import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, artistsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router: IRouter = Router();

const createUserSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6),
  role: z.enum(["superadmin", "admin", "artist"]),
  artistId: z.number().int().positive().optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["superadmin", "admin", "artist"]).optional(),
  artistId: z.number().int().positive().nullable().optional(),
});

function isElevatedRole(role: string) {
  return role === "admin" || role === "superadmin";
}

router.get("/admin/users", async (req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        artistId: usersTable.artistId,
        artistName: artistsTable.name,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .leftJoin(artistsTable, eq(usersTable.artistId, artistsTable.id))
      .orderBy(usersTable.createdAt);

    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/users", async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request: " + parsed.error.issues[0]?.message });
    }

    const { username, password, role, artistId } = parsed.data;

    // Only superadmin can create admin or superadmin accounts
    if (isElevatedRole(role) && req.session.role !== "superadmin") {
      return res.status(403).json({ error: "Forbidden: only a super admin can create admin accounts." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({ username, passwordHash, role, artistId: artistId ?? null })
      .returning();

    let artistName: string | undefined;
    if (user.artistId) {
      const artists = await db
        .select({ name: artistsTable.name })
        .from(artistsTable)
        .where(eq(artistsTable.id, user.artistId))
        .limit(1);
      artistName = artists[0]?.name;
    }

    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      artistId: user.artistId,
      artistName,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request: " + parsed.error.issues[0]?.message });
    }

    const [target] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!target) return res.status(404).json({ error: "User not found" });

    const requestingRole = req.session.role!;
    const requestingId = req.session.userId!;
    const isEditingSelf = requestingId === target.id;

    // A regular admin cannot touch another admin or superadmin's credentials/role
    if (requestingRole === "admin" && !isEditingSelf && isElevatedRole(target.role)) {
      if (parsed.data.password || parsed.data.username || parsed.data.role) {
        return res.status(403).json({
          error: "Forbidden: only a super admin can change another admin's credentials or role.",
        });
      }
    }

    // Nobody (including superadmin) can change a superadmin's role except another superadmin editing themselves
    // i.e. a superadmin cannot demote another superadmin — only self-service
    if (target.role === "superadmin" && !isEditingSelf && parsed.data.role) {
      return res.status(403).json({
        error: "Forbidden: cannot change another super admin's role.",
      });
    }

    // Promoting to superadmin requires superadmin
    if (parsed.data.role === "superadmin" && requestingRole !== "superadmin") {
      return res.status(403).json({
        error: "Forbidden: only a super admin can promote accounts to super admin.",
      });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.username) updateData.username = parsed.data.username;
    if (parsed.data.password) updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    if (parsed.data.role) updateData.role = parsed.data.role;
    if (parsed.data.artistId !== undefined) updateData.artistId = parsed.data.artistId;

    const [updated] = await db
      .update(usersTable)
      .set(updateData as any)
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    let artistName: string | undefined;
    if (updated.artistId) {
      const artists = await db
        .select({ name: artistsTable.name })
        .from(artistsTable)
        .where(eq(artistsTable.id, updated.artistId))
        .limit(1);
      artistName = artists[0]?.name;
    }

    res.json({
      id: updated.id,
      username: updated.username,
      role: updated.role,
      artistId: updated.artistId,
      artistName,
      createdAt: updated.createdAt,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const requestingRole = req.session.role!;
    const requestingId = req.session.userId!;

    if (requestingId === id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    const [target] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!target) return res.status(404).json({ error: "User not found" });

    // Only superadmin can delete admin/superadmin accounts
    if (isElevatedRole(target.role) && requestingRole !== "superadmin") {
      return res.status(403).json({ error: "Forbidden: only a super admin can delete admin accounts." });
    }

    // Nobody can delete another superadmin
    if (target.role === "superadmin") {
      return res.status(403).json({ error: "Forbidden: super admin accounts cannot be deleted." });
    }

    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
