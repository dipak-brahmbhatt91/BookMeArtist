import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { artistsTable } from "./artists";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull().references(() => artistsTable.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  eventDate: text("event_date").notNull(),
  eventType: text("event_type").notNull(),
  packageName: text("package_name"),
  budget: numeric("budget", { precision: 10, scale: 2 }).notNull(),
  brief: text("brief").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined", "completed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, status: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
