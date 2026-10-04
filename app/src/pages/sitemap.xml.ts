import type { APIRoute } from "astro";
import { generateSitemapXml, getCanonicalOrigin, PUBLIC_INDEXABLE_ROUTES } from "../lib/seo";

export const GET: APIRoute = () => {
  const origin = getCanonicalOrigin();
  const xml = generateSitemapXml(origin, PUBLIC_INDEXABLE_ROUTES);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
