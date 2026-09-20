import "server-only";
import { headers } from "next/headers";

/**
 * The absolute origin the current request arrived on, for metadata fields
 * that need fully qualified URLs (Open Graph images, canonical links).
 * Facebook's and LINE's scrapers won't resolve a relative og:image, so the
 * public pages pass this as `metadataBase`.
 *
 * Read from the request rather than configured: the same build serves
 * `next dev` on localhost, a phone on the home Wi-Fi by IP and the
 * workers.dev / custom domain on Cloudflare, and the Worker sees the real
 * host. NEXT_PUBLIC_SITE_URL overrides it if a deployment ever sits behind
 * a proxy that rewrites the host.
 */
export async function getSiteOrigin(): Promise<URL | null> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  return new URL(`${proto}://${host}`);
}
