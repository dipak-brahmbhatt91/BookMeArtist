import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || (req.session.role !== "admin" && req.session.role !== "superadmin")) {
    return res.status(401).json({ error: "Unauthorized: admin access required" });
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.role !== "superadmin") {
    return res.status(403).json({ error: "Forbidden: super admin access required" });
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized: login required" });
  }
  next();
}

export function isAdmin(req: Request) {
  return req.session.role === "admin" || req.session.role === "superadmin";
}

export function isSuperAdmin(req: Request) {
  return req.session.role === "superadmin";
}

export function isLinkedArtist(req: Request, artistId: number) {
  return req.session.role === "artist" && req.session.artistId === artistId;
}
