import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { compareSchedules, type FrequencySchedule } from "@/lib/prescriptions/frequency";
import { CreateFrequencyForm } from "./CreateFrequencyForm";
import { FrequenciesTable, type FrequencyRow } from "./FrequenciesTable";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

export default async function FrequenciesPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [frequenciesResult, prescriptionsResult] = await Promise.all([
    supabase
      .from("frequency")
      .select("id, label, doses_per_day, interval_count, interval_unit")
      .returns<(FrequencySchedule & { id: string; label: string })[]>(),
    // One row per prescription is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase
      .from("prescriptions")
      .select("frequency_id")
      .returns<{ frequency_id: string | null }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of prescriptionsResult.data ?? []) {
    if (row.frequency_id) {
      counts.set(row.frequency_id, (counts.get(row.frequency_id) ?? 0) + 1);
    }
  }
  const frequencies: FrequencyRow[] = (frequenciesResult.data ?? [])
    .map((frequency) => ({
      ...frequency,
      prescription_count: counts.get(frequency.id) ?? 0,
    }))
    .sort((a, b) => compareSchedules(a, b) || a.label.localeCompare(b.label));

  const f = t.admin.frequencies;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{f.title}</h1>
        <p className="text-sm text-muted">{f.subtitle}</p>
      </div>

      <LargerScreenNotice>
        {frequenciesResult.error && (
          <p className="text-sm text-danger">
            {f.couldntLoad}: {frequenciesResult.error.message}
          </p>
        )}
        {prescriptionsResult.error && (
          <p className="text-sm text-danger">
            {f.couldntLoadUsage}: {prescriptionsResult.error.message}
          </p>
        )}

        <CreateFrequencyForm />
        <FrequenciesTable frequencies={frequencies} />
      </LargerScreenNotice>
    </main>
  );
}
