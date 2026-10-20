import "server-only";
import { getPublicOrigin } from "@/lib/site-origin";

/**
 * The origin to print in front of a tag path: the public website's address
 * (PUBLIC_HOST), because /r/ and /e/ are served from there — a card is
 * printed once and the staff address is the one expected to move
 * (docs/decisions/2026-10-20-two-addresses-from-settings.md). With no
 * PUBLIC_HOST set it is the host the request arrived on, so a link copied
 * on a LAN address still reads as that address. Null only when neither is
 * known; CopyTagLink then falls back to the browser's own origin.
 */
export async function getTagOrigin(): Promise<string | null> {
  return (await getPublicOrigin())?.origin ?? null;
}
