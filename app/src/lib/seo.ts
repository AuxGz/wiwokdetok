/**
 * Core SEO & Discoverability Utilities
 * SMK Telkom Purwokerto (Web JHIC)
 *
 * Single source of truth for canonical URLs, metadata normalization,
 * route indexability inventory, and JSON-LD structured data generation.
 */

export interface PublicRouteConfig {
  path: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  title: string;
  lastmod?: string;
}

/**
 * Daftar seluruh rute publik yang valid dan dapat diindeks oleh mesin pencari.
 * Sumber kebenaran tunggal untuk sitemap.xml, canonical verification, dan audit SEO.
 */
export const PUBLIC_INDEXABLE_ROUTES: PublicRouteConfig[] = [
  { path: "/", changefreq: "daily", priority: 1.0, title: "Beranda" },
  { path: "/profile-sekolah", changefreq: "monthly", priority: 0.8, title: "Profil Sekolah" },
  { path: "/profile-guru", changefreq: "monthly", priority: 0.8, title: "Guru & Pimpinan" },
  { path: "/jurusan", changefreq: "monthly", priority: 0.9, title: "Program Keahlian" },
  { path: "/fasilitas", changefreq: "monthly", priority: 0.8, title: "Fasilitas & Lab 3D" },
  { path: "/ekstrakurikuler", changefreq: "monthly", priority: 0.7, title: "Ekstrakurikuler" },
  { path: "/prestasi", changefreq: "weekly", priority: 0.8, title: "Prestasi Siswa" },
  { path: "/berita", changefreq: "daily", priority: 0.8, title: "Berita & Agenda" },
  { path: "/pkl-matching", changefreq: "weekly", priority: 0.9, title: "AI PKL Matching" },
  { path: "/cv-generator", changefreq: "monthly", priority: 0.8, title: "CV Generator" },
];

/**
 * Mendapatkan origin situs kanonikal tunggal dari environment.
 * Menghindari duplikasi source of truth.
 */
export function getCanonicalOrigin(): string {
  const envUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  // Default canonical production URL resmi SMK Telkom Purwokerto
  return "https://smktelkom-pwt.sch.id";
}

/**
 * Membuat canonical URL absolut yang bersih dan konsisten.
 * - Menjamin awalan slash
 * - Menghilangkan trailing slash (kecuali untuk root '/')
 * - Menghapus query parameters dan hash fragments
 */
export function getCanonicalUrl(pathname: string = "/"): string {
  const origin = getCanonicalOrigin();
  
  // Pisahkan query atau hash jika ada
  const cleanPathname = pathname.split(/[?#]/)[0] || "/";
  
  // Normalisasi slash ganda dan pastikan format konsisten
  let normalized = cleanPathname.replace(/\/+/g, "/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  
  // Hapus trailing slash kecuali root '/'
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  
  return `${origin}${normalized}`;
}

/**
 * Mendapatkan URL absolut untuk berkas gambar media sosial (Open Graph & Twitter).
 */
export function getSocialImageUrl(imagePath?: string): string {
  const origin = getCanonicalOrigin();
  const defaultImage = "/images/brand/gedung-sekolah.png";
  const path = imagePath && imagePath.trim() ? imagePath.trim() : defaultImage;
  
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

/**
 * Menghasilkan Structured Data JSON-LD bertipe School / EducationalOrganization
 * berbasis fakta yang terverifikasi di dalam repositori sekolah.
 */
export function getSchoolSchema(siteOrigin: string = getCanonicalOrigin()) {
  return {
    "@context": "https://schema.org",
    "@type": "School",
    "@id": `${siteOrigin}/#organization`,
    name: "SMK Telkom Purwokerto",
    alternateName: ["Stematel Purwokerto", "Telkom Schools Purwokerto"],
    url: siteOrigin,
    logo: `${siteOrigin}/images/brand/logo-telkom-schools.png`,
    image: `${siteOrigin}/images/brand/gedung-sekolah.png`,
    description: "Sekolah Menengah Kejuruan Berbasis Teknologi dan Industri Digital di Bawah Naungan Yayasan Pendidikan Telkom.",
    telephone: "+62-812-2970-1800",
    email: "office@smktelkom-pwt.sch.id",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. D.I. Panjaitan No. 128",
      addressLocality: "Purwokerto Selatan",
      addressRegion: "Jawa Tengah",
      postalCode: "53147",
      addressCountry: "ID",
    },
    sameAs: [
      "https://www.instagram.com/smktelkompurwokerto/",
      "https://www.facebook.com/smktelkompurwokerto/",
      "https://www.youtube.com/@smktelkompurwokerto",
      "https://www.tiktok.com/@smktelkompurwokerto",
    ],
  };
}

/**
 * Menghasilkan Structured Data JSON-LD bertipe WebSite.
 */
export function getWebSiteSchema(siteOrigin: string = getCanonicalOrigin()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteOrigin}/#website`,
    url: siteOrigin,
    name: "SMK Telkom Purwokerto",
    description: "Portal Resmi SMK Telkom Purwokerto",
    inLanguage: "id-ID",
    publisher: {
      "@id": `${siteOrigin}/#organization`,
    },
  };
}

/**
 * Menghasilkan Structured Data JSON-LD bertipe BreadcrumbList untuk halaman sub-rute.
 */
export function getBreadcrumbSchema(siteOrigin: string, pageTitle: string, pathname: string) {
  const cleanPath = pathname.split(/[?#]/)[0] || "/";
  if (cleanPath === "/" || !cleanPath) {
    return null;
  }

  const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const canonicalUrl = `${siteOrigin}${normalized.replace(/\/+$/, "")}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Beranda",
        "item": `${siteOrigin}/`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": pageTitle,
        "item": canonicalUrl,
      },
    ],
  };
}

/**
 * Menghasilkan string dokumen XML sitemap standar UTF-8.
 */
export function generateSitemapXml(
  siteOrigin: string = getCanonicalOrigin(),
  routes: PublicRouteConfig[] = PUBLIC_INDEXABLE_ROUTES
): string {
  const currentDate = new Date().toISOString().split("T")[0];

  const urlsXml = routes
    .map((r) => {
      const loc = r.path === "/" ? `${siteOrigin}/` : `${siteOrigin}${r.path}`;
      const lastmod = r.lastmod || currentDate;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

/**
 * Menghasilkan isi robots.txt yang ramah perayap (*crawler-safe*).
 */
export function generateRobotsTxt(siteOrigin: string = getCanonicalOrigin()): string {
  return `# robots.txt for SMK Telkom Purwokerto
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

# AI Search Engine Crawlers
User-agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

User-agent: ChatGPT-User
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

# Sitemap index
Sitemap: ${siteOrigin}/sitemap.xml
`;
}
