import { Router, type Request, type Response } from "express";
import { prisma } from "../../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "school-web-api",
  });
});

healthRouter.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Database tidak terhubung",
      timestamp: new Date().toISOString(),
    });
  }
});
