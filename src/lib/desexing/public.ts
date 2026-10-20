import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * What the public site reads about desexing drives: public_desexing_drives
 * (0233) and nothing else. The view has the drive and a count of places left;
 * a sign-up, and so a person, is never readable from the public site.
 */
export type PublicDrive = {
  id: string;
  title: string;
  drive_date: string;
  starts_at: string | null;
  ends_at: string | null;
  venue: string;
  venue_address: string | null;
  species: string[];
  capacity: number | null;
  signups_close_on: string | null;
  price_note: string | null;
  eligibility_note: string | null;
  description: string | null;
  is_cancelled: boolean;
  spots_left: number | null;
  accepting_signups: boolean;
};

const COLUMNS =
  "id, title, drive_date, starts_at, ends_at, venue, venue_address, species, capacity, signups_close_on, price_note, eligibility_note, description, is_cancelled, spots_left, accepting_signups";

/** A failed read throws rather than looking like "no drives" (docs/decisions/2026-10-11-silent-empty-reads.md). */
export async function loadPublicDrives(supabase: SupabaseClient): Promise<PublicDrive[]> {
  const { data, error } = await supabase
    .from("public_desexing_drives")
    .select(COLUMNS)
    .order("drive_date", { ascending: true })
    .order("starts_at", { ascending: true })
    .returns<PublicDrive[]>();
  if (error) throw new Error(`Desexing drives: could not read the drives: ${error.message}`);
  return data ?? [];
}
