// File ini didepresiasi dan dipertahankan hanya sebagai fallback saat transisi ke Custom Admin
import { createDirectus, rest } from "@directus/sdk";
import { env } from "../config/env.js";

export const directus = env.DIRECTUS_URL
  ? createDirectus(env.DIRECTUS_URL).with(rest())
  : null;
