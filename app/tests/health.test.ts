import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApiApp } from "../src/server/api-app.js";

describe("API Health & Routing Tests", () => {
  const app = createApiApp();

  it("GET /api/health returns 200 and status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "school-web-api");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/health/ready returns 200 and status ready", async () => {
    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ready");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/non-existent-route returns 404 JSON error", async () => {
    const res = await request(app).get("/api/non-existent-route");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("status", 404);
  });
});
