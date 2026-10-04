import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import type { ProviderMessage } from "./provider.js";

export const SESSION_COOKIE_NAME = "nexel_session_id";

/**
 * Memastikan sesi percakapan anonim ada di basis data.
 * Mengembalikan objek ChatSession valid.
 */
export async function getOrCreateSession(rawSessionId?: string | null): Promise<string> {
  const isValidUuid =
    typeof rawSessionId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSessionId);

  const sessionId = isValidUuid ? (rawSessionId as string) : crypto.randomUUID();

  await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: { updatedAt: new Date() },
    create: { id: sessionId },
  });

  return sessionId;
}

/**
 * Mengambil histori percakapan terkini untuk follow-up context dengan budget deterministik.
 * Membatasi maksimal sejumlah pesan terakhir (misal: 6 pesan) agar token hemat dan fokus.
 */
export async function getRecentConversationHistory(
  sessionId: string,
  limit: number = 6
): Promise<ProviderMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Urutkan kembali secara kronologis (dari yang terlama ke yang terbaru)
  return messages.reverse().map((msg) => ({
    role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));
}

/**
 * Menyimpan pesan pengguna ke basis data.
 */
export async function saveUserMessage(sessionId: string, content: string): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: "USER",
      content,
    },
  });
}

/**
 * Menyimpan jawaban asisten ke basis data setelah proses generasi selesai.
 */
export async function saveAssistantMessage(sessionId: string, content: string): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: "ASSISTANT",
      content,
    },
  });
}
