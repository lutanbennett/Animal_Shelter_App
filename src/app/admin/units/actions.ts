"use server";

import { refresh, revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadPermissions } from "@/lib/permissions/load";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { unitKey } from "@/lib/unit-list";

// Settings → Units (0252): the units of measure an ingredient or a medicine is counted in. Written only by
// canEditItemSettings (the table's own write policy asks the same). Units are archived, never deleted.
//
// PI FAILOVER (C), 2026-10-31: all three writes on this page go through runWriteAction(), which is why
// "/admin/units" is on WRAPPED_WRITE_PATHS (src/lib/write-requests.ts) and the Worker may replay a save
// the Pi did not clearly answer. THE RULE: if a fourth write is ever added here, it goes through
// runWriteAction() too, or the path comes off that list -- a write the Worker replays without a claimed
// request id is the #250 double write. docs/decisions/2026-10-31-write-request-wrapper.md.
//
// RENAMING a unit that rows already use is REFUSED, not cascaded (docs/decisions/2026-10-23-units-of-measure-app.md):
// diet_types.unit and medication.dose_unit store the NAME as text, a rename cannot be one transaction from here
// (no migration this stream, and PostgREST has no multi-table transaction), and a half-applied rename or a "g"
// renamed "kg" would silently change what a stored amount means. The Thai name is display only and always editable.

const refuse = (error: string) => ({ ok: false as const, error });

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

export type UnitFormState = ActionResult<{ success: string }> | undefined;

export type UnitFields = {
  name: string;
  nameTh: string;
  forIngredients: boolean;
  forMedicines: boolean;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

async function refusal() {
  const perms = await loadPermissions();
  if (canEditItemSettings(perms, "diet") || canEditItemSettings(perms, "medication")) return null;
  const { t } = await getT();
  return refuse(t.admin.security.errors.adminAccessRequired);
}

function revalidateUnitPages() {
  revalidatePath("/admin", "layout");
  revalidatePath("/management/diets");
  revalidatePath("/management/medications");
  revalidatePath("/prescriptions/new");
  revalidatePath("/stocktake");
  revalidatePath("/deliveries");
  refresh();
}

type Use = { ingredients: string[]; medicines: string[] };

/** Every ingredient and medicine whose stored unit is this name (case-insensitive, as the trigger matches). */
async function usesOf(name: string): Promise<Use> {
  const supabase = await createClient();
  const [diet, med] = await Promise.all([
    supabase.from("diet_types").select("name, unit").returns<{ name: string; unit: string }[]>(),
    supabase.from("medication").select("name, dose_unit").returns<{ name: string; dose_unit: string }[]>(),
  ]);
  if (diet.error) throw new Error(diet.error.message);
  if (med.error) throw new Error(med.error.message);
  const key = unitKey(name);
  return {
    ingredients: (diet.data ?? []).filter((r) => unitKey(r.unit) === key).map((r) => r.name),
    medicines: (med.data ?? []).filter((r) => unitKey(r.dose_unit) === key).map((r) => r.name),
  };
}

/** "3 ingredients, 1 medicine (Egg, Rice, Chicken, Aspirin)": which rows, in the app's words. */
function where(t: Dictionary, use: Use, only?: "ingredients" | "medicines") {
  const ingredients = only === "medicines" ? [] : use.ingredients;
  const medicines = only === "ingredients" ? [] : use.medicines;
  const names = [...ingredients, ...medicines].sort((a, b) => a.localeCompare(b));
  const shown = names.length > 8 ? `${names.slice(0, 8).join(", ")}…` : names.join(", ");
  return `${t.admin.units.table.usage(ingredients.length, medicines.length)} (${shown})`;
}

const inUse = (use: Use) => use.ingredients.length + use.medicines.length > 0;

function isDuplicate(message: string) {
  return message.includes("units_name_lower_key");
}

export async function createUnit(_state: UnitFormState, formData: FormData): Promise<UnitFormState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction(
    "units.createUnit",
    write(t),
    { id: writeRequestIdFrom(formData), action: "units.createUnit", db: supabase },
    async () => {
      const refused = await refusal();
      if (refused) return refused;
      const e = t.admin.units.errors;
      const name = optional(formData.get("name"));
      if (!name) return refuse(e.nameRequired);
      const tag = optional(formData.get("usedFor"));
      const forIngredients = tag === "ingredients" || tag === "both";
      const forMedicines = tag === "medicines" || tag === "both";
      if (!forIngredients && !forMedicines) return refuse(e.tagRequired);

      const { data: last } = await supabase
        .from("units")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle<{ sort_order: number }>();
      const { error } = await supabase.from("units").insert({
        name,
        name_th: optional(formData.get("nameTh")),
        for_ingredients: forIngredients,
        for_medicines: forMedicines,
        sort_order: (last?.sort_order ?? 0) + 10,
      });
      if (error) return refuse(isDuplicate(error.message) ? e.nameTaken(name) : error.message);

      revalidateUnitPages();
      return { ok: true, success: t.admin.units.created(name) };
    },
  );
}

/** Rename (refused while in use), Thai name, and the tags (refused for a list the unit is still in use on). */
export async function updateUnit(id: string, requestId: string, fields: UnitFields): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("units.updateUnit", write(t), { id: requestId, action: "units.updateUnit", db: supabase }, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const e = t.admin.units.errors;
    const name = optional(fields.name);
    if (!name) return refuse(e.nameRequired);
    if (!fields.forIngredients && !fields.forMedicines) return refuse(e.tagRequired);

    const { data: current } = await supabase
      .from("units")
      .select("name, for_ingredients, for_medicines")
      .eq("id", id)
      .maybeSingle<{ name: string; for_ingredients: boolean; for_medicines: boolean }>();
    if (!current) return refuse(e.notFound);

    const use = await usesOf(current.name);
    if (name !== current.name && inUse(use)) return refuse(e.renameInUse(current.name, where(t, use)));
    if (current.for_ingredients && !fields.forIngredients && use.ingredients.length > 0) {
      return refuse(e.untagInUse(current.name, t.admin.units.tags.ingredients, where(t, use, "ingredients")));
    }
    if (current.for_medicines && !fields.forMedicines && use.medicines.length > 0) {
      return refuse(e.untagInUse(current.name, t.admin.units.tags.medicines, where(t, use, "medicines")));
    }

    const { error } = await supabase
      .from("units")
      .update({
        name,
        name_th: optional(fields.nameTh),
        for_ingredients: fields.forIngredients,
        for_medicines: fields.forMedicines,
      })
      .eq("id", id);
    if (error) return refuse(isDuplicate(error.message) ? e.nameTaken(name) : error.message);

    revalidateUnitPages();
    return { ok: true };
  });
}

/** Archive refuses while any ingredient or medicine still has the unit, naming them; restore always works. */
export async function setUnitArchived(id: string, requestId: string, archived: boolean): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("units.setUnitArchived", write(t), { id: requestId, action: "units.setUnitArchived", db: supabase }, async () => {
    const refused = await refusal();
    if (refused) return refused;
    const { data: current } = await supabase.from("units").select("name").eq("id", id).maybeSingle<{ name: string }>();
    if (!current) return refuse(t.admin.units.errors.notFound);

    if (archived) {
      const use = await usesOf(current.name);
      if (inUse(use)) return refuse(t.admin.units.errors.archiveInUse(current.name, where(t, use)));
    }
    const { error } = await supabase
      .from("units")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return refuse(error.message);

    revalidateUnitPages();
    return { ok: true };
  });
}
