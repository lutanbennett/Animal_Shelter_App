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

type DietTypeQueryRow = Omit<DietDefinitionRow, "diet_count" | "daily_qty_small" | "daily_qty_medium" | "daily_qty_large"> & {
  daily_qty_small: number | string;
  daily_qty_medium: number | string;
  daily_qty_large: number | string;
};

/**
 * Settings → Diets: the food list as the diet form's picker offers it — name,
 * unit, the daily quantity for each size, notes, the standard diet and the
 * units each is bought and counted in. Split from Management on 2026-10-08
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

  const [typesResult, dietsResult, conversions] = await Promise.all([
    supabase
      .from("diet_types")
      .select("id, name, name_th, unit, daily_qty_small, daily_qty_medium, daily_qty_large, notes, is_standard")
      .order("name")
      .returns<DietTypeQueryRow[]>(),
    // One row per resident diet is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase.from("resident_diets").select("diet_type_id").returns<{ diet_type_id: string }[]>(),
    loadConversions(supabase, "diet"),
  ]);

  const counts = new Map<string, number>();
  for (const row of dietsResult.data ?? []) {
    counts.set(row.diet_type_id, (counts.get(row.diet_type_id) ?? 0) + 1);
  }
  const dietTypes: DietDefinitionRow[] = (typesResult.data ?? []).map((type) => ({
    ...type,
    daily_qty_small: Number(type.daily_qty_small),
    daily_qty_medium: Number(type.daily_qty_medium),
    daily_qty_large: Number(type.daily_qty_large),
    diet_count: counts.get(type.id) ?? 0,
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
        {dietsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoadUsage}: {dietsResult.error.message}
          </p>
        )}

        <section className="flex flex-col gap-4">
          {typesResult.data && !dietTypes.some((type) => type.is_standard) && (
            <p className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
              {m.standard.none}
            </p>
          )}
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
