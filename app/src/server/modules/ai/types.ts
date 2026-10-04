export type ChatRole = "USER" | "ASSISTANT";

export interface ChatSource {
  title: string;
  label: string;
}

export type ChatEvent =
  | {
      type: "start";
      sessionId: string;
    }
  | {
      type: "text";
      text: string;
    }
  | {
      type: "source";
      source: ChatSource;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      code: string;
      message: string;
    };

export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata?: Record<string, unknown> | null;
  documentTitle: string;
  documentSource: string;
  similarity: number;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

export interface IngestionDocumentInput {
  title: string;
  source: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface IngestionResult {
  source: string;
  title: string;
  action: "indexed" | "skipped" | "updated";
  chunksCount: number;
}

export type ProviderErrorCode =
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_AUTH"
  | "AI_PROVIDER_RATE_LIMIT"
  | "AI_PROVIDER_BAD_RESPONSE"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_ABORTED";
