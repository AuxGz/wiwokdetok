# Dokumentasi Arsitektur Sistem

Dokumen ini memuat arsitektur teknis, batasan tanggung jawab komponen, topologi jaringan, dan alur kerja runtime website sekolah.

---

## 1. Prinsip Utama Arsitektur

1. **Pengelolaan Data Terintegrasi (Custom Admin)**:
   Pengelolaan data guru, pimpinan, dan konten sekolah dikelola langsung melalui modul Custom Admin internal yang terhubung ke Prisma ORM dan PostgreSQL. Sistem tidak menggunakan CMS eksternal (seperti Directus) guna menyederhanakan alur data dan mengurangi overhead sistem.

2. **Efisiensi Penggunaan Resource VPS**:
   Sistem dirancang untuk berjalan optimal pada VPS dengan kapasitas memori terbatas (~4 GB RAM) dengan hanya mengoperasikan dua kontainer Docker utama:
   - `app`: Aplikasi Node.js (Express 5 backend API, Custom Admin, dan Astro 7 SSR)
   - `postgres`: Basis data PostgreSQL 16 dengan ekstensi `pgvector`

3. **Pemisahan Peran Ingress & Aplikasi**:
   Terminasi SSL dan manajemen port publik 80/443 ditangani langsung oleh server web host (Webuzo) menggunakan sertifikat Cloudflare Origin CA. Kontainer aplikasi berjalan di belakang reverse proxy host pada antarmuka loopback (`127.0.0.1:3000`).

4. **Isolasi Jaringan Basis Data**:
   Port basis data `5432` sengaja tidak dipublikasikan ke antarmuka host pada lingkungan produksi. Komunikasi antara aplikasi dan PostgreSQL berlangsung secara privat melalui bridge network Docker internal.

---

## 2. Topologi Jaringan Produksi

```text
Browser Pengguna
    ↓ (HTTPS: Port 443)
Cloudflare (SSL Full Strict / WAF / CDN)
    ↓ (HTTPS Origin: Port 443)
VPS Ingress (Webuzo Host Server)
    ↓ Terminasi SSL Cloudflare Origin CA
    ↓ HTTP Reverse Proxy (127.0.0.1:3000)
Kontainer Docker: app (:3000)
    ├── /api/*               ──> Express Router (createApiApp)
    ├── /admin/*             ──> Modul Custom Admin & Autentikasi
    ├── express.static       ──> Aset Statis Klien (dist/astro/client)
    └── Astro SSR Handler    ──> Handler Halaman Publik (dist/astro/server/entry.mjs)
        ↓ (TCP Internal Docker Network: port 5432)
Kontainer Docker: postgres (:5432)
    └── app_db (PostgreSQL 16 + pgvector)
```

---

## 3. Matriks Port Sistem

| Komponen / Layanan | Port Lingkungan Dev | Port Binding Host Produksi | Keterangan |
| :--- | :---: | :---: | :--- |
| **Astro Dev Server** | `4321` | N/A | Server pengembangan Astro dengan Vite HMR |
| **Express Dev Server** | `3000` | N/A | Backend API saat pengembangan lokal (`npm run dev:server`) |
| **Docker `app`** | `3000` | `127.0.0.1:3000` | Proses Node.js produksi yang di-reverse proxy oleh Webuzo |
| **PostgreSQL** | `5432` | Tertutup | Komunikasi murni melalui internal bridge network Docker |

---

## 4. Alur Kerja Pengembangan vs Produksi

### A. Mode Pengembangan Lokal (Host Machine)
- Pengembang menjalankan perintah `npm run dev` pada direktori `app/`.
- Perintah ini mengaktifkan dua proses konkuren melalui paket `concurrently`:
  1. `npm run dev:server`: Menjalankan Express API pada `http://127.0.0.1:3000` menggunakan `tsx` dengan fitur hot reload (`--watch`).
  2. `npm run dev:astro`: Menjalankan server pengembangan Astro pada `http://localhost:4321`.
- Seluruh permintaan ke rute `/api/*` dari antarmuka Astro diproksikan secara otomatis oleh konfigurasi dev Astro ke port `3000`.
- Pada tahap ini, kompilasi build produksi Astro tidak diwajibkan.

### B. Mode Produksi (Docker Container)
- Kontainer `app` menjalankan satu proses Node.js melalui berkas `src/server/server.ts`.
- Fungsi `createApp()` pada `src/server/app.ts` menggabungkan:
  1. Router Express API (`createApiApp()`).
  2. Penyajian berkas statis klien dari direktori `dist/astro/client`.
  3. Handler SSR Astro yang diimpor dari `dist/astro/server/entry.mjs`.
- Mekanisme **Fail-Fast**: Jika berkas kompilasi `entry.mjs` tidak ditemukan atau gagal dimuat, aplikasi akan langsung melempar error pada saat booting dan menghentikan proses sehingga Docker dapat menandai kegagalan kontainer secara dini.

---

## 5. Struktur Basis Data & Migrasi

1. **Basis Data Utama (`app_db`)**:
   - Dimiliki oleh role `app_user`.
   - Mengaktifkan ekstensi `vector` untuk kebutuhan komputasi vektor atau pencarian semantik di masa mendatang.
   - Dikelola menggunakan Prisma 7 dengan adapter driver native `@prisma/adapter-pg`.

2. **Shadow Database (`app_shadow_db`)**:
   - Digunakan oleh perintah `prisma migrate dev` di mesin lokal untuk mendeteksi perubahan skema secara otomatis.
   - Tidak digunakan dan tidak dibutuhkan pada lingkungan runtime produksi.
