import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ROW_COLUMNS,
  type TranslationQueueRow,
  type TranslationRow,
  type TranslationStatus,
} from "./types";

/** Translation rows for some records of one table, keyed by translationKey(). */
export type TranslationMap = Map<string, TranslationRow>;

export function translationKey(rowId: string, column: string) {
  return `${rowId}:${column}`;
}

export async function loadTranslations(
  supabase: SupabaseClient,
  table: string,
  rowIds: string[],
): Promise<TranslationMap> {
  const map: TranslationMap = new Map();
  if (rowIds.length === 0) return map;
  const { data } = await supabase
    .from("translations")
    .select(ROW_COLUMNS)
    .eq("table_name", table)
    .in("row_id", rowIds)
    .returns<TranslationRow[]>();
  for (const row of data ?? []) {
    map.set(translationKey(row.row_id, row.column_name), row);
  }
  return map;
}

/** The statuses a manager still has something to do about. */
export const OPEN_STATUSES: TranslationStatus[] = ["pending", "stale", "draft"];

/**
 * The manager's queue. Stale first — a wrong translation that is live
 * matters more than a missing one — then drafts, then pending; oldest
 * first within each so nothing sits at the bottom forever.
 */
export async function loadTranslationQueue(
  supabase: SupabaseClient,
  options: { includeApproved?: boolean } = {},
): Promise<{ rows: TranslationQueueRow[]; error: string | null }> {
  let query = supabase
    .from("translation_queue")
    .select(`${ROW_COLUMNS}, tier, record_label, record_path`)
    .order("updated_at", { ascending: true });
  if (!options.includeApproved) query = query.in("status", OPEN_STATUSES);
  const { data, error } = await query.returns<TranslationQueueRow[]>();
  const order: Record<TranslationStatus, number> = { stale: 0, draft: 1, pending: 2, approved: 3 };
  const rows = (data ?? []).sort((a, b) => order[a.status] - order[b.status]);
  return { rows, error: error?.message ?? null };
}

export async function countOpenTranslations(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("translations")
    .select("id", { count: "exact", head: true })
    .in("status", OPEN_STATUSES);
  return count ?? 0;
}
