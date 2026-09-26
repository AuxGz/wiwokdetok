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

## 4. Inisialisasi Skema & Migrasi Prisma

Jalankan generasi client Prisma 7:
```bash
npm run prisma:generate
```

### Alur Migrasi Pengembangan (`prisma migrate dev`)
Alur kerja pengembangan skema menggunakan database shadow terpisah (`app_shadow_db`) yang secara otomatis diinisialisasi oleh skrip `docker/postgres/init/01-init-databases.sh`.

Jalankan perintah migrasi pengembangan di dalam kontainer `app` (di mana jaringan internal PostgreSQL dapat diakses langsung):
```bash
docker compose exec app npx prisma migrate dev --name <nama_migrasi>
```

Atau jika dijalankan dari host lokal dengan port database terpetakan:
```bash
cd app
npx prisma migrate dev --name <nama_migrasi>
```

> [!NOTE]
> Shadow database `app_shadow_db` hanya digunakan selama proses pembuatan migrasi pengembangan (`prisma migrate dev`) dan **bukan** merupakan dependensi runtime produksi.

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
