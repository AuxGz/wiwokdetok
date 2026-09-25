import express, { type Express } from "express";
import { healthRouter } from "./modules/health/health.router.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export function createApiApp(): Express {
  const app = express();

  app.use(express.json());

  const apiRouter = express.Router();
  apiRouter.use("/health", healthRouter);
  apiRouter.use(notFoundHandler);

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
