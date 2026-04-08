import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router: IRouter = Router();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, "New password must be at least 12 characters"),
});

const changeUsernameSchema = z.object({
  newUsername: z.string().min(2).max(50),
  currentPassword: z.string().min(1),
});

router.get("/admin/credentials", async (req, res) => {
  try {
    const users = await db
      .select({ id: usersTable.id, username: usersTable.username, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!))
      .limit(1);

    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(users[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get credentials");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/credentials/password", async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { currentPassword, newPassword } = parsed.data;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!))
      .limit(1);

    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, users[0].passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, req.session.userId!));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to change password");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/credentials/username", async (req, res) => {
  try {
    const parsed = changeUsernameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { newUsername, currentPassword } = parsed.data;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!))
      .limit(1);

    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, users[0].passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.username, newUsername), ne(usersTable.id, req.session.userId!)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({ username: newUsername })
      .where(eq(usersTable.id, req.session.userId!))
      .returning({ username: usersTable.username });

    res.json({ success: true, username: updated.username, message: "Username updated successfully" });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Username already taken" });
    }
    req.log.error({ err }, "Failed to change username");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
