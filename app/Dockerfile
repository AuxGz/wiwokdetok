# Stage 1: Build & Kompilasi
FROM node:24-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# package-lock.json WAJIB ada di repositori untuk instalasi deterministik & reproduktif
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Dummy DATABASE_URL agar prisma generate bisa mengevaluasi prisma.config.ts tanpa DB aktif saat build
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/app_db"
# npm run build secara otomatis mengeksekusi prisma:generate, build:astro, dan build:server
RUN npm run build

# Stage 2: Runtime Produksi
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Hanya memasang openssl yang dibutuhkan engine Prisma; curl tidak dipasang karena healthcheck menggunakan fetch() bawaan Node.js
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Salin direktori dist/ yang memuat hasil build server (dist/node) dan astro (dist/astro)
COPY --from=builder /app/dist ./dist

# Salin skema, konfigurasi prisma, dan berkas migrasi untuk prisma migrate deploy
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Image produksi mandiri: TIDAK memerlukan kode sumber, node_modules dev lokal, ataupun berkas .env
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/node/server/server.js"]
