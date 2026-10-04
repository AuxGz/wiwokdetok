import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Pemuatan .env tunggal dari root repositori untuk alur kerja development lokal ('cd app && npm ...')
// Sesuai konvensi, perintah dijalankan dari direktori 'app/', sehingga root .env berada di '../.env':
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  // Wajib disediakan dari environment (Docker Compose atau root .env), tanpa fallback kredensial palsu
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  PUBLIC_SITE_URL: z.string().url("PUBLIC_SITE_URL harus berupa URL valid").default("http://localhost:4321"),

  // AI Chat Provider (OpenAI Chat Completions-compatible)
  AI_BASE_URL: z.string().default("https://api.openai.com"),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default("nemotron-3.5-lightning"),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),

  // Embedding Provider (otomatis fallback ke AI_BASE_URL & AI_API_KEY jika dikosongkan)
  EMBEDDING_BASE_URL: z.string().default(""),
  EMBEDDING_API_KEY: z.string().default(""),
  EMBEDDING_MODEL: z.string().default("nvidia/nemotron-3-embed-1b"),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(2048),
  EMBEDDING_TIMEOUT_MS: z.coerce.number().default(15000),

  // RAG & Retrieval
  AI_RAG_TOP_K: z.coerce.number().default(5),
  AI_RAG_MIN_SIMILARITY: z.coerce.number().default(0.35),

  // Rate Limiting
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Kesalahan konfigurasi variabel lingkungan:", parsed.error.format());
  throw new Error("Variabel lingkungan tidak valid");
}

export const env = parsed.data;
