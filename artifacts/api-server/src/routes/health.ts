import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug-session", (req, res) => {
  res.json({
    secure: req.secure,
    protocol: req.protocol,
    nodeEnv: process.env.NODE_ENV,
    forwardedProto: req.headers["x-forwarded-proto"],
    forwardedFor: req.headers["x-forwarded-for"],
    host: req.headers["host"],
    sessionId: req.session?.id ?? null,
    sessionUserId: req.session?.userId ?? null,
  });
});

export default router;
