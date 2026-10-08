import type { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/format";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type SpecialDietRow = {
  resident_id: string;
  diet_type_id: string;
};

/**
 * Residents on a special diet, as resident id → the names of their current
 * non-standard diets. "Current" is the hub's rule: start_date on or before
 * today at the shelter, end_date unset or on or after it. "Special" is a
 * current diet whose type is not the standard (0087).
 *
 * With no standard flagged (0087 allows zero) nobody is special: the
 * alternative, every resident with a diet marked, would bury the cards in
 * markers that mean nothing. Settings → Diets says so instead.
 *
 * `residentIds` narrows the read to one enclosure's residents; omit it for
 * the whole shelter. A role RLS keeps out of resident_diets gets an empty
 * map, not an error.
 */
export async function loadSpecialDiets(
  supabase: Supabase,
  residentIds?: string[],
): Promise<Map<string, string[]>> {
  const special = new Map<string, string[]>();
  if (residentIds && residentIds.length === 0) return special;

  // The type names come from the price-free picker view (0151), not an embed
  // on diet_types: an embed reads the table, which a login without the price
  // cell no longer sees, and an inner join would then drop every row.
  const { data: types } = await supabase
    .from("picker_diet_types")
    .select("id, name, is_standard")
    .returns<{ id: string; name: string; is_standard: boolean }[]>();
  if (!types?.some((t) => t.is_standard)) return special;
  const nameOf = new Map(types.filter((t) => !t.is_standard).map((t) => [t.id, t.name]));

  const today = todayIso();
  let query = supabase
    .from("resident_diets")
    .select("resident_id, diet_type_id")
    .in("diet_type_id", [...nameOf.keys()])
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`);
  if (residentIds) query = query.in("resident_id", residentIds);

  const { data } = await query.returns<SpecialDietRow[]>();
  for (const row of data ?? []) {
    const name = nameOf.get(row.diet_type_id);
    if (!name) continue;
    const names = special.get(row.resident_id) ?? [];
    if (!names.includes(name)) names.push(name);
    special.set(row.resident_id, names);
  }
  return special;
}
