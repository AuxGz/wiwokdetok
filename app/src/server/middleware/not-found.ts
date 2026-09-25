import type { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan`,
      status: 404,
    },
  });
}
