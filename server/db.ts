import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, surveillanceConfig, surveillances, articles, Article, Surveillance, SurveillanceConfig, weeklySummaries, WeeklySummary, alertKeywords, AlertKeyword, emailSubscriptions, EmailSubscription } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Surveillance configuration helpers
export async function getSurveillanceConfig(userId: number): Promise<SurveillanceConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveillanceConfig)
    .where(eq(surveillanceConfig.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSurveillanceConfig(
  userId: number,
  executionHour: number,
  executionMinute: number = 0
): Promise<SurveillanceConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSurveillanceConfig(userId);
  
  if (existing) {
    await db
      .update(surveillanceConfig)
      .set({
        executionHour,
        executionMinute,
        updatedAt: new Date(),
      })
      .where(eq(surveillanceConfig.userId, userId));
    
    return { ...existing, executionHour, executionMinute, updatedAt: new Date() };
  } else {
    const result = await db
      .insert(surveillanceConfig)
      .values({
        userId,
        executionHour,
        executionMinute,
        isActive: 1,
      });
    
    const inserted = await getSurveillanceConfig(userId);
    if (!inserted) throw new Error("Failed to insert surveillance config");
    return inserted;
  }
}

export async function updateSurveillanceConfigExecutionTime(
  userId: number,
  lastExecutedAt: Date,
  nextExecutedAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(surveillanceConfig)
    .set({
      lastExecutedAt,
      nextExecutedAt,
      updatedAt: new Date(),
    })
    .where(eq(surveillanceConfig.userId, userId));
}

// Surveillance results helpers
export async function createSurveillance(
  userId: number,
  executedAt: Date,
  summary: string,
  status: "success" | "failed" | "partial" = "success",
  articlesCount: number = 0,
  errorMessage?: string
): Promise<Surveillance> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(surveillances)
    .values({
      userId,
      executedAt,
      summary,
      status,
      articlesCount,
      errorMessage,
    });

  const inserted = await db
    .select()
    .from(surveillances)
    .where(and(eq(surveillances.userId, userId), eq(surveillances.executedAt, executedAt)))
    .orderBy(desc(surveillances.id))
    .limit(1);

  if (!inserted.length) throw new Error("Failed to insert surveillance");
  return inserted[0];
}

export async function getSurveillanceHistory(
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<Surveillance[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveillances)
    .where(eq(surveillances.userId, userId))
    .orderBy(desc(surveillances.executedAt))
    .limit(limit)
    .offset(offset);
}

export async function getSurveillanceById(surveillanceId: number): Promise<Surveillance | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveillances)
    .where(eq(surveillances.id, surveillanceId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Articles helpers
export async function createArticles(
  userId: number,
  surveillanceId: number,
  articlesList: Array<{
    title: string;
    url: string;
    urlHash: string;
    source: string;
    excerpt?: string;
    publishedAt?: Date;
  }>
): Promise<Article[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (articlesList.length === 0) return [];

  await db.insert(articles).values(
    articlesList.map((article) => ({
      userId,
      surveillanceId,
      title: article.title,
      url: article.url,
      urlHash: article.urlHash,
      source: article.source,
      excerpt: article.excerpt,
      publishedAt: article.publishedAt,
    }))
  );

  return await getArticlesBySurveillanceId(surveillanceId);
}

export async function getArticlesBySurveillanceId(surveillanceId: number): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .where(eq(articles.surveillanceId, surveillanceId))
    .orderBy(desc(articles.discoveredAt));
}

export async function getLatestSurveillance(userId: number): Promise<Surveillance | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveillances)
    .where(eq(surveillances.userId, userId))
    .orderBy(desc(surveillances.executedAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Duplicate detection helpers
export async function checkArticleExists(userId: number, urlHash: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.userId, userId), eq(articles.urlHash, urlHash)))
    .limit(1);

  return result.length > 0;
}

export async function createArticlesWithDuplicateCheck(
  userId: number,
  surveillanceId: number,
  articlesList: Array<{
    title: string;
    url: string;
    urlHash: string;
    source: string;
    excerpt?: string;
    publishedAt?: Date;
  }>
): Promise<Article[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (articlesList.length === 0) return [];

  // Filter out duplicates
  const newArticles = [];
  for (const article of articlesList) {
    const exists = await checkArticleExists(userId, article.urlHash);
    if (!exists) {
      newArticles.push({
        userId,
        surveillanceId,
        title: article.title,
        url: article.url,
        urlHash: article.urlHash,
        source: article.source,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
      });
    }
  }

  if (newArticles.length === 0) return [];

  await db.insert(articles).values(newArticles);

  return await getArticlesBySurveillanceId(surveillanceId);
}

// Weekly summary helpers
export async function createWeeklySummary(
  userId: number,
  weekStartDate: Date,
  weekEndDate: Date,
  summary: string,
  articlesIds: number[]
): Promise<WeeklySummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(weeklySummaries)
    .values({
      userId,
      weekStartDate,
      weekEndDate,
      summary,
      articlesCount: articlesIds.length,
      articlesIds: JSON.stringify(articlesIds),
    });

  const inserted = await db
    .select()
    .from(weeklySummaries)
    .where(and(eq(weeklySummaries.userId, userId), eq(weeklySummaries.weekStartDate, weekStartDate)))
    .orderBy(desc(weeklySummaries.id))
    .limit(1);

  if (!inserted.length) throw new Error("Failed to insert weekly summary");
  return inserted[0];
}

export async function getWeeklySummaries(
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<WeeklySummary[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(weeklySummaries)
    .where(eq(weeklySummaries.userId, userId))
    .orderBy(desc(weeklySummaries.weekStartDate))
    .limit(limit)
    .offset(offset);
}

export async function getArticlesForWeek(
  userId: number,
  weekStartDate: Date,
  weekEndDate: Date
): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.userId, userId),
        gte(articles.discoveredAt, weekStartDate),
        lte(articles.discoveredAt, weekEndDate)
      )
    )
    .orderBy(desc(articles.discoveredAt));
}

// Alert keywords helpers
export async function createAlertKeyword(
  userId: number,
  keyword: string
): Promise<AlertKeyword> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(alertKeywords).values({
    userId,
    keyword,
    isActive: 1,
  });

  const inserted = await db
    .select()
    .from(alertKeywords)
    .where(and(eq(alertKeywords.userId, userId), eq(alertKeywords.keyword, keyword)))
    .orderBy(desc(alertKeywords.id))
    .limit(1);

  if (!inserted.length) throw new Error("Failed to insert alert keyword");
  return inserted[0];
}

export async function getAlertKeywords(userId: number): Promise<AlertKeyword[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(alertKeywords)
    .where(and(eq(alertKeywords.userId, userId), eq(alertKeywords.isActive, 1)))
    .orderBy(desc(alertKeywords.createdAt));
}

export async function deleteAlertKeyword(keywordId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(alertKeywords).where(eq(alertKeywords.id, keywordId));
}

// Email subscriptions helpers
export async function addEmailSubscription(
  userId: number,
  email: string
): Promise<EmailSubscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailSubscriptions).values({
    userId,
    email,
    isActive: 1,
  });

  const inserted = await db
    .select()
    .from(emailSubscriptions)
    .where(and(eq(emailSubscriptions.userId, userId), eq(emailSubscriptions.email, email)))
    .orderBy(desc(emailSubscriptions.id))
    .limit(1);

  if (!inserted.length) throw new Error("Failed to insert email subscription");
  return inserted[0];
}

export async function getEmailSubscriptions(userId: number): Promise<EmailSubscription[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailSubscriptions)
    .where(and(eq(emailSubscriptions.userId, userId), eq(emailSubscriptions.isActive, 1)))
    .orderBy(desc(emailSubscriptions.createdAt));
}

export async function removeEmailSubscription(subscriptionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(emailSubscriptions).where(eq(emailSubscriptions.id, subscriptionId));
}

export async function updateEmailSentAt(subscriptionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailSubscriptions)
    .set({ lastEmailSentAt: new Date() })
    .where(eq(emailSubscriptions.id, subscriptionId));
}
