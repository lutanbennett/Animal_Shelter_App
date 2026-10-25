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
 * SINCE 0259 THIS IS ALWAYS FALSE. `on_volunteer_floor()` used to read `roles.scope_residents`; no role column may
 * decide access (CLAUDE.md, "Hard-coded security is forbidden"), so it reads none and nobody is confined to the view by
 * their role. A role reads as much of a resident as its cards give: the volunteer holds `view_residents`, which grants
 * `resident.record` at read, so it reads `residents` like everyone else. This function and its six callers are now dead
 * weight rather than a rule — removing them is a follow-up in docs/backlog.md, deliberately not done in 0259's PR.
 */
export const readsWhoAndWhereOnly = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("on_volunteer_floor");
  return data === true;
});

/**
 * May this login open the resident's whole record although it reads a resident as who-and-where? The
 * database's own answer (0249, may_open_resident_record()): true for a who_and_where role that holds an
 * edit of a medical.* activity (the Medical records card). Asked of the function, not re-derived here, so
 * the app and the read policies cannot drift apart. Read-only outside the medical sections: every write
 * policy still asks sees_all_residents().
 */
export const mayOpenResidentRecord = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("may_open_resident_record");
  return data === true;
});

/** The hub is open for this login but only its medical sections are editable: a who-and-where role with a medical edit. */
export async function opensRecordReadOnly(): Promise<boolean> {
  return (await readsWhoAndWhereOnly()) && (await mayOpenResidentRecord());
}

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
export async function requireFullResident(
  activity?: LevelKey,
  level: Level = "read",
  { allowMedicalCard = false }: { allowMedicalCard?: boolean } = {},
) {
  const guarded = await requirePermission("resident.record", "read");
  // allowMedicalCard: the pages the Medical records card opens (the hub and its tabs), never the edit,
  // move, hospital, rehome, death or adoption-news pages.
  const refusedAsWhoAndWhere =
    (await readsWhoAndWhereOnly()) && !(allowMedicalCard && (await mayOpenResidentRecord()));
  if (refusedAsWhoAndWhere || (activity && !can(guarded.perms, activity, level))) {
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
