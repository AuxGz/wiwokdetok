import { describe, it, expect } from "vitest";
import {
  getCanonicalOrigin,
  getCanonicalUrl,
  getSocialImageUrl,
  getSchoolSchema,
  getWebSiteSchema,
  getBreadcrumbSchema,
  generateSitemapXml,
  generateRobotsTxt,
  PUBLIC_INDEXABLE_ROUTES,
} from "../src/lib/seo.js";

describe("Technical SEO & Metadata Tests", () => {
  it("determines canonical origin without trailing slashes", () => {
    const origin = getCanonicalOrigin();
    expect(origin).toBeDefined();
    expect(origin.startsWith("http")).toBe(true);
    expect(origin.endsWith("/")).toBe(false);
  });

  it("normalizes canonical URLs correctly, removing query strings and trailing slashes", () => {
    const origin = getCanonicalOrigin();
    expect(getCanonicalUrl("/")).toBe(`${origin}/`);
    expect(getCanonicalUrl("/jurusan")).toBe(`${origin}/jurusan`);
    expect(getCanonicalUrl("/jurusan/")).toBe(`${origin}/jurusan`);
    expect(getCanonicalUrl("/jurusan?page=2&utm_source=google")).toBe(`${origin}/jurusan`);
    expect(getCanonicalUrl("/berita#headline")).toBe(`${origin}/berita`);
  });

  it("produces valid absolute social image URLs", () => {
    const origin = getCanonicalOrigin();
    const defaultImage = getSocialImageUrl();
    expect(defaultImage).toBe(`${origin}/images/brand/gedung-sekolah.png`);

    const customImage = getSocialImageUrl("/images/berita/sample.jpg");
    expect(customImage).toBe(`${origin}/images/berita/sample.jpg`);

    const absoluteExternal = getSocialImageUrl("https://cdn.example.com/photo.png");
    expect(absoluteExternal).toBe("https://cdn.example.com/photo.png");
  });

  it("generates Schema.org School JSON-LD with verified factual data", () => {
    const origin = getCanonicalOrigin();
    const schema = getSchoolSchema(origin);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("School");
    expect(schema.name).toBe("SMK Telkom Purwokerto");
    expect(schema.url).toBe(origin);
    expect(schema.telephone).toBe("+62-812-2970-1800");
    expect(schema.email).toBe("office@smktelkom-pwt.sch.id");
    expect(schema.address["@type"]).toBe("PostalAddress");
    expect(schema.address.streetAddress).toBe("Jl. D.I. Panjaitan No. 128");
    expect(schema.address.addressCountry).toBe("ID");
    expect(schema.sameAs.length).toBeGreaterThan(0);
  });

  it("generates Schema.org WebSite JSON-LD", () => {
    const origin = getCanonicalOrigin();
    const schema = getWebSiteSchema(origin);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.url).toBe(origin);
    expect(schema.name).toBe("SMK Telkom Purwokerto");
  });

  it("generates BreadcrumbList for subpages and null for root", () => {
    const origin = getCanonicalOrigin();
    const rootBreadcrumb = getBreadcrumbSchema(origin, "Beranda", "/");
    expect(rootBreadcrumb).toBeNull();

    const subBreadcrumb = getBreadcrumbSchema(origin, "Program Keahlian", "/jurusan");
    expect(subBreadcrumb).not.toBeNull();
    expect(subBreadcrumb!["@type"]).toBe("BreadcrumbList");
    expect(subBreadcrumb!.itemListElement.length).toBe(2);
    expect(subBreadcrumb!.itemListElement[0].name).toBe("Beranda");
    expect(subBreadcrumb!.itemListElement[1].name).toBe("Program Keahlian");
    expect(subBreadcrumb!.itemListElement[1].item).toBe(`${origin}/jurusan`);
  });

  it("generates valid sitemap XML with UTF-8 encoding and absolute URLs", () => {
    const origin = getCanonicalOrigin();
    const xml = generateSitemapXml(origin, PUBLIC_INDEXABLE_ROUTES);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(`<loc>${origin}/</loc>`);
    expect(xml).toContain(`<loc>${origin}/jurusan</loc>`);
    expect(xml).toContain(`<loc>${origin}/berita</loc>`);
    expect(xml).toContain(`<loc>${origin}/pkl-matching</loc>`);
    expect(xml).toContain(`<loc>${origin}/cv-generator</loc>`);

    // Pastikan rute internal/admin tidak bocor ke dalam sitemap
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/api");
    expect(xml).not.toContain("/404");
  });

  it("generates robots.txt with safe crawler rules and sitemap reference", () => {
    const origin = getCanonicalOrigin();
    const robots = generateRobotsTxt(origin);

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });

  it("inventory only contains indexable public routes", () => {
    const paths = PUBLIC_INDEXABLE_ROUTES.map((r) => r.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/profile-sekolah");
    expect(paths).toContain("/jurusan");
    expect(paths).toContain("/fasilitas");
    expect(paths).toContain("/berita");
    expect(paths).not.toContain("/admin");
    expect(paths).not.toContain("/404");
  });
});
