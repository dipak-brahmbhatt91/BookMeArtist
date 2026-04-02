import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { artistsTable, bookingsTable, categoriesTable, usersTable } from "@workspace/db/schema";
import { eq, count, sum, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/stats", async (req, res) => {
  try {
    const [artistStats] = await db
      .select({
        total: count(artistsTable.id),
        featured: sql<number>`count(*) filter (where ${artistsTable.featured} = true)`,
        available: sql<number>`count(*) filter (where ${artistsTable.availability} = 'available')`,
      })
      .from(artistsTable);

    const [bookingStats] = await db
      .select({
        total: count(bookingsTable.id),
        pending: sql<number>`count(*) filter (where ${bookingsTable.status} = 'pending')`,
        accepted: sql<number>`count(*) filter (where ${bookingsTable.status} = 'accepted')`,
        totalRevenue: sql<number>`coalesce(sum(case when ${bookingsTable.status} in ('accepted', 'completed') then ${bookingsTable.budget}::numeric else 0 end), 0)`,
      })
      .from(bookingsTable);

    const [catStats] = await db
      .select({ total: count(categoriesTable.id) })
      .from(categoriesTable);

    const [userStats] = await db
      .select({ total: count(usersTable.id) })
      .from(usersTable);

    res.json({
      totalArtists: Number(artistStats?.total ?? 0),
      featuredArtists: Number(artistStats?.featured ?? 0),
      availableArtists: Number(artistStats?.available ?? 0),
      totalBookings: Number(bookingStats?.total ?? 0),
      pendingBookings: Number(bookingStats?.pending ?? 0),
      acceptedBookings: Number(bookingStats?.accepted ?? 0),
      totalRevenue: parseFloat(String(bookingStats?.totalRevenue ?? 0)),
      totalCategories: Number(catStats?.total ?? 0),
      totalUsers: Number(userStats?.total ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
