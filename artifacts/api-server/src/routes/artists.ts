import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import { artistsTable, categoriesTable, insertArtistSchema } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";
import { isAdmin, isLinkedArtist, requireAdmin, requireAuth } from "../middleware/auth";

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = toSlug(name);
  const { rows } = await pool.query<{ slug: string }>(
    `SELECT slug FROM artists WHERE slug LIKE $1 ${excludeId ? "AND id != $2" : ""}`,
    excludeId ? [`${base}%`, excludeId] : [`${base}%`]
  );
  const taken = new Set(rows.map(r => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const router: IRouter = Router();

router.get("/artists", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, location, search, featured } = req.query;

    const conditions = [];

    if (category && typeof category === "string") {
      const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
      if (cat.length > 0) {
        conditions.push(eq(artistsTable.categoryId, cat[0].id));
      }
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(artistsTable.basePrice, String(minPrice)));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(artistsTable.basePrice, String(maxPrice)));
    }

    if (location && typeof location === "string") {
      conditions.push(ilike(artistsTable.location, `%${location}%`));
    }

    if (featured === "true") {
      conditions.push(eq(artistsTable.featured, true));
    }

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(artistsTable.name, `%${search}%`),
          ilike(artistsTable.bio, `%${search}%`),
          ilike(artistsTable.location, `%${search}%`)
        )
      );
    }

    const artists = await db
      .select({
        id: artistsTable.id,
        name: artistsTable.name,
        slug: artistsTable.slug,
        bio: artistsTable.bio,
        categoryId: artistsTable.categoryId,
        categoryName: categoriesTable.name,
        location: artistsTable.location,
        profileImage: artistsTable.profileImage,
        portfolioImages: artistsTable.portfolioImages,
        basePrice: artistsTable.basePrice,
        rating: artistsTable.rating,
        reviewCount: artistsTable.reviewCount,
        featured: artistsTable.featured,
        tags: artistsTable.tags,
        packages: artistsTable.packages,
        availability: artistsTable.availability,
        socialLinks: artistsTable.socialLinks,
        createdAt: artistsTable.createdAt,
      })
      .from(artistsTable)
      .leftJoin(categoriesTable, eq(artistsTable.categoryId, categoriesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const result = artists.map((a) => ({
      ...a,
      basePrice: parseFloat(a.basePrice as string),
      rating: parseFloat(a.rating as string),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const numericId = parseInt(identifier, 10);
    const condition = !isNaN(numericId) && String(numericId) === identifier
      ? eq(artistsTable.id, numericId)
      : eq(artistsTable.slug, identifier);

    const artists = await db
      .select({
        id: artistsTable.id,
        name: artistsTable.name,
        slug: artistsTable.slug,
        bio: artistsTable.bio,
        categoryId: artistsTable.categoryId,
        categoryName: categoriesTable.name,
        location: artistsTable.location,
        profileImage: artistsTable.profileImage,
        portfolioImages: artistsTable.portfolioImages,
        basePrice: artistsTable.basePrice,
        rating: artistsTable.rating,
        reviewCount: artistsTable.reviewCount,
        featured: artistsTable.featured,
        tags: artistsTable.tags,
        packages: artistsTable.packages,
        availability: artistsTable.availability,
        socialLinks: artistsTable.socialLinks,
        createdAt: artistsTable.createdAt,
      })
      .from(artistsTable)
      .leftJoin(categoriesTable, eq(artistsTable.categoryId, categoriesTable.id))
      .where(condition)
      .limit(1);

    if (artists.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const a = artists[0];
    res.json({
      ...a,
      basePrice: parseFloat(a.basePrice as string),
      rating: parseFloat(a.rating as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/artists", requireAdmin, async (req, res) => {
  try {
    const body = {
      ...req.body,
      basePrice: req.body.basePrice !== undefined ? String(req.body.basePrice) : undefined,
      rating: req.body.rating !== undefined ? String(req.body.rating) : undefined,
    };
    const parsed = insertArtistSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const slug = await uniqueSlug(parsed.data.name as string);
    const [artist] = await db.insert(artistsTable).values({ ...parsed.data, slug }).returning();
    res.status(201).json({ ...artist, basePrice: parseFloat(artist.basePrice as string), rating: parseFloat(artist.rating as string) });
  } catch (err) {
    req.log.error({ err }, "Failed to create artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/artists/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!isAdmin(req) && !isLinkedArtist(req, id)) {
      return res.status(403).json({ error: "Forbidden: you can only update your own artist profile" });
    }

    const body = {
      ...req.body,
      basePrice: req.body.basePrice !== undefined ? String(req.body.basePrice) : undefined,
      rating: req.body.rating !== undefined ? String(req.body.rating) : undefined,
    };
    const parsed = insertArtistSchema.partial().safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
      updateData.slug = await uniqueSlug(parsed.data.name, id);
    }
    if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;
    if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
    if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
    if (parsed.data.profileImage !== undefined) updateData.profileImage = parsed.data.profileImage;
    if (parsed.data.portfolioImages !== undefined) updateData.portfolioImages = parsed.data.portfolioImages;
    if (parsed.data.basePrice !== undefined) updateData.basePrice = String(parsed.data.basePrice);
    if (parsed.data.rating !== undefined) updateData.rating = String(parsed.data.rating);
    if (parsed.data.reviewCount !== undefined) updateData.reviewCount = parsed.data.reviewCount;
    if (parsed.data.featured !== undefined) updateData.featured = parsed.data.featured;
    if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
    if (parsed.data.packages !== undefined) updateData.packages = parsed.data.packages;
    if (parsed.data.availability !== undefined) updateData.availability = parsed.data.availability;
    if (parsed.data.socialLinks !== undefined) updateData.socialLinks = parsed.data.socialLinks;

    const [updated] = await db
      .update(artistsTable)
      .set(updateData as Parameters<typeof artistsTable.$inferInsert extends infer T ? (data: T) => unknown : never>[0])
      .where(eq(artistsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Artist not found" });

    const cat = await db
      .select({ name: categoriesTable.name })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, updated.categoryId))
      .limit(1);

    res.json({
      ...updated,
      categoryName: cat[0]?.name ?? "",
      basePrice: parseFloat(updated.basePrice as string),
      rating: parseFloat(updated.rating as string),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/artists/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = await db.delete(artistsTable).where(eq(artistsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Artist not found" });

    res.json({ success: true, message: "Artist deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
