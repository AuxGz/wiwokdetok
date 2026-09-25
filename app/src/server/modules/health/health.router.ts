import { Router, type Request, type Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "school-web-api",
  });
});

healthRouter.get("/ready", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
  });
});
