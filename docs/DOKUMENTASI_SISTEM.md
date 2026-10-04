# Dokumentasi Teknis Sistem, Infrastruktur, & Panduan Pemeliharaan
**Proyek:** Web Resmi SMK Telkom Purwokerto (Web JHIC)  
**Versi Sistem:** 1.0.0 (Production Ready)  
**Pembaruan Terakhir:** 4 Oktober 2026  
**Lisensi:** Hak Cipta SMK Telkom Purwokerto  

---

## Daftar Isi
1. [Ringkasan Eksekutif & Tech Stack](#1-ringkasan-eksekutif--tech-stack)
2. [Topologi Jaringan & Arsitektur Sistem](#2-topologi-jaringan--arsitektur-sistem)
3. [Infrastruktur Server VPS & Tuning Kernel OpenVZ](#3-infrastruktur-server-vps--tuning-kernel-openvz)
   - [Karakteristik & Batasan Virtualisasi OpenVZ](#karakteristik--batasan-virtualisasi-openvz)
   - [Insiden & Resolusi: `cannot fork() ... Resource temporarily unavailable`](#insiden--resolusi-cannot-fork--resource-temporarily-unavailable)
   - [Tuning Web Server Apache Reverse Proxy (`zz-mpm-tuning.conf`)](#tuning-web-server-apache-reverse-proxy-zz-mpm-tuningconf)
4. [CI/CD Pipeline (GitHub Actions) & Deployment](#4-cicd-pipeline-github-actions--deployment)
   - [Alur Kerja Pipeline (`.github/workflows/deploy.yml`)](#alur-kerja-pipeline-githubworkflowsdeployyml)
   - [Insiden & Resolusi: Permission Denied pada `.git/objects`](#insiden--resolusi-permission-denied-pada-gitobjects)
   - [Optimasi Build Context Docker & Eliminasi Core Dump](#optimasi-build-context-docker--eliminasi-core-dump)
5. [Arsitektur & Optimasi Asisten AI (NEXEL AI)](#5-arsitektur--optimasi-asisten-ai-nexel-ai)
   - [Alur Kerja RAG (Retrieval-Augmented Generation)](#alur-kerja-rag-retrieval-augmented-generation)
   - [Karakteristik Penalaran Model & UX Latensi (TTFT)](#karakteristik-penalaran-model--ux-latensi-ttft)
   - [Kalibrasi Vektor pgvector & Resolusi Batas `TOP_K`](#kalibrasi-vektor-pgvector--resolusi-batas-top_k)
   - [Mekanisme Ketahanan Jaringan (Auto-Retry 429 & 500)](#mekanisme-ketahanan-jaringan-auto-retry-429--500)
   - [Ketersediaan Global Antarmuka Widget](#ketersediaan-global-antarmuka-widget)
6. [Fitur Unggulan Frontend & Pengalaman Visual](#6-fitur-unggulan-frontend--pengalaman-visual)
   - [Interactive 3D Leadership Showcase (`/profile-guru`)](#interactive-3d-leadership-showcase-profile-guru)
   - [Virtual Tour Arsitektural 360° 8K (`/fasilitas`)](#virtual-tour-arsitektural-360-8k-fasilitas)
   - [Animasi Scroll Reveal & Polish Visual Landing Page (`/`)](#animasi-scroll-reveal--polish-visual-landing-page-)
7. [SOP Pemeliharaan, Monitoring, & Troubleshooting Rutin](#7-sop-pemeliharaan-monitoring--troubleshooting-rutin)

---

## 1. Ringkasan Eksekutif & Tech Stack

Sistem Web SMK Telkom Purwokerto adalah platform berbasis web modern yang menggabungkan situs profil sekolah berkecepatan tinggi dengan asisten virtual cerdas (NEXEL AI) serta pengalaman visual interaktif (3D Leadership Rack dan Tur Virtual Panorama 360° 8K).

### Komposisi Teknologi (Tech Stack)

| Komponen | Teknologi | Peran & Detail Implementasi |
| :--- | :--- | :--- |
| **Frontend Framework** | **Astro 5.x (SSR Mode)** | Rendering halaman statis dan dinamis dengan adapter `@astrojs/node`, meminimalkan ukuran bundle JavaScript di sisi klien. |
| **Styling & Desain** | **Tailwind CSS v4** | Sistem utilitas CSS modern dengan kurva animasi kustom dan tipografi Poppins serta Plus Jakarta Sans. |
| **Backend Runtime** | **Node.js 22 LTS (ESM)** | Server aplikasi utama berbasis modul native ESM yang menjalankan REST API dan Server-Sent Events (SSE). |
| **Database & Vektor** | **PostgreSQL 16 + pgvector 0.8.6** | Penyimpanan basis data relasional dan pencarian kemiripan kosinus vektor berdimensi 2048 untuk RAG AI. |
| **ORM & Migrasi** | **Prisma 7.10.0** | Type-safe query engine dengan Prisma Client dan pengelolaan skema basis data relasional/vektor. |
| **Model AI (Chat)** | **nvidia/nemotron-3.5-lightning:free** | Model penalaran bahasa alami tingkat lanjut dengan jendela konteks luas untuk menjawab pertanyaan resmi sekolah. |
| **Model AI (Embedding)** | **nvidia/nemotron-3-embed-1b:free** | Model embedding vektor 2048 dimensi untuk representasi semantik potongan dokumen pengetahuan sekolah. |
| **Web Server / Proxy** | **Apache 2.4 (Webuzo)** | Reverse proxy port 80/443 dengan terminasi SSL dan kompresi gzip menuju kontainer aplikasi di port 3000. |
| **Kontainerisasi** | **Docker & Docker Compose** | Isolasi lingkungan aplikasi (`app`) dan basis data (`postgres`) dengan volume persisten data. |
| **Otomasi CI/CD** | **GitHub Actions + Appleboy SSH** | Pipeline pengujian unit otomatis, linting, build validation, dan zero-downtime deployment otomatis ke VPS. |

---

## 2. Topologi Jaringan & Arsitektur Sistem

Seluruh sistem berjalan secara terisolasi dan aman di dalam kontainer Docker pada server VPS produksi (IP: `101.50.1.15`):

```
                                [ PERAMBAN KLIEN ]
                                        │
                                        ▼ HTTPS (Port 443) / HTTP (Port 80)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SERVER VPS LINUX (OpenVZ Container)                                                   │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Apache Web Server 2.4 (Reverse Proxy)                                            │  │
│  │ - SSL Termination (Sertifikat Let's Encrypt / Custom)                            │  │
│  │ - Modul: mod_proxy, mod_proxy_http, mpm_worker_module                            │  │
│  │ - Konfigurasi: /usr/local/apps/apache2/etc/conf.d/zz-mpm-tuning.conf             │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ http://127.0.0.1:3000                    │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ DOCKER CONTAINER: web-jhic-app-1                                                 │  │
│  │ - Service Port: 127.0.0.1:3000 -> 3000                                           │  │
│  │ - Runtime: Node.js 22 LTS (Alpine/Bookworm-slim)                                 │  │
│  │ - Entrypoint: docker-entrypoint.sh (Migrate -> Ingestion Chunks -> Node Server)  │  │
│  │ - Healthcheck: GET /api/health (Interval 10s)                                    │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ postgresql://app_user:...@postgres:5432  │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ DOCKER CONTAINER: web-jhic-postgres-1                                            │  │
│  │ - Service Port: 127.0.0.1:5432 -> 5432                                           │  │
│  │ - Volume Persisten: postgres_data -> /var/lib/postgresql/data                    │  │
│  │ - Ekstensi Vektor: CREATE EXTENSION IF NOT EXISTS vector;                        │  │
│  │ - Database: app_db (Tabel: knowledge_documents, knowledge_chunks, chat_sessions) │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼ HTTPS REST / SSE Stream
                               [ GATEWAY AI UPSTREAM (api.bynizzar.my.id) ]
                               - nvidia/nemotron-3.5-lightning:free
                               - nvidia/nemotron-3-embed-1b:free
```

---

## 3. Infrastruktur Server VPS & Tuning Kernel OpenVZ

### Karakteristik & Batasan Virtualisasi OpenVZ
VPS yang digunakan memanfaatkan virtualisasi berbasis kontainer kernel bersama (OpenVZ / Virtuozzo). Tidak seperti KVM atau mesin fisik murni yang memiliki kernel independen, VPS OpenVZ memiliki batas sumber daya kernel ketat yang dicatat di `/proc/user_beancounters`.

Parameter paling kritis pada VPS ini adalah:
- **`numproc`**: Batas jumlah proses dan thread (*Lightweight Processes*) total yang diizinkan berjalan secara bersamaan di seluruh sistem VPS.
- **Nilai Batas**: `barrier: 500, limit: 500`.

### Insiden & Resolusi: `cannot fork() ... Resource temporarily unavailable`

#### Gejala Error
Proses deployment Git melalui SSH mengalami kegagalan fatal pada langkah `git fetch origin main`:
```text
error: cannot fork() for remote-https: Resource temporarily unavailable
fatal: failed to write object
fatal: unpack-objects failed
Process exited with status 255
```

#### Analisis Diagnostik Kernel
Pemeriksaan langsung pada `/proc/user_beancounters` menunjukkan data berikut:
```text
resource       held        maxheld      barrier      limit     failcnt
numproc         500            500          500        500          55
physpages    839001        1024064      1024000    1024000           5
```
- Nilai `held` berada tepat di angka **500 thread**.
- Nilai `failcnt` bertambah 55 kali, menandakan kernel Linux secara aktif menolak setiap panggilan sistem `fork()` atau `clone()` baru (`EAGAIN`).

#### Profil Konsumsi Thread Sebelum Perbaikan:
1. **Apache Web Server (`httpd`)**: Mengonsumsi **208 thread** akibat konfigurasi default modul `mpm_worker` (4 proses anak $\times$ 52 thread).
2. **Proses Build Docker**: Mengonsumsi ~85 thread saat mengeksekusi kompilasi Astro dan bundling Vite.
3. **Sisa Layanan Sistem**: MariaDB, BIND DNS, MTA-STS Daemon, Portainer, dan Docker Daemon menghabiskan sisa kuota hingga menyentuh batas 500 thread.
4. **Trigger Kegagalan**: Begitu `git fetch` dijalankan, proses `git-remote-https` membutuhkan thread baru untuk menangani koneksi TLS/HTTPS. Karena kuota 500 telah habis, perintah langsung gagal (*cannot fork*).

---

### Tuning Web Server Apache Reverse Proxy (`zz-mpm-tuning.conf`)

Untuk menyelesaikan masalah ini secara permanen, dilakukan optimasi alokasi worker thread pada Apache tanpa mengorbankan performa *reverse proxy*.

#### 1. Berkas Konfigurasi MPM Tuning
Dibuat berkas konfigurasi baru pada `/usr/local/apps/apache2/etc/conf.d/zz-mpm-tuning.conf`:

```apache
<IfModule mpm_event_module>
    ServerLimit              2
    StartServers             1
    MinSpareThreads          5
    MaxSpareThreads         15
    ThreadsPerChild         10
    MaxRequestWorkers       20
    MaxConnectionsPerChild 1000
</IfModule>

<IfModule mpm_worker_module>
    ServerLimit              2
    StartServers             1
    MinSpareThreads          5
    MaxSpareThreads         15
    ThreadsPerChild         10
    MaxRequestWorkers       20
    MaxConnectionsPerChild 1000
</IfModule>
```

#### Mengapa Berkas Bernama `zz-mpm-tuning.conf`?
Di dalam direktori `/usr/local/apps/apache2/etc/conf.d/`, Apache memuat berkas konfigurasi berdasarkan urutan abjad leksikografis (`Include etc/conf.d/*.conf`). Berkas bawaan panel Webuzo bernama `webuzo.conf` mendefinisikan `ServerLimit 256` dan `MaxRequestWorkers 256`. Dengan memberi awalan `zz-`, konfigurasi tuning ini dibaca **paling akhir**, sehingga berhasil menimpa (*override*) batas agresif Webuzo dengan sempurna.

#### Hasil Setelah Tuning:
- Konsumsi thread Apache turun drastis dari **208 thread** menjadi hanya **22–24 thread**.
- Nilai `numproc held` pada kernel turun dari **500 / 500 (100%)** menjadi **~309 / 500 (61%)**.
- Menyediakan cadangan aman sebesar **~191 thread kosong** untuk proses Git, SSH, dan kompilasi Docker.

---

## 4. CI/CD Pipeline (GitHub Actions) & Deployment

Alur integrasi dan deployment berkelanjutan diatur secara terpusat pada [`.github/workflows/deploy.yml`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/.github/workflows/deploy.yml).

### Alur Kerja Pipeline (`.github/workflows/deploy.yml`)

1. **Tahap 1: Pengujian & Validasi Build (CI Runner di GitHub)**
   - **Environment**: Ubuntu Latest, Node.js 22 LTS.
   - **Langkah-langkah**:
     - `npm ci`: Instalasi dependensi deterministik sesuai `package-lock.json`.
     - `npx prisma generate`: Pembangkitan kode Prisma Client type-safe.
     - `npm run lint`: Pemeriksaan kualitas kode dan format Astro/TypeScript.
     - `npm run test`: Eksekusi 42 unit test vitest (keamanan, token, RAG, sanitasi error).
     - `npm run build`: Kompilasi produksi Astro (`dist/astro`) dan TypeScript Server (`dist/node`).

2. **Tahap 2: Deployment Otomatis ke VPS (CD via Appleboy SSH)**
   - Terpicu saat push ke branch `main`.
   - Menggunakan kredensial rahasia GitHub Secrets (`VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_DEPLOY_PATH`).
   - Eksekusi skrip deployment di VPS:
     ```bash
     cd /opt/web-jhic
     git fetch origin main
     git reset --hard origin/main
     docker compose build app
     docker compose up -d --remove-orphans
     docker image prune -f
     ```

---

### Insiden & Resolusi: Permission Denied pada `.git/objects`

#### Akar Masalah
Ketika repositori di VPS sebelumnya pernah disentuh menggunakan hak akses `root` atau perintah `sudo git pull`, sejumlah objek Git baru dibuat dengan pemilik `root:root` dan mode `755`. Ketika pipeline dijalankan menggunakan akun non-root (`deployer`), akun tersebut tidak diizinkan membuat objek Git baru di direktori `.git/objects/`.

#### Resolusi Permanen di VPS
```bash
sudo chown -R deployer:deployer /opt/web-jhic
sudo chmod -R u+rwX,g+rwX /opt/web-jhic/.git
```
Perintah ini memastikan user `deployer` memiliki kepemilikan penuh atas seluruh pohon direktori Git dan direktori kerja aplikasi.

---

### Optimasi Build Context Docker & Eliminasi Core Dump

#### 1. Temuan Berkas Core Dump 1.4 GB
Saat investigasi sistem di `/opt/web-jhic/app/`, ditemukan berkas `core.35` berukuran **1.4 GB** hasil crash proses sebelumnya. Karena berkas ini berada di dalam folder `app/`, Docker CLI secara otomatis menyalin 1.4 GB data ke dalam *build context*, menghabiskan RAM dan memicu limit `physpages` OpenVZ.

#### 2. Tindakan Pencegahan
- Berkas `core.35` dihapus secara manual di VPS: `rm -f /opt/web-jhic/app/core.*`.
- Menambahkan aturan pencegahan pada [`app/.dockerignore`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/app/.dockerignore):
  ```dockerignore
  node_modules
  dist
  .astro
  coverage
  .env
  .env.*
  npm-debug.log*
  core
  core.*
  ```
- Ukuran build context Docker terpangkas dari **1.52 GB** menjadi hanya **~119 MB**.

#### 3. Pencegahan Child Process Telemetri Prisma
Menambahkan variabel lingkungan pada [`app/Dockerfile`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/app/Dockerfile):
```dockerfile
ENV CHECKPOINT_DISABLE=1
```
Variabel ini menonaktifkan pemanggilan proses latar belakang `/app/node_modules/prisma/build/child` ke endpoint telemetri Prisma, mencegah kemunculan error `spawn EAGAIN` saat proses build di lingkungan terbatas thread.

---

## 5. Arsitektur & Optimasi Asisten AI (NEXEL AI)

NEXEL AI adalah asisten virtual resmi berbasis Retrieval-Augmented Generation (RAG) yang dirancang untuk menjawab pertanyaan seputar SMK Telkom Purwokerto secara akurat, faktual, dan bebas dari halusinasi.

### Alur Kerja RAG (Retrieval-Augmented Generation)

```
[ Pesan Pengguna ]
       │
       ▼
[ Validasi Input ] (Panjang maks 4000 karakter, sanitasi teks)
       │
       ├───► [ Fast-Path Sapaan? ] ──(Ya)──► Kirim Salam Ramah Cepat (0ms LLM)
       │
      (Tidak)
       ▼
[ Embedding Query ] (nvidia/nemotron-3-embed-1b:free -> Vektor 2048D)
       │
       ▼
[ pgvector Search ] (Cosine Distance: 1 - (c.embedding <=> query_vector))
       │
       ▼
[ Scope Gate Evaluation ] 
       │
       ├───► [ Relevan? (similarity >= 0.15) ] ──(Tidak)──► Tolak Sopan / Out of Scope
       │
      (Ya)
       ▼
[ Rujukan Sumber ] ──► Pancarkan event SSE: {"type":"source", "source":{...}}
       │
       ▼
[ Grounded System Prompt ] (Konteks disisipkan di dalam tag <school_context>)
       │
       ▼
[ Streaming LLM ] (nvidia/nemotron-3.5-lightning:free via SSE)
       │
       ▼
[ Tampilan Real-time Klien ] (Markdown parser + Auto-scroll)
```

---

### Karakteristik Penalaran Model & UX Latensi (TTFT)

- **Karakteristik Model:** `nvidia/nemotron-3.5-lightning:free` adalah *reasoning model*. Sebelum memancarkan token jawaban pertama (`delta.content`), model menghasilkan 400 s.d. 500 token pemikiran internal (`delta.reasoning`).
- **Time to First Token (TTFT):** Membutuhkan waktu antara **17 hingga 20 detik** sebelum token pertama diterima oleh server.
- **Peningkatan UX di [`ChatbotWidget.astro`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/app/src/components/landing/ChatbotWidget.astro):**
  Untuk mencegah persepsi bahwa sistem mengalami *freeze* atau tidak merespons, diterapkan indikator status dinamis:
  - `Detik 0–2`: *“Menyiapkan jawaban...”*
  - `Detik 2–5`: *“Menghubungkan asisten NEXEL AI...”*
  - `Detik 5–12`: *“Menganalisis dokumen & data sekolah...”*
  - `Detik 12+`: *“Menyusun jawaban lengkap...”*
  - Saat token teks pertama tiba, interval timer langsung dihentikan (`clearInterval`), indikator status berganti menjadi gelembung teks yang mengalir lancar secara *real-time*.

---

### Kalibrasi Vektor pgvector & Resolusi Batas `TOP_K`

#### Kendala Awal:
Pertanyaan penting seperti *"Siapa kepala sekolah SMK Telkom Purwokerto?"* sempat dijawab dengan respons penolakan: *"Saya belum menemukan informasi tersebut dalam informasi resmi SMK Telkom Purwokerto yang tersedia untuk saya."*

#### Investigasi Ranking Vektor:
Basis data memuat 24 potongan pengetahuan (*chunks*). Saat query *"Siapa kepala sekolah SMK Telkom Purwokerto?"* diproses, hasil ranking kemiripan vektor kosinus pgvector adalah:
1. `Profil Pimpinan` Chunk 0 (hanya judul `# Profil Pimpinan...`) $\rightarrow$ Sim: `0.6256`
2. `Profil SMK Telkom` Chunk 0 $\rightarrow$ Sim: `0.5862`
3. `Fasilitas Sekolah` Chunk 0 $\rightarrow$ Sim: `0.5760`
4. `Prestasi Resmi Siswa` Chunk 0 $\rightarrow$ Sim: `0.5655`
5. `Kegiatan Ekstrakurikuler` Chunk 0 $\rightarrow$ Sim: `0.5375`
6. **`Profil Pimpinan` Chunk 1 (Memuat nama: Aris Puji Santoso, S.Kom., M.M.) $\rightarrow$ Sim: `0.5286`**

Karena konfigurasi awal membatasi `AI_RAG_TOP_K=5`, Chunk 1 yang memuat nama Kepala Sekolah berada di peringkat ke-6 dan **terpotong dari prompt konteks**. Akibatnya, LLM yang memiliki aturan tegas untuk tidak berhalusinasi menyatakan bahwa informasi tersebut belum tersedia.

#### Solusi yang Diterapkan:
1. Meningkatkan batas dokumen relevan dari `5` menjadi **`8`** pada berkas [`.env`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/.env) dan [`app/src/server/config/env.ts`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/app/src/server/config/env.ts):
   ```env
   AI_RAG_TOP_K=8
   AI_RAG_MIN_SIMILARITY=0.15
   ```
2. Dengan `TOP_K=8`, potongan detail pimpinan, rincian jurusan, asrama, dan fasilitas selalu masuk ke dalam `<school_context>`.
3. Pengujian ulang live membuktikan pertanyaan langsung dijawab dengan akurat:
   > *"Kepala Sekolah SMK Telkom Purwokerto saat ini adalah **Aris Puji Santoso, S.Kom., M.M.**"*

---

### Mekanisme Ketahanan Jaringan (Auto-Retry 429 & 500)

Pada berkas [`app/src/server/modules/ai/provider.ts`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/app/src/server/modules/ai/provider.ts), dipasang mekanisme *auto-retry* 1 kali secara transparan:
- **Status HTTP 429 (Rate Limit Free Tier)**: Server secara otomatis menahan jeda (*backoff*) selama **2000 ms**, kemudian mencoba memanggil ulang endpoint streaming upstream 1 kali sebelum mengembalikan error ke klien.
- **Status HTTP 500 (Upstream Error / Flapping)**: Server menahan jeda selama **1200 ms**, kemudian mencoba kembali 1 kali.
- **Fallback Non-Streaming**: Jika mode streaming tetap gagal pada status 500, server mencoba mode *completion* non-streaming biasa (`stream: false`) dan mengalirkan teksnya secara bertahap ke klien.

---

### Ketersediaan Global Antarmuka Widget
Komponen widget `<ChatbotWidget />` dipasang di dalam [`app/src/layouts/BaseLayout.astro`](file:///c:/Users/LENOVO/Downloads/Web%20JHIC/app/src/layouts/BaseLayout.astro), sehingga otomatis aktif dan konsisten di seluruh 11 halaman situs:
- `/` (Beranda)
- `/jurusan` (Program Keahlian)
- `/profile-guru` (Pimpinan & Guru)
- `/fasilitas` (Sarana & Tur 360°)
- `/berita` & `/berita/[slug]`
- `/kontak`
- `/prestasi`
- `/ekstrakurikuler`
- `/cv-generator`
- `/pkl-matching`

---

## 6. Fitur Unggulan Frontend & Pengalaman Visual

### Interactive 3D Leadership Showcase (`/profile-guru`)

Halaman profil pimpinan ditata ulang menjadi formasi 7 seksi struktural vertikal dengan interaksi 3D berbasis CSS native (*no heavy external libraries like Three.js*):

#### Struktur 7 Seksi Struktural (Tepat 20 Pejabat):
1. **Pucuk Pimpinan & Dewan Pertimbangan** (3 figur: Kepala Sekolah, Komite Sekolah, Kaur QD & PM).
2. **Bidang Kurikulum & Pembelajaran** (3 figur: Waka Kurikulum, Pgs. Kaur Pembelajaran, Pgs. Kaur KurSilMat).
3. **Bidang IT, Lab & SarPra** (3 figur: Pgs. Waka IT, Pgs. Kaur Lab & TI, Pgs. Kaur SarPra).
4. **Bidang Hubungan Industri & Komunikasi** (3 figur: Pgs. Waka Hubin, Kaur PPDB, Pgs. Kaur Sinergi & Alumni).
5. **Bidang Kesiswaan & Karakter** (3 figur: Pgs. Waka Kesiswaan, Pgs. Kaur BK, Kaur Ekskul & Prestasi).
6. **Bidang Tata Kelola & Administrasi** (3 figur: Pgs. Kepala Administrasi, Kaur Keuangan, Kaur Urusan HC).
7. **Pimpinan Program Keahlian** (2 figur: Pgs. Kaprog TJKT, Pgs. Kaprog PPLG).

#### Karakteristik Desain & 3D:
- **Native CSS 3D**: `perspective: 1200px` dengan `transform-style: preserve-3d`. Formasi melengkung (*curved rack layout*) dengan efek hover mengangkat ke depan (`translateZ(36px) scale(1.03)`).
- **Aset Potret Studio**: Menggunakan foto potret studio DSLR beresolusi tinggi di `/images/guru/` dengan framing terfokus rapi.
- **Subnavigasi Statis**: Pills navigasi horizontal di bawah banner pahlawan menggunakan alur dokumen statis (`relative py-3`) dengan offset scroll `scroll-mt-28`, mencegah tumpang-tindih dengan navbar header mengambang (*floating header*).
- **Prinsip Anti-Slop**: Kartu pimpinan murni hanya menampilkan `[FOTO]`, `[NAMA]`, dan `[JABATAN]` tanpa atribut fiktif atau elemen dekoratif berlebih.

---

### Virtual Tour Arsitektural 360° 8K (`/fasilitas`)

Halaman fasilitas menyediakan penampil tur virtual panorama 360 derajat kelas dunia setara Matterport dan Apple Look Around:

- **8 Ruangan Panorama Beresolusi 8K**:
  1. Ruangan PG (`/images/class3d/RuangPG.jpg`)
  2. Laboratorium Jaringan & Telekomunikasi / TJKT (`/images/class3d/RuangTJKT.jpg`)
  3. Laboratorium Robotika & IoT (`/images/class3d/RuangRobotik.jpg`)
  4. Studio Podcast & Multimedia (`/images/class3d/RuangPodcast.jpg`)
  5. Aula Pertemuan Utama (`/images/class3d/Aula.jpg`)
  6. Masjid Sekolah (`/images/class3d/Masjid.jpg`)
  7. Lapangan Upacara & Olahraga (`/images/class3d/LapanganUpacara.jpg`)
  8. Unit Kesehatan Sekolah / UKS (`/images/class3d/UKS.jpg`)
- **Antarmuka Minimalis Edge-to-Edge**: Kanvas WebGL mengisi 100% viewport layar penuh tanpa bingkai tebal kartu.
- **Dermaga Kontrol HUD Mengambang**: Dermaga kontrol terpadu di bagian bawah layar yang mencakup navigasi prev/next ruangan, indikator counter nomor (`01 / 08`), zoom in/out, reset kamera, dan mode putar otomatis (*auto-rotate*).
- **Dukungan Aksesibilitas**: Navigasi menggunakan keyboard (tombol panah kiri/kanan untuk ganti ruangan, tombol `ESC` untuk keluar, tombol `F` untuk fullscreen).

---

### Animasi Scroll Reveal & Polish Visual Landing Page (`/`)

- **Progressive Enhancement (Anti-Blank Guarantee)**:
  Menggunakan pendekatan kelas `html.scroll-ready`. Jika JavaScript lambat atau dimatikan oleh pengguna, 100% konten tetap tampil secara instan tanpa menyisakan ruang kosong putih.
- **Section Sambutan Kepala Sekolah**:
  - Foto portrait pimpinan dan kartu latar belakang merah terpisah secara elegan dengan kedalaman visual.
  - Di belakang kepala pimpinan terpasang *orbital dashed halo* dengan animasi rotasi melingkar lambat (siklus 36 detik) yang bergerak halus.
- **Penyesuaian Tata Letak Footer**:
  Bagian *Supported by* dipisahkan menjadi dua baris rapi dan proporsional:
  - Baris 1: Logo JHIC 2026, Jagoan Hosting, dan Kementerian KOMDIGI.
  - Baris 2: Logo Garuda Spark Innovation Hub dan Ngalup.co.

---

## 7. SOP Pemeliharaan, Monitoring, & Troubleshooting Rutin

Berikut adalah panduan praktis bagi administrator sistem untuk merawat dan memantau VPS produksi.

### 1. Memeriksa Kuota Thread Kernel OpenVZ
Jalankan melalui SSH (`ssh vps-root` atau `ssh vps-deployer`):
```bash
grep numproc /proc/user_beancounters
```
*Interpretasi Hasil:*
- `held < 350`: Sangat aman dan optimal.
- `held > 450`: Perlu perhatian (periksa apakah ada proses build yang tertahan).
- `held = 500`: Kritis! Sistem akan menolak setiap proses `fork()`.

### 2. Memeriksa Status Kontainer Aplikasi
```bash
docker compose -f /opt/web-jhic/docker-compose.yml ps
```
*Status yang diharapkan:*
- `web-jhic-app-1`: `Up ... (healthy)`
- `web-jhic-postgres-1`: `Up ... (healthy)`

### 3. Memantau Log Aplikasi Secara Real-Time
```bash
# Log server aplikasi & modul AI
docker logs --tail 100 -f web-jhic-app-1

# Log basis data PostgreSQL & pgvector
docker logs --tail 50 -f web-jhic-postgres-1
```

### 4. Membersihkan Image Docker Usang Secara Berkala
Untuk menghemat ruang penyimpanan SSD server VPS:
```bash
docker image prune -f
```

### 5. Memeriksa Integritas Layanan Web Reverse Proxy
```bash
# Memeriksa sintaks konfigurasi Apache
/usr/local/apps/apache2/bin/httpd -t

# Melakukan reload/restart graceful
sudo systemctl restart httpd

# Menguji respon lokal endpoint kesehatan
curl -sI http://127.0.0.1:3000/api/health
```

### 6. Menjalankan Ingesti Ulang Data Pengetahuan AI (Jika File Markdown Berubah)
Jika file pengetahuan di `app/knowledge/*.md` diperbarui di masa mendatang, jalankan ingesti vektor manual di dalam kontainer:
```bash
docker exec -it web-jhic-app-1 node dist/node/server/modules/ai/ingestion.cli.js
```
Proyek ini secara otomatis memecah dokumen markdown, menghasilkan embedding 2048 dimensi, dan memperbarui tabel `knowledge_chunks` di PostgreSQL.

---

*Dokumentasi ini disusun secara faktual berdasarkan inspeksi kode sumber dan pengujian kernel VPS langsung pada tanggal 4 Oktober 2026.*
