import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicTranslations } from "@/lib/translations/types";
import { isUuid } from "@/lib/tags/links";

/**
 * public_resident_cards (0067): the card-shaped slice of *any* resident
 * that a visitor may see after scanning the RFID card by a kennel
 * (src/app/r/[code]/page.tsx). Unlike public_resident_profiles it has no
 * "shown on the public site" filter — the card is on the door, so the
 * page behind it must always answer — and it says nothing about where a
 * current resident is: `status` is only Resident, Adopted or Deceased.
 */
export type ResidentCard = {
  id: string;
  resident_code: string;
  name: string;
  thai_name: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  size: string | null;
  colour: string | null;
  is_desexed: boolean | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  intake_date: string | null;
  bio: string | null;
  temperament_notes: string | null;
  profile_photo_drive_file_id: string | null;
  ready_for_adoption: boolean;
  /** On the /adopt listing too, so the page can link to the fuller profile. */
  is_public_visible: boolean;
  good_with_dogs: string | null;
  good_with_cats: string | null;
  good_with_children: string | null;
  energy_level: string | null;
  translations: PublicTranslations;
  status: "Resident" | "Adopted" | "Deceased";
};

const CARD_COLUMNS =
  "id, resident_code, name, thai_name, species, breed, sex, size, colour, is_desexed, estimated_age_years, age_estimated_on, intake_date, bio, temperament_notes, profile_photo_drive_file_id, ready_for_adoption, is_public_visible, good_with_dogs, good_with_cats, good_with_children, energy_level, translations, status";

/**
 * By R-code (what the card carries; case-insensitive so a hand-typed
 * r-0043 works) or by id (an older link).
 */
export async function loadResidentCard(
  supabase: SupabaseClient,
  codeOrId: string,
): Promise<ResidentCard | null> {
  const query = supabase.from("public_resident_cards").select(CARD_COLUMNS);
  const { data } = await (isUuid(codeOrId)
    ? query.eq("id", codeOrId)
    : query.eq("resident_code", codeOrId.toUpperCase())
  )
    .limit(1)
    .returns<ResidentCard[]>();
  return data?.[0] ?? null;
}
