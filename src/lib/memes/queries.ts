import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { can, type Permissions } from "@/lib/permissions/can";
import { isPlatform, type Platform } from "./platforms";
import { isSourceKind, type SourceKind } from "./sources";

/**
 * The meme library's reads (memes, meme_residents, social_shares with owner_type 'meme': 0223). Every query runs as
 * the caller, so RLS answers with nothing for a login without social.library at Read; the pages still ask can()
 * first so a refusal is a sentence and not an empty grid. docs/decisions/2026-10-18-meme-library-app.md.
 */

export type MemeShare = {
  id: string;
  platform: Platform;
  shared_on: string;
  post_url: string | null;
  note: string | null;
};

export type MemeResident = { id: string; name: string; thai_name: string | null };

export type MemeSummary = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  title: string;
  caption_en: string | null;
  caption_th: string | null;
  tags: string[];
  archived: boolean;
  created_at: string;
  /** Where the photo came from (0228). Null: filed before sources were recorded, or made elsewhere. */
  source_kind: SourceKind | null;
  residents: MemeResident[];
  /** Distinct platforms this meme has been shared on, newest share first. Empty = not shared yet. */
  platforms: Platform[];
};

export type MemeDetail = MemeSummary & { shares: MemeShare[] };

type MemeRow = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  title: string;
  caption_en: string | null;
  caption_th: string | null;
  tags: string[] | null;
  archived: boolean;
  created_at: string;
  source_kind: string | null;
};

type LinkRow = { meme_id: string; resident_id: string; residents: MemeResident | MemeResident[] | null };
type ShareRow = { id: string; owner_id: string; platform: string; shared_on: string; post_url: string | null; note: string | null };

const MEME_COLUMNS = "id, drive_file_id, file_name, title, caption_en, caption_th, tags, archived, created_at, source_kind";

/** Whether this login may open the library at all (Read), and whether it may change it (Edit). */
export const canBrowseMemes = (perms: Permissions | null | undefined): boolean => can(perms, "social.library", "read");
export const canEditMemes = (perms: Permissions | null | undefined): boolean => can(perms, "social.library");

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** The residents and shares for a set of memes, in two queries, however many memes there are. */
async function attach(supabase: SupabaseClient, rows: MemeRow[]): Promise<MemeDetail[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: links }, { data: shares }] = await Promise.all([
    supabase
      .from("meme_residents")
      .select("meme_id, resident_id, residents(id, name, thai_name)")
      .in("meme_id", ids)
      .returns<LinkRow[]>(),
    supabase
      .from("social_shares")
      .select("id, owner_id, platform, shared_on, post_url, note")
      .eq("owner_type", "meme")
      .in("owner_id", ids)
      .order("shared_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<ShareRow[]>(),
  ]);
  const residentsOf = new Map<string, MemeResident[]>();
  for (const l of links ?? []) {
    const r = one(l.residents);
    // A resident this login cannot read (a doctor's scope) is left off rather than shown nameless.
    if (!r) continue;
    residentsOf.set(l.meme_id, [...(residentsOf.get(l.meme_id) ?? []), r]);
  }
  const sharesOf = new Map<string, MemeShare[]>();
  for (const s of shares ?? []) {
    if (!isPlatform(s.platform)) continue;
    sharesOf.set(s.owner_id, [...(sharesOf.get(s.owner_id) ?? []), { ...s, platform: s.platform }]);
  }
  return rows.map((r) => {
    const memeShares = sharesOf.get(r.id) ?? [];
    return {
      ...r,
      source_kind: isSourceKind(r.source_kind) ? r.source_kind : null,
      tags: r.tags ?? [],
      residents: (residentsOf.get(r.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      shares: memeShares,
      platforms: [...new Set(memeShares.map((s) => s.platform))],
    };
  });
}

/** Every meme that is not archived, newest first. Filtering happens in the page: the library is a few hundred at most. */
export async function loadMemes(supabase: SupabaseClient): Promise<{ memes: MemeDetail[]; error: string | null }> {
  const { data, error } = await supabase
    .from("memes")
    .select(MEME_COLUMNS)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .returns<MemeRow[]>();
  if (error) return { memes: [], error: error.message };
  return { memes: await attach(supabase, data ?? []), error: null };
}

/** One meme, archived or not (its page still opens, marked archived), or null when none or not readable. */
export async function loadMeme(supabase: SupabaseClient, id: string): Promise<MemeDetail | null> {
  const { data } = await supabase.from("memes").select(MEME_COLUMNS).eq("id", id).limit(1).returns<MemeRow[]>();
  const row = data?.[0];
  if (!row) return null;
  return (await attach(supabase, [row]))[0] ?? null;
}

/**
 * The memes featuring one resident, newest first, for the resident's page. Only for a login holding social.library at
 * Read: the page asks canBrowseMemes() before calling this, and RLS would answer nothing anyway.
 */
export async function loadResidentMemes(supabase: SupabaseClient, residentId: string): Promise<MemeSummary[]> {
  const { data: links } = await supabase
    .from("meme_residents")
    .select("meme_id")
    .eq("resident_id", residentId)
    .returns<{ meme_id: string }[]>();
  const ids = (links ?? []).map((l) => l.meme_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("memes")
    .select(MEME_COLUMNS)
    .in("id", ids)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .returns<MemeRow[]>();
  return attach(supabase, data ?? []);
}

/** Every tag in use on a non-archived meme, A to Z, for the filter and the tag suggestions. */
export function tagsInUse(memes: readonly MemeSummary[]): string[] {
  return [...new Set(memes.flatMap((m) => m.tags))].sort((a, b) => a.localeCompare(b));
}
