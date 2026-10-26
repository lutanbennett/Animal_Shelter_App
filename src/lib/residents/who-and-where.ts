import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { refuseFor } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions/can";
import type { Level, LevelKey } from "@/lib/permissions/catalogue";
import { requirePermission } from "@/lib/permissions/require";

/**
 * "Who and where" (docs/roles-and-permissions.md §5, 0134): the whole of a resident a volunteer
 * reads. The database gives it one view, `resident_who_and_where`, and takes the volunteer's read
 * of `residents` and of the views built on it away, so every page that reads a resident for a
 * volunteer reads this instead, and every page that needs more refuses.
 *
 * No role is limited to this view any more (0259, 0264): a role reads as much of a resident as its cards give, and
 * the volunteer holds `view_residents`, which grants `resident.record` at read. The view stays for the pickers.
 */

/** A row of `resident_who_and_where`, as the view names its columns. */
export type WhoAndWhere = {
  id: string;
  name: string;
  thai_name: string | null;
  resident_code: string;
  species: string | null;
  sex: string | null;
  profile_photo_drive_file_id: string | null;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  zone_id: string | null;
  zone_name: string | null;
  zone_name_th: string | null;
  zone_colour: string | null;
};

export const WHO_AND_WHERE_COLUMNS =
  "id, name, thai_name, resident_code, species, sex, profile_photo_drive_file_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_colour";

/**
 * The guard for a page that shows more of a resident than who and where: the resident's own
 * pages (edit, move, hospital, rehome, death, adoption news, every tab of the record) and the
 * pages that act on one. Refuses, with the app's own no-access page, a login that reads a
 * resident only as who and where, and one that holds no read of the record at all. A page that
 * is also about one activity names it, at the level it needs.
 *
 *   await requireFullResident();
 *   await requireFullResident("medical.weight", "read");
 */
export async function requireFullResident(
  activity?: LevelKey,
  level: Level = "read",
) {
  const guarded = await requirePermission("resident.record", "read");
  if (activity && !can(guarded.perms, activity, level)) {
    refuseFor(guarded.perms);
  }
  return guarded;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Who is in which enclosure now, from the residents list's own view. The enclosure pages and the
 * facility map count and list from this. Pass an enclosure to read only its occupants.
 */
export async function loadOccupants(supabase: Supabase, enclosureId?: string) {
  let query = supabase
    .from("resident_list_view")
    .select("enclosure_id, resident_id, name")
    .not("enclosure_id", "is", null)
    .order("name");
  if (enclosureId) query = query.eq("enclosure_id", enclosureId);
  const { data, error } = await query.returns<{ enclosure_id: string; resident_id: string; name: string }[]>();
  return {
    error,
    data: (data ?? []).map((row) => ({
      enclosure_id: row.enclosure_id,
      resident_id: row.resident_id,
      name: row.name,
    })),
  };
}
