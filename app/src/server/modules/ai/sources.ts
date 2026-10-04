import type { ChatSource, RetrievedChunk } from "./types.js";

/**
 * Memetakan retrieved chunks ke daftar referensi sumber yang bersih dan aman untuk pengguna.
 * Tidak mengekspos UUID database, score similaritas numerik, path sistem berkas, atau metadata internal.
 */
export function extractSources(chunks: RetrievedChunk[]): ChatSource[] {
  const seenTitles = new Set<string>();
  const sources: ChatSource[] = [];

  for (const chunk of chunks) {
    const title = chunk.documentTitle.trim();
    if (title && !seenTitles.has(title)) {
      seenTitles.add(title);
      sources.push({
        title,
        label: title,
      });
    }
  }

  return sources;
}
