import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { compareSchedules, type FrequencySchedule } from "@/lib/prescriptions/frequency";
import { CreateMedicationForm } from "./CreateMedicationForm";
import { MedicationsTable, type MedicationRow } from "./MedicationsTable";
import { CreateFrequencyForm } from "./CreateFrequencyForm";
import { FrequenciesTable, type FrequencyRow } from "./FrequenciesTable";
import { ForecastWindowPicker } from "@/components/ForecastWindowPicker";
import { formatDate } from "@/lib/format";
import { forecastWindows, parseCustomWindow } from "@/lib/management/forecast-window";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

type MedicationQueryRow = {
  id: string;
  name: string;
  dose_unit: string;
  // numeric(12, 2): PostgREST normally hands this back as a JSON number, but
  // ForecastRow below shows it can arrive as a string, so it is normalised
  // once here rather than guessed at in the table.
  cost_per_unit: number | string | null;
};

type ForecastRow = {
  medication_id: string;
  prescription_count: number;
  resident_count: number;
  dose_count: number;
  quantity: number | string | null;
};

export default async function MedicationsAdminPage(props: PageProps<"/management/medications">) {
  await requireManagementUser();
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;

  // The fixed 7 / 30-day columns, plus a custom From/To window from the
  // picker when the query string carries one.
  const custom = parseCustomWindow(searchParams);
  const windows = forecastWindows(custom && "window" in custom ? custom.window : null);

  const supabase = await createClient();
  const [medicationsResult, frequenciesResult, prescriptionsResult, ...forecastResults] =
    await Promise.all([
      supabase
        .from("medication")
        .select("id, name, dose_unit, cost_per_unit")
        .order("name")
        .returns<MedicationQueryRow[]>(),
      supabase
        .from("frequency")
        .select("id, label, doses_per_day, interval_count, interval_unit")
        .returns<(FrequencySchedule & { id: string; label: string })[]>(),
      // One row per prescription is cheap at shelter scale and gives both
      // reference counts (which gate the delete buttons) in one query.
      supabase
        .from("prescriptions")
        .select("medication_id, frequency_id")
        .returns<{ medication_id: string; frequency_id: string | null }[]>(),
      // Whole doses due in each window, from each prescription's own start
      // date (0044) — a weekly tablet is counted on the days it falls.
      ...windows.map(async (window) => {
        const { data, error } = await supabase.rpc("medication_forecast", {
          p_from: window.from,
          p_to: window.to,
        });
        return { data: (data ?? null) as ForecastRow[] | null, error };
      }),
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
  const forecasts = forecastResults.map(
    (result) => new Map((result.data ?? []).map((row) => [row.medication_id, row])),
  );

  const medications: MedicationRow[] = (medicationsResult.data ?? []).map(
    (medication) => ({
      ...medication,
      cost_per_unit:
        medication.cost_per_unit == null ? null : Number(medication.cost_per_unit),
      prescription_count: medicationCounts.get(medication.id) ?? 0,
      forecast: forecasts.map((byMedication) => {
        const row = byMedication.get(medication.id);
        return {
          residents: row?.resident_count ?? 0,
          doses: row?.dose_count ?? 0,
          quantity: Number(row?.quantity ?? 0),
        };
      }),
    }),
  );
  const frequencies: FrequencyRow[] = (frequenciesResult.data ?? [])
    .map((frequency) => ({
      ...frequency,
      prescription_count: frequencyCounts.get(frequency.id) ?? 0,
    }))
    .sort((a, b) => compareSchedules(a, b) || a.label.localeCompare(b.label));

  const m = t.management.medications;
  const forecastError = forecastResults.find((r) => r.error)?.error;
  const forecastHeadings = windows.map((window) =>
    window.days != null
      ? m.table.forecastHeading(window.days)
      : t.management.forecastWindow.heading(
          formatDate(window.from, locale),
          formatDate(window.to, locale),
        ),
  );

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
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
        {forecastError && (
          <p className="text-sm text-danger">
            {m.couldntLoadForecast}: {forecastError.message}
          </p>
        )}

        <section className="flex flex-col gap-4">
          <CreateMedicationForm />
          <ForecastWindowPicker
            from={custom && "window" in custom ? custom.window.from : ""}
            to={custom && "window" in custom ? custom.window.to : ""}
            invalid={custom != null && "invalid" in custom}
          />
          <MedicationsTable medications={medications} forecastHeadings={forecastHeadings} />
          <p className="text-xs text-muted">{m.table.forecastNote}</p>
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
      </LargerScreenNotice>
    </main>
  );
}
