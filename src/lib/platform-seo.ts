import type { MetadataRoute } from "next";
import { isPlatformSearchOpen } from "./public-site.ts";

/** The product pages a search engine may index: English and its Thai twin (#cjseo). Nothing else on the platform host. */
export const PLATFORM_INDEXABLE = ["/platform/about", "/th/platform/about"];

/** robots.txt for the platform host. Closed (the default) forbids everything; open allows only the product page. */
export function platformRobots(origin: URL | null, open = isPlatformSearchOpen()): MetadataRoute.Robots {
  if (!open) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: ["/$", ...PLATFORM_INDEXABLE], disallow: "/" },
    ...(origin ? { sitemap: new URL("/sitemap.xml", origin).toString() } : {}),
  };
}

/** The platform host's sitemap: the product page in both languages and nothing from any shelter table. Empty while closed. */
export function platformSitemap(origin: URL | null, open = isPlatformSearchOpen()): MetadataRoute.Sitemap {
  if (!open || !origin) return [];
  const abs = (p: string) => new URL(p, origin).toString();
  const alternates = { languages: { en: abs("/platform/about"), th: abs("/th/platform/about"), "x-default": abs("/platform/about") } };
  return PLATFORM_INDEXABLE.map((p) => ({ url: abs(p), changeFrequency: "monthly" as const, priority: 1, alternates }));
}
