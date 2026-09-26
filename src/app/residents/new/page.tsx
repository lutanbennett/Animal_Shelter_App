import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import {
  IntakeForm,
  type DietTypeOption,
  type OriginOption,
} from "./IntakeForm";
import { parseStepParam } from "./steps";

export default async function NewResidentPage(
  props: PageProps<"/residents/new">,
) {
  const supabase = await createClient();
  const { t } = await getT();
  const initialStep = parseStepParam((await props.searchParams).step);

  // Zones and enclosures come from the same loader as Move, with each
  // enclosure's headcount, so intake's capacity warning can't disagree
  // with the other placement screens about what "full" means.
  const [options, originsResult, dietTypesResult] = await Promise.all([
    loadEnclosureOptions(supabase),
    supabase
      .from("group_origins")
      .select("id, name")
      .order("date", { ascending: false })
      .returns<OriginOption[]>(),
    supabase
      .from("diet_types")
      .select("id, name, is_standard")
      .order("name")
      .returns<DietTypeOption[]>(),
  ]);

  const origins = originsResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.residents.new.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.residents.new.pageSubtitle}</p>
      </div>

      {options.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadEnclosures}: {options.error}
        </p>
      )}
      {originsResult.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadOrigins}: {originsResult.error.message}
        </p>
      )}

      <IntakeForm
        zones={options.zones}
        enclosures={options.enclosures}
        origins={origins}
        dietTypes={dietTypesResult.data ?? []}
        initialStep={initialStep}
      />
    </main>
  );
}
