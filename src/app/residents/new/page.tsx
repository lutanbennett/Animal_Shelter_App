import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  IntakeForm,
  type DietTypeOption,
  type EnclosureOption,
  type OriginOption,
  type ZoneOption,
} from "./IntakeForm";

export default async function NewResidentPage() {
  const supabase = await createClient();
  const { t } = await getT();

  const [zonesResult, enclosuresResult, originsResult, dietTypesResult] = await Promise.all([
    supabase
      .from("zones")
      .select("id, name, name_th")
      .neq("name", "Lifecycle")
      .order("name")
      .returns<ZoneOption[]>(),
    supabase
      .from("enclosures")
      .select("id, name, name_th, zone_id, zones!inner(name)")
      .neq("zones.name", "Lifecycle")
      .order("name")
      .returns<{ id: string; name: string; name_th: string | null; zone_id: string }[]>(),
    supabase
      .from("group_origins")
      .select("id, name")
      .order("date", { ascending: false })
      .returns<OriginOption[]>(),
    supabase
      .from("diet_types")
      .select("id, name")
      .order("name")
      .returns<DietTypeOption[]>(),
  ]);

  const zones = zonesResult.data ?? [];
  const enclosures: EnclosureOption[] = (enclosuresResult.data ?? []).map(
    (e) => ({ id: e.id, name: e.name, name_th: e.name_th, zoneId: e.zone_id }),
  );
  const origins = originsResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.residents.new.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.residents.new.pageSubtitle}</p>
      </div>

      {zonesResult.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadZones}: {zonesResult.error.message}
        </p>
      )}
      {enclosuresResult.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadEnclosures}: {enclosuresResult.error.message}
        </p>
      )}
      {originsResult.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadOrigins}: {originsResult.error.message}
        </p>
      )}

      <IntakeForm
        zones={zones}
        enclosures={enclosures}
        origins={origins}
        dietTypes={dietTypesResult.data ?? []}
      />
    </main>
  );
}
