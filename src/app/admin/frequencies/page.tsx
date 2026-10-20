import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { compareSchedules, type FrequencySchedule } from "@/lib/prescriptions/frequency";
import { describeSchedule } from "@/lib/prescriptions/frequency";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { requirePermission } from "@/lib/permissions/require";

export default async function FrequenciesPage() {
  await requirePermission("reference.types");
  const { t } = await getT();

  const supabase = await createClient();
  const [frequenciesResult, prescriptionsResult] = await Promise.all([
    supabase
      .from("frequency")
      .select("id, label, label_th, doses_per_day, interval_count, interval_unit")
      .returns<(FrequencySchedule & { id: string; label: string; label_th: string | null })[]>(),
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
  const frequencies = (frequenciesResult.data ?? [])
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

        {frequencies.length === 0 ? (
          <p className="text-sm text-muted">{f.table.noFrequencies}</p>
        ) : (
          <table className="w-full max-w-2xl text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">{f.table.label}</th>
                <th className="py-2 pr-4 font-medium">{f.table.schedule}</th>
                <th className="py-2 font-medium">{f.table.prescriptions}</th>
              </tr>
            </thead>
            <tbody>
              {frequencies.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-2 pr-4 text-foreground">{row.label}</td>
                  <td className="py-2 pr-4 text-foreground">{describeSchedule(t, row)}</td>
                  <td className="py-2 text-foreground">{f.table.prescriptionCount(row.prescription_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </LargerScreenNotice>
    </main>
  );
}
