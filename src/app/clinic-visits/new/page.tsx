import { requirePermission } from "@/lib/permissions/require";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { NOT_DECEASED } from "@/lib/residents/status";
import { loadDoctorNamesByClinic } from "@/lib/clinics/doctors";
import { loadClinicScope } from "@/lib/clinics/scope";
import { ClinicVisitForm, type ResidentOption, type ClinicOption } from "./ClinicVisitForm";

export default async function NewClinicVisitPage(
  props: PageProps<"/clinic-visits/new">,
) {
  await requirePermission("medical.visits");
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();

  const preselectedIds = new Set<string>();
  const residentIdParam = searchParams.residentId;
  const residentIdsParam = searchParams.residentIds;

  if (typeof residentIdParam === "string" && residentIdParam) {
    preselectedIds.add(residentIdParam);
  }
  if (typeof residentIdsParam === "string" && residentIdsParam) {
    for (const id of residentIdsParam.split(",")) {
      if (id) preselectedIds.add(id);
    }
  }

  const supabase = await createClient();
  const scope = await loadClinicScope(supabase);

  if (scope.kind === "unlinked") {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.pageTitle}</h1>
        <p className="max-w-2xl text-sm text-muted">{t.vetVisits.noClinicForAccount}</p>
      </main>
    );
  }

  // A doctor login books against its current clinics only (src/lib/clinics/scope.ts).
  let clinicsQuery = supabase.from("clinics").select("id, name, name_th").order("name");
  if (scope.kind === "clinics") clinicsQuery = clinicsQuery.in("id", scope.clinicIds);

  const [residentsResult, clinicsResult, doctorNamesByClinic] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select("resident_id, name, thai_name, current_status")
      .or(NOT_DECEASED)
      .order("name"),
    clinicsQuery,
    loadDoctorNamesByClinic(supabase),
  ]);

  const residents: ResidentOption[] = (residentsResult.data ?? []).map(
    (r) => ({
      id: r.resident_id,
      name: r.name,
      thai_name: r.thai_name,
      current_status: r.current_status,
    }),
  );

  const clinics: ClinicOption[] = ((clinicsResult.data ?? []) as (ClinicOption & { name_th: string | null })[]).map(
    ({ name_th, ...clinic }) => ({ ...clinic, name: localLabel(locale, clinic.name, name_th) }),
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.vetVisits.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.vetVisits.pageSubtitle}</p>
      </div>

      {residentsResult.error && (
        <p className="text-sm text-danger">
          {t.vetVisits.couldntLoadResidents}: {residentsResult.error.message}
        </p>
      )}
      {clinicsResult.error && (
        <p className="text-sm text-danger">
          {t.vetVisits.couldntLoadVets}: {clinicsResult.error.message}
        </p>
      )}

      <ClinicVisitForm
        residents={residents}
        clinics={clinics}
        fixedClinic={scope.kind === "clinics" && clinics.length === 1 ? clinics[0] : null}
        lockedDoctor={scope.kind === "clinics" ? scope.doctorName : null}
        doctorNamesByClinic={doctorNamesByClinic}
        preselectedResidentIds={[...preselectedIds]}
      />
    </main>
  );
}
