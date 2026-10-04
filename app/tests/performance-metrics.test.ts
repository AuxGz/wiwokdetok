import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { createApiApp } from "../src/server/api-app.js";
import {
  setCache,
  getCache,
  invalidateCache,
  getCacheMetrics,
  resetCache,
} from "../src/server/lib/cache.js";
import { resetMetrics } from "../src/server/middleware/metrics.middleware.js";

describe("Backend Performance & Observability Suite", () => {
  const app = createApiApp();

  beforeEach(() => {
    resetCache();
    resetMetrics();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // 1. IN-MEMORY MICRO-CACHE TESTS
  // ============================================================================
  describe("In-Memory Micro-Cache (cache.ts)", () => {
    it("dapat menyimpan dan membaca data cache secara akurat", () => {
      setCache("test-key", { name: "SMK Telkom", year: 2026 });
      const value = getCache<{ name: string; year: number }>("test-key");

      expect(value).toBeDefined();
      expect(value?.name).toBe("SMK Telkom");
      expect(value?.year).toBe(2026);
    });

    it("mencatat metrik hit dan miss secara akurat", () => {
      // Miss pertama
      const miss1 = getCache("non-existent");
      expect(miss1).toBeUndefined();

      // Set key
      setCache("user-1", { id: 1 });

      // Hit pertama & kedua
      const hit1 = getCache("user-1");
      const hit2 = getCache("user-1");
      expect(hit1).toBeDefined();
      expect(hit2).toBeDefined();

      // Miss kedua
      const miss2 = getCache("user-2");
      expect(miss2).toBeUndefined();

      const metrics = getCacheMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(2);
      expect(metrics.size).toBe(1);
    });

    it("menghapus cache otomatis setelah waktu TTL habis", () => {
      vi.useFakeTimers();

      setCache("temporary-key", "temp-value", 10); // TTL 10 detik

      // Sebelum TTL habis, data masih ada
      expect(getCache("temporary-key")).toBe("temp-value");

      // Majukan waktu 11 detik
      vi.advanceTimersByTime(11 * 1000);

      // Setelah TTL habis, data bernilai undefined
      expect(getCache("temporary-key")).toBeUndefined();
    });

    it("mendukung invalidasi sebagian berdasarkan prefix/pattern", () => {
      setCache("news:1", "Artikel 1");
      setCache("news:2", "Artikel 2");
      setCache("majors:tjkt", "TJKT");
      setCache("teachers:1", "Guru 1");

      // Invalidasi hanya prefix 'news'
      invalidateCache("news");

      expect(getCache("news:1")).toBeUndefined();
      expect(getCache("news:2")).toBeUndefined();
      expect(getCache("majors:tjkt")).toBe("TJKT");
      expect(getCache("teachers:1")).toBe("Guru 1");
    });

    it("membersihkan seluruh cache saat invalidateCache() dipanggil tanpa parameter", () => {
      setCache("key1", "val1");
      setCache("key2", "val2");

      invalidateCache();

      expect(getCache("key1")).toBeUndefined();
      expect(getCache("key2")).toBeUndefined();
      expect(getCacheMetrics().size).toBe(0);
    });
  });

  // ============================================================================
  // 2. PROMETHEUS OBSERVABILITY METRICS ENDPOINT TESTS
  // ============================================================================
  describe("Prometheus Metrics Exporter (metrics.router.ts)", () => {
    it("GET /api/metrics menghasilkan format Prometheus Version 0.0.4 yang valid", async () => {
      // Simulasikan hit ke health agar metrics middleware mencatat request
      await request(app).get("/api/health");

      const res = await request(app).get("/api/metrics");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");
      expect(res.headers["content-type"]).toContain("version=0.0.4");

      const text = res.text;

      // Verifikasi seluruh metrik wajib k6 & Grafana
      expect(text).toContain("# HELP http_requests_total");
      expect(text).toContain("# TYPE http_requests_total counter");

      expect(text).toContain("# HELP http_request_duration_seconds");
      expect(text).toContain("# TYPE http_request_duration_seconds histogram");
      expect(text).toContain("http_request_duration_seconds_bucket");
      expect(text).toContain("http_request_duration_seconds_sum");
      expect(text).toContain("http_request_duration_seconds_count");

      expect(text).toContain("# HELP nodejs_heap_used_bytes");
      expect(text).toContain("nodejs_heap_used_bytes");

      expect(text).toContain("# HELP nodejs_heap_total_bytes");
      expect(text).toContain("nodejs_heap_total_bytes");

      expect(text).toContain("# HELP nodejs_rss_bytes");
      expect(text).toContain("nodejs_rss_bytes");

      expect(text).toContain("# HELP nodejs_eventloop_lag_seconds");
      expect(text).toContain("nodejs_eventloop_lag_seconds");

      expect(text).toContain("# HELP db_pool_total_connections");
      expect(text).toContain("db_pool_total_connections");

      expect(text).toContain("# HELP db_pool_idle_connections");
      expect(text).toContain("db_pool_idle_connections");

      expect(text).toContain("# HELP db_pool_waiting_connections");
      expect(text).toContain("db_pool_waiting_connections");

      expect(text).toContain("# HELP cache_hits_total");
      expect(text).toContain("cache_hits_total");

      expect(text).toContain("# HELP cache_misses_total");
      expect(text).toContain("cache_misses_total");
    });

    it("GET /metrics (root route) juga menyajikan teks metrik Prometheus", async () => {
      const res = await request(app).get("/metrics");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");
      expect(res.text).toContain("http_requests_total");
    });

    it("mencatat method, route, dan status kode HTTP ke http_requests_total", async () => {
      await request(app).get("/api/health");

      const res = await request(app).get("/api/metrics");
      expect(res.text).toMatch(/http_requests_total\{method="GET",route="\/api\/health",status="200"\}\s+1/);
    });
  });

  // ============================================================================
  // 3. HTTP COMPRESSION (GZIP) TESTS
  // ============================================================================
  describe("HTTP Compression (compression middleware)", () => {
    it("merespons dengan header 'content-encoding: gzip' saat klien mengirim 'Accept-Encoding: gzip'", async () => {
      const res = await request(app)
        .get("/api/metrics")
        .set("Accept-Encoding", "gzip");

      expect(res.status).toBe(200);
      expect(res.headers["content-encoding"]).toBe("gzip");
    });
  });
});
