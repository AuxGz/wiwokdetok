# Panduan Deployment Produksi (NAT VPS Jagoan Hosting & Webuzo)

Panduan deployment sistem website sekolah ke VPS Jagoan Hosting berbasis Ubuntu dengan panel Webuzo dan integrasi Cloudflare.

---

## 1. Arsitektur Ingress Produksi

```text
Internet / Browser Publik
    ↓ (HTTPS: 443)
Cloudflare (SSL/TLS: Full (Strict) + Origin CA Certificate)
    ↓ (HTTPS Origin: 443)
Jagoan Hosting Domain Forward (NAT Upstream)
    ↓ (Port 443)
Webuzo Host Web Server (Terminasi SSL via Cloudflare Origin CA)
    ↓ (HTTP Reverse Proxy: 127.0.0.1:3000)
Docker Container: app (Port 3000)
```

---

## 2. Konfigurasi Webuzo Host

1. Buat Domain / Virtual Host di Webuzo untuk domain sekolah (contoh: `www.sekolah.sch.id`).
2. Pasang **Cloudflare Origin CA Certificate** dan Private Key di menu SSL Webuzo.
3. Konfigurasikan Webuzo Reverse Proxy agar meneruskan seluruh permintaan ke loopback host:
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

## 3. Deployment Docker Compose

1. Clone repositori ke VPS:
   ```bash
   git clone <URL_REPOSITORI> /home/<USER>/web-sekolah
   cd /home/<USER>/web-sekolah
   ```

2. Buat berkas konfigurasi `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Sesuaikan variabel lingkungan produksi di `.env`:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `PUBLIC_SITE_URL=https://www.sekolah.sch.id`
   - Buat password acak URL-safe untuk `POSTGRES_SUPERUSER_PASSWORD`, `APP_DB_PASSWORD`, dan `CMS_DB_PASSWORD`.
   - `DIRECTUS_ADMIN_EMAIL` & `DIRECTUS_ADMIN_PASSWORD`: Kredensial admin CMS.
   - `DIRECTUS_PUBLIC_URL`: Sesuaikan dengan mode akses (lihat bagian 4).

4. Build citra dan jalankan kontainer:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

5. Periksa status ketiga kontainer:
   ```bash
   docker compose ps
   ```
   Pastikan seluruh service berstatus `healthy`:
   - `app`: healthy
   - `directus`: healthy
   - `postgres`: healthy

---

## 4. Akses Administrator Directus CMS di Produksi

Port Directus (`8055`) terikat pada loopback host (`127.0.0.1:8055`) demi keamanan.

### Mode A: Akses Melalui SSH Tunnel NAT-Aware (Sangat Direkomendasikan)
Karena VPS Jagoan Hosting menggunakan NAT upstream, port SSH dialihkan ke port publik tertentu. Jalankan perintah ini di komputer administrator:
```bash
ssh -L 8055:127.0.0.1:8055 -p <FORWARDED_SSH_PORT> <USER>@<SSH_HOST>
```
Lalu buka peramban lokal di:
```text
http://localhost:8055
```
Pada mode ini:
`DIRECTUS_PUBLIC_URL=http://localhost:8055`

### Mode B: Subdomain Khusus (Contoh: `cms.sekolah.sch.id`)
Jika admin ingin mengakses CMS melalui browser tanpa SSH tunnel:
1. Buat subdomain di Webuzo yang memproksi `https://cms.sekolah.sch.id` ke `http://127.0.0.1:8055`.
2. Lindungi subdomain tersebut menggunakan **Cloudflare Zero Trust / Access**.
3. Setel di `.env`:
   `DIRECTUS_PUBLIC_URL=https://cms.sekolah.sch.id`
