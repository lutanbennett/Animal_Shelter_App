import type { MetadataRoute } from "next";
import { isPlatformSearchOpen } from "./public-site";
import { PRODUCT_COOPER, PRODUCT_PAGES_EN, PRODUCT_PAGES_TH, productAlternates } from "./platform-features";

/**
 * The product pages a search engine may index (#cjseo, widened by #psubp): the home page and each feature page, English and its
 * Thai twin. #cjseo first settled "the product page is the only page under /platform"; that is now "only the product pages".
 * The rule it protects is unchanged: no console, no shelter listing and no sign-in page is ever indexable. The list is built
 * from src/lib/platform-features.ts, so a new product page is added in one place.
 */
export const PLATFORM_INDEXABLE = [...PRODUCT_PAGES_EN, ...PRODUCT_PAGES_TH];

/** robots.txt for the platform host. Closed (the default) forbids everything; open allows only the product page. */
export function platformRobots(origin: URL | null, open = isPlatformSearchOpen()): MetadataRoute.Robots {
  if (!open) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: ["/$", ...PLATFORM_INDEXABLE], disallow: "/" },
    ...(origin ? { sitemap: new URL("/sitemap.xml", origin).toString() } : {}),
  };
}

/** The platform host's sitemap: every product page in both languages and nothing from any shelter table. Empty while closed. */
export function platformSitemap(origin: URL | null, open = isPlatformSearchOpen(), cooperLive = true): MetadataRoute.Sitemap {
  if (!open || !origin) return [];
  const abs = (p: string) => new URL(p, origin).toString();
  // Cooper's page is listed only once it has content (#cpstr): a sitemap entry that answers not-found is worse than none.
  return PLATFORM_INDEXABLE.filter((p) => cooperLive || (p !== PRODUCT_COOPER && p !== `/th${PRODUCT_COOPER}`)).map((p) => {
    // Each page gets ITS OWN language links, not the home page's.
    const en = p.startsWith("/th/") ? p.slice(3) : p;
    const alt = productAlternates(en);
    return { url: abs(p), changeFrequency: "monthly" as const, priority: en === "/platform/about" ? 1 : 0.8, alternates: { languages: { en: abs(alt.en), th: abs(alt.th), "x-default": abs(alt.en) } } };
  });
}
