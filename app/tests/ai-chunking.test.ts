import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "../src/server/modules/ai/chunking.js";

describe("NEXEL AI Chunking Tests", () => {
  it("returns empty array for empty or whitespace content", () => {
    expect(chunkMarkdown("")).toEqual([]);
    expect(chunkMarkdown("   \n\n  ")).toEqual([]);
  });

  it("splits content deterministically based on headings", () => {
    const markdown = `# Program Keahlian
Pilihan program keahlian di SMK Telkom Purwokerto.

## Rekayasa Perangkat Lunak (RPL)
Mempelajari rekayasa aplikasi web dan mobile.

## Pengembangan Game (PG)
Mempelajari pembuatan game 2D dan 3D.`;

    const chunks = chunkMarkdown(markdown);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0].content).toContain("Program Keahlian");
    expect(chunks[1].content).toContain("Rekayasa Perangkat Lunak (RPL)");
    expect(chunks[2].content).toContain("Pengembangan Game (PG)");
  });

  it("preserves school acronyms and technical terms intact", () => {
    const text = `## Akronim Sekolah
Jurusan kami mencakup RPL, TKJ, TJA, dan PG.
Selain itu ada program PPDB dan magang PKL di industri Telkom.`;

    const chunks = chunkMarkdown(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toContain("RPL");
    expect(chunks[0].content).toContain("TKJ");
    expect(chunks[0].content).toContain("TJA");
    expect(chunks[0].content).toContain("PG");
    expect(chunks[0].content).toContain("PPDB");
    expect(chunks[0].content).toContain("PKL");
  });

  it("produces identical chunks on repeated executions (deterministic)", () => {
    const content = `## Fasilitas
Fasilitas lengkap meliputi Lab Komputer dan Lab Jaringan Cisco.

## Asrama
SMK Telkom Purwokerto bekerjasama dengan pondokan terverifikasi.`;

    const firstRun = chunkMarkdown(content);
    const secondRun = chunkMarkdown(content);

    expect(firstRun).toEqual(secondRun);
  });
});
