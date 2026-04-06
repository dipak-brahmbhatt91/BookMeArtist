import { Router, type IRouter, type Request } from "express";
import { db } from "@workspace/db";
import { usersTable, artistsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    role?: "superadmin" | "admin" | "artist";
    artistId?: number | null;
  }
}

const router: IRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

async function getArtistNameById(artistId?: number | null) {
  if (!artistId) return undefined;

  const artists = await db
    .select({ name: artistsTable.name })
    .from(artistsTable)
    .where(eq(artistsTable.id, artistId))
    .limit(1);

  return artists[0]?.name;
}

async function saveSession(req: Request, user: { id: number; role: string; artistId: number | null }) {
  req.session.userId = user.id;
  req.session.role = user.role as "superadmin" | "admin" | "artist";
  req.session.artistId = user.artistId;

  await new Promise<void>((resolve, reject) => {
    req.session.save((err: unknown) => (err ? reject(err) : resolve()));
  });
}

async function buildAuthResponse(user: { id: number; username: string; role: string; artistId: number | null }) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    artistId: user.artistId,
    artistName: await getArtistNameById(user.artistId),
  };
}

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const { username, password } = parsed.data;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    await saveSession(req, user);
    res.json(await buildAuthResponse(user));
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("bma.sid");
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (users.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }

    res.json(await buildAuthResponse(users[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to get session user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
