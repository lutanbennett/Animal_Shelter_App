import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canWriteMaintenance, loadMaintenanceJobs } from "@/lib/maintenance/queries";
import {
  EnclosureHub,
  type Enclosure,
  type EnclosureResident,
} from "./EnclosureHub";

type EnclosureRow = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  zones: { name: string; name_th: string | null; internal: boolean } | null;
};

export default async function EnclosurePage(
  props: PageProps<"/enclosures/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [enclosureResult, occupantsResult, roleResult, maintenanceResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, name, name_th, capacity, notes, zone_id, zones(name, name_th, internal)")
      .eq("id", id)
      .limit(1)
      .returns<EnclosureRow[]>(),
    // Who's here now, per the same view the residents list uses; the
    // profile photo isn't in that view so it's fetched in a second step.
    supabase
      .from("resident_list_view")
      .select("resident_id")
      .eq("enclosure_id", id)
      .returns<{ resident_id: string }[]>(),
    supabase.rpc("current_user_role"),
    loadMaintenanceJobs(supabase, { enclosureId: id }),
  ]);

  const row = enclosureResult.data?.[0];
  if (!row) notFound();

  const residentIds = (occupantsResult.data ?? []).map((r) => r.resident_id);
  const residentsResult =
    residentIds.length > 0
      ? await supabase
          .from("residents")
          .select("id, name, thai_name, resident_code, profile_photo_drive_file_id")
          .in("id", residentIds)
          .order("name")
          .returns<EnclosureResident[]>()
      : null;

  const enclosure: Enclosure = {
    id: row.id,
    name: row.name,
    name_th: row.name_th,
    capacity: row.capacity,
    notes: row.notes,
    zone_id: row.zone_id,
    zone_name: row.zones?.name ?? "—",
    zone_name_th: row.zones?.name_th ?? null,
    zone_internal: row.zones?.internal ?? true,
    isSystem: row.zones?.name === "Lifecycle",
  };

  return (
    <EnclosureHub
      enclosure={enclosure}
      residents={residentsResult?.data ?? []}
      isAdmin={roleResult.data === "admin"}
      canWriteMaintenance={canWriteMaintenance(roleResult.data)}
      maintenanceJobs={maintenanceResult.jobs}
    />
  );
}
