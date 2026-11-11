import Link from "next/link";
import { dbRefusal } from "@/lib/db-refusal";
import { getT } from "@/lib/i18n/get-t";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { CorrectIntakeDateForm } from "./CorrectIntakeDateForm";

/**
 * Settings → Correct an intake date. Finds a resident by name or code, shows the intake date and the records that
 * move with it, and saves the corrected date through correct_intake_date() (0302), which asks
 * resident.correct_intake_date. The page asks the same activity, and so does the Save control.
 * docs/decisions/2026-11-02-intake-date-correction.md
 */

type Found = { id: string; name: string; resident_code: string | null; intake_date: string | null };

type Records = {
  name: string;
  resident_code: string | null;
  intake_date: string;
  age_estimated_on: string | null;
  age_moves: boolean;
  placement: { start_date: string; place: string | null } | null;
  diets: { name: string; start_date: string }[];
  weights: { date: string; weight_kg: number }[];
};

export default async function IntakeDatePage({ searchParams }: { searchParams: Promise<{ q?: string; id?: string }> }) {
  const { supabase, perms } = await requirePermission("resident.correct_intake_date");
  const { t } = await getT();
  const s = t.admin.intakeDate;
  const { q = "", id = "" } = await searchParams;
  const term = q.trim().replace(/[%,()]/g, " ").trim();

  let found: Found[] = [];
  if (term && !id) {
    const { data } = await supabase
      .from("residents")
      .select("id, name, resident_code, intake_date")
      .or(`name.ilike.%${term}%,resident_code.ilike.%${term}%`)
      .order("name")
      .limit(12)
      .returns<Found[]>();
    found = data ?? [];
  }

  let records: Records | null = null;
  let loadError: string | null = null;
  if (id) {
    const { data, error } = await supabase.rpc("correct_intake_date", { p_resident_id: id, p_new_date: null, p_preview: true });
    if (error) loadError = dbRefusal("intakeDate.preview", error, t).error;
    else records = data as Records;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="max-w-3xl text-sm text-muted">{s.subtitle}</p>
      </div>

      <LargerScreenNotice>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="intake-q" className="text-sm font-medium text-muted">{s.searchLabel}</label>
            <input
              id="intake-q"
              name="q"
              defaultValue={q}
              placeholder={s.searchPlaceholder}
              className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button type="submit" className="min-h-11 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover md:min-h-0">
            {s.searchButton}
          </button>
        </form>

        {term && !id && found.length === 0 && <p className="text-sm text-muted">{s.noMatch}</p>}
        {found.length > 0 && (
          <ul className="flex max-w-xl flex-col divide-y divide-border rounded border border-border bg-surface">
            {found.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/intake-date?id=${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-background">
                  <span className="font-medium text-foreground">{r.name}{r.resident_code ? ` (${r.resident_code})` : ""}</span>
                  <span className="text-muted">{r.intake_date ?? s.noIntakeDate}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {loadError && <p className="text-sm text-danger">{loadError}</p>}
        {records && (
          <section className="flex max-w-2xl flex-col gap-4 rounded border border-border bg-surface p-4">
            <h2 className="text-lg font-semibold text-foreground">
              {records.name}{records.resident_code ? ` (${records.resident_code})` : ""}
            </h2>
            <p className="text-sm text-foreground">
              {s.currentIntake}: <strong>{records.intake_date}</strong>
            </p>
            <div>
              <h3 className="text-sm font-medium text-muted">{s.willMove}</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                <li>{s.recordIntake(records.intake_date)}</li>
                {records.age_moves && <li>{s.recordAge(records.intake_date)}</li>}
                {records.placement && <li>{s.recordPlacement(records.placement.place, records.placement.start_date)}</li>}
                {records.diets.map((d, i) => <li key={`d${i}`}>{s.recordDiet(d.name, d.start_date)}</li>)}
                {records.weights.map((w, i) => <li key={`w${i}`}>{s.recordWeight(w.weight_kg, w.date)}</li>)}
              </ul>
            </div>
            <p className="text-xs text-muted">{s.leftAlone}</p>
            <CorrectIntakeDateForm
              residentId={id}
              currentDate={records.intake_date}
              canCorrect={can(perms, "resident.correct_intake_date")}
            />
          </section>
        )}
      </LargerScreenNotice>
    </main>
  );
}
