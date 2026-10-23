import { getT } from "@/lib/i18n/get-t";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { loadUnitList } from "@/lib/unit-list-server";
import { unitKey } from "@/lib/unit-list";
import { CreateUnitForm } from "./CreateUnitForm";
import { UnitsTable, type UnitTableRow } from "./UnitsTable";

/**
 * Settings → Units: the units of measure (the `units` table, 0252) that ingredients and medicines are
 * counted in. Replaces the hard-coded DIET_UNITS / DOSE_UNITS lists. Admin only, as the other item
 * settings are (item-settings.ts); the table's write policy asks the same.
 */
export default async function UnitsPage() {
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "diet") && !canEditItemSettings(perms, "medication")) refuseFor(perms);
  const { t } = await getT();

  const [units, diet, med] = await Promise.all([
    loadUnitList(),
    supabase.from("diet_types").select("unit").returns<{ unit: string }[]>(),
    supabase.from("medication").select("dose_unit").returns<{ dose_unit: string }[]>(),
  ]);

  const count = (rows: string[]) => {
    const counts = new Map<string, number>();
    for (const unit of rows) counts.set(unitKey(unit), (counts.get(unitKey(unit)) ?? 0) + 1);
    return counts;
  };
  const ingredientCounts = count((diet.data ?? []).map((r) => r.unit));
  const medicineCounts = count((med.data ?? []).map((r) => r.dose_unit));
  const rows: UnitTableRow[] = units.map((u) => ({
    ...u,
    ingredientCount: ingredientCounts.get(unitKey(u.name)) ?? 0,
    medicineCount: medicineCounts.get(unitKey(u.name)) ?? 0,
  }));

  const s = t.admin.units;
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="max-w-3xl text-sm text-muted">{s.subtitle}</p>
      </div>

      <LargerScreenNotice>
        {(diet.error || med.error) && (
          <p className="text-sm text-danger">
            {s.couldntLoadUsage}: {(diet.error ?? med.error)?.message}
          </p>
        )}
        <section className="flex flex-col gap-4">
          <CreateUnitForm />
          {rows.length === 0 ? <p className="text-sm text-muted">{s.noUnits}</p> : <UnitsTable units={rows} />}
          <p className="max-w-3xl text-xs text-muted">{s.renameNote}</p>
          <p className="max-w-3xl text-xs text-muted">{s.archiveNote}</p>
        </section>
      </LargerScreenNotice>
    </main>
  );
}
