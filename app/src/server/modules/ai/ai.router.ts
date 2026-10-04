import express, { type Request, type Response, type NextFunction } from "express";
import { env } from "../../config/env.js";
import { handleChatStream } from "./chat.service.js";
import { getOrCreateSession, SESSION_COOKIE_NAME } from "./session.service.js";
import type { ChatEvent } from "./types.js";

export const aiRouter = express.Router();

// ==============================================================================
// IN-MEMORY RATE LIMITER PER IP & PER SESSION
// ==============================================================================
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

function cleanExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Bersihkan memori rate limiter setiap 5 menit
setInterval(cleanExpiredRateLimits, 5 * 60 * 1000).unref();

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
  const rawCookie = req.headers.cookie || "";
  const match = rawCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const sessionId = match ? match[1] : "anonymous";

  const key = `${ip}:${sessionId}`;
  const now = Date.now();
  const windowMs = env.AI_RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.AI_RATE_LIMIT_MAX_REQUESTS;

  let record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(key, record);
    return next();
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mengirim pesan lagi.",
      },
    });
    return;
  }

  record.count += 1;
  next();
}

/**
 * Helper untuk membaca atau menginisialisasi cookie sesi anonim
 */
function resolveSessionId(req: Request, res: Response): string {
  const rawCookie = req.headers.cookie || "";
  const match = rawCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const existingId = match ? match[1] : null;

  // Jika cookie belum ada atau bukan UUID yang valid
  const isValidUuid =
    typeof existingId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingId);

  const sessionId = isValidUuid ? existingId : crypto.randomUUID();

  // Set HttpOnly cookie
  const isProd = env.NODE_ENV === "production";
  const cookieOptions = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${30 * 24 * 60 * 60}`,
  ];
  if (isProd) {
    cookieOptions.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieOptions.join("; "));
  return sessionId;
}

// Endpoint status sesi anonim
aiRouter.get("/session", async (req: Request, res: Response) => {
  const sessionId = resolveSessionId(req, res);
  await getOrCreateSession(sessionId);
  res.json({
    status: "ok",
    sessionId,
  });
});

// Endpoint percakapan streaming NEXEL AI (SSE)
aiRouter.post("/chat", rateLimitMiddleware, async (req: Request, res: Response) => {
  const body = req.body as { message?: string };
  const message = body?.message;

  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({
      error: {
        code: "EMPTY_MESSAGE",
        message: "Pesan tidak boleh kosong.",
      },
    });
    return;
  }

  if (message.length > 4000) {
    res.status(400).json({
      error: {
        code: "MESSAGE_TOO_LONG",
        message: "Pesan melebihi batas maksimal 4000 karakter.",
      },
    });
    return;
  }

  const sessionId = resolveSessionId(req, res);

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const abortController = new AbortController();

  res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  const sendEvent = (event: ChatEvent) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (event.type === "done" || event.type === "error") {
      res.end();
    }
  };

  try {
    await handleChatStream({
      sessionId,
      message,
      signal: abortController.signal,
      onEvent: sendEvent,
    });
  } catch (err: unknown) {
    console.error("[aiRouter] Uncaught chat stream error:", err);
    sendEvent({
      type: "error",
      code: "AI_PROVIDER_UNAVAILABLE",
      message: "Maaf, terjadi gangguan pada chatbot sekolah.",
    });
  }
});
