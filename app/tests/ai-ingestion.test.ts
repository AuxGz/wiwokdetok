import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestDocument, computeContentHash } from "../src/server/modules/ai/ingestion.service.js";
import { prisma } from "../src/server/lib/prisma.js";
import type { EmbeddingProvider } from "../src/server/modules/ai/types.js";

describe("NEXEL AI Ingestion Service Tests", () => {
  let fakeEmbeddingProvider: EmbeddingProvider;

  beforeEach(() => {
    vi.restoreAllMocks();
    fakeEmbeddingProvider = {
      embed: vi.fn().mockImplementation(async (texts: string[]) => {
        return texts.map(() => new Array(2048).fill(0.01));
      }),
    };
  });

  it("skips ingestion if content hash has not changed (idempotency)", async () => {
    const content = "# Profil Sekolah\nInformasi resmi sekolah.";
    const hash = computeContentHash(content);

    vi.spyOn(prisma.knowledgeDocument, "findUnique").mockResolvedValueOnce({
      id: "doc-1",
      contentHash: hash,
    } as never);

    vi.spyOn(prisma.knowledgeChunk, "count").mockResolvedValueOnce(3 as never);

    const res = await ingestDocument(
      {
        title: "Profil Sekolah",
        source: "sekolah.md",
        content,
      },
      fakeEmbeddingProvider
    );

    expect(res.action).toBe("skipped");
    expect(res.chunksCount).toBe(3);
    expect(fakeEmbeddingProvider.embed).not.toHaveBeenCalled();
  });

  it("reindexes document when content has changed", async () => {
    const oldHash = "hash-lama-1234";
    const newContent = "# Profil Sekolah Baru\nInformasi terbarukan.";

    vi.spyOn(prisma.knowledgeDocument, "findUnique").mockResolvedValueOnce({
      id: "doc-1",
      contentHash: oldHash,
    } as never);

    vi.spyOn(prisma, "$transaction").mockImplementationOnce(async (cb) => {
      return cb({
        knowledgeDocument: {
          upsert: vi.fn().mockResolvedValue({ id: "doc-1" }),
        },
        knowledgeChunk: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        $executeRaw: vi.fn().mockResolvedValue(1),
      } as never);
    });

    const res = await ingestDocument(
      {
        title: "Profil Sekolah Baru",
        source: "sekolah.md",
        content: newContent,
      },
      fakeEmbeddingProvider
    );

    expect(res.action).toBe("updated");
    expect(res.chunksCount).toBeGreaterThan(0);
    expect(fakeEmbeddingProvider.embed).toHaveBeenCalled();
  });
});
