/**
 * The product site's pages (#psubp): the home page and one detail page per feature, English and Thai.
 * ONE list feeds every place that used to hard-code "/platform/about": the public-path lists and the Thai rewrite
 * (public-paths.ts), the platform host's keep-list (site-hosts.ts), and robots.txt and the sitemap (platform-seo.ts).
 * Add a page by adding its slug here and its words to the dictionaries; nothing else needs to know its address.
 * No imports on purpose: the proxy and the tests load this file.
 */
export const PRODUCT_HOME = "/platform/about";
export const PRODUCT_FEATURE_SLUGS = ["residents", "medical", "adoptions", "volunteers", "website", "money"] as const;
export type ProductFeatureSlug = (typeof PRODUCT_FEATURE_SLUGS)[number];

/** Cooper's page (#cpstr). Its words and photo are the product administrator's, typed in the console as page "cooper"; until the `heading` line exists the page answers not-found and the sitemap leaves it out. */
export const PRODUCT_COOPER = "/platform/cooper";
export const PRODUCT_COOPER_PAGE = "cooper";

export const productFeaturePath = (slug: string, th = false): string => `${th ? "/th" : ""}/platform/features/${slug}`;

/** Every English product page address, home first. */
export const PRODUCT_PAGES_EN: string[] = [PRODUCT_HOME, ...PRODUCT_FEATURE_SLUGS.map((s) => productFeaturePath(s)), PRODUCT_COOPER];
/** Every Thai product page address, home first. */
export const PRODUCT_PAGES_TH: string[] = PRODUCT_PAGES_EN.map((p) => `/th${p}`);

/** Whether `rest` (a path with any /th prefix already removed) is a product page. */
export function isProductPage(rest: string): boolean {
  return PRODUCT_PAGES_EN.includes(rest);
}

/** The Thai and English addresses of an English product page, for hreflang. */
export function productAlternates(en: string): { en: string; th: string } {
  return { en, th: `/th${en}` };
}
