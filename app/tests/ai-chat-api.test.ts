import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../src/server/api-app.js";
import { prisma } from "../src/server/lib/prisma.js";

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

describe("NEXEL AI Chat API Integration Tests", () => {
  const app = createApiApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/ai/session creates or retrieves anonymous session cookie", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);

    const res = await request(app).get("/api/ai/session");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sessionId");
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toContain("nexel_session_id=");
    expect(setCookie[0]).toContain("HttpOnly");
  });

  it("POST /api/ai/chat returns SSE stream with normalized events on success", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);
    vi.spyOn(prisma.chatMessage, "create").mockResolvedValue({ id: "mock-msg" } as never);
    vi.spyOn(prisma.chatMessage, "findMany").mockResolvedValue([] as never);

    // Mock fetch untuk embedding dan chat completions
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/embeddings")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ index: 0, embedding: new Array(2048).fill(0.01) }],
          }),
        } as Response;
      }
      if (urlStr.includes("/chat/completions")) {
        return {
          ok: true,
          body: createSseStream([
            'data: {"choices":[{"delta":{"content":"Jurusan "}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"RPL dan PG"}}]}\n\n',
            "data: [DONE]\n\n",
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    // Mock retrieval
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
      {
        id: "chunk-1",
        documentId: "doc-1",
        chunkIndex: 0,
        content: "Ada 4 jurusan di SMK Telkom Purwokerto.",
        metadata: {},
        documentTitle: "Program Keahlian",
        documentSource: "jurusan.md",
        similarity: 0.9,
      },
    ] as never);

    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "Jurusan apa saja?" });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.text).toContain('"type":"start"');
    expect(res.text).toContain('"type":"source"');
    expect(res.text).toContain('"type":"text"');
    expect(res.text).toContain('"type":"done"');
  });

  it("POST /api/ai/chat rejects empty message with 400", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("EMPTY_MESSAGE");
  });

  it("POST /api/ai/chat rejects oversized message (> 4000 chars) with 400", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "X".repeat(4001) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MESSAGE_TOO_LONG");
  });

  it("POST /api/ai/chat sanitizes provider error safely without crashing", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);
    vi.spyOn(prisma.chatMessage, "create").mockResolvedValue({ id: "mock-msg" } as never);
    vi.spyOn(prisma.chatMessage, "findMany").mockResolvedValue([] as never);

    // Mock fetch: embeddings sukses, completions 500 error
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/embeddings")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ index: 0, embedding: new Array(2048).fill(0.01) }],
          }),
        } as Response;
      }
      if (urlStr.includes("/chat/completions")) {
        return {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    // Mock retrieval
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
      {
        id: "chunk-1",
        documentId: "doc-1",
        chunkIndex: 0,
        content: "Ada 4 jurusan di SMK Telkom Purwokerto.",
        metadata: {},
        documentTitle: "Program Keahlian",
        documentSource: "jurusan.md",
        similarity: 0.9,
      },
    ] as never);

    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "Jurusan apa saja?" });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"type":"error"');
    expect(res.text).toContain('"code":"AI_PROVIDER_UNAVAILABLE"');
  });

  it("POST /api/ai/chat returns friendly greeting without invoking LLM when user sends greeting", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);
    vi.spyOn(prisma.chatMessage, "create").mockResolvedValue({ id: "mock-msg" } as never);

    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "halo" });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"type":"start"');
    expect(res.text).toContain('"type":"text"');
    expect(res.text).toContain("NEXEL AI");
    expect(res.text).toContain('"type":"done"');
    expect(res.text).not.toContain('"type":"error"');
  });

  it("POST /api/ai/chat correctly treats conversational greetings as greetings and does not reject them as out-of-scope", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);
    vi.spyOn(prisma.chatMessage, "create").mockResolvedValue({ id: "mock-msg" } as never);

    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "halo apa kabar?" });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"type":"text"');
    expect(res.text).toContain("NEXEL AI");
    expect(res.text).toContain('"type":"done"');
  });

  it("POST /api/ai/chat does not swallow substantive inquiries prefixed with greetings", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);
    vi.spyOn(prisma.chatMessage, "create").mockResolvedValue({ id: "mock-msg" } as never);
    vi.spyOn(prisma.chatMessage, "findMany").mockResolvedValue([] as never);
    vi.spyOn(prisma, "$queryRaw").mockResolvedValue([
      {
        id: "chunk-1",
        documentId: "doc-1",
        documentTitle: "Informasi PPDB",
        content: "Pendaftaran PPDB SMK Telkom Purwokerto dibuka secara daring.",
        similarity: 0.85,
      },
    ] as never);

    // Jika pertanyaan substantif, embedding provider akan dipanggil
    const embedSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ index: 0, embedding: new Array(2048).fill(0.01) }],
      }),
    } as never).mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Pendaftaran PPDB"}}]}\n\ndata: [DONE]\n\n'));
          controller.close();
        },
      }),
    } as never);

    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "Selamat pagi info ppdb" });

    expect(res.status).toBe(200);
    // Harus memanggil embedding (bukan fast-path sapaan belaka)
    expect(embedSpy).toHaveBeenCalled();
    expect(res.text).toContain("Pendaftaran PPDB");
  });

  it("POST /api/ai/chat provides graceful fallback text when embedding upstream fails", async () => {
    vi.spyOn(prisma.chatSession, "upsert").mockResolvedValue({ id: "mock-sess" } as never);
    vi.spyOn(prisma.chatMessage, "create").mockResolvedValue({ id: "mock-msg" } as never);
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network timeout to embedding service"));

    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "Berapa biaya masuk jurusan RPL?" });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"type":"start"');
    expect(res.text).toContain('"type":"text"');
    expect(res.text).toContain("Mohon maaf");
    expect(res.text).toContain('"type":"done"');
    expect(res.text).not.toContain('"type":"error"');
  });
});
