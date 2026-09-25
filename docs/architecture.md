# Dokumentasi Arsitektur Sistem

Dokumen ini menjelaskan batas tanggung jawab, topologi jaringan, isolasi database, dan siklus hidup sistem website sekolah.

---

## 1. Prinsip Utama Arsitektur

1. **Kesederhanaan & Kemudahan Handover**: Menggunakan stack teknologi standar yang ramah pemula dan siswa (Astro 7, Express 5, React 19, Prisma 7, Directus 12, PostgreSQL 16 + pgvector).
2. **Kesesuaian Resource VPS Kecil**: Dioptimalkan untuk NAT VPS Jagoan Hosting (~4 GB RAM) dengan runtime Docker yang ramping (tepat 3 layanan: `app`, `directus`, `postgres`).
3. **Penyelarasan Host Webuzo**: Webuzo mengelola ingress port 80/443 publik dan terminasi SSL Cloudflare Origin CA. Tidak ada kontainer reverse proxy tambahan di Docker.
4. **Isolasi Database**:
   - `app_db`: Dimiliki oleh `app_user`, ekstensi `pgvector` aktif, dikelola oleh Prisma 7.
   - `cms_db`: Dimiliki oleh `directus_user`, dikelola secara eksklusif oleh Directus 12.
   - Layanan Express tidak pernah melakukan query langsung ke tabel internal Directus.
5. **Keamanan Port Maksimal**: Port 5432 PostgreSQL **tidak dipublikasikan ke host**. Akses hanya melalui Docker Compose default bridge network.

---

## 2. Topologi Jaringan Produksi

```text
Public Browser
    ↓ (HTTPS: 443)
Cloudflare (SSL Full Strict / WAF / CDN)
    ↓ (HTTPS Origin: 443)
Jagoan Hosting Domain Forward (NAT Upstream)
    ↓ (Port 443)
Webuzo Host Web Server (Terminasi SSL via Cloudflare Origin CA)
    ↓ (HTTP Loopback: 127.0.0.1:3000)
Docker app:3000 (server.ts ──> createApp())
                ├── /api/*               ──> createApiApp()
                ├── express.static       ──> dist/astro/client
                └── Astro SSR Handler    ──> dist/astro/server/entry.mjs (Fail-Fast)
```

---

## 3. Matriks Port Otoritatif

| Komponen / Layanan | Port Internal / Dev | Port Binding Host (Produksi) | Keterangan |
| :--- | :---: | :--- | :--- |
| **Astro Dev Server** | `4321` | N/A | Hanya aktif saat `npm run dev` di mesin lokal |
| **Express Dev Server** | `3000` | N/A | Dijalankan via `dev-server.ts` saat dev lokal |
| **Docker `app`** | `3000` | `127.0.0.1:3000` | Di-reverse proxy oleh Webuzo host |
| **Directus CMS** | `8055` | `127.0.0.1:8055` | Terikat pada loopback host lokal |
| **PostgreSQL** | `5432` | **Tidak ada port host (tertutup)** | Komunikasi murni via internal bridge Docker |

---

## 4. Alur Kerja Pengembangan vs Produksi

### Mode Pengembangan (Local Host Dev)
- Pengembang menjalankan `npm run dev` di dalam direktori `app/`.
- Perintah ini menjalankan dua proses secara konkruen (`concurrently`):
  1. `npm run dev:server` (`tsx watch src/server/dev-server.ts`): Menjalankan Express API di `http://127.0.0.1:3000`.
  2. `npm run dev:astro` (`astro dev`): Menjalankan Astro dev server di `http://localhost:4321` dengan Vite HMR.
- Vite memproksi rute `/api/*` ke Express dev server di `http://127.0.0.1:3000`.
- **Tidak membutuhkan build produksi Astro sebelumnya.**

### Mode Produksi (Docker Container)
- Kontainer `app` menjalankan satu proses Node.js via `src/server/server.ts`.
- Fungsi `createApp()` di `src/server/app.ts` menggabungkan router Express API, penyajian aset statis (`dist/astro/client`), dan handler Astro SSR (`dist/astro/server/entry.mjs`).
- Pemuatan handler Astro SSR dikonfigurasi **Fail-Fast**: jika berkas `entry.mjs` hilang atau rusak, proses langsung melempar error saat startup dan berhenti dengan kode non-zero sehingga supervisor Docker dapat mendeteksi kegagalan kontainer.
