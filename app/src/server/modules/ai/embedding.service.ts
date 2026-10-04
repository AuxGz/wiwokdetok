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

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const cleanBase = this.baseUrl.replace(/\/+$/, "");
    const endpoint = cleanBase.endsWith("/v1")
      ? `${cleanBase}/embeddings`
      : `${cleanBase}/v1/embeddings`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const _errorBody = await response.text().catch(() => "");
        throw new Error(
          `Embedding upstream error (status ${response.status}): ${response.statusText}`
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
