import { createApiApp } from "./api-app.js";
import { env } from "./config/env.js";

const app = createApiApp();

app.listen(env.PORT, () => {
  console.log(`[dev-server] Express API dev server berjalan pada http://127.0.0.1:${env.PORT}`);
  console.log(`[dev-server] Siap menerima request /api/* dari Astro dev proxy`);
});
