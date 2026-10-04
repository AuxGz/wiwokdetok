import express, { type Express } from "express";
import compression from "compression";
import { metricsMiddleware } from "./middleware/metrics.middleware.js";
import { metricsRouter } from "./modules/metrics/metrics.router.js";
import { healthRouter } from "./modules/health/health.router.js";
import { aiRouter } from "./modules/ai/ai.router.js";
import { pklRouter } from "./modules/pkl/pkl.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export function createApiApp(): Express {
  const app = express();

  // 1. Metrics observabilitas di awal request
  app.use(metricsMiddleware);

  // 2. Kompresi respons HTTP
  app.use(compression());

  // 3. Konfigurasi trust proxy untuk reverse proxy Webuzo/Nginx
  app.set("trust proxy", 1);

  // 4. Body parser JSON & form urlencoded
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // 5. Root metrics router (/metrics)
  app.use("/metrics", metricsRouter);

  // 6. API routers (/api/*)
  const apiRouter = express.Router();
  apiRouter.use("/health", healthRouter);
  apiRouter.use("/ai", aiRouter);
  apiRouter.use("/pkl", pklRouter);
  apiRouter.use("/admin", adminRouter);
  apiRouter.use("/metrics", metricsRouter);
  apiRouter.use(notFoundHandler);

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
