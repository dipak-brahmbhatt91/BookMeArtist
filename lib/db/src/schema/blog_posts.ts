import { pgTable, text, serial, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  featuredImage: text("featured_image").notNull().default(""),
  author: text("author").notNull().default("BookMeArtist Team"),
  authorBio: text("author_bio").notNull().default(""),
  category: text("category").notNull().default("general"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  // SEO fields
  metaTitle: text("meta_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  ogImage: text("og_image").notNull().default(""),
  canonicalUrl: text("canonical_url").notNull().default(""),
  noindex: boolean("noindex").notNull().default(false),
  // Content metadata
  readingTime: integer("reading_time").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;
