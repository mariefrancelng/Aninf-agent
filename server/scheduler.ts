import { getDb, getSurveillanceConfig, updateSurveillanceConfigExecutionTime, createSurveillance, createArticles } from "./db";
import { executeSurveillance, filterArticlesByKeywords } from "./surveillance-agent";
import { notifyOwner } from "./_core/notification";
import { getAlertKeywords } from "./db";

interface ScheduledTask {
  userId: number;
  timeout: NodeJS.Timeout;
}

const scheduledTasks = new Map<number, ScheduledTask>();

/**
 * Calculate the next execution time based on the configured hour and minute
 */
function calculateNextExecutionTime(executionHour: number, executionMinute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(executionHour, executionMinute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Calculate milliseconds until next execution
 */
function getTimeUntilNextExecution(executionHour: number, executionMinute: number): number {
  const nextExecution = calculateNextExecutionTime(executionHour, executionMinute);
  return nextExecution.getTime() - Date.now();
}

/**
 * Execute surveillance for a user and handle results
 */
async function runSurveillanceForUser(userId: number): Promise<void> {
  try {
    console.log(`[Scheduler] Running surveillance for user ${userId}`);

    const result = await executeSurveillance();

    // Get user's alert keywords and filter articles
    const keywords = await getAlertKeywords(userId);
    const activeKeywords = keywords
      .filter((k) => k.isActive)
      .map((k) => k.keyword);
    
    let filteredArticles = result.articles;
    if (activeKeywords.length > 0) {
      filteredArticles = filterArticlesByKeywords(result.articles, activeKeywords);
      console.log(
        `[Scheduler] Filtered ${result.articles.length} articles to ${filteredArticles.length} based on keywords`
      );
    }

    // Save to database
    const surveillance = await createSurveillance(
      userId,
      new Date(),
      result.summary,
      filteredArticles.length > 0 ? "success" : "partial",
      filteredArticles.length
    );

    // Save articles
    if (filteredArticles.length > 0) {
      await createArticles(userId, surveillance.id, filteredArticles);
    }

    // Update config with execution times
    const config = await getSurveillanceConfig(userId);
    if (config) {
      const nextExecution = calculateNextExecutionTime(config.executionHour, config.executionMinute);
      await updateSurveillanceConfigExecutionTime(userId, new Date(), nextExecution);
    }

    // Notify owner
    await notifyOwner({
      title: "Veille ANINF - Exécution réussie",
      content: `La veille sur l'ANINF a été exécutée avec succès.\n\n${result.articlesCount} articles trouvés.\n\nRésumé:\n${result.summary.substring(0, 500)}...`,
    });

    console.log(`[Scheduler] Surveillance completed for user ${userId}`);
  } catch (error) {
    console.error(`[Scheduler] Error running surveillance for user ${userId}:`, error);

    // Save failed surveillance to database
    try {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await createSurveillance(
        userId,
        new Date(),
        "La veille a échoué. Veuillez vérifier les logs pour plus de détails.",
        "failed",
        0,
        errorMessage
      );

      // Notify owner of failure
      await notifyOwner({
        title: "Veille ANINF - Erreur",
        content: `La veille sur l'ANINF a échoué.\n\nErreur: ${errorMessage}`,
      });
    } catch (notifyError) {
      console.error(`[Scheduler] Error notifying owner:`, notifyError);
    }
  }
}

/**
 * Schedule surveillance for a user
 */
export async function scheduleUserSurveillance(userId: number, executionHour: number, executionMinute: number): Promise<void> {
  // Clear existing scheduled task if any
  if (scheduledTasks.has(userId)) {
    const existing = scheduledTasks.get(userId);
    if (existing) {
      clearTimeout(existing.timeout);
    }
    scheduledTasks.delete(userId);
  }

  // Calculate time until next execution
  const timeUntilNext = getTimeUntilNextExecution(executionHour, executionMinute);

  console.log(`[Scheduler] Scheduling surveillance for user ${userId} in ${Math.round(timeUntilNext / 1000)}s`);

  // Schedule the first execution
  const timeout = setTimeout(async () => {
    await runSurveillanceForUser(userId);
    // Reschedule for the next day
    scheduleUserSurveillance(userId, executionHour, executionMinute);
  }, timeUntilNext);

  scheduledTasks.set(userId, { userId, timeout });

  // Update database with next execution time
  const nextExecution = calculateNextExecutionTime(executionHour, executionMinute);
  const db = await getDb();
  if (db) {
    const { surveillanceConfig } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(surveillanceConfig)
      .set({
        nextExecutedAt: nextExecution,
        updatedAt: new Date(),
      })
      .where(eq(surveillanceConfig.userId, userId));
  }
}

/**
 * Initialize all scheduled tasks from database
 */
export async function initializeScheduler(): Promise<void> {
  try {
    console.log("[Scheduler] Initializing scheduler...");

    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available, skipping initialization");
      return;
    }

    const { surveillanceConfig } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const configs = await db.select().from(surveillanceConfig).where(eq(surveillanceConfig.isActive, 1));

    for (const config of configs) {
      await scheduleUserSurveillance(config.userId, config.executionHour, config.executionMinute);
    }

    console.log(`[Scheduler] Initialized ${configs.length} scheduled tasks`);
  } catch (error) {
    console.error("[Scheduler] Error initializing scheduler:", error);
  }
}

/**
 * Stop all scheduled tasks
 */
export function stopAllScheduledTasks(): void {
  console.log("[Scheduler] Stopping all scheduled tasks...");
  scheduledTasks.forEach((task) => {
    clearTimeout(task.timeout);
  });
  scheduledTasks.clear();
  console.log("[Scheduler] All scheduled tasks stopped");
}

/**
 * Manually trigger surveillance for a user
 */
export async function triggerSurveillanceNow(userId: number): Promise<void> {
  console.log(`[Scheduler] Manually triggering surveillance for user ${userId}`);
  await runSurveillanceForUser(userId);
}
