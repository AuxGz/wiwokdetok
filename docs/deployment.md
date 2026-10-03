# Panduan Deployment Produksi & CI/CD

Panduan ini mendokumentasikan proses deployment sistem website sekolah ke VPS berbasis Ubuntu (dengan panel Webuzo) serta konfigurasi pipeline CI/CD otomatis menggunakan GitHub Actions.

---

## 1. Arsitektur Ingress Produksi

```text
Pengguna / Peramban Publik
    ↓ (HTTP: Port 80 / HTTPS: Port 443)
Jagoan Hosting Ingress / NAT (101.50.1.15)
    ↓ (Port 80 / 443)
Webuzo Host Server (Apache 2.4 - Terminasi SSL Let's Encrypt via acme.sh)
    ↓ (HTTP 301 Redirect Port 80 -> Port 443, kecuali /.well-known/acme-challenge/)
    ↓ (HTTP Reverse Proxy: 127.0.0.1:3000)
Kontainer Docker: app (Port 3000)
    ↓ (Koneksi Internal Docker)
Kontainer Docker: postgres (Port 5432)
```

---

## 2. Konfigurasi Reverse Proxy Apache & SSL Let's Encrypt

Konfigurasi reverse proxy dan SSL ditangani oleh Apache bawaan Webuzo pada `/usr/local/apps/apache2/etc/conf.d/web-jhic-proxy.conf`:

```apache
# Reverse Proxy configuration for Web JHIC (Astro + Express)
<VirtualHost *:80>
    ServerName renovare.smktelkom-pwt.sch.id
    ServerAlias www.renovare.smktelkom-pwt.sch.id server.renovare.smktelkom-pwt.sch.id

    DocumentRoot /var/webuzo-data/www

    Alias /.well-known/acme-challenge/ /var/webuzo-data/www/.well-known/acme-challenge/
    <Directory /var/webuzo-data/www/.well-known/acme-challenge/>
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

    ProxyPreserveHost On
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>

<VirtualHost *:443>
    ServerName renovare.smktelkom-pwt.sch.id
    ServerAlias www.renovare.smktelkom-pwt.sch.id server.renovare.smktelkom-pwt.sch.id

    DocumentRoot /var/webuzo-data/www

    Alias /.well-known/acme-challenge/ /var/webuzo-data/www/.well-known/acme-challenge/
    <Directory /var/webuzo-data/www/.well-known/acme-challenge/>
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    SSLEngine on
    SSLCertificateFile /var/webuzo/certs/renovare/fullchain.pem
    SSLCertificateKeyFile /var/webuzo/certs/renovare/key.pem
    SSLUseStapling Off

    ProxyPreserveHost On
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

### Pembaruan Otomatis Sertifikat SSL (Auto Renewal)
Sertifikat dikelola oleh `acme.sh` dengan cron berkala di `/etc/cron.d/acme_sh`:
```text
30 2 * * * root bash /usr/local/webuzo/includes/cli/acme.sh --cron --home /root/.acme.sh > /dev/null 2>&1
```
Ketika sertifikat mendekati masa kadaluwarsa (60 hari), `acme.sh` akan memperbarui sertifikat dan memicu perintah graceful reload pada Apache (`apachectl graceful`).

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
