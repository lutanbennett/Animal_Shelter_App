"use server";

import { refresh, revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { hasTwoStep } from "@/lib/auth/two-step";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type StocktakingArea = "food" | "medical";

const COLUMN: Record<StocktakingArea, "stocktaking_food_enabled" | "stocktaking_medical_enabled"> = {
  food: "stocktaking_food_enabled",
  medical: "stocktaking_medical_enabled",
};

/**
 * Settings → Stocktaking: turn one area's switch on or off. Admin at 2-step, checked here for the
 * words and again by the database (0254's site_content_stocktaking_guard), which is the real lock.
 * Writes nothing else on the row, so no website field is touched.
 */
export async function setStocktakingSwitch(area: StocktakingArea, enabled: boolean): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.stocktaking.errors;
  return runAction("stocktaking.setSwitch", t.common.somethingWentWrong, async () => {
    if (!(area in COLUMN)) return { ok: false, error: e.unknownArea };
    if (!(await hasAdminRole())) return { ok: false, error: e.adminOnly };
    if (!(await hasTwoStep())) return { ok: false, error: e.twoStep };

    const supabase = await createClient();
    const { error } = await supabase
      .from("site_content")
      .update({ [COLUMN[area]]: enabled })
      .eq("id", true);
    if (error) return databaseFailure("stocktaking.setSwitch", error, t.common);

    // Everything that forecasts or lists stock reads the switch.
    for (const path of [
      "/admin/stocktaking",
      "/management/purchasing",
      "/management/diets",
      "/management/medications",
      "/stocktake",
    ]) {
      revalidatePath(path);
    }
    refresh();
    return { ok: true };
  });
}
