import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export interface StudentProfile {
  name?: string;
  major?: string;
  skills: string[];
  bio?: string;
}

export interface PklMatchInput {
  profile: StudentProfile;
  cvText?: string;
}

export interface PklListingRecord {
  id: string;
  company: string;
  initials: string | null;
  logoBg: string | null;
  location: string;
  workMode: string;
  title: string;
  tags: string[];
  description: string;
  major: string;
  isOpen: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PklMatchEvaluation {
  listingId: string;
  score: number;
  reason: string;
  matchedSkills: string[];
  skillsToImprove: string[];
}

export interface PklMatchResultItem extends PklMatchEvaluation {
  listing: PklListingRecord;
  company: string;
  title: string;
  location: string;
  workMode: string;
  major: string;
  tags: string[];
  description: string;
  initials: string | null;
  logoBg: string | null;
}

export const DEFAULT_PKL_LISTINGS: PklListingRecord[] = [
  // --- Jurusan RPL (Rekayasa Perangkat Lunak) ---
  {
    id: "pkl-rpl-1",
    company: "Telkom Indonesia",
    initials: "TI",
    logoBg: "bg-[#E4002B]",
    location: "Bandung",
    workMode: "Hybrid",
    title: "Frontend Developer Intern",
    tags: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
    description: "Membantu pengembangan antarmuka portal layanan pelanggan berbasis web dan integrasi API design system Telkom.",
    major: "RPL",
    isOpen: true,
    order: 1,
  },
  {
    id: "pkl-rpl-2",
    company: "Finnet Indonesia",
    initials: "FN",
    logoBg: "bg-[#0761C7]",
    location: "Jakarta",
    workMode: "Hybrid",
    title: "Backend Node.js & API Intern",
    tags: ["Node.js", "Express", "PostgreSQL", "REST APIs"],
    description: "Mengembangkan endpoint microservice pembayaran digital, integrasi gateway perbankan, dan optimasi query database.",
    major: "RPL",
    isOpen: true,
    order: 2,
  },
  {
    id: "pkl-rpl-3",
    company: "Telkomsel",
    initials: "TS",
    logoBg: "bg-[#E4002B]",
    location: "Jakarta",
    workMode: "Hybrid",
    title: "Mobile Flutter Developer Intern",
    tags: ["Flutter", "Dart", "State Management", "Mobile UI"],
    description: "Membantu pembuatan fitur aplikasi mobile layanan mandiri pelanggan, pengujian widget, dan integrasi response API backend.",
    major: "RPL",
    isOpen: true,
    order: 3,
  },
  {
    id: "pkl-rpl-4",
    company: "Tokopedia",
    initials: "TP",
    logoBg: "bg-[#10B981]",
    location: "Jakarta",
    workMode: "Remote",
    title: "Junior Fullstack Web Intern",
    tags: ["Next.js", "TypeScript", "Prisma", "Tailwind CSS"],
    description: "Berkolaborasi dalam pengembangan fitur merchant dashboard, pemeliharaan arsitektur frontend, dan integrasi backend modern.",
    major: "RPL",
    isOpen: true,
    order: 4,
  },
  {
    id: "pkl-rpl-5",
    company: "Infomedia Nusantara",
    initials: "IN",
    logoBg: "bg-[#0761C7]",
    location: "Bandung",
    workMode: "Hybrid",
    title: "QA Automation & Software Tester Intern",
    tags: ["Playwright", "Cypress", "Jest", "Manual Testing"],
    description: "Menyusun skenario pengujian end-to-end, melakukan automation test antarmuka web, dan mendokumentasikan temuan bug sistem.",
    major: "RPL",
    isOpen: true,
    order: 5,
  },

  // --- Jurusan TKJ (Teknik Komputer dan Jaringan) ---
  {
    id: "pkl-tkj-1",
    company: "Telkomsigma",
    initials: "TS",
    logoBg: "bg-[#E4002B]",
    location: "Semarang",
    workMode: "On-site",
    title: "Data Center Support Intern",
    tags: ["Linux Server", "Monitoring", "Hardware", "Virtualization"],
    description: "Membantu pemantauan operasional pusat data tier-3, inventarisasi server rak, dan dasar administrasi infrastruktur cloud enterprise.",
    major: "TKJ",
    isOpen: true,
    order: 6,
  },
  {
    id: "pkl-tkj-2",
    company: "PINS Indonesia",
    initials: "PN",
    logoBg: "bg-[#0761C7]",
    location: "Purwokerto",
    workMode: "On-site",
    title: "IT Infrastructure & Support Intern",
    tags: ["Jaringan", "Hardware", "Troubleshoot", "MikroTik"],
    description: "Mendukung instalasi perangkat jaringan, konfigurasi router/switch, dan perbaikan perangkat keras di lingkungan klien korporat.",
    major: "TKJ",
    isOpen: true,
    order: 7,
  },
  {
    id: "pkl-tkj-3",
    company: "Lintasarta",
    initials: "LA",
    logoBg: "bg-[#0761C7]",
    location: "Jakarta",
    workMode: "On-site",
    title: "Network Engineer & Routing Intern",
    tags: ["Cisco", "MikroTik", "BGP", "VLAN", "Routing"],
    description: "Membantu konfigurasi routing static & dynamic, manajemen VLAN switch enterprise, dan pengawasan link WAN pelanggan bisnis.",
    major: "TKJ",
    isOpen: true,
    order: 8,
  },
  {
    id: "pkl-tkj-4",
    company: "Telkomsel Regional",
    initials: "TR",
    logoBg: "bg-[#E4002B]",
    location: "Purwokerto",
    workMode: "On-site",
    title: "NOC Network Operations Intern",
    tags: ["NOC", "Wireshark", "Monitoring", "TCP/IP", "Incident"],
    description: "Membantu monitoring real-time ketersediaan jaringan telekomunikasi seluler dan koordinasi eskalasi insiden BTS di regional Jateng.",
    major: "TKJ",
    isOpen: true,
    order: 9,
  },
  {
    id: "pkl-tkj-5",
    company: "CBN Cloud",
    initials: "CB",
    logoBg: "bg-[#10B981]",
    location: "Jakarta",
    workMode: "Hybrid",
    title: "Cloud & Linux Systems Admin Intern",
    tags: ["Ubuntu Server", "Docker", "Nginx", "Bash", "Cloud"],
    description: "Membantu konfigurasi web server Nginx, containerisasi aplikasi berbasis Docker, dan otomasi pemeliharaan server Linux.",
    major: "TKJ",
    isOpen: true,
    order: 10,
  },

  // --- Jurusan TJA (Teknik Jaringan Akses Telekomunikasi) ---
  {
    id: "pkl-tja-1",
    company: "Telkom Akses Purwokerto",
    initials: "TA",
    logoBg: "bg-[#0761C7]",
    location: "Purwokerto",
    workMode: "On-site",
    title: "Fiber Optic Splicing & OTDR Technician",
    tags: ["FTTH", "OTDR", "Fusion Splicer", "ODP/ODC"],
    description: "Praktik langsung penanganan jaringan kabel serat optik, penyambungan core dengan fusion splicer, dan pengukuran redaman OTDR.",
    major: "TJA",
    isOpen: true,
    order: 11,
  },
  {
    id: "pkl-tja-2",
    company: "Telkom Akses Regional",
    initials: "TA",
    logoBg: "bg-[#0761C7]",
    location: "Semarang",
    workMode: "On-site",
    title: "FTTH Outside Plant (OSP) Planner Intern",
    tags: ["AutoCAD", "QGIS", "FTTH", "Survey", "ODP"],
    description: "Membantu survei lapangan jalur distribusi kabel optik, pemetaan rute tiang & manhole, serta penggambaran as-built drawing jaringan FTTH.",
    major: "TJA",
    isOpen: true,
    order: 12,
  },
  {
    id: "pkl-tja-3",
    company: "Mitratel",
    initials: "MT",
    logoBg: "bg-[#E4002B]",
    location: "Purwokerto",
    workMode: "On-site",
    title: "Tower & RF Transmission Technician Intern",
    tags: ["Tower BTS", "RF", "Antenna", "VSWR", "K3 Lapangan"],
    description: "Mendampingi teknisi senior dalam pemeliharaan berkala infrastruktur menara BTS, pengecekan feeder kabel RF, dan audit grounding.",
    major: "TJA",
    isOpen: true,
    order: 13,
  },
  {
    id: "pkl-tja-4",
    company: "Telkom Akses Banyumas",
    initials: "TA",
    logoBg: "bg-[#0761C7]",
    location: "Purwokerto",
    workMode: "On-site",
    title: "Quality Assurance & Fiber Testing Intern",
    tags: ["OPM", "VFL", "Optical Power", "Fiber Optic"],
    description: "Melakukan pengujian kualitas sambungan kabel optik pada jaringan backbone dan distribusi menggunakan Optical Power Meter (OPM) dan Visual Fault Locator.",
    major: "TJA",
    isOpen: true,
    order: 14,
  },
  {
    id: "pkl-tja-5",
    company: "Indosat Ooredoo Hutchison",
    initials: "IO",
    logoBg: "bg-[#F59E0B]",
    location: "Yogyakarta",
    workMode: "Hybrid",
    title: "Microwave & Backhaul Transmission Intern",
    tags: ["Microwave", "Backhaul", "Link Budget", "Transmisi"],
    description: "Membantu analisis performa link transmisi microwave antar-site, pemantauan utilisasi kapasitas backhaul radio, dan pelaporan metrik sinyal.",
    major: "TJA",
    isOpen: true,
    order: 15,
  },

  // --- Jurusan PG (Pengembangan Gim) ---
  {
    id: "pkl-pg-1",
    company: "Agate International",
    initials: "AG",
    logoBg: "bg-[#8B5CF6]",
    location: "Bandung",
    workMode: "Hybrid",
    title: "Game Programmer Unity & C# Intern",
    tags: ["Unity", "C#", "Gameplay Mechanics", "Physics 2D/3D"],
    description: "Mengembangkan logika mekanisme gameplay, sistem kontrol karakter, dan integrasi antarmuka game menggunakan Unity Engine.",
    major: "PG",
    isOpen: true,
    order: 16,
  },
  {
    id: "pkl-pg-2",
    company: "Gameloft Indonesia",
    initials: "GL",
    logoBg: "bg-[#0761C7]",
    location: "Yogyakarta",
    workMode: "Hybrid",
    title: "3D Game Environment Artist Intern",
    tags: ["Blender", "Maya", "3D Modeling", "Texturing", "PBR"],
    description: "Membuat aset lingkungan 3D berstandar mobile gaming, pemodelan low-poly teroptimasi, serta UV unwrapping dan texturing PBR.",
    major: "PG",
    isOpen: true,
    order: 17,
  },
  {
    id: "pkl-pg-3",
    company: "Nuon Digital Indonesia",
    initials: "ND",
    logoBg: "bg-[#0761C7]",
    location: "Jakarta",
    workMode: "Hybrid",
    title: "Game UI/UX & Asset Designer Intern",
    tags: ["Figma", "Photoshop", "Game UI", "Asset Export", "Wireframe"],
    description: "Merancang layout antarmuka interaktif game mobile, membuat ikon item, tombol, dan asset sheet yang siap diimpor ke game engine.",
    major: "PG",
    isOpen: true,
    order: 18,
  },
  {
    id: "pkl-pg-4",
    company: "Toge Productions",
    initials: "TP",
    logoBg: "bg-[#EC4899]",
    location: "Tangerang",
    workMode: "Remote",
    title: "2D Sprite & Pixel Animator Intern",
    tags: ["Aseprite", "Pixel Art", "2D Animation", "Frame-by-frame"],
    description: "Membuat aset karakter 2D, animasi walk/attack/idle frame-by-frame menggunakan Aseprite, dan menyiapkan sprite sheets untuk integrasi game.",
    major: "PG",
    isOpen: true,
    order: 19,
  },
  {
    id: "pkl-pg-5",
    company: "Metra Digital",
    initials: "MD",
    logoBg: "bg-[#E4002B]",
    location: "Jakarta",
    workMode: "Hybrid",
    title: "Multimedia & Motion Graphics Intern",
    tags: ["After Effects", "Premiere Pro", "Motion Graphics", "Video Editing"],
    description: "Memproduksi trailer gameplay interaktif, animasi motion graphics promosi digital, dan aset visual multimedia untuk rilisan gim lokal.",
    major: "PG",
    isOpen: true,
    order: 20,
  },
];

/**
 * Mengambil daftar lowongan PKL aktif dari database Prisma.
 * Jika database belum memiliki data, menggunakan fallback default listings.
 */
export async function getActivePklListings(): Promise<PklListingRecord[]> {
  try {
    const listings = await prisma.pklListing.findMany({
      where: { isOpen: true },
      orderBy: { order: "asc" },
    });
    if (listings && listings.length > 0) {
      return listings;
    }
    return DEFAULT_PKL_LISTINGS;
  } catch (error) {
    console.warn("[pklMatching] Gagal membaca pkl_listings dari database, menggunakan fallback data:", error);
    return DEFAULT_PKL_LISTINGS;
  }
}

/**
 * Pemetaan sinonim atau kata kunci jurusan SMK Telkom Purwokerto.
 */
const MAJOR_SYNONYMS: Record<string, string[]> = {
  RPL: ["rpl", "rekayasa perangkat lunak", "software", "programmer", "programming", "coding", "web", "frontend", "backend"],
  TKJ: ["tkj", "teknik komputer dan jaringan", "network", "jaringan", "sysadmin", "server", "cloud", "infrastruktur", "hardware"],
  TJA: ["tja", "tjat", "teknik jaringan akses", "telekomunikasi", "fiber", "optik", "ftth", "odp", "splicing", "otdr"],
  PG: ["pg", "pengembangan game", "game", "multimedia", "animasi", "3d", "video editing", "desain grafis", "motion"],
};

function normalizeMajorMatch(studentMajor: string | undefined, listingMajor: string, candidateText: string): number {
  const normStudent = (studentMajor || "").trim().toUpperCase();
  const normListing = listingMajor.trim().toUpperCase();

  if (normStudent && normStudent === normListing) {
    return 45;
  }

  const synonyms = MAJOR_SYNONYMS[normListing] || [normListing.toLowerCase()];
  const studentLower = (studentMajor || "").toLowerCase();

  const isStudentMajorMatch = synonyms.some((syn) => studentLower.includes(syn));
  if (isStudentMajorMatch) {
    return 40;
  }

  const isTextMatch = synonyms.some((syn) => candidateText.includes(syn));
  if (isTextMatch) {
    return 25;
  }

  return studentMajor ? 10 : 20;
}

/**
 * Algoritma fallback cerdas (keyword & major matching) jika terjadi timeout/error dari gateway AI.
 * Menjamin hasil selalu valid, terukur 0-100, dan terurut berdasarkan skor tertinggi.
 */
export function calculateSmartFallback(
  listings: PklListingRecord[],
  input: PklMatchInput
): PklMatchResultItem[] {
  const skillsList = (input.profile.skills || []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const bioText = (input.profile.bio || "").toLowerCase();
  const cvText = (input.cvText || "").toLowerCase();
  const candidateText = `${skillsList.join(" ")} ${bioText} ${cvText}`;

  const results: PklMatchResultItem[] = listings.map((listing) => {
    const majorScore = normalizeMajorMatch(input.profile.major, listing.major, candidateText);

    const listingTags = listing.tags || [];
    const matchedSkills: string[] = [];
    const skillsToImprove: string[] = [];

    for (const tag of listingTags) {
      const tagLower = tag.trim().toLowerCase();
      const hasSkill =
        skillsList.some((s) => s === tagLower || s.includes(tagLower) || tagLower.includes(s)) ||
        candidateText.includes(tagLower);

      if (hasSkill) {
        matchedSkills.push(tag);
      } else {
        skillsToImprove.push(tag);
      }
    }

    const skillRatio = listingTags.length > 0 ? matchedSkills.length / listingTags.length : 0.5;
    const skillScore = Math.round(skillRatio * 40);

    const descWords = (listing.description || "")
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ""))
      .filter((w) => w.length >= 4);

    let descMatchCount = 0;
    for (const word of descWords) {
      if (candidateText.includes(word)) {
        descMatchCount += 1;
      }
    }
    const keywordScore = Math.min(15, descMatchCount * 3);

    const rawScore = majorScore + skillScore + keywordScore;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let reason: string;
    if (score >= 75) {
      reason = `Kesesuaian tinggi dengan bidang ${listing.major} di ${listing.company}. Memiliki keahlian relevan (${matchedSkills.length > 0 ? matchedSkills.join(", ") : "dasar teknis yang kuat"}).`;
    } else if (score >= 50) {
      reason = `Kualifikasi cukup relevan untuk posisi ${listing.title}. Penguasaan ${matchedSkills.length > 0 ? matchedSkills.join(", ") : "kompetensi awal"} dapat dikembangkan dengan mempelajari ${skillsToImprove.slice(0, 2).join(", ")}.`;
    } else {
      reason = `Potensi dasar tersedia untuk posisi ${listing.title}. Diperlukan penguatan keahlian pada ${skillsToImprove.slice(0, 3).join(", ")} untuk memenuhi spesifikasi industri.`;
    }

    return {
      listingId: listing.id,
      score,
      reason,
      matchedSkills,
      skillsToImprove,
      listing,
      company: listing.company,
      title: listing.title,
      location: listing.location,
      workMode: listing.workMode,
      major: listing.major,
      tags: listing.tags,
      description: listing.description,
      initials: listing.initials,
      logoBg: listing.logoBg,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Evaluasi LLM menggunakan model 'kimi-k2.7' melalui gateway AI.
 * Menghasilkan JSON terstruktur berisi penilaian objektif per lowongan.
 */
export async function evaluatePklMatchingWithLlm(
  listings: PklListingRecord[],
  input: PklMatchInput,
  options?: { timeoutMs?: number; signal?: AbortSignal }
): Promise<PklMatchResultItem[]> {
  const cleanBase = env.AI_BASE_URL.replace(/\/+$/, "");
  const endpoint = cleanBase.endsWith("/v1")
    ? `${cleanBase}/chat/completions`
    : `${cleanBase}/v1/chat/completions`;

  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout pemanggilan AI PKL Matching melebihi ${timeoutMs}ms`));
  }, timeoutMs);

  if (options?.signal) {
    options.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  const promptListings = listings.map((l) => ({
    id: l.id,
    company: l.company,
    title: l.title,
    major: l.major,
    tags: l.tags,
    description: l.description,
    location: l.location,
    workMode: l.workMode,
  }));

  const systemPrompt = `Anda adalah sistem evaluasi pencocokan lowongan PKL (Praktik Kerja Lapangan) untuk siswa SMK Telkom Purwokerto.
Tugas Anda adalah menilai kecocokan profil siswa dengan daftar lowongan PKL yang disediakan secara objektif, proporsional, dan faktual.

Instruksi Output:
- Wajib mengembalikan respons HANYA berupa JSON array valid tanpa markdown formatting, tanpa penjelasan tambahan di luar JSON.
- Format setiap item dalam array:
[
  {
    "listingId": "string",
    "score": number (0 hingga 100),
    "reason": "string (alasan spesifik dan profesional dalam bahasa Indonesia baku)",
    "matchedSkills": ["string"],
    "skillsToImprove": ["string"]
  }
]`;

  const userPrompt = `PROFIL SISWA:
Nama: ${input.profile.name || "Siswa"}
Jurusan: ${input.profile.major || "-"}
Keahlian: ${(input.profile.skills || []).join(", ") || "-"}
Bio/Minat: ${input.profile.bio || "-"}
Teks CV/Portofolio: ${input.cvText || "-"}

DAFTAR LOWONGAN PKL:
${JSON.stringify(promptListings, null, 2)}

Nilai semua lowongan di atas berdasarkan profil siswa dan kembalikan JSON array evaluasi.`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "kimi-k2.7",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gateway AI merespons dengan status ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Respons gateway AI tidak memuat konten valid");
    }

    const cleanedContent = content
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedContent) as PklMatchEvaluation[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Hasil parsing evaluasi AI bukan merupakan array");
    }

    const evaluationMap = new Map<string, PklMatchEvaluation>();
    for (const item of parsed) {
      if (item && item.listingId) {
        evaluationMap.set(item.listingId, {
          listingId: String(item.listingId),
          score: Math.min(100, Math.max(0, Math.round(Number(item.score) || 0))),
          reason: typeof item.reason === "string" ? item.reason : "Kesesuaian dievaluasi oleh sistem AI.",
          matchedSkills: Array.isArray(item.matchedSkills) ? item.matchedSkills.map(String) : [],
          skillsToImprove: Array.isArray(item.skillsToImprove) ? item.skillsToImprove.map(String) : [],
        });
      }
    }

    const fallbackResults = calculateSmartFallback(listings, input);
    const fallbackMap = new Map(fallbackResults.map((r) => [r.listingId, r]));

    const mergedResults: PklMatchResultItem[] = listings.map((listing) => {
      const aiEval = evaluationMap.get(listing.id);
      if (aiEval) {
        return {
          listingId: listing.id,
          score: aiEval.score,
          reason: aiEval.reason,
          matchedSkills: aiEval.matchedSkills,
          skillsToImprove: aiEval.skillsToImprove,
          listing,
          company: listing.company,
          title: listing.title,
          location: listing.location,
          workMode: listing.workMode,
          major: listing.major,
          tags: listing.tags,
          description: listing.description,
          initials: listing.initials,
          logoBg: listing.logoBg,
        };
      }
      return fallbackMap.get(listing.id)!;
    });

    return mergedResults.sort((a, b) => b.score - a.score);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Alur utama matching lowongan PKL:
 * 1. Mengambil lowongan aktif dari DB (atau fallback).
 * 2. Mencoba evaluasi berbasis model 'kimi-k2.7'.
 * 3. Otomatis beralih ke fallback cerdas bila AI timeout/offline/eror.
 */
export async function matchPklListings(
  input: PklMatchInput,
  options?: { timeoutMs?: number; signal?: AbortSignal }
): Promise<PklMatchResultItem[]> {
  const listings = await getActivePklListings();

  if (listings.length === 0) {
    return [];
  }

  // Jika API KEY kosong atau tidak disetel, langsung gunakan algoritma fallback cerdas
  if (!env.AI_API_KEY || !env.AI_API_KEY.trim()) {
    return calculateSmartFallback(listings, input);
  }

  try {
    return await evaluatePklMatchingWithLlm(listings, input, options);
  } catch (err: unknown) {
    console.warn(
      "[pklMatching] Evaluasi model 'kimi-k2.7' gagal atau timeout, mengalihkan ke fallback cerdas:",
      err instanceof Error ? err.message : err
    );
    return calculateSmartFallback(listings, input);
  }
}
