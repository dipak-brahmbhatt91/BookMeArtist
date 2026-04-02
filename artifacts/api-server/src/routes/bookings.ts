import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, artistsTable, insertBookingSchema } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { isAdmin, isLinkedArtist, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/bookings", requireAuth, async (req, res) => {
  try {
    const { artistId, status } = req.query;
    const conditions = [];

    if (req.session.role === "artist" && req.session.artistId) {
      conditions.push(eq(bookingsTable.artistId, req.session.artistId));
    } else if (artistId && !isNaN(Number(artistId))) {
      conditions.push(eq(bookingsTable.artistId, Number(artistId)));
    }

    if (status && typeof status === "string") {
      conditions.push(eq(bookingsTable.status, status as "pending" | "accepted" | "declined" | "completed"));
    }

    const bookings = await db
      .select({
        id: bookingsTable.id,
        artistId: bookingsTable.artistId,
        artistName: artistsTable.name,
        artistImage: artistsTable.profileImage,
        clientName: bookingsTable.clientName,
        clientEmail: bookingsTable.clientEmail,
        eventDate: bookingsTable.eventDate,
        eventType: bookingsTable.eventType,
        packageName: bookingsTable.packageName,
        budget: bookingsTable.budget,
        brief: bookingsTable.brief,
        location: bookingsTable.location,
        status: bookingsTable.status,
        createdAt: bookingsTable.createdAt,
      })
      .from(bookingsTable)
      .leftJoin(artistsTable, eq(bookingsTable.artistId, artistsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(bookingsTable.createdAt);

    const result = bookings.map((b) => ({
      ...b,
      budget: parseFloat(b.budget as string),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch bookings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const body = {
      ...req.body,
      budget: req.body.budget !== undefined ? String(req.body.budget) : req.body.budget,
    };
    const parsed = insertBookingSchema.safeParse(body);
    if (!parsed.success) {
      req.log.warn({ errors: parsed.error.errors }, "Booking validation failed");
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
    }

    const [booking] = await db
      .insert(bookingsTable)
      .values({ ...parsed.data, budget: String(parsed.data.budget) })
      .returning();

    const artist = await db
      .select({ name: artistsTable.name, profileImage: artistsTable.profileImage })
      .from(artistsTable)
      .where(eq(artistsTable.id, booking.artistId))
      .limit(1);

    res.status(201).json({
      ...booking,
      artistName: artist[0]?.name ?? "",
      artistImage: artist[0]?.profileImage ?? "",
      budget: parseFloat(booking.budget as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const bookings = await db
      .select({
        id: bookingsTable.id,
        artistId: bookingsTable.artistId,
        artistName: artistsTable.name,
        artistImage: artistsTable.profileImage,
        clientName: bookingsTable.clientName,
        clientEmail: bookingsTable.clientEmail,
        eventDate: bookingsTable.eventDate,
        eventType: bookingsTable.eventType,
        packageName: bookingsTable.packageName,
        budget: bookingsTable.budget,
        brief: bookingsTable.brief,
        location: bookingsTable.location,
        status: bookingsTable.status,
        createdAt: bookingsTable.createdAt,
      })
      .from(bookingsTable)
      .leftJoin(artistsTable, eq(bookingsTable.artistId, artistsTable.id))
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (bookings.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const b = bookings[0];
    if (!isAdmin(req) && !isLinkedArtist(req, b.artistId)) {
      return res.status(403).json({ error: "Forbidden: you can only view your own bookings" });
    }
    res.json({ ...b, budget: parseFloat(b.budget as string) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/bookings/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const existing = await db
      .select({ artistId: bookingsTable.artistId })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (existing.length === 0) return res.status(404).json({ error: "Booking not found" });
    if (!isAdmin(req) && !isLinkedArtist(req, existing[0].artistId)) {
      return res.status(403).json({ error: "Forbidden: you can only delete your own bookings" });
    }

    const [deleted] = await db.delete(bookingsTable).where(eq(bookingsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Booking not found" });

    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/bookings/:id/status", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const schema = z.object({
      status: z.enum(["pending", "accepted", "declined", "completed"]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const existing = await db
      .select({ artistId: bookingsTable.artistId })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (!isAdmin(req) && !isLinkedArtist(req, existing[0].artistId)) {
      return res.status(403).json({ error: "Forbidden: you can only update your own bookings" });
    }

    const [updated] = await db
      .update(bookingsTable)
      .set({ status: parsed.data.status })
      .where(eq(bookingsTable.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const artist = await db
      .select({ name: artistsTable.name, profileImage: artistsTable.profileImage })
      .from(artistsTable)
      .where(eq(artistsTable.id, updated.artistId))
      .limit(1);

    res.json({
      ...updated,
      artistName: artist[0]?.name ?? "",
      artistImage: artist[0]?.profileImage ?? "",
      budget: parseFloat(updated.budget as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update booking status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
