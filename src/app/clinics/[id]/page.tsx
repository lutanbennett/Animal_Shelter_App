import { notFound } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getLocale } from "@/lib/i18n/get-locale";
import { localLabel } from "@/lib/translations/labels";
import {
  ClinicHub,
  type HubDoctor,
  type LinkedRecord,
  type Clinic,
  type ClinicHubVisit,
} from "./ClinicHub";

export default async function ClinicPage(props: PageProps<"/clinics/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("clinics.list", "read");

  // Records logged against this clinic's visits are counted on the hub. Each
  // is fetched through its clinic_visit_id with an inner join filtered
  // on the clinic, so one round-trip per table and no id list in the URL.
  const linkedSelect = "id, clinic_visit_id, clinic_visits!inner(clinic_id)";

  const [
    clinicResult,
    visitsResult,
    proceduresResult,
    bloodTestsResult,
    prescriptionsResult,
    doctorsResult,
  ] =
    await Promise.all([
      supabase
        .from("clinics")
        .select("id, name, name_th, contact_info, notes")
        .eq("id", id)
        .limit(1)
        .returns<(Clinic & { name_th: string | null })[]>(),
      supabase
        .from("clinic_visits")
        .select(
          "id, resident_id, appointment_date, status, reason, doctor_id, doctor_name, cost, residents(name, thai_name, resident_code, profile_photo_drive_file_id)",
        )
        .is("archived_at", null)
        .eq("clinic_id", id)
        .order("appointment_date", { ascending: false })
        .returns<ClinicHubVisit[]>(),
      supabase
        .from("procedures")
        .select(linkedSelect)
        .eq("clinic_visits.clinic_id", id)
        .is("clinic_visits.archived_at", null)
        .returns<LinkedRecord[]>(),
      supabase
        .from("blood_tests")
        .select(linkedSelect)
        .eq("clinic_visits.clinic_id", id)
        .is("clinic_visits.archived_at", null)
        .returns<LinkedRecord[]>(),
      supabase
        .from("prescriptions")
        .select(linkedSelect)
        .eq("clinic_visits.clinic_id", id)
        .is("clinic_visits.archived_at", null)
        .is("archived_at", null)
        .returns<LinkedRecord[]>(),
      // The clinic's doctor list (0102, links 0125). Read-only here; corrected
      // under Management → Clinics → Doctors. `active` is the link's: a doctor
      // who left this clinic may still work at another.
      supabase
        .from("doctor_clinics")
        .select("active, doctors!inner(id, name)")
        .eq("clinic_id", id)
        .returns<{ active: boolean; doctors: { id: string; name: string } }[]>()
        .then((r) => ({
          error: r.error,
          data: (r.data ?? [])
            .map((l): HubDoctor => ({ ...l.doctors, active: l.active }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        })),
    ]);

  // A query error must not look like a missing clinic — surface it, not a 404.
  if (clinicResult.error) throw new Error(clinicResult.error.message);
  const row = clinicResult.data?.[0];
  if (!row) notFound();
  const clinic: Clinic = { ...row, name: localLabel(await getLocale(), row.name, row.name_th) };
  if (visitsResult.error) throw new Error(visitsResult.error.message);

  return (
    <ClinicHub
      clinic={clinic}
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
