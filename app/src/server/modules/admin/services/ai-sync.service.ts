import { prisma } from "../../../lib/prisma.js";
import { ingestDocument } from "../../ai/ingestion.service.js";
import type { IngestionResult } from "../../ai/types.js";

/**
 * Otomatis sinkronkan satu artikel berita ke basis pengetahuan NEXEL AI.
 */
export async function syncNewsToAi(newsId: string): Promise<IngestionResult | null> {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id: newsId } });
    if (!article || !article.isPublished) return null;

    const content = `# Berita: ${article.title}
- Kategori: ${article.category}
- Tanggal Publikasi: ${article.date}

## Ringkasan
${article.excerpt || "-"}

## Isi Berita
${article.content || article.excerpt || ""}
`;

    return await ingestDocument({
      source: `db:news:${article.slug}`,
      title: `Berita: ${article.title}`,
      content,
      metadata: {
        type: "news",
        slug: article.slug,
        category: article.category,
      },
    });
  } catch (err) {
    console.warn(`[ai-sync] Gagal sinkronisasi berita ${newsId} ke AI:`, err);
    return null;
  }
}

/**
 * Otomatis sinkronkan program keahlian ke AI.
 */
export async function syncMajorToAi(majorId: string): Promise<IngestionResult | null> {
  try {
    const major = await prisma.schoolMajor.findUnique({ where: { id: majorId } });
    if (!major) return null;

    let compText = "";
    if (Array.isArray(major.competencies)) {
      compText = (major.competencies as Array<{ text?: string }>)
        .map((c) => `- ${c.text || ""}`)
        .join("\n");
    }

    const content = `# Program Keahlian: ${major.name} (${major.code})
${major.tagline ? `Tagline: ${major.tagline}\n` : ""}

## Deskripsi
${major.description}

${compText ? `## Kompetensi Keahlian\n${compText}\n` : ""}
${major.careerProspects ? `## Prospek Karir\n${major.careerProspects}\n` : ""}
`;

    return await ingestDocument({
      source: `db:major:${major.code.toLowerCase()}`,
      title: `Jurusan ${major.name} (${major.code})`,
      content,
      metadata: {
        type: "major",
        code: major.code,
      },
    });
  } catch (err) {
    console.warn(`[ai-sync] Gagal sinkronisasi jurusan ${majorId} ke AI:`, err);
    return null;
  }
}

/**
 * Otomatis sinkronkan fasilitas ke AI.
 */
export async function syncFacilityToAi(facilityId: string): Promise<IngestionResult | null> {
  try {
    const facility = await prisma.schoolFacility.findUnique({ where: { id: facilityId } });
    if (!facility) return null;

    const content = `# Fasilitas Sekolah: ${facility.name}
Badge: ${facility.badge || "-"}
Tipe Panorama 360°: ${facility.isPanorama ? "Ya (Tersedia Tur Virtual)" : "Tidak"}

## Deskripsi
${facility.description}
`;

    return await ingestDocument({
      source: `db:facility:${facility.id}`,
      title: `Fasilitas: ${facility.name}`,
      content,
      metadata: {
        type: "facility",
        name: facility.name,
      },
    });
  } catch (err) {
    console.warn(`[ai-sync] Gagal sinkronisasi fasilitas ${facilityId} ke AI:`, err);
    return null;
  }
}

/**
 * Otomatis sinkronkan FAQ ke AI.
 */
export async function syncFaqToAi(faqId: string): Promise<IngestionResult | null> {
  try {
    const faq = await prisma.faqItem.findUnique({ where: { id: faqId } });
    if (!faq) return null;

    const content = `# Tanya Jawab (FAQ): ${faq.question}
Kategori: ${faq.category || "Umum"}

## Jawaban
${faq.answer}
`;

    return await ingestDocument({
      source: `db:faq:${faq.id}`,
      title: `FAQ: ${faq.question}`,
      content,
      metadata: {
        type: "faq",
        category: faq.category,
      },
    });
  } catch (err) {
    console.warn(`[ai-sync] Gagal sinkronisasi FAQ ${faqId} ke AI:`, err);
    return null;
  }
}

export interface SyncAllWebsiteContentResult {
  success: boolean;
  totalSynced: number;
  totalSkipped: number;
  totalErrors: number;
  results: IngestionResult[];
  errors: string[];
}

/**
 * Sinkronisasi Menyeluruh 1-Klik:
 * Membaca seluruh konten website dari database dan menyuntikkannya ke basis pengetahuan NEXEL AI.
 */
export async function syncAllWebsiteContentToAi(): Promise<SyncAllWebsiteContentResult> {
  const results: IngestionResult[] = [];
  const errors: string[] = [];
  let totalSynced = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    // 1. Berita terpublikasi
    const articles = await prisma.newsArticle.findMany({ where: { isPublished: true } });
    for (const a of articles) {
      try {
        const res = await syncNewsToAi(a.id);
        if (res) {
          results.push(res);
          if (res.action === "skipped") totalSkipped++;
          else totalSynced++;
        }
      } catch (e) {
        totalErrors++;
        errors.push(`Berita ${a.title}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 2. Program Keahlian
    const majors = await prisma.schoolMajor.findMany();
    for (const m of majors) {
      try {
        const res = await syncMajorToAi(m.id);
        if (res) {
          results.push(res);
          if (res.action === "skipped") totalSkipped++;
          else totalSynced++;
        }
      } catch (e) {
        totalErrors++;
        errors.push(`Jurusan ${m.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 3. Fasilitas
    const facilities = await prisma.schoolFacility.findMany();
    for (const f of facilities) {
      try {
        const res = await syncFacilityToAi(f.id);
        if (res) {
          results.push(res);
          if (res.action === "skipped") totalSkipped++;
          else totalSynced++;
        }
      } catch (e) {
        totalErrors++;
        errors.push(`Fasilitas ${f.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 4. FAQ
    const faqs = await prisma.faqItem.findMany();
    for (const q of faqs) {
      try {
        const res = await syncFaqToAi(q.id);
        if (res) {
          results.push(res);
          if (res.action === "skipped") totalSkipped++;
          else totalSynced++;
        }
      } catch (e) {
        totalErrors++;
        errors.push(`FAQ ${q.question}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 5. Guru & Pimpinan
    const teachers = await prisma.teacherLeader.findMany();
    if (teachers.length > 0) {
      try {
        const teacherLines = teachers
          .map((t) => `- **${t.name}**: ${t.position} (${t.sectionTitle || t.sectionId})`)
          .join("\n");
        const doc = {
          source: "db:teachers:all",
          title: "Daftar Dewan Guru dan Pimpinan SMK Telkom Purwokerto",
          content: `# Struktur Pimpinan & Dewan Guru SMK Telkom Purwokerto\n\n${teacherLines}\n`,
          metadata: { type: "teachers", count: teachers.length },
        };
        const res = await ingestDocument(doc);
        results.push(res);
        if (res.action === "skipped") totalSkipped++;
        else totalSynced++;
      } catch (e) {
        totalErrors++;
        errors.push(`Dewan Guru: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 6. Lowongan PKL
    const pkls = await prisma.pklListing.findMany({ where: { isOpen: true } });
    if (pkls.length > 0) {
      try {
        const pklLines = pkls
          .map(
            (p) =>
              `- **${p.company}** (${p.location}, ${p.workMode}): ${p.title} untuk Jurusan ${p.major}. Deskripsi: ${p.description}. Keahlian: ${p.tags.join(", ")}`
          )
          .join("\n");
        const doc = {
          source: "db:pkl:open-listings",
          title: "Daftar Lowongan PKL Aktif Mitra SMK Telkom Purwokerto",
          content: `# Lowongan PKL / Magang Aktif SMK Telkom Purwokerto\n\n${pklLines}\n`,
          metadata: { type: "pkl", count: pkls.length },
        };
        const res = await ingestDocument(doc);
        results.push(res);
        if (res.action === "skipped") totalSkipped++;
        else totalSynced++;
      } catch (e) {
        totalErrors++;
        errors.push(`Lowongan PKL: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (globalErr) {
    console.error("[ai-sync] Error fatal saat sinkronisasi menyeluruh:", globalErr);
    errors.push(`Error global: ${globalErr instanceof Error ? globalErr.message : String(globalErr)}`);
  }

  return {
    success: totalErrors === 0 || totalSynced > 0,
    totalSynced,
    totalSkipped,
    totalErrors,
    results,
    errors,
  };
}
