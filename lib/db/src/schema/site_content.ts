import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const siteContentTable = pgTable("site_content", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  section: text("section").notNull(),
  type: text("type").notNull().default("text"),
  value: jsonb("value").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteContent = typeof siteContentTable.$inferSelect;
