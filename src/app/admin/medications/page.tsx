import { ActionLink } from "@/components/ActionLink";
import { Boxes } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { UnitsPanel } from "@/components/UnitsPanel";
import { doseUnitLabel } from "@/lib/i18n/enum-labels";
import { loadConversions } from "@/lib/units-server";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { CreateMedicationForm } from "./CreateMedicationForm";
import { MedicationsTable, type MedicationDefinitionRow } from "./MedicationsTable";

/**
 * Settings → Medications: the medication list as the prescription form's
 * picker offers it — name, dose unit, merging duplicates and the units each
 * is bought and counted in. Split from Management on 2026-10-08
 * (docs/decisions/2026-10-07-management-settings-split.md); the stock half,
 * with prices, counts, labels and the forecast, is /management/medications.
 *
 * Admin only (item-settings.ts). The Director's, at her desk: the
 * desktop-only notice stands.
 */
export default async function MedicationSettingsPage() {
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "medication")) refuseFor(perms);
  const { t } = await getT();

  const [medicationsResult, prescriptionsResult, conversions] = await Promise.all([
    supabase
      .from("medication")
      .select("id, name, dose_unit")
      .order("name")
      .returns<{ id: string; name: string; dose_unit: string }[]>(),
    // One row per prescription is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase.from("prescriptions").select("medication_id").returns<{ medication_id: string }[]>(),
    loadConversions(supabase, "medication"),
  ]);

  const counts = new Map<string, number>();
  for (const row of prescriptionsResult.data ?? []) {
    counts.set(row.medication_id, (counts.get(row.medication_id) ?? 0) + 1);
  }
  const medications: MedicationDefinitionRow[] = (medicationsResult.data ?? []).map((row) => ({
    ...row,
    prescription_count: counts.get(row.id) ?? 0,
  }));

  const m = t.management.medications;
  const s = t.admin.medications;

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.subtitle}</p>
        {/*
          The page's actions row. The cupboard-order screen (batch 73, medication.sort_order from
          0161) gets its link here, beside the way back to the stock half.
        */}
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionLink href="/management/medications" label={s.stockLink} icon={Boxes} iconOnlyOnMobile={false} />
        </div>
      </div>

      <LargerScreenNotice>
        {medicationsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoad}: {medicationsResult.error.message}
          </p>
        )}
        {prescriptionsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoadUsage}: {prescriptionsResult.error.message}
          </p>
        )}

        <section className="flex flex-col gap-4">
          <CreateMedicationForm />
          <MedicationsTable medications={medications} />
        </section>

        {conversions.error && (
          <p className="text-sm text-danger">
            {t.units.title}: {conversions.error}
          </p>
        )}
        <UnitsPanel
          kind="medication"
          mode="conversions"
          items={medications.map((medication) => ({
            id: medication.id,
            name: medication.name,
            baseUnit: doseUnitLabel(t, medication.dose_unit),
            conversions: conversions.data[medication.id] ?? [],
            costPerBase: null,
          }))}
        />
      </LargerScreenNotice>
    </main>
  );
}
