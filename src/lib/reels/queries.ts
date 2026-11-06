import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { can, type Permissions } from "@/lib/permissions/can";
import { isPlatform, type Platform } from "@/lib/memes/platforms";

/**
 * The reels library's reads (reels, reel_residents, social_shares with owner_type 'reel': 0322). Every query runs as
 * the caller, so RLS answers with nothing for a login without social.library at Read; the pages still ask can() first
 * so a refusal is a sentence and not an empty grid. Shaped like src/lib/memes/queries.ts on purpose.
 * docs/decisions/2026-11-06-reels-app.md.
 */

export type ReelShare = { id: string; platform: Platform; shared_on: string; post_url: string | null; note: string | null };
export type ReelResident = { id: string; name: string; thai_name: string | null };

export type ReelSummary = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  description: string;
  tags: string[];
  duration_ms: number | null;
  date_taken: string;
  archived: boolean;
  created_at: string;
  residents: ReelResident[];
  /** Distinct platforms this reel has been posted on. Empty = not posted yet. */
  platforms: Platform[];
};

export type ReelDetail = ReelSummary & { shares: ReelShare[] };

type ReelRow = Omit<ReelSummary, "tags" | "residents" | "platforms"> & { tags: string[] | null };
type LinkRow = { reel_id: string; resident_id: string; residents: ReelResident | ReelResident[] | null };
type ShareRow = { id: string; owner_id: string; platform: string; shared_on: string; post_url: string | null; note: string | null };

const REEL_COLUMNS = "id, drive_file_id, file_name, description, tags, duration_ms, date_taken, archived, created_at";

/** Whether this login may open the library (Read) and whether it may change it (Edit): the activity every policy asks. */
export const canBrowseReels = (perms: Permissions | null | undefined): boolean => can(perms, "social.library", "read");
export const canEditReels = (perms: Permissions | null | undefined): boolean => can(perms, "social.library");

const one = <T,>(value: T | T[] | null): T | null => (Array.isArray(value) ? (value[0] ?? null) : value);

async function attach(supabase: SupabaseClient, rows: ReelRow[]): Promise<ReelDetail[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: links }, { data: shares }] = await Promise.all([
    supabase.from("reel_residents").select("reel_id, resident_id, residents(id, name, thai_name)").in("reel_id", ids).returns<LinkRow[]>(),
    supabase
      .from("social_shares")
      .select("id, owner_id, platform, shared_on, post_url, note")
      .eq("owner_type", "reel")
      .in("owner_id", ids)
      .order("shared_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<ShareRow[]>(),
  ]);
  const residentsOf = new Map<string, ReelResident[]>();
  for (const l of links ?? []) {
    const r = one(l.residents);
    // A resident this login cannot read is left off rather than shown nameless.
    if (r) residentsOf.set(l.reel_id, [...(residentsOf.get(l.reel_id) ?? []), r]);
  }
  const sharesOf = new Map<string, ReelShare[]>();
  for (const s of shares ?? []) {
    if (isPlatform(s.platform)) sharesOf.set(s.owner_id, [...(sharesOf.get(s.owner_id) ?? []), { ...s, platform: s.platform }]);
  }
  return rows.map((r) => {
    const reelShares = sharesOf.get(r.id) ?? [];
    return {
      ...r,
      tags: r.tags ?? [],
      residents: (residentsOf.get(r.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      shares: reelShares,
      platforms: [...new Set(reelShares.map((s) => s.platform))],
    };
  });
}

/** Every reel that is not archived, newest date taken first. Filtering happens in the page: the library is small. */
export async function loadReels(supabase: SupabaseClient): Promise<{ reels: ReelDetail[]; error: string | null }> {
  const { data, error } = await supabase
    .from("reels")
    .select(REEL_COLUMNS)
    .eq("archived", false)
    .order("date_taken", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ReelRow[]>();
  if (error) return { reels: [], error: error.message };
  return { reels: await attach(supabase, data ?? []), error: null };
}

/** One reel, archived or not (its page still opens, marked archived), or null when none or not readable. */
export async function loadReel(supabase: SupabaseClient, id: string): Promise<ReelDetail | null> {
  const { data } = await supabase.from("reels").select(REEL_COLUMNS).eq("id", id).limit(1).returns<ReelRow[]>();
  const row = data?.[0];
  return row ? ((await attach(supabase, [row]))[0] ?? null) : null;
}

/** Every free hashtag in use on a non-archived reel, A to Z, for the filter. */
export function reelTagsInUse(reels: readonly ReelSummary[]): string[] {
  return [...new Set(reels.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b));
}
