import { requirePermission } from "@/lib/permissions/require";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import {
  IntakeForm,
  type DietTypeOption,
  type OriginOption,
} from "./IntakeForm";
import { isValidMicrochip, stripToDigits } from "@/lib/residents/microchip";
import { parseStepParam } from "./steps";
import { canTagNote } from "@/lib/note-tags/can";

export default async function NewResidentPage(
  props: PageProps<"/residents/new">,
) {
  const { perms } = await requirePermission("resident.register");
  const supabase = await createClient();
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;
  const initialStep = parseStepParam(searchParams.step);
  // From the scan box on /residents: an unknown chip, prefilled.
  const rawChip = typeof searchParams.chip === "string" ? stripToDigits(searchParams.chip) : "";
  const chip = isValidMicrochip(rawChip) ? rawChip : null;

  // Zones and enclosures come from the same loader as Move, with each
  // enclosure's headcount, so intake's capacity warning can't disagree
  // with the other placement screens about what "full" means.
  // Every resident the login can read, departed and dead included, for the
  // name warning (#dupnm): half its value is "is this the same animal coming
  // back?". A read the login cannot make just leaves the warning quiet.
  const [options, originsResult, dietTypesResult, existingResult] = await Promise.all([
    loadEnclosureOptions(supabase),
    supabase
      .from("group_origins")
      .select("id, name")
      .order("date", { ascending: false })
      .returns<OriginOption[]>(),
    supabase
      .from("picker_diets")
      .select("id, name, name_th, is_standard")
      .order("name")
      .returns<(DietTypeOption & { name_th: string | null })[]>(),
    supabase
      .from("resident_list_view")
      .select("resident_code, name, thai_name, other_names, current_status")
      .returns<{ resident_code: string | null; name: string; thai_name: string | null; other_names: string | null; current_status: string | null }[]>(),
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
        canTagNotes={canTagNote(perms, ["resident.register"])}
        zones={options.zones}
        enclosures={options.enclosures}
        origins={origins}
        dietTypes={(dietTypesResult.data ?? []).map(({ name_th, ...type }) => ({
          ...type,
          name: localLabel(locale, type.name, name_th),
        }))}
        initialStep={initialStep}
        chip={chip}
        existingResidents={(existingResult.data ?? []).map((r) => ({
          code: r.resident_code,
          name: r.name,
          thaiName: r.thai_name,
          otherNames: r.other_names,
          status: r.current_status,
        }))}
      />
    </main>
  );
}
