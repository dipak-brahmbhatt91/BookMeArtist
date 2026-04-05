import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { blogPostsTable } from "@workspace/db/schema";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── Helpers ───────────────────────────────────────────────────────────────

function calcReadingTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Public routes ─────────────────────────────────────────────────────────

/** GET /api/blog — paginated list of published posts */
router.get("/blog", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const { category, tag, search } = req.query;

    const conditions = [eq(blogPostsTable.status, "published" as const)];

    if (category && typeof category === "string") {
      conditions.push(eq(blogPostsTable.category, category) as any);
    }

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(blogPostsTable.title, `%${search}%`),
          ilike(blogPostsTable.excerpt, `%${search}%`),
        ) as any,
      );
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [posts, countResult] = await Promise.all([
      db
        .select({
          id: blogPostsTable.id,
          title: blogPostsTable.title,
          slug: blogPostsTable.slug,
          excerpt: blogPostsTable.excerpt,
          featuredImage: blogPostsTable.featuredImage,
          author: blogPostsTable.author,
          category: blogPostsTable.category,
          tags: blogPostsTable.tags,
          readingTime: blogPostsTable.readingTime,
          publishedAt: blogPostsTable.publishedAt,
          updatedAt: blogPostsTable.updatedAt,
        })
        .from(blogPostsTable)
        .where(whereClause)
        .orderBy(desc(blogPostsTable.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(blogPostsTable)
        .where(whereClause),
    ]);

    // Tag filter (done in JS because tags is a jsonb array)
    const filtered =
      tag && typeof tag === "string"
        ? posts.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag))
        : posts;

    const total = countResult[0]?.count ?? 0;

    res.json({
      posts: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch blog posts");
    res.status(500).json({ error: "Internal server error", detail: err?.message });
  }
});

/** GET /api/blog/sitemap — slugs + updatedAt for XML sitemap generation */
router.get("/blog/sitemap", async (_req, res) => {
  try {
    const posts = await db
      .select({
        slug: blogPostsTable.slug,
        updatedAt: blogPostsTable.updatedAt,
        publishedAt: blogPostsTable.publishedAt,
      })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.status, "published"))
      .orderBy(desc(blogPostsTable.publishedAt));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /api/blog/categories — distinct published categories */
router.get("/blog/categories", async (_req, res) => {
  try {
    const rows = await db
      .selectDistinct({ category: blogPostsTable.category })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.status, "published"));
    res.json(rows.map((r) => r.category));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /api/blog/:slug — single published post (admins also see drafts) */
router.get("/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const isAdmin = req.session?.role === "admin";

    const conditions = [eq(blogPostsTable.slug, slug)];
    if (!isAdmin) conditions.push(eq(blogPostsTable.status, "published"));

    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(and(...conditions))
      .limit(1);

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Related posts (same category, excluding current)
    const related = await db
      .select({
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        slug: blogPostsTable.slug,
        excerpt: blogPostsTable.excerpt,
        featuredImage: blogPostsTable.featuredImage,
        author: blogPostsTable.author,
        publishedAt: blogPostsTable.publishedAt,
        readingTime: blogPostsTable.readingTime,
      })
      .from(blogPostsTable)
      .where(
        and(
          eq(blogPostsTable.category, post.category),
          eq(blogPostsTable.status, "published"),
          sql`${blogPostsTable.id} != ${post.id}`,
        ),
      )
      .orderBy(desc(blogPostsTable.publishedAt))
      .limit(3);

    res.json({ ...post, related });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin routes ──────────────────────────────────────────────────────────

const postBodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional().default(""),
  content: z.string().optional().default(""),
  featuredImage: z.string().optional().default(""),
  author: z.string().optional().default("BookMeArtist Team"),
  authorBio: z.string().optional().default(""),
  category: z.string().optional().default("general"),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  ogImage: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
  noindex: z.boolean().optional().default(false),
});

/** GET /api/admin/blog — all posts including drafts */
router.get("/admin/blog", requireAdmin, async (req, res) => {
  try {
    const posts = await db
      .select({
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        slug: blogPostsTable.slug,
        status: blogPostsTable.status,
        category: blogPostsTable.category,
        author: blogPostsTable.author,
        readingTime: blogPostsTable.readingTime,
        publishedAt: blogPostsTable.publishedAt,
        createdAt: blogPostsTable.createdAt,
        updatedAt: blogPostsTable.updatedAt,
      })
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.updatedAt));
    res.json(posts);
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch admin blog posts");
    res.status(500).json({ error: "Internal server error", detail: err?.message });
  }
});

/** GET /api/admin/blog/:id — full post for editing */
router.get("/admin/blog/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .limit(1);

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    req.log.error({ err, id: req.params.id }, "Failed to fetch admin blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/admin/blog — create a new post */
router.post("/admin/blog", requireAdmin, async (req, res) => {
  try {
    const parsed = postBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    }

    const data = parsed.data;
    const slug = data.slug?.trim() || toSlug(data.title);
    const readingTime = calcReadingTime(data.content ?? "");
    const publishedAt = data.status === "published" ? new Date() : undefined;

    const [created] = await db
      .insert(blogPostsTable)
      .values({
        title: data.title,
        slug,
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        featuredImage: data.featuredImage ?? "",
        author: data.author ?? "BookMeArtist Team",
        authorBio: data.authorBio ?? "",
        category: data.category ?? "general",
        tags: data.tags ?? [],
        status: data.status ?? "draft",
        metaTitle: data.metaTitle ?? "",
        metaDescription: data.metaDescription ?? "",
        ogImage: data.ogImage ?? "",
        canonicalUrl: data.canonicalUrl ?? "",
        noindex: data.noindex ?? false,
        readingTime,
        publishedAt,
      })
      .returning();

    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "A post with this slug already exists" });
    }
    req.log.error({ err }, "Failed to create blog post");
    res.status(500).json({ error: "Internal server error", detail: err?.message });
  }
});

/** PUT /api/admin/blog/:id — update a post */
router.put("/admin/blog/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const parsed = postBodySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    }

    const data = parsed.data;

    // If publishing for the first time, stamp publishedAt
    const existing = await db
      .select({ status: blogPostsTable.status, publishedAt: blogPostsTable.publishedAt })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .limit(1);

    if (!existing.length) return res.status(404).json({ error: "Post not found" });

    const wasPublished = existing[0].publishedAt !== null;

    // Build explicit update payload — no `as any` spread
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.slug !== undefined) updatePayload.slug = data.slug.trim();
    if (data.excerpt !== undefined) updatePayload.excerpt = data.excerpt;
    if (data.featuredImage !== undefined) updatePayload.featuredImage = data.featuredImage;
    if (data.author !== undefined) updatePayload.author = data.author;
    if (data.authorBio !== undefined) updatePayload.authorBio = data.authorBio;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.tags !== undefined) updatePayload.tags = data.tags;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.metaTitle !== undefined) updatePayload.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updatePayload.metaDescription = data.metaDescription;
    if (data.ogImage !== undefined) updatePayload.ogImage = data.ogImage;
    if (data.canonicalUrl !== undefined) updatePayload.canonicalUrl = data.canonicalUrl;
    if (data.noindex !== undefined) updatePayload.noindex = data.noindex;
    if (data.content !== undefined) {
      updatePayload.content = data.content;
      updatePayload.readingTime = calcReadingTime(data.content);
    }
    if (data.status === "published" && !wasPublished) {
      updatePayload.publishedAt = new Date();
    }

    const [updated] = await db
      .update(blogPostsTable)
      .set(updatePayload as any)
      .where(eq(blogPostsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "A post with this slug already exists" });
    }
    req.log.error({ err }, "Failed to update blog post");
    res.status(500).json({ error: "Internal server error", detail: err?.message });
  }
});

/** DELETE /api/admin/blog/:id — delete a post */
router.delete("/admin/blog/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [deleted] = await db
      .delete(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .returning({ id: blogPostsTable.id });

    if (!deleted) return res.status(404).json({ error: "Post not found" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
