import express, { type Express, type Response } from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApiApp } from "./api-app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createApp(): Promise<Express> {
  const app = express();

  // Konfigurasi trust proxy untuk topologi Webuzo/Nginx reverse proxy (1 hop di depan kontainer)
  app.set("trust proxy", 1);

  // Kompresi HTTP gzip/deflate untuk performa tinggi k6 & efisiensi bandwidth
  app.use(compression());

  // 1. Mount API Router terlebih dahulu (/api/*)
  app.use(createApiApp());

  // 2. Lokasi direktori artefak build Astro (dist/astro/)
  // Saat dikompilasi ke dist/node/server/app.js, path relatif ke dist/astro adalah ../../astro
  const astroRoot = path.resolve(__dirname, "../../astro");
  const clientDir = path.join(astroRoot, "client");
  const entryPath = path.join(astroRoot, "server", "entry.mjs");

  // Layani berkas aset statis Astro dengan header caching optimal
  app.use(
    express.static(clientDir, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res: Response, filePath: string) => {
        const normalizedPath = filePath.replace(/\\/g, "/");
        if (normalizedPath.includes("/_astro/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(jpg|jpeg|png|webp|svg|gif|avif|ico)$/i.test(normalizedPath)) {
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      },
    })
  );

  // 3. Alirkan request halaman publik ke Astro SSR handler
  // FAIL-FAST: Jika entry.mjs tidak ditemukan atau rusak, import akan melempar error
  // dan menyebabkan createApp() gagal, sehingga kontainer tidak menyala dalam kondisi pincang.
  const { handler: astroHandler } = await import(pathToFileURL(entryPath).href);
  app.use(astroHandler);

  return app;
}
