# Panduan Pengujian Beban & Benchmark (SMK Telkom Purwokerto)

Direktori ini memuat skrip pengujian beban (`k6`) dan benchmark mandiri (`TypeScript/Node.js`) untuk mengevaluasi throughput, ketahanan beban tinggi, dan latensi sistem.

## 1. File Pengujian

| Berkas | Jenis | Deskripsi |
|---|---|---|
| [`k6-load-test.js`](./k6-load-test.js) | k6 Script | Pengujian beban multi-tahap (50 -> 200 -> 500 VUs) dengan ambang batas SLA latency (p95 < 200ms, p99 < 400ms) dan failure rate (< 1%). |
| [`quick-bench.ts`](./quick-bench.ts) | Node.js TS Runner | Runner benchmark mandiri tanpa dependensi binary k6 eksternal, mengukur RPS, min/max/avg/p50/p90/p99 latency, dan success rate. |

---

## 2. Cara Menjalankan Quick Benchmark (Mandiri)

Runner ini dapat langsung dijalankan menggunakan runtime Node.js v18+:

```bash
# Menggunakan Node.js native TypeScript (Node 22+)
node --experimental-strip-types benchmarks/quick-bench.ts

# Atau dengan konfigurasi konkurensi khusus (misal: 200 konkurensi)
$env:CONCURRENCY=200; node --experimental-strip-types benchmarks/quick-bench.ts
```

### Parameter Environment
- `BASE_URL`: URL target aplikasi (default: `http://localhost:3000`).
- `CONCURRENCY`: Jumlah request simultan dalam satu batch (default: `100`).
- `BATCHES`: Jumlah siklus batch yang dijalankan (default: `1`).

---

## 3. Cara Menjalankan k6 Load Test

Jika binary k6 terpasang pada sistem:

```bash
k6 run benchmarks/k6-load-test.js
```

Atau menggunakan Docker resmi grafana/k6:

```bash
docker run --rm -i --network host grafana/k6 run - < benchmarks/k6-load-test.js
```
