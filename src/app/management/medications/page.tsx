import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateMedicationForm } from "./CreateMedicationForm";
import { MedicationsTable, type MedicationRow } from "./MedicationsTable";
import { CreateFrequencyForm } from "./CreateFrequencyForm";
import { FrequenciesTable, type FrequencyRow } from "./FrequenciesTable";

type RequirementRow = {
  medication_id: string;
  prescription_count: number;
  resident_count: number;
  daily_quantity: number | string | null;
};

export default async function MedicationsAdminPage() {
  await requireManagementUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [medicationsResult, frequenciesResult, prescriptionsResult, requirementResult] =
    await Promise.all([
      supabase
        .from("medication")
        .select("id, name, dose_unit")
        .order("name")
        .returns<Pick<MedicationRow, "id" | "name" | "dose_unit">[]>(),
      supabase
        .from("frequency")
        .select("id, label, doses_per_day")
        .order("doses_per_day", { ascending: false, nullsFirst: false })
        .order("label")
        .returns<Pick<FrequencyRow, "id" | "label" | "doses_per_day">[]>(),
      // One row per prescription is cheap at shelter scale and gives both
      // reference counts (which gate the delete buttons) in one query.
      supabase
        .from("prescriptions")
        .select("medication_id, frequency_id")
        .returns<{ medication_id: string; frequency_id: string | null }[]>(),
      // What each medication is being consumed at today, across current
      // prescriptions for living, non-adopted residents (0027).
      supabase
        .from("medication_daily_requirement")
        .select("medication_id, prescription_count, resident_count, daily_quantity")
        .returns<RequirementRow[]>(),
    ]);

  const medicationCounts = new Map<string, number>();
  const frequencyCounts = new Map<string, number>();
  for (const row of prescriptionsResult.data ?? []) {
    medicationCounts.set(
      row.medication_id,
      (medicationCounts.get(row.medication_id) ?? 0) + 1,
    );
    if (row.frequency_id) {
      frequencyCounts.set(
        row.frequency_id,
        (frequencyCounts.get(row.frequency_id) ?? 0) + 1,
      );
    }
  }
  const requirements = new Map(
    (requirementResult.data ?? []).map((row) => [row.medication_id, row]),
  );

  const medications: MedicationRow[] = (medicationsResult.data ?? []).map(
    (medication) => {
      const requirement = requirements.get(medication.id);
      const daily = Number(requirement?.daily_quantity);
      return {
        ...medication,
        prescription_count: medicationCounts.get(medication.id) ?? 0,
        current_residents: requirement?.resident_count ?? 0,
        daily_quantity: Number.isFinite(daily) && daily > 0 ? daily : null,
      };
    },
  );
  const frequencies: FrequencyRow[] = (frequenciesResult.data ?? []).map(
    (frequency) => ({
      ...frequency,
      doses_per_day:
        frequency.doses_per_day == null ? null : Number(frequency.doses_per_day),
      prescription_count: frequencyCounts.get(frequency.id) ?? 0,
    }),
  );

  const m = t.management.medications;

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
      </div>

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
      {requirementResult.error && (
        <p className="text-sm text-danger">
          {m.couldntLoadRequirement}: {requirementResult.error.message}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <CreateMedicationForm />
        <MedicationsTable medications={medications} />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {m.frequenciesHeading}
          </h2>
          <p className="text-sm text-muted">{m.frequenciesIntro}</p>
        </div>
        {frequenciesResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoadFrequencies}: {frequenciesResult.error.message}
          </p>
        )}
        <CreateFrequencyForm />
        <FrequenciesTable frequencies={frequencies} />
      </section>
    </main>
  );
}
