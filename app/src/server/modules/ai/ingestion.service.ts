import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { chunkMarkdown } from "./chunking.js";
import { defaultEmbeddingProvider } from "./embedding.service.js";
import type { EmbeddingProvider, IngestionDocumentInput, IngestionResult } from "./types.js";

/**
 * Menghitung SHA-256 hash dari konten untuk deteksi perubahan (idempotency).
 */
export function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(content.trim()).digest("hex");
}

/**
 * Service ingest dokumen pengetahuan yang dapat digunakan kembali baik oleh CLI
 * maupun modul Admin internal di masa mendatang.
 */
export async function ingestDocument(
  doc: IngestionDocumentInput,
  embeddingProvider: EmbeddingProvider = defaultEmbeddingProvider
): Promise<IngestionResult> {
  const hash = computeContentHash(doc.content);

  // 1. Cek apakah dokumen sudah ada dengan hash yang sama
  const existing = await prisma.knowledgeDocument.findUnique({
    where: { source: doc.source },
    select: { id: true, contentHash: true },
  });

  if (existing && existing.contentHash === hash) {
    const chunkCount = await prisma.knowledgeChunk.count({
      where: { documentId: existing.id },
    });
    return {
      source: doc.source,
      title: doc.title,
      action: "skipped",
      chunksCount: chunkCount,
    };
  }

  // 2. Pecah dokumen menjadi chunk deterministik
  const rawChunks = chunkMarkdown(doc.content);
  if (rawChunks.length === 0) {
    return {
      source: doc.source,
      title: doc.title,
      action: "skipped",
      chunksCount: 0,
    };
  }

  // 3. Hasilkan embedding terlebih dahulu SEBELUM transaksi basis data (menghindari long DB transaction)
  const chunkTexts = rawChunks.map((c) => c.content);
  const embeddings = await embeddingProvider.embed(chunkTexts);

  // 4. Jalankan transaksi basis data: upsert dokumen, hapus chunk lama, masukkan chunk baru
  const documentId = existing ? existing.id : crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    // Upsert KnowledgeDocument
    await tx.knowledgeDocument.upsert({
      where: { source: doc.source },
      create: {
        id: documentId,
        title: doc.title,
        source: doc.source,
        content: doc.content,
        contentHash: hash,
        metadata: (doc.metadata as never) ?? undefined,
      },
      update: {
        title: doc.title,
        content: doc.content,
        contentHash: hash,
        metadata: (doc.metadata as never) ?? undefined,
      },
    });

    // Hapus chunk lama untuk dokumen ini (mencegah orphan chunks)
    await tx.knowledgeChunk.deleteMany({
      where: { documentId },
    });

    // Masukkan chunk baru bersama vector embedding menggunakan parameterized query
    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      const chunkId = crypto.randomUUID();
      const embedding = embeddings[i];
      const vectorStr = `[${embedding.join(",")}]`;
      const metaStr = JSON.stringify({
        ...(doc.metadata || {}),
        chunkIndex: chunk.chunkIndex,
      });

      await tx.$executeRaw`
        INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, embedding, metadata, created_at)
        VALUES (${chunkId}, ${documentId}, ${chunk.chunkIndex}, ${chunk.content}, ${vectorStr}::vector, ${metaStr}::jsonb, NOW())
      `;
    }
  });

  return {
    source: doc.source,
    title: doc.title,
    action: existing ? "updated" : "indexed",
    chunksCount: rawChunks.length,
  };
}

/**
 * Melakukan batch ingestion pada serangkaian dokumen secara berurutan.
 */
export async function ingestBatch(
  docs: IngestionDocumentInput[],
  embeddingProvider: EmbeddingProvider = defaultEmbeddingProvider
): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];
  for (const doc of docs) {
    const res = await ingestDocument(doc, embeddingProvider);
    results.push(res);
  }
  return results;
}
