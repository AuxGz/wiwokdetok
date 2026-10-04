import type { Request, Response, NextFunction } from "express";
import { ADMIN_COOKIE_NAME, parseCookies, verifySession } from "../auth/admin-auth.service.js";
import type { AdminUser } from "../../../../generated/prisma/client.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
      adminSessionToken?: string;
    }
  }
}

export async function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[ADMIN_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Sesi admin tidak ditemukan. Silakan login kembali.",
    });
    return;
  }

  try {
    const session = await verifySession(token);
    if (!session) {
      // Bersihkan cookie yang tidak valid
      res.setHeader(
        "Set-Cookie",
        `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
      );
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Sesi admin telah kadaluarsa atau tidak valid.",
      });
      return;
    }

    req.adminUser = session.user;
    req.adminSessionToken = token;
    next();
  } catch (err) {
    console.error("[adminAuthMiddleware] Error memverifikasi sesi:", err);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Terjadi kesalahan saat memverifikasi sesi admin.",
    });
  }
}
