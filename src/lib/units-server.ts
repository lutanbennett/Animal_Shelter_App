import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONVERSION_COLUMNS,
  groupConversions,
  type ConversionRow,
  type ItemKind,
  type UnitConversion,
} from "@/lib/units";

/** Cost per base unit of each item's latest priced delivery (view item_latest_delivery_cost, 0199), keyed by item id. */
export async function loadDeliveryCosts(
  supabase: SupabaseClient,
  kind: ItemKind,
): Promise<Record<string, { costPerBase: number; receivedAt: string }>> {
  const column = kind === "medication" ? "medication_id" : "diet_type_id";
  const { data } = await supabase
    .from("item_latest_delivery_cost")
    .select(`${column}, cost_per_base_unit, received_at`)
    .not(column, "is", null)
    .returns<Record<string, string | number>[]>();
  const out: Record<string, { costPerBase: number; receivedAt: string }> = {};
  for (const row of data ?? []) {
    out[String(row[column])] = { costPerBase: Number(row.cost_per_base_unit), receivedAt: String(row.received_at) };
  }
  return out;
}

/**
 * Every conversion for the items of one kind (or for the listed ids), keyed
 * by item id. Called when a row is about to be WRITTEN, so the factor it
 * stamps is the one in force now; never to read an old row back (0118).
 */
export async function loadConversions(
  supabase: SupabaseClient,
  kind: ItemKind,
  ids?: string[],
): Promise<{ data: Record<string, UnitConversion[]>; error: string | null }> {
  const column = kind === "medication" ? "medication_id" : "diet_type_id";
  let query = supabase.from("item_unit_conversions").select(CONVERSION_COLUMNS).not(column, "is", null);
  if (ids) query = query.in(column, ids);
  const { data, error } = await query.returns<ConversionRow[]>();
  return { data: groupConversions(data ?? []), error: error?.message ?? null };
}
