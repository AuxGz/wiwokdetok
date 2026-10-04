import express, { type Request, type Response } from "express";
import { monitorEventLoopDelay } from "node:perf_hooks";
import {
  HISTOGRAM_BUCKETS,
  getHttpRequestCounts,
  getHttpRequestHistograms,
} from "../../middleware/metrics.middleware.js";
import { getPoolMetrics } from "../../lib/prisma.js";
import { getCacheMetrics } from "../../lib/cache.js";

export const metricsRouter: express.Router = express.Router();

let eventLoopMonitor: ReturnType<typeof monitorEventLoopDelay> | null = null;
try {
  eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
  eventLoopMonitor.enable();
} catch (err) {
  console.warn("[metrics] monitorEventLoopDelay unavailable:", err);
}

function getEventLoopLagSeconds(): number {
  if (eventLoopMonitor) {
    const meanNs = eventLoopMonitor.mean;
    if (Number.isFinite(meanNs) && meanNs > 0) {
      return Number((meanNs / 1e9).toFixed(6));
    }
  }
  return 0;
}

/**
 * Membentuk teks metrik berformat Prometheus Version 0.0.4.
 */
export function buildPrometheusText(): string {
  const lines: string[] = [];
  const mem = process.memoryUsage();
  const pool = getPoolMetrics();
  const cache = getCacheMetrics();
  const eventLoopLag = getEventLoopLagSeconds();
  const reqCounts = getHttpRequestCounts();
  const reqHistograms = getHttpRequestHistograms();

  // 1. HTTP Requests Total
  lines.push("# HELP http_requests_total Total number of HTTP requests processed");
  lines.push("# TYPE http_requests_total counter");
  for (const [key, count] of reqCounts.entries()) {
    const [method, route, status] = key.split("|");
    lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`);
  }

  // 2. HTTP Request Duration Seconds Histogram
  lines.push("# HELP http_request_duration_seconds HTTP request execution latency in seconds");
  lines.push("# TYPE http_request_duration_seconds histogram");
  for (const [key, hist] of reqHistograms.entries()) {
    const [method, route] = key.split("|");
    for (const b of HISTOGRAM_BUCKETS) {
      lines.push(`http_request_duration_seconds_bucket{le="${b}",method="${method}",route="${route}"} ${hist.buckets[b]}`);
    }
    lines.push(`http_request_duration_seconds_bucket{le="+Inf",method="${method}",route="${route}"} ${hist.count}`);
    lines.push(`http_request_duration_seconds_sum{method="${method}",route="${route}"} ${hist.sum.toFixed(6)}`);
    lines.push(`http_request_duration_seconds_count{method="${method}",route="${route}"} ${hist.count}`);
  }

  // 3. Node.js Memory Usage
  lines.push("# HELP nodejs_heap_used_bytes Process heap memory currently used in bytes");
  lines.push("# TYPE nodejs_heap_used_bytes gauge");
  lines.push(`nodejs_heap_used_bytes ${mem.heapUsed}`);

  lines.push("# HELP nodejs_heap_total_bytes Process total heap memory allocated in bytes");
  lines.push("# TYPE nodejs_heap_total_bytes gauge");
  lines.push(`nodejs_heap_total_bytes ${mem.heapTotal}`);

  lines.push("# HELP nodejs_rss_bytes Process Resident Set Size memory in bytes");
  lines.push("# TYPE nodejs_rss_bytes gauge");
  lines.push(`nodejs_rss_bytes ${mem.rss}`);

  // 4. Node.js Event Loop Lag
  lines.push("# HELP nodejs_eventloop_lag_seconds Mean event loop delay lag in seconds");
  lines.push("# TYPE nodejs_eventloop_lag_seconds gauge");
  lines.push(`nodejs_eventloop_lag_seconds ${eventLoopLag}`);

  // 5. Database Connection Pool Metrics
  lines.push("# HELP db_pool_total_connections Total connections created in database pool");
  lines.push("# TYPE db_pool_total_connections gauge");
  lines.push(`db_pool_total_connections ${pool.totalCount}`);

  lines.push("# HELP db_pool_idle_connections Number of idle connections available in pool");
  lines.push("# TYPE db_pool_idle_connections gauge");
  lines.push(`db_pool_idle_connections ${pool.idleCount}`);

  lines.push("# HELP db_pool_waiting_connections Number of connection requests currently queued/waiting");
  lines.push("# TYPE db_pool_waiting_connections gauge");
  lines.push(`db_pool_waiting_connections ${pool.waitingCount}`);

  // 6. Micro-Cache Metrics
  lines.push("# HELP cache_hits_total Total number of successful in-memory cache lookups");
  lines.push("# TYPE cache_hits_total counter");
  lines.push(`cache_hits_total ${cache.hits}`);

  lines.push("# HELP cache_misses_total Total number of in-memory cache lookup misses");
  lines.push("# TYPE cache_misses_total counter");
  lines.push(`cache_misses_total ${cache.misses}`);

  return lines.join("\n") + "\n";
}

const handleMetrics = (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(buildPrometheusText());
};

metricsRouter.get("/", handleMetrics);
metricsRouter.get("/metrics", handleMetrics);
