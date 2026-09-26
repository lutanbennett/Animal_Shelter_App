import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicTranslations } from "@/lib/translations/types";
import type { ResidentCardRow } from "@/app/adopt/ResidentCard";

/**
 * public_resident_profiles (0025, 0051, 0056, 0060, 0094): what a signed-out
 * visitor may see of a resident. Read with the anon key on /adopt; the
 * view applies the "public, not adopted, not deceased" rule.
 */
export type PublicResident = ResidentCardRow & {
  sex: string | null;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  translations: PublicTranslations;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  colour: string | null;
  is_desexed: boolean | null;
  is_vaccinated: boolean;
  good_with_dogs: string | null;
  good_with_cats: string | null;
  good_with_children: string | null;
  energy_level: string | null;
  hook_line: string | null;
  ideal_home: string | null;
};

export const PUBLIC_RESIDENT_COLUMNS =
  "id, name, species, breed, sex, size, ready_for_adoption, bio, temperament_notes, past_story_notes, profile_photo_drive_file_id, estimated_age_years, age_estimated_on, translations, colour, is_desexed, is_vaccinated, good_with_dogs, good_with_cats, good_with_children, energy_level, hook_line, ideal_home";

export const CARD_COLUMNS =
  "id, name, species, breed, size, ready_for_adoption, profile_photo_drive_file_id";

export async function loadPublicResident(
  supabase: SupabaseClient,
  id: string,
): Promise<PublicResident | null> {
  const { data } = await supabase
    .from("public_resident_profiles")
    .select(PUBLIC_RESIDENT_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<PublicResident[]>();
  return data?.[0] ?? null;
}

/**
 * Up to `limit` other residents of the same species for the "Similar
 * residents" strip: ready for adoption first, then a shuffle so the same
 * four don't sit under every profile. Nothing when the species is unset.
 */
export async function loadSimilarResidents(
  supabase: SupabaseClient,
  resident: Pick<PublicResident, "id" | "species">,
  limit = 4,
): Promise<ResidentCardRow[]> {
  if (!resident.species) return [];
  const { data } = await supabase
    .from("public_resident_profiles")
    .select(CARD_COLUMNS)
    .eq("species", resident.species)
    .neq("id", resident.id)
    .returns<ResidentCardRow[]>();
  const rows = data ?? [];
  const shuffle = <T,>(items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  return [
    ...shuffle(rows.filter((r) => r.ready_for_adoption)),
    ...shuffle(rows.filter((r) => !r.ready_for_adoption)),
  ].slice(0, limit);
}

/** The first sentence or so of a bio, for cards and Open Graph descriptions. */
export function bioLead(bio: string | null | undefined, maxLength = 200): string {
  const first = (bio ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find(Boolean);
  if (!first) return "";
  const sentence = first.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? first;
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}
