import express, { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { getActivePklListings, matchPklListings } from "./pkl-matching.service.js";

export const pklRouter = express.Router();

/**
 * Skema fleksibel yang mendukung:
 * 1. Format bersarang: { profile: { name?, major?, skills, bio? }, cvText? }
 * 2. Format datar (frontend pkl-matching.astro): { major?, skills?, summary?, bio?, studentName?, name?, preferredLocation?, cvText? }
 *
 * Ditransformasikan secara konsisten menjadi format internal { profile: { name, major, skills, bio }, cvText }.
 */
const matchPayloadSchema = z.preprocess((val) => {
  if (!val || typeof val !== "object" || Array.isArray(val)) {
    return val;
  }
  const raw = val as Record<string, unknown>;

  const isNested = Boolean(raw.profile && typeof raw.profile === "object" && !Array.isArray(raw.profile));
  const hasFlatFields = Boolean(
    raw.major !== undefined ||
    raw.skills !== undefined ||
    raw.summary !== undefined ||
    raw.bio !== undefined ||
    raw.studentName !== undefined ||
    raw.name !== undefined ||
    raw.preferredLocation !== undefined ||
    raw.cvText !== undefined
  );

  // Jika payload tidak memuat field profil bersarang maupun datar yang valid
  if (!isNested && !hasFlatFields) {
    return val;
  }

  if (isNested) {
    const prof = raw.profile as Record<string, unknown>;
    const rawSkills = prof.skills;
    let normalizedSkills: string[] = [];
    if (Array.isArray(rawSkills)) {
      normalizedSkills = rawSkills.map(String).filter(Boolean);
    } else if (typeof rawSkills === "string") {
      normalizedSkills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    return {
      profile: {
        name: typeof prof.name === "string" ? prof.name : (typeof prof.studentName === "string" ? prof.studentName : undefined),
        major: typeof prof.major === "string" ? prof.major : undefined,
        skills: normalizedSkills,
        bio: typeof prof.bio === "string" ? prof.bio : (typeof prof.summary === "string" ? prof.summary : undefined),
      },
      cvText: typeof raw.cvText === "string" ? raw.cvText : undefined,
    };
  }

  // Pemetaan dari format datar
  const rawSkills = raw.skills;
  let normalizedSkills: string[] = [];
  if (Array.isArray(rawSkills)) {
    normalizedSkills = rawSkills.map(String).filter(Boolean);
  } else if (typeof rawSkills === "string") {
    normalizedSkills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const name =
    typeof raw.studentName === "string"
      ? raw.studentName
      : (typeof raw.name === "string" ? raw.name : undefined);
  const major = typeof raw.major === "string" ? raw.major : undefined;

  let bio =
    typeof raw.bio === "string"
      ? raw.bio
      : (typeof raw.summary === "string" ? raw.summary : undefined);

  if (typeof raw.preferredLocation === "string" && raw.preferredLocation.trim()) {
    const locNote = `Lokasi preferensi: ${raw.preferredLocation.trim()}`;
    bio = bio ? `${bio} | ${locNote}` : locNote;
  }

  const cvText = typeof raw.cvText === "string" ? raw.cvText : undefined;

  return {
    profile: {
      name,
      major,
      skills: normalizedSkills,
      bio,
    },
    cvText,
  };
}, z.object({
  profile: z.object({
    name: z.string().optional(),
    major: z.string().optional(),
    skills: z.array(z.string()).default([]),
    bio: z.string().optional(),
  }),
  cvText: z.string().optional(),
}));

/**
 * GET /api/pkl
 * Mengembalikan daftar seluruh lowongan PKL yang berstatus aktif.
 */
pklRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await getActivePklListings();
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pkl/match
 * Memvalidasi profil siswa dan teks CV, lalu melakukan pencocokan dengan lowongan PKL berbasis AI Kimi K2.7.
 */
pklRouter.post("/match", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = matchPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Validasi data profil gagal",
        details: parseResult.error.issues,
      });
      return;
    }

    const matches = await matchPklListings(parseResult.data);
    res.status(200).json(matches);
  } catch (error) {
    next(error);
  }
});
