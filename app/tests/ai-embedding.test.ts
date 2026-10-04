import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAiEmbeddingProvider } from "../src/server/modules/ai/embedding.service.js";

describe("NEXEL AI Embedding Service Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when input is empty", async () => {
    const provider = new OpenAiEmbeddingProvider();
    const result = await provider.embed([]);
    expect(result).toEqual([]);
  });

  it("embeds texts and verifies dimensional consistency", async () => {
    const fakeVec1 = new Array(2048).fill(0.01);
    const fakeVec2 = new Array(2048).fill(0.02);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { index: 1, embedding: fakeVec2 },
          { index: 0, embedding: fakeVec1 },
        ],
      }),
    } as Response);

    const provider = new OpenAiEmbeddingProvider({
      expectedDimensions: 2048,
    });

    const res = await provider.embed(["Halo", "Dunia"]);
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual(fakeVec1);
    expect(res[1]).toEqual(fakeVec2);
  });

  it("fails safe when embedding dimensions do not match expected configuration", async () => {
    const invalidVec = new Array(512).fill(0.01); // 512 instead of 2048

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ index: 0, embedding: invalidVec }],
      }),
    } as Response);

    const provider = new OpenAiEmbeddingProvider({
      expectedDimensions: 2048,
    });

    await expect(provider.embed(["Test"])).rejects.toThrow(/FAIL-SAFE.*Dimensi embedding/i);
  });

  it("handles upstream error cleanly without leaking secrets", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Invalid API key secret_123456",
    } as Response);

    const provider = new OpenAiEmbeddingProvider();
    await expect(provider.embed(["Test"])).rejects.toThrow(/Embedding upstream error/i);
  });
});
