import { env } from "../../config/env.js";
import type { ProviderErrorCode } from "./types.js";

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChatCompletionOptions {
  messages: ProviderMessage[];
  model?: string;
  signal?: AbortSignal;
  temperature?: number;
  onToken?: (token: string) => void;
}

export class ProviderError extends Error {
  constructor(
    public code: ProviderErrorCode,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * Transport klien OpenAI Chat Completions-compatible murni menggunakan native fetch.
 * Mengalirkan token stream secara real-time dan menangani timeout serta abort secara bersih.
 */
export async function streamChatCompletion(
  options: StreamChatCompletionOptions
): Promise<string> {
  const cleanBase = env.AI_BASE_URL.replace(/\/+$/, "");
  const endpoint = cleanBase.endsWith("/v1")
    ? `${cleanBase}/chat/completions`
    : `${cleanBase}/v1/chat/completions`;
  const model = options.model || env.AI_MODEL;
  const timeoutMs = Math.max(env.AI_TIMEOUT_MS, 60000);

  const controller = new AbortController();
  let timeoutId = setTimeout(() => {
    controller.abort(new ProviderError("AI_PROVIDER_TIMEOUT", "Permintaan ke penyedia AI melebihi batas waktu (timeout)"));
  }, timeoutMs);

  function refreshTimeout() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      controller.abort(new ProviderError("AI_PROVIDER_TIMEOUT", "Permintaan ke penyedia AI melebihi batas waktu (timeout)"));
    }, timeoutMs);
  }

  // Jika sinyal klien dibatalkan (misal: user klik Stop atau tab ditutup)
  if (options.signal) {
    options.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      controller.abort(new ProviderError("AI_PROVIDER_ABORTED", "Permintaan pembuatan respons dibatalkan oleh pengguna"));
    });
  }

  let fullResponse = "";

  try {
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        stream: true,
        temperature: options.temperature ?? 0.1,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Auto-retry 1x jika proxy upstream mengembalikan error 429 atau >= 500 (rate limit sementara / upstream timeout)
      if ((response.status >= 500 || response.status === 429) && !controller.signal.aborted) {
        try {
          const delay = response.status === 429 ? 2000 : 1200;
          await new Promise((r) => setTimeout(r, delay));
          if (!controller.signal.aborted) {
            const retryStreamRes = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.AI_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages: options.messages,
                stream: true,
                temperature: options.temperature ?? 0.1,
              }),
              signal: controller.signal,
            });
            if (retryStreamRes?.ok) {
              response = retryStreamRes;
            } else if (retryStreamRes?.status) {
              response = retryStreamRes;
            }
          }
        } catch {
          // Abaikan jika retry stream gagal, lanjutkan ke fallback non-streaming di bawah
        }
      }

      // Fallback toleran: Jika proxy upstream masih gagal pada mode streaming (500), coba mode non-streaming
      if (!response.ok && response.status >= 500) {
        try {
          const nonStreamRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.AI_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: options.messages,
              stream: false,
              temperature: options.temperature ?? 0.1,
            }),
            signal: controller.signal,
          });

          if (nonStreamRes.ok) {
            const data = (await nonStreamRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const text = data.choices?.[0]?.message?.content || "";
            if (text) {
              const chunkSize = 16;
              for (let i = 0; i < text.length; i += chunkSize) {
                if (controller.signal.aborted) break;
                const chunk = text.slice(i, i + chunkSize);
                fullResponse += chunk;
                options.onToken?.(chunk);
              }
              return fullResponse;
            }
          }
        } catch {
          // Abaikan error fallback dan lanjutkan penanganan error standar di bawah
        }
      }

      if (response.status === 401 || response.status === 403) {
        throw new ProviderError("AI_PROVIDER_AUTH", "Otentikasi penyedia AI gagal", response.status);
      }
      if (response.status === 429) {
        throw new ProviderError("AI_PROVIDER_RATE_LIMIT", "Batas pemanggilan provider AI terlampaui", response.status);
      }
      if (response.status >= 500) {
        throw new ProviderError("AI_PROVIDER_UNAVAILABLE", "Layanan penyedia AI sedang tidak tersedia", response.status);
      }
      throw new ProviderError("AI_PROVIDER_BAD_RESPONSE", `Penyedia AI merespons dengan status ${response.status}`, response.status);
    }

    if (!response.body) {
      throw new ProviderError("AI_PROVIDER_BAD_RESPONSE", "Respons penyedia AI tidak memiliki body stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      refreshTimeout();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Pertahankan baris terakhir yang belum lengkap di buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) {
          continue;
        }

        const dataContent = trimmed.slice(5).trim();
        if (dataContent === "[DONE]") {
          return fullResponse;
        }

        try {
          const parsed = JSON.parse(dataContent) as {
            choices?: Array<{
              delta?: {
                content?: string;
              };
            }>;
          };

          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullResponse += token;
            if (options.onToken) {
              options.onToken(token);
            }
          }
        } catch {
          // Abaikan baris SSE yang tidak berupa JSON valid
        }
      }
    }

    return fullResponse;
  } catch (err: unknown) {
    if (err instanceof ProviderError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        if (options.signal?.aborted) {
          throw new ProviderError("AI_PROVIDER_ABORTED", "Permintaan dibatalkan oleh klien");
        }
        throw new ProviderError("AI_PROVIDER_TIMEOUT", `Permintaan AI timeout setelah ${timeoutMs}ms`);
      }
      throw new ProviderError("AI_PROVIDER_UNAVAILABLE", `Gagal menghubungi penyedia AI: ${err.message}`);
    }
    throw new ProviderError("AI_PROVIDER_UNAVAILABLE", "Terjadi kesalahan internal pada koneksi AI");
  } finally {
    clearTimeout(timeoutId);
  }
}
