import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApiApp } from "../src/server/api-app.js";
import {
  hashPassword,
  verifyPassword,
  parseCookies,
} from "../src/server/modules/admin/auth/admin-auth.service.js";
import { getPublicImageGallery, saveUploadedImage } from "../src/server/modules/admin/services/upload.service.js";

describe("Admin Authentication Unit Tests", () => {
  it("hashPassword and verifyPassword should correctly verify matching password", async () => {
    const rawPass = "adminSecurePass123!";
    const hashed = await hashPassword(rawPass);

    expect(hashed).toContain(":");
    const isValid = await verifyPassword(rawPass, hashed);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword("wrongPass123!", hashed);
    expect(isWrong).toBe(false);
  });

  it("parseCookies should correctly parse cookie headers", () => {
    const cookieHeader = "jhic_admin_session=abc123token; other_cookie=xyz; test=1";
    const parsed = parseCookies(cookieHeader);

    expect(parsed.jhic_admin_session).toBe("abc123token");
    expect(parsed.other_cookie).toBe("xyz");
    expect(parsed.test).toBe("1");
  });

  it("parseCookies returns empty object when header is empty or undefined", () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies("")).toEqual({});
  });
});

describe("Admin Media & Upload Services", () => {
  it("getPublicImageGallery returns public image categories without error", async () => {
    const gallery = await getPublicImageGallery();
    expect(typeof gallery).toBe("object");
    // Verifikasi kategori umum seperti guru, kegiatan, atau berita terdeteksi jika foldernya ada
    const categories = Object.keys(gallery);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("saveUploadedImage stores uploaded base64 image and returns unique uploads path", async () => {
    // 1x1 pixel transparent PNG in base64
    const samplePng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const res = await saveUploadedImage({
      filename: "test-banner.png",
      base64Data: samplePng,
    });

    expect(res.url).toMatch(/^\/images\/uploads\/upload-\d+-[a-f0-9]+-test-banner\.png$/);
    expect(res.size).toBeGreaterThan(0);
  });
});

describe("Admin Router Endpoints & Security", () => {
  const app = createApiApp();

  it("POST /api/admin/auth/login returns 400 when body is missing credentials", async () => {
    const res = await request(app)
      .post("/api/admin/auth/login")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/admin/stats returns 401 UNAUTHORIZED when unauthenticated", async () => {
    const res = await request(app).get("/api/admin/stats");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHORIZED");
  });

  it("GET /api/admin/news returns 401 UNAUTHORIZED when unauthenticated", async () => {
    const res = await request(app).get("/api/admin/news");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHORIZED");
  });

  it("POST /api/admin/auth/logout clears cookie and returns 200", async () => {
    const res = await request(app).post("/api/admin/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("Max-Age=0");
  });
});
