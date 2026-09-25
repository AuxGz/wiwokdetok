import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApiApp } from "./api-app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createApp(): Promise<Express> {
  const app = express();

  // 1. Mount API Router terlebih dahulu (/api/*)
  app.use(createApiApp());

  // 2. Lokasi direktori artefak build Astro (dist/astro/)
  // Saat dikompilasi ke dist/node/server/app.js, path relatif ke dist/astro adalah ../../astro
  const astroRoot = path.resolve(__dirname, "../../astro");
  const clientDir = path.join(astroRoot, "client");
  const entryPath = path.join(astroRoot, "server", "entry.mjs");

  // Layani berkas aset statis Astro
  app.use(express.static(clientDir));

  // 3. Alirkan request halaman publik ke Astro SSR handler
  // FAIL-FAST: Jika entry.mjs tidak ditemukan atau rusak, import akan melempar error
  // dan menyebabkan createApp() gagal, sehingga kontainer tidak menyala dalam kondisi pincang.
  const { handler: astroHandler } = await import(pathToFileURL(entryPath).href);
  app.use(astroHandler);

  return app;
}
