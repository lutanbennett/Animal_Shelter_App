"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { loadPermissions } from "@/lib/permissions/load";
import { loadUnitList } from "@/lib/unit-list-server";
import { usableUnit } from "@/lib/unit-list";
import { normaliseDescription } from "@/lib/management/described-lines";

/**
 * Adds a typed description to Settings → Medications or → Diets and links every line that says the same words to the
 * new item, in one step (0308). The link is a record of what the line became: the lines still count toward NO stock
 * figure, and stock for the new item starts from its next stocktake.
 *
 * Asks what the two halves of it ask: stock.delivery (the update of the lines, the table's policy) and the
 * Settings write the item's own page asks (canEditItemSettings, as admin/medications and admin/diets do). It creates
 * the item through the same table, with the same unit-list rule, so nothing is granted that Settings does not grant.
 */
export async function promoteDescription(
  input: { target: "medication" | "diet"; key: string; lineIds: string[]; unit: string },
  requestId: string | null,
): Promise<ActionResult<{ name?: string; linked?: number }>> {
  const { t } = await getT();
  const e = t.deliveries.errors;
  const supabase = await createClient();
  return runWriteAction<{ name?: string; linked?: number }>(
    "deliveries.promoteDescription",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: requestId, action: "deliveries.promoteDescription", db: supabase },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "stock.delivery") || !canEditItemSettings(perms, input.target)) return { ok: false, error: e.promoteNotAuthorized };
      if (input.target !== "medication" && input.target !== "diet") return { ok: false, error: e.itemRequired };

      // The lines are read again here, never taken from the screen: only unlinked described lines with these words.
      const { data: rows, error: readError } = await supabase
        .from("stock_receipts")
        .select("id, description, unit, promoted_medication_id, promoted_diet_type_id")
        .eq("item_kind", "described")
        .is("promoted_medication_id", null)
        .is("promoted_diet_type_id", null)
        .returns<{ id: string; description: string | null; unit: string | null }[]>();
      if (readError) return { ok: false, error: `${e.failed}: ${readError.message}` };
      const matching = (rows ?? []).filter((r) => normaliseDescription(r.description ?? "") === input.key);
      if (matching.length === 0) return { ok: false, error: e.promoteGone };
      const name = (matching[0].description ?? "").trim().replace(/\s+/g, " ");

      const unit = usableUnit(await loadUnitList(), target(input.target), input.unit.trim() || matching[0].unit)?.name ?? null;
      if (!unit) return { ok: false, error: e.promoteUnitInvalid };

      const created =
        input.target === "medication"
          ? await supabase.from("medication").insert({ name, dose_unit: unit }).select("id").single<{ id: string }>()
          : await supabase.from("diet_types").insert({ name, unit }).select("id").single<{ id: string }>();
      if (created.error || !created.data) {
        // 23505: the name is already on the list. Say so in words rather than the raw constraint.
        return { ok: false, error: created.error?.code === "23505" ? e.promoteExists(name) : `${e.failed}: ${created.error?.message ?? ""}` };
      }

      const link = input.target === "medication" ? { promoted_medication_id: created.data.id } : { promoted_diet_type_id: created.data.id };
      const { error, count } = await supabase
        .from("stock_receipts")
        .update(link, { count: "exact" })
        .in("id", matching.map((r) => r.id));
      if (error) return { ok: false, error: `${e.failed}: ${error.message}` };

      revalidatePath("/deliveries");
      revalidatePath("/stocktake");
      revalidatePath("/admin/medications");
      revalidatePath("/admin/diets", "layout");
      revalidatePath("/management/medications");
      revalidatePath("/management/diets");
      return { ok: true, name, linked: count ?? matching.length };
    },
  );
}

function target(kind: "medication" | "diet") {
  return kind === "medication" ? "medicines" : "ingredients";
}
