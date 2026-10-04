import express, { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { invalidateCache } from "../../lib/cache.js";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_MS,
  createSession,
  invalidateSession,
  parseCookies,
  verifyPassword,
} from "./auth/admin-auth.service.js";
import { adminAuthMiddleware } from "./middleware/admin-auth.middleware.js";
import {
  syncAllWebsiteContentToAi,
  syncFacilityToAi,
  syncFaqToAi,
  syncMajorToAi,
  syncNewsToAi,
} from "./services/ai-sync.service.js";
import { getPublicImageGallery, saveUploadedImage } from "./services/upload.service.js";

export const adminRouter: express.Router = express.Router();

// Helper slug generator
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==============================================================================
// 1. AUTENTIKASI ADMIN
// ==============================================================================

// POST /api/admin/auth/login
adminRouter.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: "Username dan password wajib diisi." });
      return;
    }

    const user = await prisma.adminUser.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "Kredensial tidak valid." });
      return;
    }

    const isValid = await verifyPassword(String(password), user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: "Kredensial tidak valid." });
      return;
    }

    const { token, expiresAt } = await createSession(user.id);

    // Pasang secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
    const cookieFlags = [
      `${ADMIN_COOKIE_NAME}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${maxAgeSec}`,
      isProduction ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    res.setHeader("Set-Cookie", cookieFlags);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      expiresAt,
    });
  } catch (err) {
    console.error("[adminRouter] Login error:", err);
    res.status(500).json({ success: false, error: "Gagal memproses login admin." });
  }
});

// POST /api/admin/auth/logout
adminRouter.post("/auth/logout", async (req: Request, res: Response): Promise<void> => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[ADMIN_COOKIE_NAME];
    if (token) {
      await invalidateSession(token);
    }
    res.setHeader(
      "Set-Cookie",
      `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
    );
    res.json({ success: true, message: "Berhasil logout." });
  } catch (err) {
    console.error("[adminRouter] Logout error:", err);
    res.status(500).json({ success: false, error: "Gagal memproses logout." });
  }
});

// GET /api/admin/auth/me
adminRouter.get("/auth/me", adminAuthMiddleware, (req: Request, res: Response): void => {
  res.json({
    success: true,
    user: req.adminUser,
  });
});

// ==============================================================================
// 2. DASHBOARD STATS
// ==============================================================================
adminRouter.get("/stats", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      newsCount,
      majorsCount,
      teachersCount,
      achievementsCount,
      facilitiesCount,
      ekskulCount,
      partnersCount,
      pklCount,
      alumniCount,
      faqCount,
      aiDocsCount,
      aiChunksCount,
    ] = await Promise.all([
      prisma.newsArticle.count(),
      prisma.schoolMajor.count(),
      prisma.teacherLeader.count(),
      prisma.studentAchievement.count(),
      prisma.schoolFacility.count(),
      prisma.extracurricular.count(),
      prisma.industryPartner.count(),
      prisma.pklListing.count({ where: { isOpen: true } }),
      prisma.alumniStory.count(),
      prisma.faqItem.count(),
      prisma.knowledgeDocument.count(),
      prisma.knowledgeChunk.count(),
    ]);

    res.json({
      success: true,
      stats: {
        news: newsCount,
        majors: majorsCount,
        teachers: teachersCount,
        achievements: achievementsCount,
        facilities: facilitiesCount,
        ekskul: ekskulCount,
        partners: partnersCount,
        pkl: pklCount,
        alumni: alumniCount,
        faq: faqCount,
        aiDocs: aiDocsCount,
        aiChunks: aiChunksCount,
      },
    });
  } catch (err) {
    console.error("[adminRouter] Stats error:", err);
    res.status(500).json({ success: false, error: "Gagal memuat statistik admin." });
  }
});

// ==============================================================================
// 3. MEDIA GALLERY & UPLOAD
// ==============================================================================
adminRouter.get("/media", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getPublicImageGallery();
    res.json({ success: true, categories });
  } catch (err) {
    console.error("[adminRouter] Media listing error:", err);
    res.status(500).json({ success: false, error: "Gagal memuat galeri media." });
  }
});

adminRouter.post("/media/upload", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      res.status(400).json({ success: false, error: "Nama file dan konten base64 gambar wajib diisi." });
      return;
    }

    const uploaded = await saveUploadedImage({
      filename: String(filename),
      base64Data: String(base64Data),
    });

    res.json({
      success: true,
      message: "Gambar berhasil diunggah.",
      data: uploaded,
    });
  } catch (err) {
    console.error("[adminRouter] Media upload error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengunggah gambar.",
    });
  }
});

// ==============================================================================
// 4. MODUL: BERITA & PENGUMUMAN
// ==============================================================================
adminRouter.get("/news", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: articles });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar berita." });
  }
});

adminRouter.post("/news", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, date, excerpt, content, imageUrl, isFeatured, isPublished, order } = req.body;
    if (!title || !category) {
      res.status(400).json({ success: false, error: "Judul dan kategori wajib diisi." });
      return;
    }

    let slug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(title);
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const article = await prisma.newsArticle.create({
      data: {
        title: String(title).trim(),
        slug,
        category: String(category).trim(),
        date: date ? String(date).trim() : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        excerpt: excerpt ? String(excerpt).trim() : null,
        content: content ? String(content).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        isFeatured: Boolean(isFeatured),
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        order: Number(order) || 0,
      },
    });

    syncNewsToAi(article.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: article });
  } catch (err) {
    console.error("[adminRouter] Create news error:", err);
    res.status(500).json({ success: false, error: "Gagal membuat artikel berita." });
  }
});

adminRouter.put("/news/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { title, slug, category, date, excerpt, content, imageUrl, isFeatured, isPublished, order } = req.body;

    const article = await prisma.newsArticle.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(slug !== undefined && { slug: generateSlug(slug) }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(date !== undefined && { date: String(date).trim() }),
        ...(excerpt !== undefined && { excerpt: excerpt ? String(excerpt).trim() : null }),
        ...(content !== undefined && { content: content ? String(content).trim() : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    syncNewsToAi(article.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: article });
  } catch (err) {
    console.error("[adminRouter] Update news error:", err);
    res.status(500).json({ success: false, error: "Gagal memperbarui berita." });
  }
});

adminRouter.delete("/news/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.newsArticle.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Artikel berita berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus berita." });
  }
});

// ==============================================================================
// 5. MODUL: PROGRAM KEAHLIAN (JURUSAN)
// ==============================================================================
adminRouter.get("/majors", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const majors = await prisma.schoolMajor.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: majors });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar jurusan." });
  }
});

adminRouter.post("/majors", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, headlineTitle, tagline, description, imageUrl, cardTags, competencies, careerProspects, order } = req.body;
    if (!code || !name || !description) {
      res.status(400).json({ success: false, error: "Kode, nama, dan deskripsi jurusan wajib diisi." });
      return;
    }

    const major = await prisma.schoolMajor.create({
      data: {
        code: String(code).toUpperCase().trim(),
        name: String(name).trim(),
        headlineTitle: headlineTitle ? String(headlineTitle).trim() : null,
        tagline: tagline ? String(tagline).trim() : "Keunggulan Jurusan",
        description: String(description).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        cardTags: Array.isArray(cardTags) ? cardTags : [],
        competencies: competencies || [],
        careerProspects: careerProspects ? String(careerProspects).trim() : null,
        order: Number(order) || 0,
      },
    });

    syncMajorToAi(major.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: major });
  } catch (err) {
    console.error("[adminRouter] Create major error:", err);
    res.status(500).json({ success: false, error: "Gagal menambahkan jurusan baru." });
  }
});

adminRouter.put("/majors/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { code, name, headlineTitle, tagline, description, imageUrl, cardTags, competencies, careerProspects, order } = req.body;

    const major = await prisma.schoolMajor.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: String(code).toUpperCase().trim() }),
        ...(name !== undefined && { name: String(name).trim() }),
        ...(headlineTitle !== undefined && { headlineTitle: String(headlineTitle).trim() }),
        ...(tagline !== undefined && { tagline: String(tagline).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(cardTags !== undefined && { cardTags: Array.isArray(cardTags) ? cardTags : [] }),
        ...(competencies !== undefined && { competencies: competencies || [] }),
        ...(careerProspects !== undefined && { careerProspects: String(careerProspects).trim() }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    syncMajorToAi(major.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: major });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui jurusan." });
  }
});

adminRouter.delete("/majors/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.schoolMajor.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Program keahlian berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus program keahlian." });
  }
});

// ==============================================================================
// 6. MODUL: DEWAN GURU & PIMPINAN
// ==============================================================================
adminRouter.get("/teachers", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await prisma.teacherLeader.findMany({ orderBy: [{ sectionId: "asc" }, { order: "asc" }] });
    res.json({ success: true, data: teachers });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar dewan guru." });
  }
});

adminRouter.post("/teachers", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, position, sectionId, sectionBadge, sectionTitle, imageUrl, order } = req.body;
    if (!name || !position || !sectionId) {
      res.status(400).json({ success: false, error: "Nama, posisi, dan divisi/seksi wajib diisi." });
      return;
    }

    const teacher = await prisma.teacherLeader.create({
      data: {
        name: String(name).trim(),
        position: String(position).trim(),
        sectionId: String(sectionId).trim(),
        sectionBadge: sectionBadge ? String(sectionBadge).trim() : null,
        sectionTitle: sectionTitle ? String(sectionTitle).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        order: Number(order) || 0,
      },
    });

    invalidateCache();
    res.json({ success: true, data: teacher });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan guru/pimpinan." });
  }
});

adminRouter.put("/teachers/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, position, sectionId, sectionBadge, sectionTitle, imageUrl, order } = req.body;

    const teacher = await prisma.teacherLeader.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(position !== undefined && { position: String(position).trim() }),
        ...(sectionId !== undefined && { sectionId: String(sectionId).trim() }),
        ...(sectionBadge !== undefined && { sectionBadge: sectionBadge ? String(sectionBadge).trim() : null }),
        ...(sectionTitle !== undefined && { sectionTitle: sectionTitle ? String(sectionTitle).trim() : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    invalidateCache();
    res.json({ success: true, data: teacher });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui data guru/pimpinan." });
  }
});

adminRouter.delete("/teachers/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.teacherLeader.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Data guru/pimpinan berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus data guru/pimpinan." });
  }
});

// ==============================================================================
// 7. MODUL: PRESTASI SISWA
// ==============================================================================
adminRouter.get("/achievements", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const achievements = await prisma.studentAchievement.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: achievements });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar prestasi." });
  }
});

adminRouter.post("/achievements", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, badge, meta, description, year, order } = req.body;
    if (!title || !category) {
      res.status(400).json({ success: false, error: "Judul dan kategori prestasi wajib diisi." });
      return;
    }

    const item = await prisma.studentAchievement.create({
      data: {
        title: String(title).trim(),
        category: String(category).trim().toLowerCase(),
        badge: badge ? String(badge).trim() : null,
        meta: meta ? String(meta).trim() : null,
        description: description ? String(description).trim() : null,
        year: year ? String(year).trim() : null,
        order: Number(order) || 0,
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan prestasi baru." });
  }
});

adminRouter.put("/achievements/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { title, category, badge, meta, description, year, order } = req.body;

    const item = await prisma.studentAchievement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(category !== undefined && { category: String(category).trim().toLowerCase() }),
        ...(badge !== undefined && { badge: badge ? String(badge).trim() : null }),
        ...(meta !== undefined && { meta: meta ? String(meta).trim() : null }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(year !== undefined && { year: year ? String(year).trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui prestasi." });
  }
});

adminRouter.delete("/achievements/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.studentAchievement.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Prestasi berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus prestasi." });
  }
});

// ==============================================================================
// 8. MODUL: FASILITAS & 360° TOUR
// ==============================================================================
adminRouter.get("/facilities", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const facilities = await prisma.schoolFacility.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: facilities });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar fasilitas." });
  }
});

adminRouter.post("/facilities", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, badge, description, imageUrl, isPanorama, icon, order } = req.body;
    if (!name || !description) {
      res.status(400).json({ success: false, error: "Nama dan deskripsi fasilitas wajib diisi." });
      return;
    }

    const item = await prisma.schoolFacility.create({
      data: {
        name: String(name).trim(),
        badge: badge ? String(badge).trim() : null,
        description: String(description).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        isPanorama: Boolean(isPanorama),
        icon: icon ? String(icon).trim() : null,
        order: Number(order) || 0,
      },
    });

    syncFacilityToAi(item.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan fasilitas." });
  }
});

adminRouter.put("/facilities/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, badge, description, imageUrl, isPanorama, icon, order } = req.body;

    const item = await prisma.schoolFacility.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(badge !== undefined && { badge: badge ? String(badge).trim() : null }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(isPanorama !== undefined && { isPanorama: Boolean(isPanorama) }),
        ...(icon !== undefined && { icon: icon ? String(icon).trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    syncFacilityToAi(item.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui fasilitas." });
  }
});

adminRouter.delete("/facilities/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.schoolFacility.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Fasilitas berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus fasilitas." });
  }
});

// ==============================================================================
// 9. MODUL: EKSTRAKURIKULER
// ==============================================================================
adminRouter.get("/extracurriculars", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.extracurricular.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar ekstrakurikuler." });
  }
});

adminRouter.post("/extracurriculars", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, imageUrl, icon, order } = req.body;
    if (!name || !description) {
      res.status(400).json({ success: false, error: "Nama dan deskripsi ekstrakurikuler wajib diisi." });
      return;
    }

    const item = await prisma.extracurricular.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        icon: icon ? String(icon).trim() : null,
        order: Number(order) || 0,
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan ekstrakurikuler." });
  }
});

adminRouter.put("/extracurriculars/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, description, imageUrl, icon, order } = req.body;

    const item = await prisma.extracurricular.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(icon !== undefined && { icon: icon ? String(icon).trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui ekstrakurikuler." });
  }
});

adminRouter.delete("/extracurriculars/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.extracurricular.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Ekstrakurikuler berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus ekstrakurikuler." });
  }
});

// ==============================================================================
// 10. MODUL: MITRA INDUSTRI
// ==============================================================================
adminRouter.get("/partners", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const partners = await prisma.industryPartner.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: partners });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar mitra industri." });
  }
});

adminRouter.post("/partners", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, logoUrl, scale, category, order } = req.body;
    if (!name || !logoUrl) {
      res.status(400).json({ success: false, error: "Nama dan URL logo mitra industri wajib diisi." });
      return;
    }

    const item = await prisma.industryPartner.create({
      data: {
        name: String(name).trim(),
        logoUrl: String(logoUrl).trim(),
        scale: scale !== undefined ? Number(scale) : 1.0,
        category: category ? String(category).trim() : "Mitra Industri",
        order: Number(order) || 0,
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan mitra industri." });
  }
});

adminRouter.put("/partners/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, logoUrl, scale, category, order } = req.body;

    const item = await prisma.industryPartner.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(logoUrl !== undefined && { logoUrl: String(logoUrl).trim() }),
        ...(scale !== undefined && { scale: Number(scale) }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui mitra industri." });
  }
});

adminRouter.delete("/partners/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.industryPartner.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Mitra industri berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus mitra industri." });
  }
});

// ==============================================================================
// 11. MODUL: LOWONGAN PKL / MAGANG
// ==============================================================================
adminRouter.get("/pkl", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const listings = await prisma.pklListing.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: listings });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar lowongan PKL." });
  }
});

adminRouter.post("/pkl", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { company, initials, logoBg, location, workMode, title, tags, description, major, isOpen, order } = req.body;
    if (!company || !title || !location || !major) {
      res.status(400).json({ success: false, error: "Perusahaan, posisi, lokasi, dan jurusan wajib diisi." });
      return;
    }

    const item = await prisma.pklListing.create({
      data: {
        company: String(company).trim(),
        initials: initials ? String(initials).trim() : null,
        logoBg: logoBg ? String(logoBg).trim() : "bg-[#E4002B]",
        location: String(location).trim(),
        workMode: workMode ? String(workMode).trim() : "On-site",
        title: String(title).trim(),
        tags: Array.isArray(tags) ? tags : [],
        description: description ? String(description).trim() : "",
        major: String(major).toUpperCase().trim(),
        isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
        order: Number(order) || 0,
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan lowongan PKL." });
  }
});

adminRouter.put("/pkl/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { company, initials, logoBg, location, workMode, title, tags, description, major, isOpen, order } = req.body;

    const item = await prisma.pklListing.update({
      where: { id },
      data: {
        ...(company !== undefined && { company: String(company).trim() }),
        ...(initials !== undefined && { initials: String(initials).trim() }),
        ...(logoBg !== undefined && { logoBg: String(logoBg).trim() }),
        ...(location !== undefined && { location: String(location).trim() }),
        ...(workMode !== undefined && { workMode: String(workMode).trim() }),
        ...(title !== undefined && { title: String(title).trim() }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(major !== undefined && { major: String(major).toUpperCase().trim() }),
        ...(isOpen !== undefined && { isOpen: Boolean(isOpen) }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui lowongan PKL." });
  }
});

adminRouter.delete("/pkl/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.pklListing.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Lowongan PKL berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus lowongan PKL." });
  }
});

// ==============================================================================
// 12. MODUL: KISAH SUKSES ALUMNI
// ==============================================================================
adminRouter.get("/alumni", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const alumni = await prisma.alumniStory.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: alumni });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat kisah alumni." });
  }
});

adminRouter.post("/alumni", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, role, quote, imageUrl, graduationYear, order } = req.body;
    if (!name || !role || !quote) {
      res.status(400).json({ success: false, error: "Nama, posisi/role, dan kutipan alumni wajib diisi." });
      return;
    }

    const item = await prisma.alumniStory.create({
      data: {
        name: String(name).trim(),
        role: String(role).trim(),
        quote: String(quote).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        graduationYear: graduationYear ? String(graduationYear).trim() : null,
        order: Number(order) || 0,
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan kisah alumni." });
  }
});

adminRouter.put("/alumni/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, role, quote, imageUrl, graduationYear, order } = req.body;

    const item = await prisma.alumniStory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(role !== undefined && { role: String(role).trim() }),
        ...(quote !== undefined && { quote: String(quote).trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(graduationYear !== undefined && { graduationYear: graduationYear ? String(graduationYear).trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui kisah alumni." });
  }
});

adminRouter.delete("/alumni/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.alumniStory.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "Kisah alumni berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus kisah alumni." });
  }
});

// ==============================================================================
// 13. MODUL: FAQ (TANYA JAWAB)
// ==============================================================================
adminRouter.get("/faqs", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await prisma.faqItem.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: faqs });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat daftar FAQ." });
  }
});

adminRouter.post("/faqs", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) {
      res.status(400).json({ success: false, error: "Pertanyaan dan jawaban wajib diisi." });
      return;
    }

    const item = await prisma.faqItem.create({
      data: {
        question: String(question).trim(),
        answer: String(answer).trim(),
        category: category ? String(category).trim() : "Umum",
        order: Number(order) || 0,
      },
    });

    syncFaqToAi(item.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menambahkan FAQ." });
  }
});

adminRouter.put("/faqs/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { question, answer, category, order } = req.body;

    const item = await prisma.faqItem.update({
      where: { id },
      data: {
        ...(question !== undefined && { question: String(question).trim() }),
        ...(answer !== undefined && { answer: String(answer).trim() }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    syncFaqToAi(item.id).catch(() => {});
    invalidateCache();
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memperbarui FAQ." });
  }
});

adminRouter.delete("/faqs/:id", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.faqItem.delete({ where: { id } });
    invalidateCache();
    res.json({ success: true, message: "FAQ berhasil dihapus." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menghapus FAQ." });
  }
});

// ==============================================================================
// 14. MODUL: PENGATURAN UMUM WEBSITE
// ==============================================================================
adminRouter.get("/settings", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    res.json({ success: true, data: settingsMap });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat pengaturan website." });
  }
});

adminRouter.put("/settings", adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    if (typeof payload !== "object" || payload === null) {
      res.status(400).json({ success: false, error: "Data pengaturan tidak valid." });
      return;
    }

    for (const [key, value] of Object.entries(payload)) {
      if (typeof key === "string" && value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }
    }

    invalidateCache();
    res.json({ success: true, message: "Pengaturan berhasil disimpan." });
  } catch {
    res.status(500).json({ success: false, error: "Gagal menyimpan pengaturan." });
  }
});

// ==============================================================================
// 15. MODUL: SINKRONISASI AI 1-KLIK
// ==============================================================================
adminRouter.get("/ai/status", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [docsCount, chunksCount, docs] = await Promise.all([
      prisma.knowledgeDocument.count(),
      prisma.knowledgeChunk.count(),
      prisma.knowledgeDocument.findMany({
        select: {
          id: true,
          title: true,
          source: true,
          updatedAt: true,
          _count: { select: { chunks: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments: docsCount,
        totalChunks: chunksCount,
        documents: docs.map((d) => ({
          id: d.id,
          title: d.title,
          source: d.source,
          updatedAt: d.updatedAt,
          chunksCount: d._count.chunks,
        })),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Gagal memuat status AI." });
  }
});

adminRouter.post("/ai/sync", adminAuthMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const syncResult = await syncAllWebsiteContentToAi();
    res.json({
      success: syncResult.success,
      message: `Sinkronisasi selesai: ${syncResult.totalSynced} dokumen tersinkron, ${syncResult.totalSkipped} dokumen tidak berubah, ${syncResult.totalErrors} error.`,
      result: syncResult,
    });
  } catch (err) {
    console.error("[adminRouter] AI Sync error:", err);
    res.status(500).json({ success: false, error: "Gagal menjalankan sinkronisasi AI." });
  }
});
