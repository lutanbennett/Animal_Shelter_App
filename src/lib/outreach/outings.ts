import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Outreach visits: dogs the shelter helps without taking in (0169, the
 * Director's eight answers in docs/decisions/2026-10-09-community-dogs-unit.md).
 *
 * One note per visit. dog_count is "dogs helped at this visit", and the same
 * dog on a later visit counts again: there is no dog identity, so nothing here
 * ever counts distinct dogs, and no wording should suggest it does.
 */

export const PLACE_KINDS = ["temple", "village"] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];
export const isPlaceKind = (v: unknown): v is PlaceKind => PLACE_KINDS.includes(v as PlaceKind);

/** The five ticks, in the order the paper and the form list them. At least one is required. */
export const HELP_KINDS = ["fed", "treated", "sterilised", "vaccinated", "rehomed"] as const;
export type HelpKind = (typeof HELP_KINDS)[number];

export type CommunityPlace = { id: string; name: string; kind: PlaceKind };

export type Outing = {
  id: string;
  outing_on: string;
  place_id: string;
  dog_count: number;
  fed: boolean;
  treated: boolean;
  sterilised: boolean;
  sterilised_count: number | null;
  vaccinated: boolean;
  rehomed: boolean;
  note: string | null;
  community_places: { name: string; kind: PlaceKind } | null;
};

export type OutingPhoto = {
  id: string;
  outing_id: string;
  drive_file_id: string;
  file_name: string | null;
  is_public: boolean;
};

const OUTING_COLUMNS =
  "id, outing_on, place_id, dog_count, fed, treated, sterilised, sterilised_count, vaccinated, rehomed, note, community_places(name, kind)";

/** Live places, by name. An archived place keeps its notes but is not offered for new ones. */
export async function loadPlaces(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("community_places")
    .select("id, name, kind")
    .is("archived_at", null)
    .order("name")
    .returns<CommunityPlace[]>();
  return { places: data ?? [], error: error?.message ?? null };
}

/** Newest visit first. RLS (community.outings, Read) decides who gets rows at all. */
export async function loadOutings(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from("community_dog_outings")
    .select(OUTING_COLUMNS)
    .order("outing_on", { ascending: false })
    .order("recorded_at", { ascending: false })
    .limit(limit)
    .returns<Outing[]>();
  return { outings: data ?? [], error: error?.message ?? null };
}

export async function loadOuting(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from("community_dog_outings")
    .select(OUTING_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<Outing[]>();
  return data?.[0] ?? null;
}

export async function loadOutingPhotos(supabase: SupabaseClient, outingId: string) {
  const { data } = await supabase
    .from("community_outing_photos")
    .select("id, outing_id, drive_file_id, file_name, is_public")
    .eq("outing_id", outingId)
    .order("uploaded_at")
    .returns<OutingPhoto[]>();
  return data ?? [];
}

/** Which of the five ticks a note has, in form order. */
export function helpGiven(o: Pick<Outing, HelpKind>): HelpKind[] {
  return HELP_KINDS.filter((k) => o[k]);
}
