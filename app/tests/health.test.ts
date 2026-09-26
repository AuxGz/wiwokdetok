import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../src/server/api-app.js";
import { prisma } from "../src/server/lib/prisma.js";

describe("API Health & Routing Tests", () => {
  const app = createApiApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/health returns 200 and status ok without requiring database", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "school-web-api");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/health/ready returns 200 when database is reachable", async () => {
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([{ "?column?": 1 }] as never);

    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ready");
    expect(res.body).toHaveProperty("database", "connected");
  });

  it("GET /api/health/ready returns 503 when database is unavailable without leaking error details", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty("status", "unhealthy");
    expect(res.body).toHaveProperty("database", "disconnected");
    expect(res.body).not.toHaveProperty("error");
  });

  it("GET /api/health/ready includes error details when NODE_ENV is development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("Connection refused"));
      const res = await request(app).get("/api/health/ready");
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty("error", "Connection refused");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("GET /api/non-existent-route returns 404 JSON error", async () => {
    const res = await request(app).get("/api/non-existent-route");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("status", 404);
  });
});
