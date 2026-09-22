import "server-only";
import { getSiteOrigin } from "@/lib/site-origin";

/**
 * The origin to print in front of a tag path: the real host behind
 * Cloudflare, or NEXT_PUBLIC_SITE_URL when set, so a link copied on
 * lannacare.org reads https://lannacare.org/… and never a LAN address.
 * Null only when the request carried no Host header at all; CopyTagLink
 * then falls back to the browser's own origin.
 */
export async function getTagOrigin(): Promise<string | null> {
  return (await getSiteOrigin())?.origin ?? null;
}
