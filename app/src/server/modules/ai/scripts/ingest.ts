import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ingestBatch } from "../ingestion.service.js";
import { defaultEmbeddingProvider } from "../embedding.service.js";
import { closeDatabase } from "../../../lib/prisma.js";
import type { IngestionDocumentInput } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runCliIngest(): Promise<void> {
  console.log("==> [NEXEL AI] Memulai proses ingestion dokumen pengetahuan...");

  const knowledgeDir = path.resolve(__dirname, "../../../../../knowledge");
  const fallbackKnowledgeDir = path.resolve(process.cwd(), "knowledge");

  const targetDir = fs.existsSync(knowledgeDir)
    ? knowledgeDir
    : fs.existsSync(fallbackKnowledgeDir)
    ? fallbackKnowledgeDir
    : null;

  if (!targetDir) {
    console.error("❌ Direktori knowledge tidak ditemukan.");
    process.exit(1);
  }

  console.log(`==> Membaca berkas markdown dari: ${targetDir}`);
  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.warn("⚠️ Tidak ada berkas .md di direktori knowledge.");
    await closeDatabase();
    return;
  }

  const documents: IngestionDocumentInput[] = [];

  for (const file of files) {
    const filePath = path.join(targetDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Ambil judul dari heading pertama (# Judul) atau nama file
    const match = content.match(/^#\s+(.+)$/m);
    const title = match ? match[1].trim() : file.replace(/\.md$/, "");

    documents.push({
      title,
      source: file,
      content,
      metadata: { filename: file },
    });
  }

  try {
    const results = await ingestBatch(documents, defaultEmbeddingProvider);
    console.log("\n==> [Hasil Ingestion]");
    for (const res of results) {
      console.log(`- [${res.action.toUpperCase()}] ${res.title} (${res.source}): ${res.chunksCount} chunks`);
    }
    console.log("\n✔ Ingestion selesai secara sukses dan idempotensial.");
  } catch (err: unknown) {
    console.error("❌ Gagal melakukan ingestion:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

// Jalankan jika dipanggil via CLI
runCliIngest().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
