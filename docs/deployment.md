# Panduan Deployment Produksi & CI/CD

Panduan ini mendokumentasikan proses deployment sistem website sekolah ke VPS berbasis Ubuntu (dengan panel Webuzo) serta konfigurasi pipeline CI/CD otomatis menggunakan GitHub Actions.

---

## 1. Arsitektur Ingress Produksi

```text
Pengguna / Peramban Publik
    ↓ (HTTPS: Port 443)
Cloudflare (Mode TLS: Full Strict + WAF)
    ↓ (HTTPS Origin: Port 443)
Jagoan Hosting Ingress / NAT
    ↓ (Port 443)
Webuzo Host Server (Terminasi SSL via Cloudflare Origin CA)
    ↓ (HTTP Reverse Proxy: 127.0.0.1:3000)
Kontainer Docker: app (Port 3000)
    ↓ (Koneksi Internal Docker)
Kontainer Docker: postgres (Port 5432)
```

---

## 2. Konfigurasi Awal di Server Webuzo

1. **Buat Domain / Virtual Host**:
   Daftarkan domain atau subdomain sekolah pada menu Domain Management Webuzo.

2. **Pasang Sertifikat SSL Cloudflare Origin CA**:
   - Terbitkan Origin Certificate dari dashboard Cloudflare untuk domain terkait.
   - Pasang sertifikat publik (.crt) dan kunci privat (.key) pada menu SSL di Webuzo.

3. **Konfigurasi Reverse Proxy Nginx**:
   Arahkan seluruh trafik HTTP dari domain host ke port loopback aplikasi (`127.0.0.1:3000`):
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

---

## 3. Otomasi Deployment via GitHub Actions (CI/CD)

Repositori ini telah dilengkapi pipeline terintegrasi pada `.github/workflows/deploy.yml`.

### A. Tahapan Kerja Pipeline
1. **Tahap Pengujian & Validasi Kualitas (CI)**:
   - Dijalankan pada setiap pull request dan push ke branch `main`.
   - Menguji instalasi dependensi (`npm ci`).
   - Memvalidasi skema Prisma (`npm run prisma:generate`).
   - Menjalankan analisis statis kode (`npm run lint`).
   - Menjalankan pengujian otomatis (`npm run test`).
   - Memastikan kompilasi aplikasi berhasil penuh (`npm run build`).

2. **Tahap Deployment ke VPS (CD)**:
   - Hanya dieksekusi jika tahap pengujian berhasil 100% dan perubahan terjadi pada branch `main` (atau dipicu manual melalui tombol *Run workflow* di GitHub Actions).
   - Melakukan koneksi terenkripsi via SSH ke VPS.
   - Memperbarui kode dari repositori Git (`git reset --hard origin/main`).
   - Membangun citra kontainer `app` (`docker compose build app`).
   - Menjalankan kontainer terbaru tanpa downtime (`docker compose up -d --remove-orphans`).
   - Membersihkan citra kontainer usang (`docker image prune -f`).

### B. Konfigurasi GitHub Repository Secrets
Untuk mengaktifkan deployment otomatis, daftarkan variabel rahasia berikut pada menu **Settings > Secrets and variables > Actions** di repositori GitHub:

| Nama Secret | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `VPS_HOST` | Alamat IP publik atau domain SSH server VPS | `103.xxx.xxx.xxx` |
| `VPS_PORT` | Port layanan SSH (sesuaikan jika server menggunakan NAT port forwarding) | `22` atau `2222` |
| `VPS_USER` | Akun pengguna sistem dengan akses eksekusi Docker | `root` atau `deployer` |
| `VPS_SSH_KEY` | Kunci privat SSH (format OpenSSH / PEM) untuk autentikasi tanpa password | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `VPS_DEPLOY_PATH` | Path absolut direktori repositori di dalam server VPS | `/opt/web-jhic` atau `/home/deploy/web-jhic` |

---

## 4. Setup Awal di VPS (Deployment Manual Pertama Kali)

Sebelum pipeline CI/CD dijalankan untuk pertama kali, inisialisasi repositori pada VPS:

1. **Clone Repositori**:
   ```bash
   git clone <URL_REPOSITORI> /opt/web-jhic
   cd /opt/web-jhic
   ```

2. **Konfigurasi Variabel Lingkungan Produksi**:
   ```bash
   cp .env.example .env
   ```
   Edit berkas `.env` dan isi nilai produksi:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `PUBLIC_SITE_URL=https://www.sekolah.sch.id`
   - Buat password acak URL-safe untuk `POSTGRES_SUPERUSER_PASSWORD` dan `APP_DB_PASSWORD`.

3. **Membangun dan Menjalankan Kontainer**:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

4. **Verifikasi Status Kontainer**:
   ```bash
   docker compose ps
   ```
   Pastikan layanan `postgres` dan `app` berstatus `healthy`.

---

## 5. Mekanisme Migrasi Basis Data Produksi

Setiap kali kontainer `app` dimulai ulang, skrip `docker-entrypoint.sh` secara otomatis mengeksekusi perintah:
```bash
npx prisma migrate deploy
```
Perintah ini menerapkan seluruh berkas migrasi SQL yang belum terpasang ke basis data produksi sebelum server Node.js menerima trafik pengguna.

Jika ingin melakukan eksekusi migrasi secara manual:
```bash
docker compose exec app npx prisma migrate deploy
```

---

## 6. Verifikasi & Pemeriksaan Kesehatan Sistem

Layanan Express menyediakan endpoint diagnostik:
- **Liveness probe**: `http://127.0.0.1:3000/api/health`
  Mengembalikan status 200 jika proses server aktif.
- **Readiness probe**: `http://127.0.0.1:3000/api/health/ready`
  Memvalidasi kesiapan koneksi basis data PostgreSQL sebelum menerima permintaan data dinamis.
