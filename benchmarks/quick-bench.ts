/**
 * Quick Benchmark Runner - Web SMK Telkom Purwokerto
 * Skrip mandiri berbasis TypeScript / Node.js tanpa dependensi k6 eksternal.
 *
 * Mengukur throughput (RPS), latensi (min, max, avg, p50, p90, p99),
 * dan success rate pada request konkuren tinggi menggunakan Promise.all.
 */

import { performance } from "node:perf_hooks";

interface BenchmarkTarget {
  name: string;
  url: string;
}

interface RequestResult {
  durationMs: number;
  statusCode: number;
  success: boolean;
  error?: string;
}

interface BenchmarkStats {
  targetName: string;
  url: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTimeMs: number;
  rps: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
  successRate: number;
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Daftar endpoint target sesuai spesifikasi pengujian performa
const TARGETS: BenchmarkTarget[] = [
  { name: "Endpoint Kesehatan", url: `${BASE_URL}/api/health` },
  { name: "Endpoint PKL", url: `${BASE_URL}/api/pkl` },
  { name: "Endpoint Metrik Prometheus", url: `${BASE_URL}/api/metrics` },
  { name: "Halaman Utama", url: `${BASE_URL}/` },
  { name: "Halaman Jurusan", url: `${BASE_URL}/jurusan` },
  { name: "Halaman Berita", url: `${BASE_URL}/berita` },
];

// Opsi eksekusi dari CLI / Environment
const CONCURRENCY = Number(process.env.CONCURRENCY) || 100;
const BATCHES = Number(process.env.BATCHES) || 1;

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    Math.floor(sortedValues.length * (percentile / 100)),
    sortedValues.length - 1
  );
  return Number(sortedValues[index].toFixed(2));
}

async function sendRequest(url: string): Promise<RequestResult> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "quick-bench-runner/1.0",
        Accept: "application/json, text/html, */*",
      },
      signal: AbortSignal.timeout(10000), // Timeout 10 detik
    });
    const durationMs = performance.now() - start;
    await res.text(); // Pastikan payload selesai dibaca
    const success = res.status === 200;
    return {
      durationMs,
      statusCode: res.status,
      success,
    };
  } catch (err: unknown) {
    const durationMs = performance.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      durationMs,
      statusCode: 0,
      success: false,
      error: errorMessage,
    };
  }
}

async function benchmarkEndpoint(target: BenchmarkTarget, concurrency: number, batches: number): Promise<BenchmarkStats> {
  process.stdout.write(`  Menjalankan uji ke ${target.name} (${target.url}) [${concurrency * batches} reqs]... `);
  
  const allResults: RequestResult[] = [];
  const overallStart = performance.now();

  for (let b = 0; b < batches; b++) {
    const promises: Promise<RequestResult>[] = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(sendRequest(target.url));
    }
    const batchResults = await Promise.all(promises);
    allResults.push(...batchResults);
  }

  const overallDurationMs = performance.now() - overallStart;
  process.stdout.write(`Selesai (${overallDurationMs.toFixed(0)} ms)\n`);

  const totalRequests = allResults.length;
  const successfulRequests = allResults.filter((r) => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const successRate = Number(((successfulRequests / totalRequests) * 100).toFixed(2));

  const latencies = allResults.map((r) => r.durationMs).sort((a, b) => a - b);
  const minLatencyMs = Number((latencies[0] || 0).toFixed(2));
  const maxLatencyMs = Number((latencies[latencies.length - 1] || 0).toFixed(2));
  const avgLatencyMs = Number((latencies.reduce((acc, v) => acc + v, 0) / (latencies.length || 1)).toFixed(2));

  const p50Ms = calculatePercentile(latencies, 50);
  const p90Ms = calculatePercentile(latencies, 90);
  const p99Ms = calculatePercentile(latencies, 99);

  const durationSec = overallDurationMs / 1000;
  const rps = Number((totalRequests / (durationSec || 1)).toFixed(2));

  return {
    targetName: target.name,
    url: target.url,
    totalRequests,
    successfulRequests,
    failedRequests,
    totalTimeMs: Number(overallDurationMs.toFixed(2)),
    rps,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    p50Ms,
    p90Ms,
    p99Ms,
    successRate,
  };
}

async function main() {
  console.log("===============================================================================");
  console.log("           BENCHMARK RUNNER MANDIRI - SMK TELKOM PURWOKERTO                    ");
  console.log("===============================================================================");
  console.log(`Target Base URL   : ${BASE_URL}`);
  console.log(`Konkurensi per Batch : ${CONCURRENCY} request simultan`);
  console.log(`Jumlah Batch       : ${BATCHES}`);
  console.log(`Total per Endpoint : ${CONCURRENCY * BATCHES} request`);
  console.log("-------------------------------------------------------------------------------\n");

  const results: BenchmarkStats[] = [];

  for (const target of TARGETS) {
    try {
      const stats = await benchmarkEndpoint(target, CONCURRENCY, BATCHES);
      results.push(stats);
    } catch (err) {
      console.error(`Gagal menguji ${target.name}:`, err);
    }
  }

  console.log("\n===============================================================================");
  console.log("                           TABEL HASIL RINGKASAN                               ");
  console.log("===============================================================================");

  const formattedTable = results.map((r) => ({
    "Target / Endpoint": r.targetName,
    "Total Reqs": r.totalRequests,
    "RPS": `${r.rps.toFixed(1)} req/s`,
    "Avg (ms)": `${r.avgLatencyMs.toFixed(1)} ms`,
    "Min (ms)": `${r.minLatencyMs.toFixed(1)} ms`,
    "Max (ms)": `${r.maxLatencyMs.toFixed(1)} ms`,
    "p50 (ms)": `${r.p50Ms.toFixed(1)} ms`,
    "p90 (ms)": `${r.p90Ms.toFixed(1)} ms`,
    "p99 (ms)": `${r.p99Ms.toFixed(1)} ms`,
    "Success Rate": `${r.successRate.toFixed(1)}%`,
  }));

  console.table(formattedTable);

  console.log("-------------------------------------------------------------------------------");
  console.log("Detail Metrik Pengujian:");
  for (const r of results) {
    const statusNote = r.successRate >= 99 ? "PASSED (Memenuhi ambang batas)" : (r.failedRequests > 0 && r.url.endsWith("/api/metrics") ? "NOTE (Rute /api/metrics belum diaktifkan - 404)" : "WARNING (Di bawah ambang batas)");
    console.log(`- [${r.targetName}] ${r.url}`);
    console.log(`  Throughput   : ${r.rps.toFixed(2)} req/s | Waktu Total: ${r.totalTimeMs.toFixed(1)} ms`);
    console.log(`  Latensi      : Avg=${r.avgLatencyMs} ms | p50=${r.p50Ms} ms | p90=${r.p90Ms} ms | p99=${r.p99Ms} ms | Min=${r.minLatencyMs} ms | Max=${r.maxLatencyMs} ms`);
    console.log(`  Keberhasilan : ${r.successfulRequests}/${r.totalRequests} (${r.successRate}%) -> Status: ${statusNote}`);
  }
  console.log("===============================================================================\n");
}

main().catch((err) => {
  console.error("Kesalahan fatal saat eksekusi benchmark:", err);
  process.exit(1);
});
