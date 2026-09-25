import type { MetadataRoute } from "next";
import { isPublicSiteLocked } from "@/lib/public-site";

// PUBLIC_SITE is a Worker var read at request time (src/lib/public-site.ts);
// a robots.txt baked at build time would not know whether it is locked.
export const dynamic = "force-dynamic";

/**
 * Locked (UAT, test): nothing on this host is for search engines — the
 * proxy's X-Robots-Tag says the same on every response. Open: everything,
 * which is what having no robots.txt meant before this file existed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: isPublicSiteLocked()
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
  };
}
