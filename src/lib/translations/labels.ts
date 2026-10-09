import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";
import type { Permissions } from "@/lib/permissions/can";
import { canOpen, routeFor } from "@/lib/permissions/routes";

/**
 * Short labels that carry their Thai in a paired `_th` column (0166):
 * diet names, setup lists, places, website captions. The registry is
 * `translatable_labels`; `label_translations()` reads every registered
 * label with its state and `set_label_th()` writes one. Prose (bios,
 * stories, job descriptions) is the other half and lives in
 * `translations` (./types.ts). docs/decisions/2026-10-08-label-translations-schema.md.
 */

/**
 *  - missing:  English present, Thai empty, the list is not optional
 *  - as_typed: Thai empty on an optional list (a drug or clinic name) — a deliberate answer, not a gap
 *  - stale:    Thai present, and the English changed after it was written (label_sources)
 *  - current:  Thai present and written against today's English
 */
export type LabelStatus = "missing" | "as_typed" | "stale" | "current";

/** A row of `label_translations()`. */
export type LabelRow = {
  table_name: string;
  row_id: string;
  column_name: string;
  th_column: string;
  label_group: string;
  optional: boolean;
  /** The English now. */
  source_text: string;
  text_th: string | null;
  /** The English the Thai was written against; differs from source_text when stale. */
  seen_source_text: string | null;
  status: LabelStatus;
};

/** One label as the page shows it: the row plus where it lives. */
export type LabelItem = LabelRow & {
  /** The label's own screen, when the viewer can open it. */
  path: string | null;
  /** Something to tell two same-named labels apart ("bag (20 kg)" of which food). */
  context: string | null;
};

export function labelKey(row: Pick<LabelRow, "table_name" | "row_id" | "column_name">) {
  return `${row.table_name}:${row.row_id}:${row.column_name}`;
}

export async function loadLabelTranslations(
  supabase: SupabaseClient,
): Promise<{ rows: LabelRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc("label_translations");
  return { rows: ((data ?? null) as LabelRow[] | null) ?? [], error: error?.message ?? null };
}

/**
 * Where each registered table's labels are typed, best first. The page
 * links to the first one the viewer can open; the Director holds
 * translations.manage but not every list (a setup list is Admin's), and a
 * link she would be turned away from is worse than none. A table
 * registered later with no entry here simply has no link — the label
 * still shows and can still be translated.
 */
const LABEL_SCREENS: Record<string, (rowId: string) => string[]> = {
  site_content: () => ["/admin/website"],
  site_content_photos: () => ["/admin/website"],
  impact_baselines: () => ["/admin/website"],
  project_folders: (id) => [`/projects/${id}`],
  zones: () => ["/admin/zones"],
  enclosures: () => ["/admin/enclosures"],
  diet_types: () => ["/management/diets", "/admin/diets"],
  medication: () => ["/management/medications", "/admin/medications"],
  item_unit_conversions: () => ["/management/diets", "/management/medications", "/admin/diets", "/admin/medications"],
  frequency: () => ["/admin/frequencies"],
  immunization_types: () => ["/admin/immunization-types"],
  procedure_types: () => ["/admin/procedure-types"],
  blood_test_types: () => ["/admin/blood-test-types"],
  vets: () => ["/management/vets", "/vets"],
  fixed_outgoings: () => ["/management/cashflow/fixed-outgoings", "/management/cashflow"],
  roles: () => ["/admin/security"],
};

export function labelPath(perms: Permissions | null, table: string, rowId: string): string | null {
  const candidates = LABEL_SCREENS[table]?.(rowId) ?? [];
  for (const path of candidates) {
    // A record's page (/projects/<id>) is gated by its list's route.
    const route = routeFor(path) ?? routeFor(path.split("/").slice(0, -1).join("/"));
    if (!route) {
      // Settings pages outside the registry (/admin/security) are Admin's.
      if (perms?.isAdmin) return path;
      continue;
    }
    if (canOpen(perms, route)) return path;
  }
  return null;
}

/**
 * The page's sections, in the order the item listed them. Groups come
 * from the data — a label's `label_group`, a prose row's table — so one
 * registered later appears with no code change, after these, in name
 * order.
 */
export const GROUP_ORDER = [
  "website",
  "residents",
  "projects",
  "diets",
  "medications",
  "units",
  "setup_lists",
  "places",
  "maintenance",
  "recurring_jobs",
  "friends",
  "money",
  "roles",
];

/** The section a prose row (a `translations` row) is filed under. */
export function proseGroup(table: string): string {
  switch (table) {
    case "residents":
      return "residents";
    case "project_folders":
    case "attachments":
      return "projects";
    case "maintenance":
      return "maintenance";
    case "recurring_jobs":
      return "recurring_jobs";
    case "site_pages":
      return "website";
    case "shelter_friends":
      return "friends";
    default:
      return table;
  }
}

export function sortGroups(keys: Iterable<string>): string[] {
  const rank = (k: string) => {
    const i = GROUP_ORDER.indexOf(k);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  return [...new Set(keys)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/**
 * A label in the reader's language: the Thai when it is set and the
 * reader reads Thai, the English otherwise. Empty strings count as unset.
 * (placeName() is the same rule plus the Lifecycle zone's special case.)
 */
export function localLabel(
  locale: Locale,
  english: string | null | undefined,
  thai: string | null | undefined,
): string {
  if (locale === "th" && thai?.trim()) return thai.trim();
  return english ?? "";
}

/** The page's filters (`?show=`): what nobody has written, what is out of date, everything. */
export type Show = "missing" | "stale" | "all";
export const SHOWS: Show[] = ["missing", "stale", "all"];
