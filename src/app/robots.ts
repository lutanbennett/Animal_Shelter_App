import type { MetadataRoute } from "next";
import { isPublicSiteLocked } from "@/lib/public-site";
import { getSiteOrigin } from "@/lib/site-origin";

// PUBLIC_SITE is a Worker var read at request time (src/lib/public-site.ts);
// a robots.txt baked at build time would not know whether it is locked.
export const dynamic = "force-dynamic";

/**
 * Locked (UAT, test): nothing on this host is for search engines — the
 * proxy's X-Robots-Tag says the same on every response. Open: everything,
 * which is what having no robots.txt meant before this file existed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isPublicSiteLocked()) return { rules: { userAgent: "*", disallow: "/" } };
  // The sitemap's address follows the host asked, as every absolute URL on
  // the public site does (src/lib/site-origin.ts), so the domain move needs
  // no edit here.
  const origin = await getSiteOrigin();
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(origin ? { sitemap: new URL("/sitemap.xml", origin).toString() } : {}),
  };
}
