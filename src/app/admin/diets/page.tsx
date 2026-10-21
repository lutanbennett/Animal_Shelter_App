import { ActionLink } from "@/components/ActionLink";
import { Boxes } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { UnitsPanel } from "@/components/UnitsPanel";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { loadConversions } from "@/lib/units-server";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { CreateDietTypeForm } from "./CreateDietTypeForm";
import { DietTypesTable, type DietDefinitionRow } from "./DietTypesTable";
import { RecipesPanel, type RecipeIngredient, type RecipeRow } from "./RecipesPanel";

type DietTypeQueryRow = Omit<DietDefinitionRow, "recipe_count" | "record_count">;

/**
 * Settings → Diets: the diets (recipes of ingredients, 0239) and the
 * ingredients they are made of — name, unit, notes and the units each is
 * bought and counted in. Split from Management on 2026-10-08
 * (docs/decisions/2026-10-07-management-settings-split.md); the stock half,
 * with cost, counts and the food forecast, is /management/diets.
 *
 * Admin only (item-settings.ts). The Director's, at her desk: the
 * desktop-only notice stands.
 */
export default async function DietSettingsPage() {
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "diet")) refuseFor(perms);
  const { t } = await getT();

  const [typesResult, recipesResult, linesResult, residentDietsResult, conversions] = await Promise.all([
    supabase
      .from("diet_types")
      .select("id, name, name_th, unit, notes")
      .order("name")
      .returns<DietTypeQueryRow[]>(),
    supabase
      .from("diets")
      .select("id, name, name_th, notes, is_standard")
      .order("name")
      .returns<{ id: string; name: string; name_th: string | null; notes: string | null; is_standard: boolean }[]>(),
    supabase
      .from("diet_ingredients")
      .select("diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large")
      .returns<
        {
          diet_id: string;
          diet_type_id: string;
          serving_unit: string | null;
          qty_small: number | string;
          qty_medium: number | string;
          qty_large: number | string;
        }[]
      >(),
    // One row per resident diet is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase
      .from("resident_diets")
      .select("diet_id")
      .returns<{ diet_id: string }[]>(),
    loadConversions(supabase, "diet"),
  ]);

  const recordsByDiet = new Map<string, number>();
  for (const row of residentDietsResult.data ?? []) {
    recordsByDiet.set(row.diet_id, (recordsByDiet.get(row.diet_id) ?? 0) + 1);
  }
  const recipeCounts = new Map<string, number>();
  // Resident records that reach an ingredient through a recipe that uses it.
  const recordsByType = new Map<string, number>();
  for (const line of linesResult.data ?? []) {
    recipeCounts.set(line.diet_type_id, (recipeCounts.get(line.diet_type_id) ?? 0) + 1);
    recordsByType.set(line.diet_type_id, (recordsByType.get(line.diet_type_id) ?? 0) + (recordsByDiet.get(line.diet_id) ?? 0));
  }
  const dietTypes: DietDefinitionRow[] = (typesResult.data ?? []).map((type) => ({
    ...type,
    recipe_count: recipeCounts.get(type.id) ?? 0,
    record_count: recordsByType.get(type.id) ?? 0,
  }));
  const ingredients: RecipeIngredient[] = dietTypes.map((type) => ({
    id: type.id,
    name: type.name,
    unit: type.unit,
    servingUnits: (conversions.data[type.id] ?? []).map((c) => c.unit),
  }));
  const recipes: RecipeRow[] = (recipesResult.data ?? []).map((recipe) => ({
    ...recipe,
    resident_count: recordsByDiet.get(recipe.id) ?? 0,
    lines: (linesResult.data ?? [])
      .filter((line) => line.diet_id === recipe.id)
      .map((line) => ({
        ingredientId: line.diet_type_id,
        servingUnit: line.serving_unit,
        small: Number(line.qty_small),
        medium: Number(line.qty_medium),
        large: Number(line.qty_large),
      })),
  }));

  const m = t.management.diets;
  const s = t.admin.diets;

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.subtitle}</p>
        {/*
          The page's actions row. The cupboard-order screen (batch 73, diet_types.sort_order from
          0161) gets its link here, beside the way back to the stock half.
        */}
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionLink href="/management/diets" label={s.stockLink} icon={Boxes} iconOnlyOnMobile={false} />
        </div>
      </div>

      <LargerScreenNotice>
        {typesResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoad}: {typesResult.error.message}
          </p>
        )}
        {(recipesResult.error ?? linesResult.error ?? residentDietsResult.error) && (
          <p className="text-sm text-danger">
            {m.couldntLoadUsage}: {(recipesResult.error ?? linesResult.error ?? residentDietsResult.error)?.message}
          </p>
        )}

        <RecipesPanel recipes={recipes} ingredients={ingredients} />

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">{s.ingredientsTitle}</h2>
          <p className="text-sm text-muted">{s.ingredientsHint}</p>
          <CreateDietTypeForm />
          <DietTypesTable dietTypes={dietTypes} />
        </section>

        {conversions.error && (
          <p className="text-sm text-danger">
            {t.units.title}: {conversions.error}
          </p>
        )}
        <UnitsPanel
          kind="diet"
          mode="conversions"
          items={dietTypes.map((type) => ({
            id: type.id,
            name: type.name,
            baseUnit: dietUnitLabel(t, type.unit),
            conversions: conversions.data[type.id] ?? [],
            costPerBase: null,
          }))}
        />
      </LargerScreenNotice>
    </main>
  );
}
