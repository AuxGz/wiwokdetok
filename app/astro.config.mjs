import process from "node:process";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://smktelkom-pwt.sch.id",
  outDir: "./dist/astro",
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  integrations: [react()],
  // Proxy rute /api/* ke Express dev server saat menjalankan 'npm run dev' di lokal
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      noDiscovery: true,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
        },
      },
    },
  },
});
