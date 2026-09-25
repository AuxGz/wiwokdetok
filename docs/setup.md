# Panduan Setup Pengembangan Lokal

Dokumen ini memandu pengembang untuk menyiapkan lingkungan pengembangan lokal dari *clean checkout*.

---

## Prasyarat Lingkungan

- **Node.js**: Versi 24 LTS (direkomendasikan) atau 20+
- **npm**: Versi 10+
- **Docker & Docker Compose**: Untuk menjalankan database PostgreSQL dan Directus CMS

---

## 1. Konfigurasi Lingkungan (`.env`)

Repositori menggunakan **satu berkas kanonikal `.env`** di root repositori:

```bash
cp .env.example .env
```

Buka berkas `.env` dan atur nilai kredensial.

> [!WARNING]
> **Aturan URL-Safe Password Database**:
> Nilai password database wajib dibuat dalam format URL-safe agar tidak merusak parsing string koneksi `DATABASE_URL` (`postgresql://USER:PASSWORD@HOST:PORT/DB`).
> Buat password acak dengan perintah:
> ```bash
> openssl rand -hex 24
> ```

---

## 2. Menjalankan Database & CMS Lokal

Jalankan container PostgreSQL dan Directus melalui Docker Compose:
```bash
docker compose up -d postgres directus
```

Periksa status kesiapan database:
```bash
docker compose ps
```

---

## 3. Instalasi Dependensi Aplikasi

Seluruh dependensi dikelola secara terpusat di dalam direktori `app/`:

```bash
cd app
npm install
```

Perintah di atas akan membaca `package.json` dan memvalidasi integritas `package-lock.json`.

---

## 4. Inisialisasi Skema Prisma

Jalankan generasi client Prisma 7:
```bash
npm run prisma:generate
```

Terapkan migrasi ke `app_db`:
```bash
npx prisma migrate dev --name init
```

---

## 5. Menjalankan Server Pengembangan

Jalankan alur kerja pengembangan konkruen:
```bash
npm run dev
```

Output terminal akan menampilkan:
- **Express API dev server**: `http://127.0.0.1:3000`
- **Astro dev server**: `http://localhost:4321`

Buka `http://localhost:4321` di browser Anda untuk melihat antarmuka dengan fitur Hot Module Replacement (HMR). Panggilan ke `http://localhost:4321/api/health` akan otomatis diteruskan ke Express API.

---

## 6. Pengujian Otomatis

Untuk menjalankan unit test endpoint API tanpa koneksi database aktif:
```bash
cd app
npm test
```
