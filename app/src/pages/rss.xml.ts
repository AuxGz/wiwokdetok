import type { APIRoute } from "astro";
import { getCanonicalOrigin } from "../lib/seo";

export const GET: APIRoute = async () => {
  const origin = getCanonicalOrigin();
  let articles: Array<{ title: string; excerpt?: string | null; slug?: string | null; createdAt?: Date | string }> = [];

  try {
    const { prisma } = await import("../server/lib/prisma.js");
    const dbArticles = await prisma.newsArticle.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (dbArticles && dbArticles.length > 0) {
      articles = dbArticles;
    }
  } catch {
    // Fallback data berita jika DB offline
  }

  const itemsXml = articles
    .map((item) => {
      const pubDate = item.createdAt ? new Date(item.createdAt).toUTCString() : new Date().toUTCString();
      const link = `${origin}/berita`;
      const title = item.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const desc = (item.excerpt || item.title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}#${encodeURIComponent(item.title)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Berita &amp; Agenda — SMK Telkom Purwokerto</title>
    <link>${origin}/berita</link>
    <description>Kabar terkini seputar kegiatan, prestasi, dan pengumuman resmi civitas akademika SMK Telkom Purwokerto.</description>
    <language>id-ID</language>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
