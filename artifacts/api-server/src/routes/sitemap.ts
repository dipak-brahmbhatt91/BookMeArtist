import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const BASE_URL = process.env.SITE_URL ?? "https://www.bookmeartist.com";

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const [artistRows, blogRows, categoryRows] = await Promise.all([
      pool.query<{ slug: string; created_at: string }>(
        `SELECT slug, created_at FROM artists WHERE slug != '' ORDER BY id`
      ),
      pool.query<{ slug: string; published_at: string }>(
        `SELECT slug, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`
      ),
      pool.query<{ slug: string }>(
        `SELECT slug FROM categories ORDER BY id`
      ),
    ]);

    const today = new Date().toISOString().split("T")[0];

    const staticUrls = [
      { loc: `${BASE_URL}/`,        lastmod: today, changefreq: "weekly",  priority: "1.0" },
      { loc: `${BASE_URL}/artists`, lastmod: today, changefreq: "daily",   priority: "0.9" },
      { loc: `${BASE_URL}/blog`,    lastmod: today, changefreq: "weekly",  priority: "0.7" },
    ];

    const categoryUrls = categoryRows.rows.map(c => ({
      loc:        `${BASE_URL}/artists/${c.slug}`,
      lastmod:    today,
      changefreq: "weekly",
      priority:   "0.85",
    }));

    const artistUrls = artistRows.rows.map(a => ({
      loc:        `${BASE_URL}/artists/${a.slug}`,
      lastmod:    a.created_at ? new Date(a.created_at).toISOString().split("T")[0] : today,
      changefreq: "weekly",
      priority:   "0.8",
    }));

    const blogUrls = blogRows.rows.map(b => ({
      loc:        `${BASE_URL}/blog/${b.slug}`,
      lastmod:    b.published_at ? new Date(b.published_at).toISOString().split("T")[0] : today,
      changefreq: "monthly",
      priority:   "0.6",
    }));

    const allUrls = [...staticUrls, ...categoryUrls, ...artistUrls, ...blogUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
    res.send(xml);
  } catch {
    res.status(500).send("Failed to generate sitemap");
  }
});

export default router;
