import { pgTable, text, serial, integer, numeric, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const artistsTable = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  location: text("location").notNull(),
  profileImage: text("profile_image").notNull().default(""),
  portfolioImages: jsonb("portfolio_images").$type<string[]>().notNull().default([]),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  packages: jsonb("packages").$type<Array<{ name: string; description: string; price: number; duration: string }>>().notNull().default([]),
  availability: text("availability", { enum: ["available", "busy", "unavailable"] }).notNull().default("available"),
  socialLinks: jsonb("social_links").$type<{ instagram?: string; website?: string; youtube?: string; twitter?: string; tiktok?: string }>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artistsTable).omit({ id: true, createdAt: true });
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artistsTable.$inferSelect;
