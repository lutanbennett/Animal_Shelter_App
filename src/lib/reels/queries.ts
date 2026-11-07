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
  /** Tags on this reel whose animal this login may not name (reel_resident_tags, 0330): counted, never named. */
  unnamedCount: number;
  /** Distinct platforms this reel has been posted on. Empty = not posted yet. */
  platforms: Platform[];
};

export type ReelDetail = ReelSummary & { shares: ReelShare[] };

type ReelRow = Omit<ReelSummary, "tags" | "residents" | "unnamedCount" | "platforms"> & { tags: string[] | null };
type TagRow = { reel_id: string; resident_id: string | null; name: string | null; thai_name: string | null; named: boolean };
type ShareRow = { id: string; owner_id: string; platform: string; shared_on: string; post_url: string | null; note: string | null };

const REEL_COLUMNS = "id, drive_file_id, file_name, description, tags, duration_ms, date_taken, archived, created_at";

/** Whether this login may open the library (Read) and whether it may change it (Edit): the activity every policy asks. */
export const canBrowseReels = (perms: Permissions | null | undefined): boolean => can(perms, "social.library", "read");
export const canEditReels = (perms: Permissions | null | undefined): boolean => can(perms, "social.library");

async function attach(supabase: SupabaseClient, rows: ReelRow[]): Promise<ReelDetail[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: links }, { data: shares }] = await Promise.all([
    supabase.rpc("reel_resident_tags", { p_reel_ids: ids }),
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
  const unnamedOf = new Map<string, number>();
  for (const l of (links ?? []) as TagRow[]) {
    if (l.named && l.resident_id && l.name) {
      residentsOf.set(l.reel_id, [...(residentsOf.get(l.reel_id) ?? []), { id: l.resident_id, name: l.name, thai_name: l.thai_name }]);
    } else {
      // A tag this login may not name is counted, not dropped: absence and "may not look" must read differently.
      unnamedOf.set(l.reel_id, (unnamedOf.get(l.reel_id) ?? 0) + 1);
    }
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
      unnamedCount: unnamedOf.get(r.id) ?? 0,
      shares: reelShares,
      platforms: [...new Set(reelShares.map((s) => s.platform))],
    };
  });
}

/**
 * The reels featuring one resident, newest date taken first, for the resident's page. Only for a login holding social.library at
 * Read: the page asks canBrowseReels() before calling this, and RLS would answer nothing anyway (reel_residents_select_perm).
 * Shaped like loadResidentMemes in src/lib/memes/queries.ts.
 */
export async function loadResidentReels(supabase: SupabaseClient, residentId: string): Promise<ReelSummary[]> {
  const { data: links } = await supabase.from("reel_residents").select("reel_id").eq("resident_id", residentId).returns<{ reel_id: string }[]>();
  const ids = (links ?? []).map((l) => l.reel_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("reels")
    .select(REEL_COLUMNS)
    .in("id", ids)
    .eq("archived", false)
    .order("date_taken", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ReelRow[]>();
  return attach(supabase, data ?? []);
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
