import crypto from "node:crypto";
import { prisma } from "../../../lib/prisma.js";
import type { AdminUser, AdminSession } from "../../../../generated/prisma/client.js";

export const ADMIN_COOKIE_NAME = "jhic_admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawVal] = part.trim().split("=");
    if (rawKey) {
      cookies[rawKey] = decodeURIComponent(rawVal.join("="));
    }
  }
  return cookies;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  const [salt, key] = combinedHash.split(":");
  if (!salt || !key) return false;

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      const keyBuffer = Buffer.from(key, "hex");
      if (derivedKey.length !== keyBuffer.length) return resolve(false);
      resolve(crypto.timingSafeEqual(derivedKey, keyBuffer));
    });
  });
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function verifySession(token: string): Promise<(AdminSession & { user: AdminUser }) | null> {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  // Jika sesi kadaluarsa atau user non-aktif
  if (session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session;
}

export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  await prisma.adminSession.deleteMany({
    where: { token },
  });
}
