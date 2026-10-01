import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONVERSION_COLUMNS,
  groupConversions,
  type ConversionRow,
  type ItemKind,
  type UnitConversion,
} from "@/lib/units";

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
