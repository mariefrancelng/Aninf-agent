import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Surveillance configuration table
 */
export const surveillanceConfig = pgTable("surveillance_config", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  executionHour: integer("executionHour").notNull(),
  executionMinute: integer("executionMinute").default(0).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  nextExecutedAt: timestamp("nextExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SurveillanceConfig = typeof surveillanceConfig.$inferSelect;
export type InsertSurveillanceConfig = typeof surveillanceConfig.$inferInsert;

export const surveillanceStatusEnum = pgEnum("surveillance_status", ["success", "failed", "partial"]);

/**
 * Surveillance results table
 */
export const surveillances = pgTable("surveillances", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  executedAt: timestamp("executedAt").notNull(),
  status: surveillanceStatusEnum("status").default("success").notNull(),
  summary: text("summary").notNull(),
  articlesCount: integer("articlesCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Surveillance = typeof surveillances.$inferSelect;
export type InsertSurveillance = typeof surveillances.$inferInsert;

/**
 * Articles found during surveillance
 */
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  surveillanceId: integer("surveillanceId").notNull().references(() => surveillances.id),
  userId: integer("userId").notNull().references(() => users.id),
  title: text("title").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  urlHash: varchar("urlHash", { length: 64 }).notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  publishedAt: timestamp("publishedAt"),
  discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Weekly summaries
 */
export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  weekStartDate: timestamp("weekStartDate").notNull(),
  weekEndDate: timestamp("weekEndDate").notNull(),
  summary: text("summary").notNull(),
  articlesCount: integer("articlesCount").default(0).notNull(),
  articlesIds: text("articlesIds").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = typeof weeklySummaries.$inferInsert;

/**
 * Alert keywords
 */
export const alertKeywords = pgTable("alert_keywords", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertKeyword = typeof alertKeywords.$inferSelect;
export type InsertAlertKeyword = typeof alertKeywords.$inferInsert;

/**
 * Email subscriptions
 */
export const emailSubscriptions = pgTable("email_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  email: varchar("email", { length: 320 }).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type InsertEmailSubscription = typeof emailSubscriptions.$inferInsert;
