import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { artistsTable } from "./artists";
import { categoriesTable } from "./categories";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  specialty: text("specialty").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  location: text("location").notNull().default(""),
  bio: text("bio").notNull(),
  instagram: text("instagram").notNull().default(""),
  message: text("message").notNull().default(""),
  applicationType: text("application_type", { enum: ["new_artist", "claim_profile"] }).notNull().default("new_artist"),
  claimedArtistId: integer("claimed_artist_id").references(() => artistsTable.id, { onDelete: "set null" }),
  linkedArtistId: integer("linked_artist_id").references(() => artistsTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Application = typeof applicationsTable.$inferSelect;
