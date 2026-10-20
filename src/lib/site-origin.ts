import "server-only";
import { headers } from "next/headers";
import { publicUrl, requestHost } from "@/lib/site-hosts";

/**
 * The absolute origin the current request arrived on, for metadata fields
 * that need fully qualified URLs (Open Graph images, canonical links) and
 * for sign-in return addresses. Facebook's and LINE's scrapers won't resolve
 * a relative og:image, so the public pages pass this as `metadataBase`.
 *
 * Read from the request rather than configured: the same build serves
 * `next dev` on localhost, a phone on the home Wi-Fi by IP and either
 * address in production, and the Worker sees the real host. Behind the Pi,
 * cloudflared overwrites Host and x-forwarded-host, so the Worker also sends
 * x-lanna-public-host (worker/origin.mjs), which wins (requestHost in
 * src/lib/site-hosts.ts). NEXT_PUBLIC_SITE_URL is only the fallback for a
 * request with no host at all.
 */
export async function getSiteOrigin(): Promise<URL | null> {
  const h = await headers();
  const host = requestHost((n) => h.get(n));
  if (!host) {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    return configured ? new URL(configured) : null;
  }
  // Keep the port `next dev` is on; requestHost strips it for comparison.
  const raw = h.get("x-lanna-public-host") ?? h.get("x-forwarded-host") ?? h.get("host") ?? host;
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  return new URL(`${proto}://${raw.split(",")[0].trim()}`);
}

/**
 * The public website's origin: PUBLIC_HOST when set, else wherever this
 * request arrived. For links a member of the public follows even when the
 * page that prints them is on the staff address (tag links, /r/ and /e/).
 */
export async function getPublicOrigin(): Promise<URL | null> {
  const configured = publicUrl("/");
  return configured ? new URL(configured) : getSiteOrigin();
}
