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
  DIRECTUS_URL: z.string().url("DIRECTUS_URL harus berupa URL valid").optional(),
  PUBLIC_SITE_URL: z.string().url("PUBLIC_SITE_URL harus berupa URL valid").default("http://localhost:4321"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Kesalahan konfigurasi variabel lingkungan:", parsed.error.format());
  throw new Error("Variabel lingkungan tidak valid");
}

export const env = parsed.data;
