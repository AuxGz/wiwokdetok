# Panduan Setup Pengembangan Lokal

Dokumen ini memandu pengembang untuk menyiapkan lingkungan pengembangan lokal dari *clean checkout*.

---

## Prasyarat Lingkungan

- **Node.js**: Versi 22 LTS atau 24 LTS
- **npm**: Versi 10 ke atas
- **Docker & Docker Compose**: Untuk menjalankan basis data PostgreSQL lokal

---

## 1. Konfigurasi Variabel Lingkungan (`.env`)

Sistem menggunakan satu berkas konfigurasi `.env` yang diletakkan pada direktori root proyek:

```bash
cp .env.example .env
```

Buka berkas `.env` yang baru dibuat dan tentukan kredensial database.

> [!WARNING]
> **Format Password Database Wajib URL-Safe**:
> Nilai password database diuraikan dalam format string URL (`postgresql://USER:PASSWORD@HOST:PORT/DB`). Hindari karakter khusus seperti `@`, `:`, `/`, atau `#`.
> Gunakan string heksadesimal acak:
> ```bash
> openssl rand -hex 24
> ```

---

## 2. Menjalankan Basis Data PostgreSQL

Jalankan kontainer database PostgreSQL melalui Docker Compose:
```bash
docker compose up -d postgres
```

Pastikan kontainer telah berstatus `healthy`:
```bash
docker compose ps
```

Skrip inisialisasi (`docker/postgres/init/01-init-databases.sh`) akan secara otomatis membuat basis data `app_db`, database bayangan `app_shadow_db`, serta mengaktifkan ekstensi `pgvector`.

---

## 3. Instalasi Dependensi & Kode Klien Prisma

Seluruh dependensi frontend dan backend dikelola di dalam direktori `app/`:

```bash
cd app
npm install
```

Setelah dependensi terpasang, hasilkan tipe TypeScript dan modul klien Prisma:
```bash
npm run prisma:generate
```

---

## 4. Pengelolaan Skema & Migrasi Basis Data

Saat Anda menambahkan atau memodifikasi model tabel pada `app/prisma/schema.prisma`, jalankan migrasi pengembangan lokal:

```bash
cd app
npx prisma migrate dev --name <nama_perubahan>
```

Perintah ini akan:
1. Membaca perubahan pada skema Prisma.
2. Membandingkannya dengan database bayangan (`app_shadow_db`).
3. Menghasilkan berkas migrasi SQL baru di `app/prisma/migrations/`.
4. Menerapkan berkas migrasi tersebut ke basis data `app_db`.
5. Memperbarui Prisma Client secara otomatis.

---

## 5. Menjalankan Server Pengembangan

Jalankan alur kerja pengembangan konkuren:
```bash
cd app
npm run dev
```

Perintah di atas akan mengaktifkan dua layanan sekaligus:
- **Express API dev server**: `http://127.0.0.1:3000` (berjalan menggunakan `tsx` dengan fitur *file watcher*)
- **Astro dev server**: `http://localhost:4321` (berjalan dengan fitur *Vite Hot Module Replacement*)

Buka peramban di `http://localhost:4321`. Seluruh pemanggilan rute API publik (`/api/*`) dari halaman Astro akan diteruskan secara otomatis oleh proxy internal Astro ke port `3000`.

---

## 6. Pengujian Otomatis & Validasi Kualitas

Sebelum mengajukan perubahan kode ke repositori, jalankan rangkaian pengujian berikut:

1. **Pemeriksaan Linter (ESLint 9)**:
   ```bash
   npm run lint
   ```

2. **Unit Test API (Vitest & Supertest)**:
   ```bash
   npm run test
   ```

3. **Verifikasi Build Produksi (Prisma + Astro + Server)**:
   ```bash
   npm run build
   ```
