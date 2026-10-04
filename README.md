# Website Sekolah — Arsitektur & Panduan Sistem

Repositori ini memuat sistem website sekolah dengan arsitektur Server-Side Rendering (SSR) berbasis Astro dan API backend Express. Data sekolah dikelola secara mandiri menggunakan basis data PostgreSQL dan Prisma ORM melalui modul Custom Admin internal tanpa ketergantungan pada CMS pihak ketiga.

---

## Teknologi Utama

- **Frontend & Web SSR**: Astro 7 (Node.js adapter mode middleware) + React 19 Islands
- **Styling & Interaktivitas**: Tailwind CSS v4 + Lenis Smooth Scroll
- **Backend API & Custom Admin**: Express 5 + TypeScript
- **ORM & Database Client**: Prisma 7 dengan PostgreSQL Driver Adapter (`@prisma/adapter-pg`)
- **Basis Data**: PostgreSQL 16 dengan ekstensi `pgvector` 0.8.6
- **Kontainerisasi**: Docker & Docker Compose (2 layanan: `app` dan `postgres`)
- **Ingress Host & TLS**: Webuzo host reverse proxy dengan terminasi SSL Cloudflare Origin CA Full (Strict)
- **Otomasi CI/CD**: GitHub Actions (Linting ESLint, Unit Testing Vitest, Validasi Build, dan Deployment SSH ke VPS)

---

## Struktur Repositori

```text
Web JHIC/
├── .github/
│   └── workflows/
│       └── deploy.yml                 # Pipeline CI/CD (Test, Build, Deploy ke VPS)
├── app/                               # Aplikasi Node.js tunggal
│   ├── prisma/
│   │   ├── schema.prisma              # Definisi skema basis data Prisma
│   │   └── migrations/                # Riwayat migrasi basis data SQL
│   ├── prisma.config.ts               # Konfigurasi Prisma CLI & resolusi path ../.env
│   ├── src/
│   │   ├── pages/                     # Halaman Astro (SSR & routing publik)
│   │   ├── layouts/                   # Layout halaman dasar
│   │   ├── components/                # Komponen UI (Navbar, Footer, Carousel 3D, dsb.)
│   │   ├── data/                      # Modul data statis dan konfigurasi
│   │   ├── styles/                    # Gaya global (global.css)
│   │   └── server/                    # Backend API Express 5
│   │       ├── api-app.ts             # Router API Express (dapat diuji mandiri oleh Vitest)
│   │       ├── dev-server.ts          # Entrypoint lokal untuk dev server API (:3000)
│   │       ├── app.ts                 # Komposisi produksi: Express API + static + Astro SSR
│   │       ├── server.ts              # Entrypoint server produksi dengan graceful shutdown
│   │       ├── config/
│   │       │   └── env.ts             # Validasi variabel lingkungan berbasis Zod
│   │       ├── lib/
│   │       │   └── prisma.ts          # Inisialisasi PrismaClient dengan pg adapter
│   │       ├── middleware/            # Error handling dan middleware Express
│   │       └── modules/
│   │           └── health/            # Endpoint pemeriksaan kesehatan (/api/health)
│   ├── tests/
│   │   └── health.test.ts             # Unit test Vitest & Supertest
│   ├── astro.config.mjs               # Konfigurasi Astro (output: server, dev proxy /api)
│   ├── tsconfig.json                  # Konfigurasi TypeScript aplikasi
│   ├── tsconfig.server.json           # Kompilasi TypeScript backend ke dist/node
│   ├── package.json                   # Dependensi dan skrip proyek
│   ├── package-lock.json              # Kunci versi dependensi npm
│   └── Dockerfile                     # Multi-stage Dockerfile Node.js 24
├── docker/
│   └── postgres/
│       └── init/
│           └── 01-init-databases.sh   # Skrip inisialisasi basis data PostgreSQL & pgvector
├── docs/                              # Dokumentasi arsitektur dan operasional
│   ├── architecture.md                # Topologi jaringan, batas sistem, dan matriks port
│   ├── setup.md                       # Panduan penyiapan lingkungan lokal dari nol
│   └── deployment.md                  # Panduan deployment VPS Jagoan Hosting & CI/CD
├── docker-compose.yml                 # Konfigurasi kontainer produksi (postgres & app)
├── .env.example                       # Contoh konfigurasi variabel lingkungan kanonikal
├── .gitignore                         # Pengabaian berkas Git
└── .prettierrc                        # Format penulisan kode
```

---

## Panduan Cepat Pengembangan Lokal

### 1. Persiapan Variabel Lingkungan
Salin berkas contoh konfigurasi:
```bash
cp .env.example .env
```
Sesuaikan password basis data pada `.env`. Gunakan nilai heksadesimal acak (URL-safe):
```bash
openssl rand -hex 24
```

### 2. Menjalankan Basis Data PostgreSQL
Jalankan kontainer database menggunakan Docker Compose:
```bash
docker compose up -d postgres
```

### 3. Instalasi Dependensi & Generate Prisma
Masuk ke direktori `app`:
```bash
cd app
npm install
npm run prisma:generate
```

### 4. Menjalankan Server Pengembangan
Jalankan dev server secara konkruen (Express API di port 3000 dan Astro di port 4321):
```bash
npm run dev
```
Akses antarmuka web di peramban pada alamat:
`http://localhost:4321`

---

## Pengujian & Kualitas Kode

Di dalam direktori `app`, jalankan perintah berikut untuk validasi:

- **Linting kode**:
  ```bash
  npm run lint
  ```
- **Unit test endpoint**:
  ```bash
  npm run test
  ```
- **Validasi build penuh (Prisma + Astro + Server)**:
  ```bash
  npm run build
  ```

---

## Dokumentasi Lanjutan

- [Dokumentasi Teknis Sistem, Infrastruktur VPS, & Pemeliharaan (Lengkap)](docs/DOKUMENTASI_SISTEM.md)
- [Dokumentasi Arsitektur Sistem](docs/architecture.md)
- [Panduan Setup Pengembangan Lokal](docs/setup.md)
- [Panduan Deployment VPS & CI/CD](docs/deployment.md)
