import { defaultEmbeddingProvider } from "./embedding.service.js";
import { retrieveRelevantChunks } from "./retrieval.service.js";
import { streamChatCompletion, ProviderError, type ProviderMessage } from "./provider.js";
import {
  buildSystemPrompt,
  OUT_OF_SCOPE_RESPONSE,
  UNKNOWN_SCHOOL_INFO_RESPONSE,
} from "./prompts.js";
import { extractSources } from "./sources.js";
import {
  getOrCreateSession,
  getRecentConversationHistory,
  saveUserMessage,
  saveAssistantMessage,
} from "./session.service.js";
import type { ChatEvent, EmbeddingProvider } from "./types.js";

export interface ChatServiceOptions {
  sessionId?: string | null;
  message: string;
  signal?: AbortSignal;
  onEvent: (event: ChatEvent) => void;
  embeddingProvider?: EmbeddingProvider;
  streamCompletionFn?: typeof streamChatCompletion;
}

const SCHOOL_KEYWORDS = [
  "smk",
  "telkom",
  "purwokerto",
  "sekolah",
  "jurusan",
  "ppdb",
  "rpl",
  "tkj",
  "tja",
  "tjat",
  "pg",
  "game",
  "biaya",
  "guru",
  "fasilitas",
  "asrama",
  "beasiswa",
  "ekskul",
  "ekstrakurikuler",
  "prestasi",
  "pendaftaran",
  "rapor",
  "kepala sekolah",
  "kantin",
  "kelas",
  "lab",
  "lks",
  "pkl",
];

export const FRIENDLY_GREETING_RESPONSE =
  "Halo! Saya NEXEL AI, asisten virtual resmi SMK Telkom Purwokerto. Ada yang bisa saya bantu seputar informasi jurusan, pendaftaran (PPDB), fasilitas, atau kegiatan sekolah?";

const GREETING_TOKENS = new Set([
  "halo",
  "hai",
  "hi",
  "hey",
  "helo",
  "pagi",
  "siang",
  "sore",
  "malam",
  "ping",
  "p",
  "assalamualaikum",
  "kulonuwun",
  "permisi",
  "sampurasun",
]);

const INQUIRY_KEYWORDS = [
  "berapa",
  "biaya",
  "daftar",
  "pendaftaran",
  "syarat",
  "cara",
  "jadwal",
  "lokasi",
  "alamat",
  "kapan",
  "dimana",
  "mengapa",
  "kenapa",
  "info",
  "informasi",
  "tanya",
  "bisa tanya",
];

export function isGreetingQuery(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  if (!normalized) return false;

  // Jika mengandung kata kunci sekolah atau kata tanya substantif, arahkan ke retrieval
  if (SCHOOL_KEYWORDS.some((kw) => normalized.includes(kw))) return false;
  if (INQUIRY_KEYWORDS.some((kw) => normalized.includes(kw))) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 5) return false;

  // Cek frasa percakapan sapaan 'apa kabar' / 'gimana kabar'
  const isKabarPhrase =
    normalized.includes("apa kabar") ||
    normalized.includes("gimana kabar") ||
    normalized.includes("bagaimana kabar");
  if (isKabarPhrase) return true;

  // Cek awalan sapaan waktu formal (selamat pagi/siang/sore/malam/datang)
  const isSelamat =
    words[0] === "selamat" &&
    ["pagi", "siang", "sore", "malam", "datang", "sejahtera"].includes(words[1]);
  if (isSelamat) return true;

  // Cek token sapaan umum
  const hasGreetingToken = words.some((w) => GREETING_TOKENS.has(w));
  if (hasGreetingToken) {
    // Pastikan bukan pertanyaan dengan kata tanya lain
    const questionTokens = ["apa", "siapa", "bagaimana", "gimana"];
    const hasQuestion = words.some((w) => questionTokens.includes(w));
    if (!hasQuestion) return true;
  }

  return false;
}

export function isSchoolRelatedQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return SCHOOL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Orkestrasi alur percakapan NEXEL AI:
 * Validasi -> Sesi Anonim -> Sapaan Fast-Path -> Query Embedding -> pgvector Retrieval ->
 * Scope Gate -> Grounded Prompt -> Streaming LLM -> Simpan Jawaban
 */
export async function handleChatStream(options: ChatServiceOptions): Promise<void> {
  const { message, signal, onEvent } = options;
  const embeddingProvider = options.embeddingProvider || defaultEmbeddingProvider;

  // 1. Validasi Input Pesan
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    onEvent({
      type: "error",
      code: "EMPTY_MESSAGE",
      message: "Pesan tidak boleh kosong.",
    });
    return;
  }

  if (trimmedMessage.length > 4000) {
    onEvent({
      type: "error",
      code: "MESSAGE_TOO_LONG",
      message: "Pesan melebihi batas maksimal 4000 karakter.",
    });
    return;
  }

  // 2. Sesi Anonim dan Penyimpanan Pesan Pengguna
  const sessionId = await getOrCreateSession(options.sessionId);
  onEvent({ type: "start", sessionId });

  await saveUserMessage(sessionId, trimmedMessage);

  // 2.5 Sapaan Ramah (Fast-Path untuk Pesan Sapaan Pengguna)
  if (isGreetingQuery(trimmedMessage)) {
    onEvent({ type: "text", text: FRIENDLY_GREETING_RESPONSE });
    await saveAssistantMessage(sessionId, FRIENDLY_GREETING_RESPONSE);
    onEvent({ type: "done" });
    return;
  }

  // 3. Query Embedding (Fail-Safe Anggun)
  let queryEmbedding: number[];
  try {
    const embeddings = await embeddingProvider.embed([trimmedMessage]);
    queryEmbedding = embeddings[0];
    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Hasil embedding kosong");
    }
  } catch (err: unknown) {
    console.error("[NEXEL AI] Embedding failure:", err);
    // Penanganan fail-safe yang anggun tanpa memunculkan error kaku di UI pengguna
    const fallbackResponse = isSchoolRelatedQuery(trimmedMessage)
      ? "Mohon maaf, sistem pencarian informasi sekolah sedang mengalami perlambatan koneksi. Untuk informasi lengkap mengenai jurusan, PPDB, atau fasilitas, silakan hubungi kontak resmi SMK Telkom Purwokerto atau coba tanyakan kembali sesaat lagi."
      : "Mohon maaf, sistem asisten saat ini sedang mengalami gangguan koneksi sementara. Silakan coba kembali dalam beberapa saat.";

    onEvent({ type: "text", text: fallbackResponse });
    await saveAssistantMessage(sessionId, fallbackResponse);
    onEvent({ type: "done" });
    return;
  }

  // 4. pgvector Retrieval & Scope Gate (Fail-Safe Anggun)
  let retrievalResult;
  try {
    retrievalResult = await retrieveRelevantChunks(queryEmbedding);
  } catch (err: unknown) {
    console.error("[NEXEL AI] Retrieval failure:", err);
    const fallbackResponse =
      "Mohon maaf, basis data informasi sekolah sedang dalam pemeliharaan berkala. Silakan coba kembali sesaat lagi.";
    onEvent({ type: "text", text: fallbackResponse });
    await saveAssistantMessage(sessionId, fallbackResponse);
    onEvent({ type: "done" });
    return;
  }

  // 5. Evaluasi Scope Gate
  if (!retrievalResult.isRelevant || retrievalResult.chunks.length === 0) {
    // Tidak ada konteks sekolah yang relevan
    const isSchoolContext = isSchoolRelatedQuery(trimmedMessage);
    const rejectionText = isSchoolContext
      ? UNKNOWN_SCHOOL_INFO_RESPONSE
      : OUT_OF_SCOPE_RESPONSE;

    // JANGAN MEMANGGIL NEMOTRON / GENERATION MODEL
    onEvent({ type: "text", text: rejectionText });
    await saveAssistantMessage(sessionId, rejectionText);
    onEvent({ type: "done" });
    return;
  }

  // 6. Siapkan Referensi Sumber Resmi
  const sources = extractSources(retrievalResult.chunks);
  for (const src of sources) {
    onEvent({ type: "source", source: src });
  }

  // 7. Ambil Histori Percakapan Terkini (Budget Deterministik)
  const history = await getRecentConversationHistory(sessionId, 6);
  // Hapus pesan user terakhir dari histori karena akan disertakan terpisah
  const priorHistory = history.slice(0, -1);

  // 8. Susun Prompt Berpagar (Grounded System Prompt)
  const systemPrompt = buildSystemPrompt(retrievalResult.chunks);
  const promptMessages: ProviderMessage[] = [
    { role: "system", content: systemPrompt },
    ...priorHistory,
    { role: "user", content: trimmedMessage },
  ];

  // 9. Streaming Chat Completion melalui Provider
  const streamFn = options.streamCompletionFn || streamChatCompletion;
  try {
    const assistantResponse = await streamFn({
      messages: promptMessages,
      signal,
      onToken: (token) => {
        onEvent({ type: "text", text: token });
      },
    });

    // Simpan pesan asisten setelah generasi selesai secara utuh
    if (assistantResponse && !signal?.aborted) {
      await saveAssistantMessage(sessionId, assistantResponse);
      onEvent({ type: "done" });
    }
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof ProviderError && err.code === "AI_PROVIDER_ABORTED")) {
      // Abort oleh klien, bersihkan tanpa error noise berlebih
      return;
    }

    console.error("[NEXEL AI] Provider error:", err instanceof Error ? err.message : err);
    onEvent({
      type: "error",
      code: err instanceof ProviderError ? err.code : "AI_PROVIDER_UNAVAILABLE",
      message: "Maaf, chatbot sedang mengalami gangguan. Silakan coba lagi.",
    });
  }
}
