import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { NOT_DECEASED } from "@/lib/residents/status";
import {
  ImmunizationForm,
  type EnclosureOption,
  type ImmunizationTypeOption,
  type ResidentOption,
  type ZoneOption,
} from "./ImmunizationForm";

export default async function NewImmunizationPage(
  props: PageProps<"/immunizations/new">,
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

  const [residentsResult, immunizationTypesResult, zonesResult, enclosuresResult] =
    await Promise.all([
      supabase
        .from("resident_list_view")
        .select(
          "resident_id, name, thai_name, current_status, zone_id, enclosure_id",
        )
        .or(NOT_DECEASED)
        .order("name"),
      supabase
        .from("immunization_types")
        .select("id, name, is_mandatory, interval_months")
        .order("name"),
      supabase.from("zones").select("id, name, name_th").order("name"),
      supabase
        .from("enclosures")
        .select("id, name, name_th, zone_id")
        .order("name"),
    ]);

  const residents: ResidentOption[] = (residentsResult.data ?? []).map(
    (r) => ({
      id: r.resident_id,
      name: r.name,
      thai_name: r.thai_name,
      current_status: r.current_status,
      zone_id: r.zone_id,
      enclosure_id: r.enclosure_id,
    }),
  );

  const immunizationTypes: ImmunizationTypeOption[] =
    immunizationTypesResult.data ?? [];
  const zones: ZoneOption[] = zonesResult.data ?? [];
  const enclosures: EnclosureOption[] = enclosuresResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.immunizations.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.immunizations.pageSubtitle}</p>
      </div>

      {residentsResult.error && (
        <p className="text-sm text-danger">
          {t.immunizations.couldntLoadResidents}: {residentsResult.error.message}
        </p>
      )}
      {immunizationTypesResult.error && (
        <p className="text-sm text-danger">
          {t.immunizations.couldntLoadTypes}:{" "}
          {immunizationTypesResult.error.message}
        </p>
      )}

      <ImmunizationForm
        residents={residents}
        immunizationTypes={immunizationTypes}
        zones={zones}
        enclosures={enclosures}
        preselectedResidentIds={[...preselectedIds]}
      />
    </main>
  );
}
