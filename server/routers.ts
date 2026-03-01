import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getSurveillanceConfig,
  upsertSurveillanceConfig,
  getSurveillanceHistory,
  getSurveillanceById,
  getArticlesBySurveillanceId,
  getLatestSurveillance,
  getWeeklySummaries,
  getArticlesForWeek,
  createAlertKeyword,
  getAlertKeywords,
  deleteAlertKeyword,
  addEmailSubscription,
  getEmailSubscriptions,
  removeEmailSubscription,
} from "./db";
import { scheduleUserSurveillance, triggerSurveillanceNow } from "./scheduler";
import { triggerWeeklySummaryNow } from "./weekly-scheduler";
import { sendEmail } from "./email";

// Demo mode: use a fixed user ID
const DEMO_USER_ID = 1;
const DEMO_MODE = false; // Set to false to enable OAuth authentication

// Create a procedure that works in demo mode without authentication
const demoOrProtectedProcedure = DEMO_MODE ? publicProcedure : protectedProcedure;

// Helper to get user ID (demo or authenticated)
function getUserId(ctx: any): number {
  if (DEMO_MODE) {
    return DEMO_USER_ID;
  }
  return ctx.user?.id || DEMO_USER_ID;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  surveillance: router({
    /**
     * Get or create surveillance configuration for the current user
     */
    getConfig: demoOrProtectedProcedure.query(async ({ ctx }) => {
      const userId = getUserId(ctx);
      const config = await getSurveillanceConfig(userId);
      return config || null;
    }),

    /**
     * Update surveillance configuration (execution time)
     */
    updateConfig: demoOrProtectedProcedure
      .input(
        z.object({
          executionHour: z.number().min(0).max(23),
          executionMinute: z.number().min(0).max(59).default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        const config = await upsertSurveillanceConfig(
          userId,
          input.executionHour,
          input.executionMinute
        );

        // Schedule the surveillance
        await scheduleUserSurveillance(userId, input.executionHour, input.executionMinute);

        return config;
      }),

    /**
     * Get surveillance history for the current user
     */
    getHistory: demoOrProtectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        const surveillances = await getSurveillanceHistory(userId, input.limit, input.offset);
        return surveillances;
      }),

    /**
     * Get detailed information about a specific surveillance
     */
    getDetail: demoOrProtectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        const surveillance = await getSurveillanceById(input.id);

        // Verify ownership (in demo mode, allow all)
        if (!surveillance || (!DEMO_MODE && surveillance.userId !== userId)) {
          throw new Error("Surveillance not found or access denied");
        }

        const articles = await getArticlesBySurveillanceId(surveillance.id);

        return {
          ...surveillance,
          articles,
        };
      }),

    /**
     * Get the latest surveillance result
     */
    getLatest: demoOrProtectedProcedure.query(async ({ ctx }) => {
      const userId = getUserId(ctx);
      const surveillance = await getLatestSurveillance(userId);
      if (!surveillance) return null;

      const articles = await getArticlesBySurveillanceId(surveillance.id);
      return {
        ...surveillance,
        articles,
      };
    }),

    /**
     * Manually trigger a surveillance run
     */
    triggerNow: demoOrProtectedProcedure.mutation(async ({ ctx }) => {
      try {
        const userId = getUserId(ctx);
        await triggerSurveillanceNow(userId);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to trigger surveillance: ${message}`);
      }
    }),

    /**
     * Get weekly summaries for the current user
     */
    getWeeklySummaries: demoOrProtectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        const summaries = await getWeeklySummaries(userId, input.limit, input.offset);
        return summaries.map((summary) => ({
          ...summary,
          articlesIds: JSON.parse(summary.articlesIds),
        }));
      }),

    /**
     * Get articles for a specific week
     */
    getWeekArticles: demoOrProtectedProcedure
      .input(
        z.object({
          weekStartDate: z.string().datetime(),
          weekEndDate: z.string().datetime(),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        const articles = await getArticlesForWeek(
          userId,
          new Date(input.weekStartDate),
          new Date(input.weekEndDate)
        );
        return articles;
      }),
  }),

  alerts: router({
    /**
     * Create a new alert keyword
     */
    addKeyword: demoOrProtectedProcedure
      .input(z.object({ keyword: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        return await createAlertKeyword(userId, input.keyword);
      }),

    /**
     * Get all alert keywords for the current user
     */
    getKeywords: demoOrProtectedProcedure.query(async ({ ctx }) => {
      const userId = getUserId(ctx);
      return await getAlertKeywords(userId);
    }),

    /**
     * Delete an alert keyword
     */
    deleteKeyword: demoOrProtectedProcedure
      .input(z.object({ keywordId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAlertKeyword(input.keywordId);
        return { success: true };
      }),
  }),

  email: router({
    /**
     * Add an email subscription for weekly summaries
     */
    subscribe: demoOrProtectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        const userId = getUserId(ctx);
        return await addEmailSubscription(userId, input.email);
      }),

    /**
     * Get all email subscriptions for the current user
     */
    getSubscriptions: demoOrProtectedProcedure.query(async ({ ctx }) => {
      const userId = getUserId(ctx);
      return await getEmailSubscriptions(userId);
    }),

    /**
     * Remove an email subscription
     */
    unsubscribe: demoOrProtectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeEmailSubscription(input.subscriptionId);
        return { success: true };
      }),

    /**
     * Send a test email to verify SMTP configuration
     */
    sendTest: demoOrProtectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const success = await sendEmail(
            input.email,
            "Test Email - Agent de Veille ANINF",
            `<h1>Test Email</h1><p>Cet email a été envoyé avec succès depuis l'Agent de Veille ANINF.</p>`
          );
          return { success };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to send test email: ${message}`);
        }
      }),
  }),

  scheduler: router({
    /**
     * Manually trigger weekly summary generation (for testing)
     */
    triggerWeeklySummary: demoOrProtectedProcedure.mutation(async ({ ctx }) => {
      try {
        const userId = getUserId(ctx);
        await triggerWeeklySummaryNow(userId);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to trigger weekly summary: ${message}`);
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
