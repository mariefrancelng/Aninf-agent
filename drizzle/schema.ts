import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Surveillance configuration table - stores the scheduled time for daily surveillance
 */
export const surveillanceConfig = mysqlTable("surveillance_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  executionHour: int("executionHour").notNull(), // 0-23 (hour of day)
  executionMinute: int("executionMinute").default(0).notNull(), // 0-59
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  lastExecutedAt: timestamp("lastExecutedAt"),
  nextExecutedAt: timestamp("nextExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurveillanceConfig = typeof surveillanceConfig.$inferSelect;
export type InsertSurveillanceConfig = typeof surveillanceConfig.$inferInsert;

/**
 * Surveillance results table - stores the results of each surveillance run
 */
export const surveillances = mysqlTable("surveillances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  executedAt: timestamp("executedAt").notNull(),
  status: mysqlEnum("status", ["success", "failed", "partial"]).default("success").notNull(),
  summary: text("summary").notNull(), // AI-generated summary of articles
  articlesCount: int("articlesCount").default(0).notNull(),
  errorMessage: text("errorMessage"), // If status is failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Surveillance = typeof surveillances.$inferSelect;
export type InsertSurveillance = typeof surveillances.$inferInsert;

/**
 * Articles found during surveillance
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  surveillanceId: int("surveillanceId").notNull().references(() => surveillances.id),
  userId: int("userId").notNull().references(() => users.id),
  title: text("title").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  urlHash: varchar("urlHash", { length: 64 }).notNull(), // Hash of URL for duplicate detection
  source: varchar("source", { length: 255 }).notNull(), // e.g., "Google News", "Le Monde"
  excerpt: text("excerpt"), // Short excerpt from article
  publishedAt: timestamp("publishedAt"),
  discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Weekly summaries - consolidated summaries of all articles from a week
 */
export const weeklySummaries = mysqlTable("weekly_summaries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  weekStartDate: timestamp("weekStartDate").notNull(), // Monday of the week
  weekEndDate: timestamp("weekEndDate").notNull(), // Sunday of the week
  summary: text("summary").notNull(), // AI-generated comprehensive summary
  articlesCount: int("articlesCount").default(0).notNull(),
  articlesIds: text("articlesIds").notNull(), // JSON array of article IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = typeof weeklySummaries.$inferInsert;

/**
 * Alert keywords - user-defined keywords to filter articles
 */
export const alertKeywords = mysqlTable("alert_keywords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertKeyword = typeof alertKeywords.$inferSelect;
export type InsertAlertKeyword = typeof alertKeywords.$inferInsert;

/**
 * Email subscriptions - emails to receive weekly summaries
 */
export const emailSubscriptions = mysqlTable("email_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  email: varchar("email", { length: 320 }).notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type InsertEmailSubscription = typeof emailSubscriptions.$inferInsert;
