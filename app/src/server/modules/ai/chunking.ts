export interface TextChunk {
  chunkIndex: number;
  content: string;
}

/**
 * Memecah konten markdown/teks secara deterministik berdasarkan seksi logis,
 * judul (heading), paragraf, dan daftar. Mempertahankan konteks akronim (RPL, TKJ, TJA, PG, PPDB).
 */
export function chunkMarkdown(content: string, maxChunkLength: number = 1200): TextChunk[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Pisahkan berdasarkan baris heading utama (# , ## )
  const lines = normalized.split("\n");
  const sections: { title: string; bodyLines: string[] }[] = [];

  let currentTitle = "Informasi Umum";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{1,2}\s+/.test(line)) {
      if (currentLines.length > 0) {
        sections.push({ title: currentTitle, bodyLines: [...currentLines] });
        currentLines = [];
      }
      currentTitle = line.replace(/^#{1,2}\s+/, "").trim();
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({ title: currentTitle, bodyLines: currentLines });
  }

  const rawChunks: string[] = [];

  for (const section of sections) {
    const sectionText = section.bodyLines.join("\n").trim();
    if (!sectionText) continue;

    if (sectionText.length <= maxChunkLength) {
      rawChunks.push(sectionText);
    } else {
      // Jika seksi terlalu panjang, pisahkan berdasarkan blok paragraf ganda (\n\n)
      const paragraphs = sectionText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
      let buffer = "";

      for (const p of paragraphs) {
        const candidate = buffer ? `${buffer}\n\n${p}` : p;
        if (candidate.length <= maxChunkLength) {
          buffer = candidate;
        } else {
          if (buffer) {
            rawChunks.push(buffer);
          }
          // Jika paragraf tunggal melebihi maxChunkLength, simpan langsung untuk menjaga keutuhan kalimat
          buffer = p;
        }
      }

      if (buffer) {
        rawChunks.push(buffer);
      }
    }
  }

  return rawChunks.map((contentStr, index) => ({
    chunkIndex: index,
    content: contentStr.trim(),
  }));
}
