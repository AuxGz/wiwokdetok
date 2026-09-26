import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[error-handler]", err);

  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    res.status(status).json({
      status: "error",
      message: err instanceof Error ? err.message : "Internal server error",
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    res.status(status).json({
      status: "error",
      message: status >= 500 ? "Internal server error" : (err instanceof Error ? err.message : "Request error"),
    });
  }
}
