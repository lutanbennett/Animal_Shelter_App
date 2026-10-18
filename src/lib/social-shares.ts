/**
 * "Posted on social media" for a resident's photos (0223, `social_shares`):
 * the read the Photos gallery does and the shapes the app passes around.
 *
 * The table is shared with the meme library by design, so EVERY read here
 * pins `owner_type = 'attachment'`. A share belonging to a meme must never
 * make a photograph look posted: a photo that reads "Posted" is skipped by
 * whoever runs the shelter's social media, and nothing would ever error
 * (docs/decisions/2026-10-18-posted-on-social-app.md).
 *
 * Client-safe: plain data and types; the only import is a type.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const SOCIAL_PLATFORMS = ["facebook", "instagram", "line", "tiktok", "other"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

/** One post of one photo, as the gallery holds it. */
export type SocialShare = {
  id: string;
  owner_id: string;
  platform: SocialPlatform;
  shared_on: string;
  post_url: string | null;
  note: string | null;
};

/** The gallery's shares, keyed by attachment id, newest `shared_on` first within each. */
export type SharesByPhoto = Readonly<Record<string, readonly SocialShare[]>>;

export const SOCIAL_SHARES_SELECT = "id, owner_id, platform, shared_on, post_url, note";

/**
 * Groups the rows of one query by photo. Rows must already be ordered
 * newest first; a row whose platform the app does not know is dropped
 * rather than shown as something it is not.
 */
export function groupSharesByPhoto(rows: readonly (Omit<SocialShare, "platform"> & { platform: string })[]): SharesByPhoto {
  const out: Record<string, SocialShare[]> = {};
  for (const row of rows) {
    if (!isSocialPlatform(row.platform)) continue;
    (out[row.owner_id] ??= []).push({ ...row, platform: row.platform });
  }
  return out;
}

/** The distinct platforms a photo has been posted on, in SOCIAL_PLATFORMS order. */
export function platformsOf(shares: readonly SocialShare[] | undefined): SocialPlatform[] {
  const seen = new Set(shares?.map((s) => s.platform));
  return SOCIAL_PLATFORMS.filter((p) => seen.has(p));
}

/**
 * The gallery's one read of `social_shares` (0223): every post of the given
 * photos, newest first. `owner_type` is pinned to 'attachment' here and
 * nowhere else gets to query the table for photos — the table is shared
 * with the meme library, and a meme's share must never make a photograph
 * read as posted. Empty ids → an empty record without a round trip.
 */
export async function loadPhotoShares(
  supabase: SupabaseClient,
  attachmentIds: readonly string[],
): Promise<SharesByPhoto> {
  if (attachmentIds.length === 0) return {};
  const { data } = await supabase
    .from("social_shares")
    .select(SOCIAL_SHARES_SELECT)
    .eq("owner_type", "attachment")
    .in("owner_id", attachmentIds)
    .order("shared_on", { ascending: false })
    .order("created_at", { ascending: false });
  return groupSharesByPhoto((data ?? []) as (Omit<SocialShare, "platform"> & { platform: string })[]);
}
