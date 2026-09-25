#!/usr/bin/env bash
set -euo pipefail

echo "==> [PostgreSQL Init] Menginisialisasi role dan database..."

# Menggunakan psql variables agar quoting karakter khusus pada password aman
psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=cms_user="$CMS_DB_USER" \
  --set=cms_pass="$CMS_DB_PASSWORD" \
  --set=app_user="$APP_DB_USER" \
  --set=app_pass="$APP_DB_PASSWORD" <<-EOSQL
    CREATE ROLE :"cms_user" WITH LOGIN PASSWORD :'cms_pass';
    CREATE DATABASE cms_db OWNER :"cms_user";
    GRANT ALL PRIVILEGES ON DATABASE cms_db TO :"cms_user";

    CREATE ROLE :"app_user" WITH LOGIN PASSWORD :'app_pass';
    CREATE DATABASE app_db OWNER :"app_user";
    GRANT ALL PRIVILEGES ON DATABASE app_db TO :"app_user";
EOSQL

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "cms_db" \
  --set=cms_user="$CMS_DB_USER" <<-EOSQL
    GRANT ALL ON SCHEMA public TO :"cms_user";
EOSQL

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "app_db" \
  --set=app_user="$APP_DB_USER" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    GRANT ALL ON SCHEMA public TO :"app_user";
EOSQL

echo "==> [PostgreSQL Init] Inisialisasi database dan pgvector selesai."
