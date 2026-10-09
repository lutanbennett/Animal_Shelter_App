import "server-only";
import { loadMaintenanceJobs, type MaintenanceJob } from "@/lib/maintenance/queries";
import { loadSpecialDiets } from "@/lib/diets/special";
import { getLocale } from "@/lib/i18n/get-locale";
import { todayIso } from "@/lib/format";
import { loadOccupants, readsWhoAndWhereOnly } from "@/lib/residents/who-and-where";
import type { createClient } from "@/lib/supabase/server";
import type { Enclosure, EnclosureResident } from "@/app/enclosures/[id]/EnclosureHub";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type EnclosureRow = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  zones: { name: string; name_th: string | null; internal: boolean; colour: string | null } | null;
};

export type EnclosureDetails = {
  enclosure: Enclosure;
  residents: EnclosureResident[];
  maintenanceJobs: MaintenanceJob[];
};

/**
 * One enclosure as its page shows it: the place, who is in it (photo, diets, medication) and its
 * maintenance. The enclosure page and the facility map's details panel both read it from here, so a
 * tap on the map shows exactly what the page would, under the caller's own login: a volunteer reads
 * who and where only (0134), and a role that cannot read prescriptions or maintenance gets none, as
 * RLS decides. Null when the enclosure does not exist or is not visible to the caller.
 */
export async function loadEnclosureDetails(supabase: Supabase, id: string): Promise<EnclosureDetails | null> {
  const today = todayIso();
  const [enclosureResult, occupantsResult, maintenanceResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, name, name_th, capacity, notes, zone_id, zones(name, name_th, internal, colour)")
      .eq("id", id)
      .limit(1)
      .returns<EnclosureRow[]>(),
    // Who's here now, per the same view the residents list uses; the
    // profile photo isn't in that view so it's fetched in a second step.
    loadOccupants(supabase, id),
    loadMaintenanceJobs(supabase, { enclosureId: id }),
  ]);

  const row = enclosureResult.data?.[0];
  if (!row) return null;

  const limited = await readsWhoAndWhereOnly();
  const residentIds = occupantsResult.data.map((r) => r.resident_id);
  const [residentsResult, specialDiets, rxResult] = await Promise.all([
    residentIds.length > 0
      ? supabase
          // A volunteer's second step reads who and where too: it has the same five columns (0134).
          .from((limited ? "resident_who_and_where" : "residents") as "residents")
          .select("id, name, thai_name, resident_code, profile_photo_drive_file_id")
          .in("id", residentIds)
          .order("name")
          .returns<Omit<EnclosureResident, "special_diets" | "on_medication">[]>()
      : null,
    loadSpecialDiets(supabase, residentIds, await getLocale()),
    // On a current prescription: the facility map's own rule (archived_at null, started, not ended).
    // A role that cannot read prescriptions gets nothing back from RLS, so nobody is marked.
    residentIds.length > 0
      ? supabase
          .from("prescriptions")
          .select("resident_id")
          .in("resident_id", residentIds)
          .is("archived_at", null)
          .lte("start_date", today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .returns<{ resident_id: string }[]>()
      : null,
  ]);
  const onMedication = new Set((rxResult?.data ?? []).map((r) => r.resident_id));
  const residents: EnclosureResident[] = (residentsResult?.data ?? []).map((resident) => ({
    ...resident,
    special_diets: specialDiets.get(resident.id) ?? [],
    on_medication: onMedication.has(resident.id),
  }));

  return {
    enclosure: {
      id: row.id,
      name: row.name,
      name_th: row.name_th,
      capacity: row.capacity,
      notes: row.notes,
      zone_id: row.zone_id,
      zone_name: row.zones?.name ?? "—",
      zone_name_th: row.zones?.name_th ?? null,
      zone_colour: row.zones?.colour ?? null,
      zone_internal: row.zones?.internal ?? true,
      isSystem: row.zones?.name === "Lifecycle",
    },
    residents,
    maintenanceJobs: maintenanceResult.jobs,
  };
}
