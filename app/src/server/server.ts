import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase } from "./lib/prisma.js";

async function bootstrap() {
  const app = await createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] Berjalan pada port ${env.PORT} (mode: ${env.NODE_ENV})`);
    console.log(`[server] URL Publik: ${env.PUBLIC_SITE_URL}`);
  });

  async function handleShutdown(signal: string) {
    console.log(`[server] Menerima sinyal ${signal}. Memulai shutdown anggun...`);

    server.close(async (err) => {
      if (err) {
        console.error("[server] Error saat menutup listener HTTP:", err);
      } else {
        console.log("[server] Listener HTTP berhasil ditutup.");
      }

      try {
        await closeDatabase();
        console.log("[server] Koneksi database dan pool driver berhasil ditutup.");
        process.exit(0);
      } catch (dbErr) {
        console.error("[server] Gagal menutup koneksi database:", dbErr);
        process.exit(1);
      }
    });

    // Batas waktu paksa jika shutdown terhambat
    setTimeout(() => {
      console.error("[server] Shutdown melebihi batas waktu (10 detik). Menghentikan paksa.");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("[server] Gagal menginisialisasi server:", err);
  process.exit(1);
});
