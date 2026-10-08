import type { SupabaseClient } from "@supabase/supabase-js";

/** The two lists with a cupboard order (0161): medicines and foods. */
export type CupboardTable = "medication" | "diet_types";

/** The order the stocktake sheet and the stock pages read: sort_order, then name. */
export function byCupboardOrder<T extends { sort_order: number | null; name: string }>(a: T, b: T) {
  return (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || a.name.localeCompare(b.name);
}

/**
 * Move one item a place up or down the cupboard order. The whole list is
 * renumbered 1…n in its current order first, as Management → Shelter
 * Friends' moveFriend does, so two items that share a number (two adds at
 * once; 0161's trigger only takes max + 1) still move by exactly one place.
 * Only rows whose number changes are written: a few dozen at shelter scale.
 */
export async function moveInCupboardOrder(
  supabase: SupabaseClient,
  table: CupboardTable,
  id: string,
  direction: "up" | "down",
): Promise<{ error: string | null }> {
  const { data: rows, error: loadError } = await supabase
    .from(table)
    .select("id, name, sort_order")
    .returns<{ id: string; name: string; sort_order: number | null }[]>();
  if (loadError) return { error: loadError.message };
  if (!rows) return { error: null };

  const ordered = [...rows].sort(byCupboardOrder);
  const index = ordered.findIndex((r) => r.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ordered.length) return { error: null };
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  const changed = ordered
    .map((row, i) => ({ row, position: i + 1 }))
    .filter(({ row, position }) => row.sort_order !== position);
  const results = await Promise.all(
    changed.map(({ row, position }) => supabase.from(table).update({ sort_order: position }).eq("id", row.id)),
  );
  const failed = results.find((r) => r.error);
  return { error: failed?.error?.message ?? null };
}
