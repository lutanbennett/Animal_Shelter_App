import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { refuseFor } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions/can";
import type { Level, LevelKey } from "@/lib/permissions/catalogue";
import { requirePermission } from "@/lib/permissions/require";
import type { ResidentRow } from "@/app/residents/ResidentsTable";

/**
 * "Who and where" (docs/roles-and-permissions.md §5, 0134): the whole of a resident a volunteer
 * reads. The database gives it one view, `resident_who_and_where`, and takes the volunteer's read
 * of `residents` and of the views built on it away, so every page that reads a resident for a
 * volunteer reads this instead, and every page that needs more refuses.
 *
 * The scope is not a column yet (the role tables have no `scope_resident_detail`, 0132's note), so
 * the app asks the question the view itself asks: `current_user_role() = 'volunteer'`. That is the
 * one place the app says a role name for this, because it is the view's own gate, and it moves to
 * the scope with the 2IC and the Heads (batch 45), who borrow the volunteer's rights through
 * `roles.legacy_role` and so answer 'volunteer' here too.
 */
export const readsWhoAndWhereOnly = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("current_user_role");
  return data === "volunteer";
});

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

/** A who-and-where row in the shape the residents list and the enclosure pages already take. */
export function asListRow(row: WhoAndWhere, zoneInternal: boolean | null = null): ResidentRow {
  return {
    resident_id: row.id,
    name: row.name,
    resident_code: row.resident_code,
    thai_name: row.thai_name,
    other_names: null,
    current_status: row.current_status,
    enclosure_id: row.enclosure_id,
    enclosure_name: row.enclosure_name,
    enclosure_name_th: row.enclosure_name_th,
    zone_id: row.zone_id,
    zone_name: row.zone_name,
    zone_name_th: row.zone_name_th,
    zone_internal: zoneInternal,
    zone_colour: row.zone_colour,
  };
}

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
export async function requireFullResident(activity?: LevelKey, level: Level = "read") {
  const guarded = await requirePermission("resident.record", "read");
  if ((await readsWhoAndWhereOnly()) || (activity && !can(guarded.perms, activity, level))) {
    refuseFor(guarded.perms);
  }
  return guarded;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Who is in which enclosure now: the residents list's own view for most roles, `resident_who_and_where`
 * for a volunteer (0134). The enclosure pages and the facility map count and list from this, so a
 * volunteer sees the same occupancy as everyone, through the one view that gives it to them.
 * Pass an enclosure to read only its occupants.
 */
export async function loadOccupants(supabase: Supabase, enclosureId?: string) {
  const limited = await readsWhoAndWhereOnly();
  // A plain string for the column list and a plain name for the view: the typed select parser
  // cannot follow a choice between two views.
  const columns: string = limited ? "enclosure_id, id, name" : "enclosure_id, resident_id, name";
  let query = supabase
    .from((limited ? "resident_who_and_where" : "resident_list_view") as "resident_list_view")
    .select(columns)
    .not("enclosure_id", "is", null)
    .order("name");
  if (enclosureId) query = query.eq("enclosure_id", enclosureId);
  const { data, error } = await query.returns<{ enclosure_id: string; resident_id?: string; id?: string; name: string }[]>();
  return {
    error,
    data: (data ?? []).map((row) => ({
      enclosure_id: row.enclosure_id,
      resident_id: (limited ? row.id : row.resident_id) as string,
      name: row.name,
    })),
  };
}
