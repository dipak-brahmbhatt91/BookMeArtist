import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable, insertCategorySchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable);
    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const parsed = insertCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const [category] = await db.insert(categoriesTable).values(parsed.data).returning();
    res.status(201).json(category);
  } catch (err) {
    req.log.error({ err }, "Failed to create category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const parsed = insertCategorySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const [updated] = await db
      .update(categoriesTable)
      .set(parsed.data)
      .where(eq(categoriesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Category not found" });

    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
