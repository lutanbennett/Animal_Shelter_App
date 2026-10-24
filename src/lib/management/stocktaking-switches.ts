import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The two Stocktaking ON/OFF switches (0254, Lutan 2026-10-24): one for food
 * (diet ingredients) and one for medical (medications and vaccines), each
 * turned on without the other. Both default ON, so a missing row or a failed
 * read leaves today's behaviour in place rather than quietly hiding counts.
 *
 * While an area is OFF its forecasts assume nothing is in stock, no safety
 * stock is added, and "Not counted" is shown nowhere for it. Stored counts
 * are never touched; they are simply not used until the switch is back ON.
 * docs/decisions/2026-10-24-stocktaking-switches-app.md
 */
export type StocktakingSwitches = { food: boolean; medical: boolean };

export const ALL_ON: StocktakingSwitches = { food: true, medical: true };

/** The switch for an item kind as Purchasing and the stock pages name it. */
export function switchFor(switches: StocktakingSwitches, kind: "medication" | "diet" | "vaccine"): boolean {
  return kind === "diet" ? switches.food : switches.medical;
}

/** Whether the Stocktake page and the Do Stocktaking tile have anything to count. */
export function anyStocktaking(switches: StocktakingSwitches): boolean {
  return switches.food || switches.medical;
}

export async function loadStocktakingSwitches(supabase: SupabaseClient): Promise<StocktakingSwitches> {
  const { data } = await supabase
    .from("site_content")
    .select("stocktaking_food_enabled, stocktaking_medical_enabled")
    .maybeSingle<{ stocktaking_food_enabled: boolean; stocktaking_medical_enabled: boolean }>();
  return {
    food: data?.stocktaking_food_enabled ?? true,
    medical: data?.stocktaking_medical_enabled ?? true,
  };
}
