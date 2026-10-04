import { env } from "../../config/env.js";
import type { EmbeddingProvider } from "./types.js";

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private expectedDimensions: number;
  private timeoutMs: number;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    expectedDimensions?: number;
    timeoutMs?: number;
  }) {
    const rawBaseUrl = options?.baseUrl || (env.EMBEDDING_BASE_URL ? env.EMBEDDING_BASE_URL : env.AI_BASE_URL);
    this.baseUrl = rawBaseUrl.replace(/\/+$/, "");
    this.apiKey = options?.apiKey ?? (env.EMBEDDING_API_KEY ? env.EMBEDDING_API_KEY : env.AI_API_KEY);
    this.model = options?.model || env.EMBEDDING_MODEL;
    this.expectedDimensions = options?.expectedDimensions ?? env.EMBEDDING_DIMENSIONS;
    this.timeoutMs = options?.timeoutMs ?? env.EMBEDDING_TIMEOUT_MS;
  }

  private async fetchEmbedding(
    baseUrl: string,
    apiKey: string,
    texts: string[],
    signal: AbortSignal
  ): Promise<number[][]> {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const endpoint = cleanBase.endsWith("/v1")
      ? `${cleanBase}/embeddings`
      : `${cleanBase}/v1/embeddings`;

    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
      signal,
    });

    // Auto-retry hingga 2x jika proxy upstream mengembalikan error 429 atau >= 500
    let retries = 0;
    while (!response.ok && (response.status === 429 || response.status >= 500) && retries < 2 && !signal.aborted) {
      retries++;
      try {
        const delay = response.status === 429 ? retries * 1400 : retries * 900;
        await new Promise((r) => setTimeout(r, delay));
        if (signal.aborted) break;
        const retryRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: texts,
          }),
          signal,
        });
        if (retryRes) {
          response = retryRes;
        }
      } catch {
        // Lanjutkan penanganan jika retry gagal
      }
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const sanitizedBody = errorBody.slice(0, 200).replace(/\s+/g, " ").trim();
      throw new Error(
        `Embedding upstream error (status ${response.status}): ${response.statusText}${sanitizedBody ? ` - ${sanitizedBody}` : ""}`
      );
    }

    const json = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    if (!json?.data || !Array.isArray(json.data)) {
      throw new Error("Format respons embedding tidak valid dari provider");
    }

    // Pastikan urutan embedding sesuai dengan indeks input
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    const embeddings = sorted.map((item) => item.embedding);

    // FAIL-SAFE: Validasi dimensi setiap embedding
    for (let i = 0; i < embeddings.length; i++) {
      const vec = embeddings[i];
      if (!Array.isArray(vec) || vec.length !== this.expectedDimensions) {
        throw new Error(
          `FAIL-SAFE: Dimensi embedding tidak cocok. Diharapkan ${this.expectedDimensions}, tetapi provider mengembalikan ${vec?.length ?? 0}`
        );
      }
    }

    return embeddings;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      try {
        return await this.fetchEmbedding(this.baseUrl, this.apiKey, texts, controller.signal);
      } catch (err: unknown) {
        // Fallback otomatis ke gateway AI utama (env.AI_BASE_URL) jika endpoint khusus embedding berbeda dan gagal
        const cleanMainBase = env.AI_BASE_URL.replace(/\/+$/, "");
        if (this.baseUrl !== cleanMainBase && env.AI_API_KEY && !controller.signal.aborted) {
          console.warn("[NEXEL AI] Custom embedding endpoint failed, falling back to primary AI gateway:", err instanceof Error ? err.message : err);
          return await this.fetchEmbedding(cleanMainBase, env.AI_API_KEY, texts, controller.signal);
        }
        throw err;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Embedding timeout setelah ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const defaultEmbeddingProvider = new OpenAiEmbeddingProvider();
