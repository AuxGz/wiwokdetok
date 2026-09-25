import { createDirectus, rest } from "@directus/sdk";
import { env } from "../config/env.js";

export const directus = createDirectus(env.DIRECTUS_URL).with(rest());
