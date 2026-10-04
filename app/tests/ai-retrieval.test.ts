import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  retrieveRelevantChunks,
  retrieveRelevantChunksByKeyword,
} from "../src/server/modules/ai/retrieval.service.js";
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

  it("ranks jurusan.md at the top when searching for majors with institutional keywords", async () => {
    const mockRows = [
      {
        id: "chunk-sekolah",
        documentId: "doc-sekolah",
        chunkIndex: 0,
        content: "SMK Telkom Purwokerto adalah sekolah kejuruan di Purwokerto.",
        metadata: {},
        documentTitle: "Profil SMK Telkom Purwokerto",
        documentSource: "sekolah.md",
      },
      {
        id: "chunk-fasilitas",
        documentId: "doc-fasilitas",
        chunkIndex: 0,
        content: "Fasilitas lengkap SMK Telkom Purwokerto untuk mendukung pembelajaran di sekolah.",
        metadata: {},
        documentTitle: "Fasilitas Sekolah SMK Telkom Purwokerto",
        documentSource: "fasilitas.md",
      },
      {
        id: "chunk-jurusan",
        documentId: "doc-jurusan",
        chunkIndex: 0,
        content: "SMK Telkom Purwokerto memiliki 4 program keahlian unggulan: RPL, PG, TKJ, dan TJA.",
        metadata: {},
        documentTitle: "Program Keahlian (Jurusan) SMK Telkom Purwokerto",
        documentSource: "jurusan.md",
      },
    ];

    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce(mockRows as never);

    const result = await retrieveRelevantChunksByKeyword(
      "Jurusan apa saja yang tersedia di SMK Telkom Purwokerto?"
    );

    expect(result.isRelevant).toBe(true);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0].documentSource).toBe("jurusan.md");
    expect(result.chunks[0].documentTitle).toContain("Jurusan");
  });
});
