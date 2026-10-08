import { notFound } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getLocale } from "@/lib/i18n/get-locale";
import { localLabel } from "@/lib/translations/labels";
import {
  VetHub,
  type HubDoctor,
  type LinkedRecord,
  type Vet,
  type VetHubVisit,
} from "./VetHub";

export default async function VetPage(props: PageProps<"/vets/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("clinics.list", "read");

  // Records logged against this vet's visits are counted on the hub. Each
  // is fetched through its vet_appointment_id with an inner join filtered
  // on the vet, so one round-trip per table and no id list in the URL.
  const linkedSelect = "id, vet_appointment_id, vet_appointments!inner(vet_id)";

  const [
    vetResult,
    visitsResult,
    proceduresResult,
    bloodTestsResult,
    prescriptionsResult,
    doctorsResult,
  ] =
    await Promise.all([
      supabase
        .from("vets")
        .select("id, name, name_th, clinic_name, contact_info, notes")
        .eq("id", id)
        .limit(1)
        .returns<(Vet & { name_th: string | null })[]>(),
      supabase
        .from("vet_appointments")
        .select(
          "id, resident_id, appointment_date, status, reason, doctor_id, doctor_name, cost, residents(name, thai_name, resident_code, profile_photo_drive_file_id)",
        )
        .is("archived_at", null)
        .eq("vet_id", id)
        .order("appointment_date", { ascending: false })
        .returns<VetHubVisit[]>(),
      supabase
        .from("procedures")
        .select(linkedSelect)
        .eq("vet_appointments.vet_id", id)
        .is("vet_appointments.archived_at", null)
        .returns<LinkedRecord[]>(),
      supabase
        .from("blood_tests")
        .select(linkedSelect)
        .eq("vet_appointments.vet_id", id)
        .is("vet_appointments.archived_at", null)
        .returns<LinkedRecord[]>(),
      supabase
        .from("prescriptions")
        .select(linkedSelect)
        .eq("vet_appointments.vet_id", id)
        .is("vet_appointments.archived_at", null)
        .is("archived_at", null)
        .returns<LinkedRecord[]>(),
      // The clinic's doctor list (0102, links 0125). Read-only here; corrected
      // under Management → Vets → Doctors. `active` is the link's: a doctor
      // who left this clinic may still work at another.
      supabase
        .from("vet_doctor_clinics")
        .select("active, vet_doctors!inner(id, name)")
        .eq("vet_id", id)
        .returns<{ active: boolean; vet_doctors: { id: string; name: string } }[]>()
        .then((r) => ({
          error: r.error,
          data: (r.data ?? [])
            .map((l): HubDoctor => ({ ...l.vet_doctors, active: l.active }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        })),
    ]);

  // A query error must not look like a missing vet — surface it, not a 404.
  if (vetResult.error) throw new Error(vetResult.error.message);
  const row = vetResult.data?.[0];
  if (!row) notFound();
  const vet: Vet = { ...row, name: localLabel(await getLocale(), row.name, row.name_th) };
  if (visitsResult.error) throw new Error(visitsResult.error.message);

  return (
    <VetHub
      vet={vet}
      visits={visitsResult.data ?? []}
      linked={{
        procedures: proceduresResult.data ?? [],
        bloodTests: bloodTestsResult.data ?? [],
        prescriptions: prescriptionsResult.data ?? [],
      }}
      doctors={doctorsResult.data ?? []}
      canManage={can(perms, "clinics.list")}
      canOpenVisits={can(perms, "medical.visits", "read")}
      now={new Date().toISOString()}
    />
  );
}
