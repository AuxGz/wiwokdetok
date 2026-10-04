import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamChatCompletion } from "../src/server/modules/ai/provider.js";

function createSseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe("NEXEL AI Provider Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("streams chat tokens correctly from SSE events", async () => {
    const sseLines = [
      'data: {"choices":[{"delta":{"content":"Halo "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"dari "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"NEXEL AI"}}]}\n\n',
      "data: [DONE]\n\n",
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      body: createSseStream(sseLines),
    } as Response);

    const receivedTokens: string[] = [];
    const result = await streamChatCompletion({
      messages: [{ role: "user", content: "Halo" }],
      onToken: (tok) => receivedTokens.push(tok),
    });

    expect(result).toBe("Halo dari NEXEL AI");
    expect(receivedTokens).toEqual(["Halo ", "dari ", "NEXEL AI"]);
  });

  it("handles provider auth failure with AI_PROVIDER_AUTH error code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    await expect(
      streamChatCompletion({
        messages: [{ role: "user", content: "Test" }],
      })
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_AUTH",
    });
  });

  it("handles provider rate limit with AI_PROVIDER_RATE_LIMIT error code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    } as Response);

    await expect(
      streamChatCompletion({
        messages: [{ role: "user", content: "Test" }],
      })
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_RATE_LIMIT",
    });
  });

  it("handles provider 500 failure with AI_PROVIDER_UNAVAILABLE error code when fallback also fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response);

    await expect(
      streamChatCompletion({
        messages: [{ role: "user", content: "Test" }],
      })
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE",
    });
  });

  it("gracefully falls back to non-streaming completion if streaming returns 500", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // Panggilan 1 (stream: true) gagal 500
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);
    // Panggilan 2 (stream: true retry) gagal 500
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);
    // Panggilan 3 (stream: false fallback) sukses
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Jawaban fallback sukses" } }],
      }),
    } as Response);

    const tokens: string[] = [];
    const result = await streamChatCompletion({
      messages: [{ role: "user", content: "Test" }],
      onToken: (t) => tokens.push(t),
    });

    expect(result).toBe("Jawaban fallback sukses");
    expect(tokens.join("")).toBe("Jawaban fallback sukses");
  });

  it("aborts upstream fetch immediately when client signal is aborted", async () => {
    const controller = new AbortController();

    // Mock fetch that hangs until aborted
    vi.spyOn(globalThis, "fetch").mockImplementationOnce((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const completionPromise = streamChatCompletion({
      messages: [{ role: "user", content: "Test" }],
      signal: controller.signal,
    });

    controller.abort();

    await expect(completionPromise).rejects.toMatchObject({
      code: "AI_PROVIDER_ABORTED",
    });
  });
});
