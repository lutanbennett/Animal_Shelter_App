import { requirePermission } from "@/lib/permissions/require";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { NOT_DECEASED } from "@/lib/residents/status";
import { loadDoctorNamesByVet } from "@/lib/vets/doctors";
import { loadVetScope } from "@/lib/vets/scope";
import { VetVisitForm, type ResidentOption, type VetOption } from "./VetVisitForm";

export default async function NewVetVisitPage(
  props: PageProps<"/vet-visits/new">,
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
  const scope = await loadVetScope(supabase);

  if (scope.kind === "unlinked") {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.pageTitle}</h1>
        <p className="max-w-2xl text-sm text-muted">{t.vetVisits.noClinicForAccount}</p>
      </main>
    );
  }

  // A vet account books against its own clinics only (src/lib/vets/scope.ts).
  let vetsQuery = supabase.from("vets").select("id, name, name_th, clinic_name").order("name");
  if (scope.kind === "clinics") vetsQuery = vetsQuery.in("id", scope.vetIds);

  const [residentsResult, vetsResult, doctorNamesByVet] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select("resident_id, name, thai_name, current_status")
      .or(NOT_DECEASED)
      .order("name"),
    vetsQuery,
    loadDoctorNamesByVet(supabase),
  ]);

  const residents: ResidentOption[] = (residentsResult.data ?? []).map(
    (r) => ({
      id: r.resident_id,
      name: r.name,
      thai_name: r.thai_name,
      current_status: r.current_status,
    }),
  );

  const vets: VetOption[] = ((vetsResult.data ?? []) as (VetOption & { name_th: string | null })[]).map(
    ({ name_th, ...vet }) => ({ ...vet, name: localLabel(locale, vet.name, name_th) }),
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
      {vetsResult.error && (
        <p className="text-sm text-danger">
          {t.vetVisits.couldntLoadVets}: {vetsResult.error.message}
        </p>
      )}

      <VetVisitForm
        residents={residents}
        vets={vets}
        fixedVet={scope.kind === "clinics" && vets.length === 1 ? vets[0] : null}
        lockedDoctor={scope.kind === "clinics" ? scope.doctorName : null}
        doctorNamesByVet={doctorNamesByVet}
        preselectedResidentIds={[...preselectedIds]}
      />
    </main>
  );
}
