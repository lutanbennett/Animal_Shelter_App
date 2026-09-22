import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { NOT_DECEASED } from "@/lib/residents/status";
import { VetVisitForm, type ResidentOption, type VetOption } from "./VetVisitForm";

export default async function NewVetVisitPage(
  props: PageProps<"/vet-visits/new">,
) {
  const searchParams = await props.searchParams;
  const { t } = await getT();

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

  const [residentsResult, vetsResult] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select("resident_id, name, thai_name, current_status")
      .or(NOT_DECEASED)
      .order("name"),
    supabase.from("vets").select("id, name, clinic_name").order("name"),
  ]);

  const residents: ResidentOption[] = (residentsResult.data ?? []).map(
    (r) => ({
      id: r.resident_id,
      name: r.name,
      thai_name: r.thai_name,
      current_status: r.current_status,
    }),
  );

  const vets: VetOption[] = vetsResult.data ?? [];

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
        preselectedResidentIds={[...preselectedIds]}
      />
    </main>
  );
}
