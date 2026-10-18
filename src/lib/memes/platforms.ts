/**
 * The places a meme or a photo can be posted (social_shares.platform, 0223). Plain data, no imports: the
 * list page, the share form and the filter all read it, and the database's check constraint is the same five.
 */
export const PLATFORMS = ["facebook", "instagram", "line", "tiktok", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}
