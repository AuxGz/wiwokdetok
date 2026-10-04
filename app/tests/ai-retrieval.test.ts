import { describe, it, expect, vi, beforeEach } from "vitest";
import { retrieveRelevantChunks } from "../src/server/modules/ai/retrieval.service.js";
import { extractSources } from "../src/server/modules/ai/sources.js";
import { prisma } from "../src/server/lib/prisma.js";

describe("NEXEL AI Retrieval & Scope Gate Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("filters and returns relevant chunks when similarity exceeds threshold", async () => {
    const mockRows = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        chunkIndex: 0,
        content: "Jurusan RPL mempelajari pemrograman perangkat lunak.",
        metadata: {},
        documentTitle: "Program Keahlian",
        documentSource: "jurusan.md",
        similarity: 0.88,
      },
      {
        id: "chunk-2",
        documentId: "doc-1",
        chunkIndex: 1,
        content: "Jurusan PG mempelajari game development.",
        metadata: {},
        documentTitle: "Program Keahlian",
        documentSource: "jurusan.md",
        similarity: 0.75,
      },
    ];

    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce(mockRows as never);

    const fakeVector = new Array(2048).fill(0.01);
    const result = await retrieveRelevantChunks(fakeVector, 5, 0.65);

    expect(result.isRelevant).toBe(true);
    expect(result.bestSimilarity).toBe(0.88);
    expect(result.chunks).toHaveLength(2);

    const sources = extractSources(result.chunks);
    expect(sources).toHaveLength(1);
    expect(sources[0].title).toBe("Program Keahlian");
  });

  it("identifies out-of-scope query when similarity is below threshold", async () => {
    const mockRows = [
      {
        id: "chunk-low",
        documentId: "doc-1",
        chunkIndex: 0,
        content: "Konten umum sekolah.",
        metadata: {},
        documentTitle: "Profil Sekolah",
        documentSource: "sekolah.md",
        similarity: 0.35, // Jauh di bawah threshold 0.65
      },
    ];

    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce(mockRows as never);

    const fakeVector = new Array(2048).fill(0.01);
    const result = await retrieveRelevantChunks(fakeVector, 5, 0.65);

    expect(result.isRelevant).toBe(false);
    expect(result.bestSimilarity).toBe(0.35);
  });

  it("handles empty database search gracefully", async () => {
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([] as never);

    const fakeVector = new Array(2048).fill(0.01);
    const result = await retrieveRelevantChunks(fakeVector, 5, 0.65);

    expect(result.isRelevant).toBe(false);
    expect(result.bestSimilarity).toBe(0);
    expect(result.chunks).toEqual([]);
  });
});
