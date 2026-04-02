import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { applicationsTable, artistsTable, categoriesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

const submitSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  specialty: z.string().min(2, "Specialty is required"),
  categoryId: z.number().int().positive("Category is required"),
  location: z.string().min(2, "Location is required"),
  bio: z.string().min(20, "Bio must be at least 20 characters"),
  instagram: z.string().optional().default(""),
  message: z.string().optional().default(""),
});

const submitClaimSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  claimedArtistId: z.number().int().positive("Artist profile is required"),
  instagram: z.string().optional().default(""),
  message: z.string().optional().default(""),
});

router.post("/applications", async (req, res) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const [app] = await db
      .insert(applicationsTable)
      .values({
        ...parsed.data,
        applicationType: "new_artist",
      })
      .returning();

    res.status(201).json({ success: true, id: app.id });
  } catch (err) {
    req.log.error({ err }, "Failed to submit application");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/applications/claim", async (req, res) => {
  try {
    const parsed = submitClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { claimedArtistId, name, email, instagram, message } = parsed.data;

    const [artist] = await db
      .select({
        id: artistsTable.id,
        name: artistsTable.name,
        location: artistsTable.location,
        categoryId: artistsTable.categoryId,
        categoryName: categoriesTable.name,
      })
      .from(artistsTable)
      .leftJoin(categoriesTable, eq(artistsTable.categoryId, categoriesTable.id))
      .where(eq(artistsTable.id, claimedArtistId))
      .limit(1);

    if (!artist) {
      return res.status(404).json({ error: "Artist profile not found" });
    }

    const [app] = await db
      .insert(applicationsTable)
      .values({
        name,
        email,
        specialty: artist.categoryName || "Artist",
        categoryId: artist.categoryId,
        location: artist.location,
        bio: `Claim request for existing artist profile: ${artist.name}`,
        instagram,
        message: message || "",
        applicationType: "claim_profile",
        claimedArtistId: artist.id,
      })
      .returning();

    res.status(201).json({ success: true, id: app.id });
  } catch (err) {
    req.log.error({ err }, "Failed to submit claim request");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/applications", requireAdmin, async (req, res) => {
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .orderBy(desc(applicationsTable.createdAt));

    res.json(apps);
  } catch (err) {
    req.log.error({ err }, "Failed to list applications");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/applications/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [updated] = await db
      .update(applicationsTable)
      .set({ status })
      .where(eq(applicationsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Application not found" });

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update application");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/applications/:id/create-artist-draft", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [application] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, id))
      .limit(1);

    if (!application) return res.status(404).json({ error: "Application not found" });
    if (application.applicationType !== "new_artist") {
      return res.status(400).json({ error: "Only new artist applications can create draft profiles" });
    }
    if (application.linkedArtistId) {
      return res.status(409).json({ error: "This application is already linked to an artist profile" });
    }
    if (!application.categoryId) {
      return res.status(400).json({ error: "This application is missing a category, so the draft cannot be created automatically" });
    }

    const [artist] = await db
      .insert(artistsTable)
      .values({
        name: application.name,
        bio: application.bio,
        categoryId: application.categoryId,
        location: application.location,
        profileImage: "",
        portfolioImages: [],
        basePrice: "100",
        rating: "0",
        reviewCount: 0,
        featured: false,
        tags: application.specialty
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        packages: [],
        availability: "available",
        socialLinks: application.instagram ? { instagram: application.instagram } : {},
      })
      .returning();

    await db
      .update(applicationsTable)
      .set({
        linkedArtistId: artist.id,
        status: "approved",
      })
      .where(eq(applicationsTable.id, id));

    res.status(201).json({ artistId: artist.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create artist draft");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/applications/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = await db
      .delete(applicationsTable)
      .where(eq(applicationsTable.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ error: "Application not found" });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete application");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
