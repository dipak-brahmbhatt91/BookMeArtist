import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { siteContentTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

router.get("/cms", async (req, res) => {
  try {
    const rows = await db.select().from(siteContentTable);
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cms/all", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(siteContentTable);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch CMS content rows");
    res.status(500).json({ error: "Internal server error" });
  }
});

const updateSchema = z.object({ value: z.unknown() });

router.put("/cms/:key", requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const [updated] = await db
      .update(siteContentTable)
      .set({ value: parsed.data.value as any, updatedAt: new Date() })
      .where(eq(siteContentTable.key, key))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Content key not found" });
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/cms", requireAdmin, async (req, res) => {
  try {
    const updates = req.body as Record<string, unknown>;
    if (typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({ error: "Expected an object of key-value pairs" });
    }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const [updated] = await db
        .update(siteContentTable)
        .set({ value: value as any, updatedAt: new Date() })
        .where(eq(siteContentTable.key, key))
        .returning();
      if (updated) results.push(updated);
    }

    res.json({ updated: results.length, items: results });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk update CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
