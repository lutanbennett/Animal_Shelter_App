import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Success stories for strangers (0214). Reads ONLY public_adoption_updates:
 * the animal, the photo, the words an adopter agreed to publish and at most a
 * first name. The staff-only note, the sender and every date stay out of
 * reach. Do not query adoption_updates from a public route, and do not add
 * a column to the view to make a template easier
 * (docs/decisions/2026-10-16-public-adoption-updates-columns.md).
 */
export type PublicStory = {
  id: string;
  residentId: string;
  /** From public_resident_cards; the view itself carries no name. */
  name: string;
  species: string | null;
  story: string | null;
  firstName: string | null;
  photoIds: string[];
};

type ViewRow = {
  id: string;
  resident_id: string;
  drive_file_id: string;
  public_story: string | null;
  public_first_name: string | null;
};

const VIEW_COLUMNS = "id, resident_id, drive_file_id, public_story, public_first_name";

/** The view has a row per photo; fold them into one story per update, in the view's order (newest first). */
export function foldStories(
  rows: ViewRow[],
  cards: Map<string, { name: string; species: string | null }>,
): PublicStory[] {
  const byId = new Map<string, PublicStory>();
  for (const r of rows) {
    const card = cards.get(r.resident_id);
    if (!card) continue;
    const have = byId.get(r.id);
    if (have) {
      if (!have.photoIds.includes(r.drive_file_id)) have.photoIds.push(r.drive_file_id);
    } else {
      byId.set(r.id, {
        id: r.id,
        residentId: r.resident_id,
        name: card.name,
        species: card.species,
        story: r.public_story?.trim() || null,
        firstName: r.public_first_name?.trim() || null,
        photoIds: [r.drive_file_id],
      });
    }
  }
  return [...byId.values()];
}

async function loadCards(supabase: SupabaseClient, residentIds: string[]) {
  const cards = new Map<string, { name: string; species: string | null }>();
  if (residentIds.length === 0) return cards;
  const { data } = await supabase
    .from("public_resident_cards")
    .select("id, name, species")
    .in("id", residentIds)
    .returns<{ id: string; name: string; species: string | null }[]>();
  for (const c of data ?? []) cards.set(c.id, { name: c.name, species: c.species });
  return cards;
}

/** Up to `limit` stories for /adopt, newest first; empty when nobody has ticked anything. */
export async function loadPublicStories(supabase: SupabaseClient, limit = 6): Promise<PublicStory[]> {
  const { data, error } = await supabase.from("public_adoption_updates").select(VIEW_COLUMNS).returns<ViewRow[]>();
  if (error || !data?.length) return [];
  const cards = await loadCards(supabase, [...new Set(data.map((r) => r.resident_id))]);
  return foldStories(data, cards).slice(0, limit);
}

/** The stories about one animal, for its own page once adopted. */
export async function loadPublicStoriesFor(supabase: SupabaseClient, residentId: string): Promise<PublicStory[]> {
  const { data, error } = await supabase
    .from("public_adoption_updates")
    .select(VIEW_COLUMNS)
    .eq("resident_id", residentId)
    .returns<ViewRow[]>();
  if (error || !data?.length) return [];
  const cards = await loadCards(supabase, [residentId]);
  return foldStories(data, cards);
}
