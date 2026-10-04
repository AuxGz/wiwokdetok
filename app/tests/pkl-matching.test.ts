import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../src/server/api-app.js";
import { prisma } from "../src/server/lib/prisma.js";
import {
  calculateSmartFallback,
  DEFAULT_PKL_LISTINGS,
  type PklListingRecord,
} from "../src/server/modules/pkl/pkl-matching.service.js";

const mockListings: PklListingRecord[] = [
  {
    id: "pkl-test-1",
    company: "Telkom Indonesia",
    initials: "TI",
    logoBg: "bg-[#E4002B]",
    location: "Bandung",
    workMode: "Hybrid",
    title: "Frontend Developer Intern",
    tags: ["React", "TypeScript", "Tailwind"],
    description: "Membantu pengembangan antarmuka portal layanan pelanggan berbasis web.",
    major: "RPL",
    isOpen: true,
    order: 1,
  },
  {
    id: "pkl-test-2",
    company: "Telkom Akses",
    initials: "TA",
    logoBg: "bg-[#0761C7]",
    location: "Purwokerto",
    workMode: "On-site",
    title: "Fiber Optic Technician Intern",
    tags: ["FTTH", "OTDR", "Splicing"],
    description: "Praktik langsung penanganan jaringan kabel serat optik dan terminasi ODP.",
    major: "TJA",
    isOpen: true,
    order: 2,
  },
  {
    id: "pkl-test-3",
    company: "Telkomsigma",
    initials: "TS",
    logoBg: "bg-[#E4002B]",
    location: "Semarang",
    workMode: "On-site",
    title: "Data Center Support Intern",
    tags: ["Jaringan", "Server", "Monitoring"],
    description: "Membantu pemantauan operasional pusat data perusahaan skala enterprise.",
    major: "TKJ",
    isOpen: true,
    order: 3,
  },
];

describe("AI PKL Matching & Listings API Tests", () => {
  const app = createApiApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/pkl", () => {
    it("mengembalikan status 200 dan array lowongan aktif dari database", async () => {
      vi.spyOn(prisma.pklListing, "findMany").mockResolvedValueOnce(mockListings as never);

      const res = await request(app).get("/api/pkl");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty("id", "pkl-test-1");
      expect(res.body[0]).toHaveProperty("company", "Telkom Indonesia");
      expect(res.body[0]).toHaveProperty("title", "Frontend Developer Intern");
      expect(res.body[0]).toHaveProperty("major", "RPL");
      expect(res.body[0]).toHaveProperty("tags");
    });

    it("mengembalikan status 200 dengan data fallback jika database kosong", async () => {
      vi.spyOn(prisma.pklListing, "findMany").mockResolvedValueOnce([] as never);

      const res = await request(app).get("/api/pkl");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("company");
    });

    it("mengembalikan status 200 dengan fallback jika database mengalami gangguan", async () => {
      vi.spyOn(prisma.pklListing, "findMany").mockRejectedValueOnce(new Error("DB Connection Error") as never);

      const res = await request(app).get("/api/pkl");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(DEFAULT_PKL_LISTINGS.length);
    });
  });

  describe("POST /api/pkl/match", () => {
    it("menolak permintaan dengan status 400 jika payload tidak valid", async () => {
      const res = await request(app)
        .post("/api/pkl/match")
        .send({ invalidField: "test" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Validasi");
    });

    it("mengembalikan status 200 dengan evaluasi model 'kimi-k2.7' saat gateway AI aktif", async () => {
      vi.spyOn(prisma.pklListing, "findMany").mockResolvedValueOnce(mockListings as never);

      const mockAiResponse = JSON.stringify([
        {
          listingId: "pkl-test-1",
          score: 95,
          reason: "Kandidat memiliki keahlian React dan TypeScript yang sangat relevan dengan posisi Frontend.",
          matchedSkills: ["React", "TypeScript"],
          skillsToImprove: ["Tailwind"],
        },
        {
          listingId: "pkl-test-2",
          score: 30,
          reason: "Kandidat berfokus pada software development, kurang selaras dengan fiber optic.",
          matchedSkills: [],
          skillsToImprove: ["FTTH", "OTDR", "Splicing"],
        },
        {
          listingId: "pkl-test-3",
          score: 50,
          reason: "Kandidat memiliki pemahaman umum sistem, namun perlu adaptasi server monitoring.",
          matchedSkills: [],
          skillsToImprove: ["Jaringan", "Server", "Monitoring"],
        },
      ]);

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: `\`\`\`json\n${mockAiResponse}\n\`\`\``,
              },
            },
          ],
        }),
      } as Response);

      const payload = {
        profile: {
          name: "Budi Santoso",
          major: "RPL",
          skills: ["React", "TypeScript", "Node.js"],
          bio: "Siswa SMK jurusan RPL yang gemar membuat antarmuka web modern.",
        },
        cvText: "Pengalaman mengembangkan landing page dan aplikasi kasir dengan React.",
      };

      const res = await request(app)
        .post("/api/pkl/match")
        .send(payload);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      // Verifikasi urutan skor tertinggi
      expect(res.body[0].listingId).toBe("pkl-test-1");
      expect(res.body[0].score).toBe(95);
      expect(res.body[0].reason).toContain("React");
      expect(res.body[0].matchedSkills).toEqual(["React", "TypeScript"]);
      expect(res.body[0].skillsToImprove).toEqual(["Tailwind"]);
      expect(res.body[0]).toHaveProperty("company", "Telkom Indonesia");

      // Verifikasi skor berada dalam rentang 0-100
      for (const item of res.body) {
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThanOrEqual(100);
      }
    });

    it("mengembalikan status 200 dan mengaktifkan fallback cerdas saat gateway AI timeout / offline", async () => {
      vi.spyOn(prisma.pklListing, "findMany").mockResolvedValueOnce(mockListings as never);

      // Simulasikan gateway offline / network error
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Gateway connection refused"));

      const payload = {
        profile: {
          name: "Ahmad Siswa",
          major: "RPL",
          skills: ["React", "TypeScript"],
          bio: "Tertarik pada frontend engineering dan antarmuka interaktif.",
        },
        cvText: "Membuat portfolio menggunakan React dan Tailwind CSS.",
      };

      const res = await request(app)
        .post("/api/pkl/match")
        .send(payload);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      // Urutan pertama harus posisi RPL Frontend Developer
      const topMatch = res.body[0];
      expect(topMatch.listingId).toBe("pkl-test-1");
      expect(topMatch.company).toBe("Telkom Indonesia");
      expect(topMatch.major).toBe("RPL");
      expect(topMatch.score).toBeGreaterThan(60);
      expect(topMatch.matchedSkills).toContain("React");
      expect(topMatch.matchedSkills).toContain("TypeScript");

      // Pastikan urutan menurun
      expect(res.body[0].score).toBeGreaterThanOrEqual(res.body[1].score);
      expect(res.body[1].score).toBeGreaterThanOrEqual(res.body[2].score);

      // Seluruh skor berada di antara 0 dan 100
      for (const item of res.body) {
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThanOrEqual(100);
        expect(typeof item.reason).toBe("string");
        expect(item.reason.length).toBeGreaterThan(10);
      }
    });

    it("menerima format payload datar (flat) dari frontend pkl-matching.astro dan berhasil memetakan", async () => {
      vi.spyOn(prisma.pklListing, "findMany").mockResolvedValueOnce(mockListings as never);
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("AI Offline"));

      // Payload datar sesuai kiriman pkl-matching.astro
      const flatPayload = {
        studentName: "Citra Lestari",
        major: "RPL",
        skills: ["React", "TypeScript", "Tailwind"],
        summary: "Fokus ke pembuatan antarmuka web interaktif",
        preferredLocation: "Bandung",
      };

      const res = await request(app)
        .post("/api/pkl/match")
        .send(flatPayload);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
      // Lowongan RPL harus berada di peringkat teratas
      expect(res.body[0].listingId).toBe("pkl-test-1");
      expect(res.body[0].major).toBe("RPL");
      expect(res.body[0].matchedSkills).toContain("React");
    });
  });

  describe("Unit: calculateSmartFallback", () => {
    it("menghitung skor kecocokan secara proporsional berdasarkan jurusan dan skill", () => {
      const results = calculateSmartFallback(mockListings, {
        profile: {
          major: "TJA",
          skills: ["OTDR", "Splicing", "FTTH"],
        },
        cvText: "Pernah melakukan praktek penyambungan kabel fiber optik",
      });

      expect(results.length).toBe(3);
      // Lowongan TJA harus mendapatkan peringkat pertama
      expect(results[0].listingId).toBe("pkl-test-2");
      expect(results[0].major).toBe("TJA");
      expect(results[0].matchedSkills).toContain("FTTH");
      expect(results[0].matchedSkills).toContain("OTDR");
      expect(results[0].matchedSkills).toContain("Splicing");
      expect(results[0].skillsToImprove).toEqual([]);
      expect(results[0].score).toBeGreaterThanOrEqual(80);

      // Terurut descending
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
    });
  });
});
