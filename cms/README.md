# Directus Headless CMS

Direktori ini digunakan untuk pengelolaan konfigurasi dan ekstensi Directus 12.4.1.

## Pemisahan Database

Directus secara eksklusif mengelola database `cms_db` dengan pengguna `directus_user`. Directus **tidak memiliki akses** ke `app_db`, dan backend Express tidak melakukan query langsung terhadap tabel internal Directus. Komunikasi konten dilakukan murni melalui Directus REST API atau Directus TypeScript SDK (`@directus/sdk`).

## Ekspor Snapshot Skema

Untuk menyimpan perubahan skema (koleksi, field, relasi, perizinan) ke dalam repositori:
```bash
docker compose exec directus npx directus schema snapshot ./snapshot.yaml
```

Untuk menerapkan snapshot ke lingkungan baru:
```bash
docker compose exec directus npx directus schema apply ./snapshot.yaml
```

## Akses Administrator

Akses panel admin Directus di lingkungan produksi diisolasi melalui SSH Tunnel NAT-aware:
```bash
ssh -L 8055:127.0.0.1:8055 -p <FORWARDED_SSH_PORT> <USER>@<SSH_HOST>
```
Lalu buka peramban di `http://localhost:8055`.
