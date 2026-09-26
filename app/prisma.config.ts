import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Memuat .env dari root repositori saat CLI prisma dijalankan dari direktori 'app/' ('cd app && npx prisma ...')
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const shadowUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
    ...(shadowUrl ? { shadowDatabaseUrl: shadowUrl } : {}),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
