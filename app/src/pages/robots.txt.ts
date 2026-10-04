import type { APIRoute } from "astro";
import { generateRobotsTxt, getCanonicalOrigin } from "../lib/seo";

export const GET: APIRoute = () => {
  const origin = getCanonicalOrigin();
  const text = generateRobotsTxt(origin);

  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
