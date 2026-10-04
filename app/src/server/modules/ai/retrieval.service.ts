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
