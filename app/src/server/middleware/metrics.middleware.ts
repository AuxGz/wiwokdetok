import type { Request, Response, NextFunction } from "express";

export const HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] as const;

export interface HistogramData {
  buckets: Record<number, number>;
  sum: number;
  count: number;
}

// Map key: `${method}|${route}|${status}` -> count
const requestCounts = new Map<string, number>();

// Map key: `${method}|${route}` -> HistogramData
const requestHistograms = new Map<string, HistogramData>();

/**
 * Normalisasi rute Express agar tidak terjadi ledakan kardinalitas (high-cardinality explosion).
 */
function normalizeRoute(req: Request): string {
  const base = req.baseUrl || "";
  const routePath = req.route?.path;
  let fullPath = "";

  if (routePath && typeof routePath === "string") {
    fullPath = `${base}${routePath}`;
  } else {
    // Jika route path belum terikat (misal 404 atau middleware awal)
    const rawPath = req.path || "/";
    fullPath = `${base}${rawPath}`;
  }

  // Bersihkan redundant slashes dan trailing slash
  let cleaned = fullPath.replace(/\/+/g, "/");
  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned === "" ? "/" : cleaned;
}

/**
 * Mencatat durasi dan status eksekusi request ke registry metrik in-memory secara non-blocking.
 */
export function recordHttpRequest(
  method: string,
  route: string,
  status: number,
  durationSeconds: number
): void {
  // 1. Counter: http_requests_total
  const counterKey = `${method}|${route}|${status}`;
  requestCounts.set(counterKey, (requestCounts.get(counterKey) || 0) + 1);

  // 2. Histogram: http_request_duration_seconds
  const histKey = `${method}|${route}`;
  let hist = requestHistograms.get(histKey);
  if (!hist) {
    const initialBuckets: Record<number, number> = {};
    for (const b of HISTOGRAM_BUCKETS) {
      initialBuckets[b] = 0;
    }
    hist = {
      buckets: initialBuckets,
      sum: 0,
      count: 0,
    };
    requestHistograms.set(histKey, hist);
  }

  hist.count += 1;
  hist.sum += durationSeconds;
  for (const b of HISTOGRAM_BUCKETS) {
    if (durationSeconds <= b) {
      hist.buckets[b] += 1;
    }
  }
}

/**
 * Express Middleware untuk observabilitas HTTP non-blocking.
 * Menggunakan process.hrtime.bigint() untuk presisi nanodetik tanpa overhead blocking.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationSeconds = Number(end - start) / 1e9;
    const method = req.method;
    const route = normalizeRoute(req);
    const status = res.statusCode || 200;

    recordHttpRequest(method, route, status, durationSeconds);
  });

  next();
}

export function getHttpRequestCounts(): Map<string, number> {
  return requestCounts;
}

export function getHttpRequestHistograms(): Map<string, HistogramData> {
  return requestHistograms;
}

export function resetMetrics(): void {
  requestCounts.clear();
  requestHistograms.clear();
}
