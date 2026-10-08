import { getT } from "@/lib/i18n/get-t";
import { loadTranslationQueue } from "@/lib/translations/queries";
import { labelPath, loadLabelTranslations, localLabel, type LabelItem, type LabelRow } from "@/lib/translations/labels";
import { placeName } from "@/lib/enclosures/names";
import { TranslationQueue, SHOWS, type Show } from "./TranslationQueue";
import { requirePermission } from "@/lib/permissions/require";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Management → Translations: one place for everything a reader of the
 * other language would otherwise see as typed. Two kinds, side by side:
 *  - prose (bios, stories, job descriptions): the `translations` queue the
 *    0056 triggers fill, approved in place with TranslationPanel;
 *  - labels (diet names, setup lists, places, website captions): every row
 *    of `label_translations()` (0166), written with set_label_th().
 * `?show=` is missing (default), stale or all. `?all=1`, the old link for
 * "show approved too", still opens All.
 */
export default async function TranslationsPage(props: PageProps<"/management/translations">) {
  const { supabase, perms } = await requirePermission("translations.manage");
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;
  const asked = typeof searchParams.show === "string" ? searchParams.show : null;
  const show: Show = SHOWS.includes(asked as Show) ? (asked as Show) : searchParams.all === "1" ? "all" : "missing";

  const [queue, labelResult] = await Promise.all([
    loadTranslationQueue(supabase, { includeApproved: true }),
    loadLabelTranslations(supabase),
  ]);
  const contexts = await labelContexts(supabase, labelResult.rows, locale);
  const labels: LabelItem[] = labelResult.rows.map((row) => ({
    ...row,
    path: labelPath(perms, row.table_name, row.row_id),
    context: contexts.get(`${row.table_name}:${row.row_id}`) ?? null,
  }));
  const error = queue.error ?? labelResult.error;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.translations.title}</h1>
        <p className="max-w-3xl text-sm text-muted">{t.translations.subtitle}</p>
      </div>

      {error && (
        <p className="text-sm text-danger">
          {t.translations.couldntLoad}: {error}
        </p>
      )}

      <TranslationQueue key={show} prose={queue.rows} labels={labels} show={show} />
    </main>
  );
}

/**
 * What tells two same-looking labels apart: which food or medicine a stock
 * unit ("bag (20 kg)") belongs to, which zone an enclosure is in. Best
 * effort — read as the translator, so a list they cannot read simply
 * leaves the label without one.
 */
async function labelContexts(supabase: SupabaseClient, rows: LabelRow[], locale: Locale) {
  const out = new Map<string, string>();
  const ids = (table: string) => rows.filter((r) => r.table_name === table).map((r) => r.row_id);

  const unitIds = ids("item_unit_conversions");
  if (unitIds.length > 0) {
    const { data } = await supabase
      .from("item_unit_conversions")
      .select("id, medication(name, name_th), diet_types(name, name_th)")
      .in("id", unitIds)
      .returns<
        {
          id: string;
          medication: { name: string; name_th: string | null } | null;
          diet_types: { name: string; name_th: string | null } | null;
        }[]
      >();
    for (const u of data ?? []) {
      const item = u.medication ?? u.diet_types;
      if (item) out.set(`item_unit_conversions:${u.id}`, localLabel(locale, item.name, item.name_th));
    }
  }

  const enclosureIds = ids("enclosures");
  if (enclosureIds.length > 0) {
    const { data } = await supabase
      .from("enclosures")
      .select("id, zones(name, name_th)")
      .in("id", enclosureIds)
      .returns<{ id: string; zones: { name: string; name_th: string | null } | null }[]>();
    for (const e of data ?? []) {
      if (e.zones) out.set(`enclosures:${e.id}`, placeName(locale, e.zones.name, e.zones.name_th));
    }
  }
  return out;
}
