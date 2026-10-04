import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import type { RetrievedChunk } from "./types.js";

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  bestSimilarity: number;
  isRelevant: boolean;
}

/**
 * Mencari chunk pengetahuan paling relevan menggunakan pgvector cosine distance.
 * Parameterized queries murni melalui tagged template literal Prisma ($queryRaw).
 */
export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  topK: number = env.AI_RAG_TOP_K,
  minSimilarity: number = env.AI_RAG_MIN_SIMILARITY
): Promise<RetrievalResult> {
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Prisma $queryRaw tagged template literal mengubah ${...} menjadi parameter aman ($1, $2, dst)
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      documentId: string;
      chunkIndex: number;
      content: string;
      metadata: Record<string, unknown> | null;
      documentTitle: string;
      documentSource: string;
      similarity: number;
    }>
  >`
    SELECT
      c.id,
      c.document_id AS "documentId",
      c.chunk_index AS "chunkIndex",
      c.content,
      c.metadata,
      d.title AS "documentTitle",
      d.source AS "documentSource",
      (1 - (c.embedding <=> ${vectorStr}::vector)) AS similarity
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vectorStr}::vector ASC
    LIMIT ${topK}
  `;

  const chunks: RetrievedChunk[] = rows.map((r) => ({
    id: r.id,
    documentId: r.documentId,
    chunkIndex: r.chunkIndex,
    content: r.content,
    metadata: r.metadata,
    documentTitle: r.documentTitle,
    documentSource: r.documentSource,
    similarity: Number(r.similarity),
  }));

  const bestSimilarity = chunks.length > 0 ? Math.max(...chunks.map((c) => c.similarity)) : 0;
  const isRelevant = bestSimilarity >= minSimilarity;

  // Saring hanya chunk yang memiliki similaritas di atas atau mendekati threshold
  const filteredChunks = chunks.filter((c) => c.similarity >= minSimilarity * 0.9);

  return {
    chunks: filteredChunks,
    bestSimilarity,
    isRelevant,
  };
}

/**
 * Fallback pencarian berbasis kata kunci ketika provider embedding mengalami gangguan rate limit (HTTP 429) atau koneksi upstream.
 */
export async function retrieveRelevantChunksByKeyword(
  queryText: string,
  topK: number = env.AI_RAG_TOP_K
): Promise<RetrievalResult> {
  const stopwords = new Set([
    "yang", "di", "dan", "dari", "ke", "ini", "itu", "untuk", "pada", "adalah",
    "sebagai", "dengan", "saya", "kamu", "anda", "apa", "siapa", "bagaimana",
    "kapan", "dimana", "kenapa", "mengapa", "berapa", "apakah", "bisa", "tolong",
    "ada", "saja", "tentang", "mengenai", "halo", "hai", "mau", "tanya"
  ]);

  const cleanWords = queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopwords.has(w));

  const searchKeywords = cleanWords.length > 0 ? cleanWords : ["telkom", "smk", "sekolah"];

  if (typeof prisma.$queryRaw !== "function") {
    return {
      chunks: [],
      bestSimilarity: 0,
      isRelevant: false,
    };
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      documentId: string;
      chunkIndex: number;
      content: string;
      metadata: Record<string, unknown> | null;
      documentTitle: string;
      documentSource: string;
    }>
  >`
    SELECT
      c.id,
      c.document_id AS "documentId",
      c.chunk_index AS "chunkIndex",
      c.content,
      c.metadata,
      d.title AS "documentTitle",
      d.source AS "documentSource"
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON d.id = c.document_id
  `;

  const scored = rows.map((r) => {
    let score = 0;
    const lowerContent = r.content.toLowerCase();
    const lowerTitle = r.documentTitle.toLowerCase();

    for (const kw of searchKeywords) {
      if (lowerTitle.includes(kw)) {
        score += 3;
      }
      if (lowerContent.includes(kw)) {
        score += 1;
      }
    }

    return {
      id: r.id,
      documentId: r.documentId,
      chunkIndex: r.chunkIndex,
      content: r.content,
      metadata: r.metadata,
      documentTitle: r.documentTitle,
      documentSource: r.documentSource,
      similarity: score > 0 ? Math.min(0.5 + score * 0.05, 0.95) : 0,
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  const matched = scored.filter((s) => s.similarity > 0).slice(0, topK);

  const bestSimilarity = matched.length > 0 ? matched[0].similarity : 0;
  const isRelevant = matched.length > 0;

  return {
    chunks: matched,
    bestSimilarity,
    isRelevant,
  };
}

