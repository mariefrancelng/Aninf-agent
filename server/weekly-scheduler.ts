import { CronJob } from "cron";
import {
  getWeeklySummaries,
  getArticlesForWeek,
  getEmailSubscriptions,
  updateEmailSentAt,
  createWeeklySummary,
} from "./db";
import { sendWeeklySummaryEmail } from "./email";
import { invokeLLM } from "./_core/llm";

let weeklyJob: CronJob | null = null;

/**
 * Get the start and end dates of the current week (Monday to Sunday)
 */
function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday

  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Generate and send weekly summaries to all subscribers
 */
export async function generateAndSendWeeklySummaries(userId: number): Promise<void> {
  try {
    console.log(`[WeeklyScheduler] Generating and sending weekly summaries for user ${userId}`);

    const { start, end } = getCurrentWeekDates();

    // Get articles for the week
    const articles = await getArticlesForWeek(userId, start, end);

    if (articles.length === 0) {
      console.log(`[WeeklyScheduler] No articles found for user ${userId} this week`);
      return;
    }

    // Generate summary using LLM
    let summary = "";
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en synthèse d'actualités. Génère un résumé consolidé et structuré des articles fournis.",
          },
          {
            role: "user",
            content: `Voici les articles trouvés cette semaine sur l'ANINF:\n\n${articles
              .map(
                (a) =>
                  `- Titre: ${a.title}\n- Source: ${a.source}\n- Extrait: ${a.excerpt || "N/A"}\n- URL: ${a.url}`
              )
              .join("\n\n")}\n\nGénère un résumé consolidé et structuré de ces articles.`,
          },
        ],
      });

      const content = response.choices[0]?.message.content;
      summary = typeof content === "string" ? content : "";
    } catch (error) {
      console.error("[WeeklyScheduler] Failed to generate summary:", error);
      summary = `Synthèse de ${articles.length} articles trouvés cette semaine sur l'ANINF.`;
    }

    // Create weekly summary in database
    try {
      await createWeeklySummary(
        userId,
        start,
        end,
        summary,
        articles.map((a) => a.id)
      );
    } catch (error) {
      console.error("[WeeklyScheduler] Failed to create weekly summary:", error);
    }

    // Get email subscriptions
    const subscriptions = await getEmailSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log(`[WeeklyScheduler] No email subscriptions for user ${userId}`);
      return;
    }

    // Send emails to all subscribers
    for (const subscription of subscriptions) {
      try {
        const success = await sendWeeklySummaryEmail(
          subscription.email,
          summary,
          articles.length,
          start,
          end,
          articles.map((a) => ({
            title: a.title,
            url: a.url,
            source: a.source,
            excerpt: a.excerpt || undefined,
            publishedAt: a.publishedAt || undefined,
          }))
        );

        if (success) {
          // Update last email sent time
          await updateEmailSentAt(subscription.id);
          console.log(
            `[WeeklyScheduler] Email sent successfully to ${subscription.email}`
          );
        }
      } catch (error) {
        console.error(
          `[WeeklyScheduler] Failed to send email to ${subscription.email}:`,
          error
        );
      }
    }

    console.log(
      `[WeeklyScheduler] Weekly summaries generated and sent for user ${userId}`
    );
  } catch (error) {
    console.error("[WeeklyScheduler] Error in generateAndSendWeeklySummaries:", error);
  }
}

/**
 * Initialize weekly scheduler (runs every Sunday at 8 AM)
 */
export function initializeWeeklyScheduler(): void {
  if (weeklyJob) {
    console.log("[WeeklyScheduler] Weekly scheduler already initialized");
    return;
  }

  try {
    // Schedule for every Sunday at 8:00 AM
    weeklyJob = new CronJob("0 8 * * 0", async () => {
      console.log("[WeeklyScheduler] Running weekly summary generation job");

      // For now, generate summaries for the demo user (userId = 1)
      // In production, this would iterate through all users
      await generateAndSendWeeklySummaries(1);
    });

    weeklyJob.start();
    console.log("[WeeklyScheduler] Weekly scheduler initialized (runs every Sunday at 8:00 AM)");
  } catch (error) {
    console.error("[WeeklyScheduler] Failed to initialize weekly scheduler:", error);
  }
}

/**
 * Stop weekly scheduler
 */
export function stopWeeklyScheduler(): void {
  if (weeklyJob) {
    weeklyJob.stop();
    weeklyJob = null;
    console.log("[WeeklyScheduler] Weekly scheduler stopped");
  }
}

/**
 * Manually trigger weekly summary generation (for testing)
 */
export async function triggerWeeklySummaryNow(userId: number): Promise<void> {
  console.log(`[WeeklyScheduler] Manually triggering weekly summary for user ${userId}`);
  await generateAndSendWeeklySummaries(userId);
}
