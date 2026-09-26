#!/bin/sh
set -e

echo "[entrypoint] Menjalankan migrasi basis data produksi (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Memulai aplikasi..."
exec "$@"
