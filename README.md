# Website Sekolah — Fondasi & Skeleton Sistem

Fondasi awal arsitektur sistem website sekolah yang berorientasi produksi, mudah dirawat, dan siap diserahterimakan kepada siswa maupun pengembang berikutnya tanpa merombak struktur arsitektur.

## Teknologi Utama

- **Frontend & Web SSR**: Astro 7 (Node middleware mode) + React 19 Islands
- **Backend API**: Express 5 + TypeScript
- **ORM & Database Client**: Prisma 7 dengan PostgreSQL Driver Adapter (`@prisma/adapter-pg`)
- **Database**: PostgreSQL 16 dengan ekstensi `pgvector` 0.8.6
- **Headless CMS**: Directus 12.4.1
- **Orkestrasi Kontainer**: Docker Compose (tepat 3 layanan: `app`, `directus`, `postgres`)
- **Ingress & TLS**: Webuzo (host reverse proxy) dengan terminasi SSL Cloudflare Origin CA Full (Strict)

---

## Struktur Repositori

```text
Web JHIC/
├── app/                               # Satu-satunya Node application
│   ├── prisma/
│   │   └── schema.prisma              # Skema Prisma 7 (generator prisma-client)
│   ├── prisma.config.ts               # Prisma Config CLI & path ../.env
│   ├── src/
│   │   ├── pages/                     # Halaman Astro (index.astro, 404.astro)
│   │   ├── layouts/                   # Layout dasar (BaseLayout.astro)
│   │   ├── components/                # Komponen antarmuka (Container, Header, Section, Footer)
│   │   ├── styles/                    # Gaya CSS global (global.css)
│   │   └── server/                    # Backend Express 5
│   │       ├── api-app.ts             # Express API app (diuji mandiri oleh Vitest)
│   │       ├── dev-server.ts          # Entrypoint khusus development (Express API :3000)
│   │       ├── app.ts                 # Komposisi Produksi: Express + static + entry.mjs (Fail-Fast)
│   │       ├── server.ts              # Entrypoint khusus produksi: Listener & graceful shutdown
│   │       ├── config/
│   │       │   └── env.ts             # Validasi Zod & pemuatan ../.env dari direktori app/
│   │       ├── lib/                   # prisma.ts (adapter-pg) & directus.ts (SDK)
│   │       ├── middleware/            # error-handler.ts & not-found.ts
│   │       └── modules/
│   │           └── health/            # /api/health (liveness) & /api/health/ready (readiness)
│   ├── tests/
│   │   └── health.test.ts             # Pengujian otomatis Vitest & Supertest
│   ├── .dockerignore                  # Pengabaian konteks build Docker
│   ├── astro.config.mjs               # Konfigurasi Astro (mode: middleware + dev proxy /api)
│   ├── tsconfig.json                  # Konfigurasi TypeScript ESM
│   ├── tsconfig.server.json           # Kompilasi TypeScript server ke dist/node
│   ├── package.json                   # Dependensi aplikasi resmi berbasis npm
│   ├── package-lock.json              # Lockfile npm wajib di-commit untuk reproducible build
│   └── Dockerfile                     # Multi-stage Dockerfile Node.js 24 (npm ci)
├── cms/                               # Konfigurasi Directus CMS
│   ├── extensions/                    # Direktori ekstensi kustom Directus
│   └── README.md                      # Panduan skema & ekspor snapshot CMS
├── docker/
│   └── postgres/
│       └── init/
│           └── 01-init-databases.sh   # Inisialisasi database psql dinamis
├── docs/                              # Dokumentasi arsitektur & operasional
│   ├── architecture.md                # Batasan kepemilikan dan relasi sistem
│   ├── setup.md                       # Panduan setup dev lokal & aturan URL-safe password
│   └── deployment.md                  # Panduan deployment VPS Jagoan Hosting & Webuzo
├── docker-compose.yml                 # Orkestrasi 3 layanan kontainer
├── .env.example                       # Satu-satunya template konfigurasi lingkungan kanonikal
├── .gitignore                         # Pengabaian git
└── .prettierrc                        # Format penulisan kode Prettier
```

---

## Panduan Cepat Pengembangan Lokal

1. Salin template lingkungan kanonikal:
   ```bash
   cp .env.example .env
   ```
2. Sesuaikan kredensial di dalam berkas `.env` (gunakan password heksadesimal URL-safe: `openssl rand -hex 24`).
3. Masuk ke direktori aplikasi dan pasang dependensi:
   ```bash
   cd app
   npm install
   ```
4. Jalankan server pengembangan lokal (Astro di port 4321 dan Express dev API di port 3000):
   ```bash
   npm run dev
   ```

Dokumentasi lengkap dapat dibaca pada folder [`docs/`](file:///docs/).
