import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";

export default defineConfig({
  outDir: "./dist/astro",
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  integrations: [react()],
  // Proxy rute /api/* ke Express dev server saat menjalankan 'npm run dev' di lokal
  vite: {
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
