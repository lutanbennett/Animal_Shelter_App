import { AlertTriangle } from "lucide-react";
import type { getDictionary } from "@/lib/i18n/get-dictionary";
import type { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate, todayIso } from "@/lib/format";
import { localLabel } from "@/lib/translations/labels";
import type { ForecastWindow } from "@/lib/management/forecast-window";

type TypeRow = {
  id: string;
  name: string;
  name_th: string | null;
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
};
type DueRow = { immunization_type_id: string };

/** Pages through a bounded read; the shelter has dozens of residents, not thousands. */
const LIMIT = 5000;

/**
 * Management → Medications, below the medicine cards: doses of each vaccine
 * due in the same windows, beside the doses held, with a warning where the
 * doses needed exceed them.
 *
 * Doses come from immunization_due_dates() (0183), the one place that works out
 * when a dose falls due; this adds nothing of its own to that arithmetic. See
 * docs/decisions/2026-10-11-vaccine-stock-forecast.md for the two cases it
 * leaves to this page: overdue doses (counted in every window, shown on their
 * own) and residents with no record of a vaccine (cannot be counted).
 */
export async function VaccineStockSection({
  supabase,
  windows,
  headings,
  t,
  locale,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  windows: ForecastWindow[];
  headings: string[];
  t: ReturnType<typeof getDictionary>;
  locale: Locale;
}) {
  const v = t.management.vaccines;
  const today = todayIso();

  const [typesResult, overdueResult, stateResult, ...dueResults] = await Promise.all([
    supabase
      .from("immunization_types")
      .select("id, name, name_th, stock_on_hand, stock_counted_at")
      .not("interval_months", "is", null)
      .order("name")
      .returns<TypeRow[]>(),
    // A resident's latest dose of each vaccine whose next due date has passed.
    supabase
      .from("immunization_next_due")
      .select("resident_id, immunization_type_id")
      .lt("next_due_date", today)
      .limit(LIMIT)
      .returns<{ resident_id: string; immunization_type_id: string }[]>(),
    supabase
      .from("resident_current_state")
      .select("resident_id, current_status")
      .in("current_status", ["Deceased", "Adopted"])
      .limit(LIMIT)
      .returns<{ resident_id: string }[]>(),
    ...windows.map(async (w) => {
      const { data, error } = await supabase
        .rpc("immunization_due_dates", { p_from: w.from, p_to: w.to })
        .limit(LIMIT);
      return { data: (data ?? []) as DueRow[], error };
    }),
  ]);

  const error =
    typesResult.error?.message ??
    overdueResult.error?.message ??
    stateResult.error?.message ??
    dueResults.find((r) => r.error)?.error?.message;

  // Same exclusion immunization_due_dates applies: Deceased and Adopted residents owe nothing.
  const gone = new Set((stateResult.data ?? []).map((r) => r.resident_id));
  const overdueBy = new Map<string, number>();
  for (const row of overdueResult.data ?? []) {
    if (gone.has(row.resident_id)) continue;
    overdueBy.set(row.immunization_type_id, (overdueBy.get(row.immunization_type_id) ?? 0) + 1);
  }
  const dueBy = dueResults.map((r) => {
    const m = new Map<string, number>();
    for (const row of r.data) m.set(row.immunization_type_id, (m.get(row.immunization_type_id) ?? 0) + 1);
    return m;
  });

  const rows = (typesResult.data ?? []).map((type) => {
    const stock = type.stock_on_hand == null ? null : Number(type.stock_on_hand);
    const overdue = overdueBy.get(type.id) ?? 0;
    return {
      id: type.id,
      name: localLabel(locale, type.name, type.name_th),
      stock,
      countedAt: type.stock_counted_at,
      overdue,
      windows: dueBy.map((m) => {
        const due = m.get(type.id) ?? 0;
        const needed = overdue + due;
        return { due, needed, short: stock == null ? null : Math.max(0, needed - stock) };
      }),
    };
  });

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{v.title}</h2>
        <p className="text-sm text-muted">{v.intro}</p>
      </div>
      {error && (
        <p className="text-sm text-danger">
          {v.couldntLoad}: {error}
        </p>
      )}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">{v.vaccine}</th>
              <th className="px-4 py-2 font-medium">{v.onHand}</th>
              <th className="px-4 py-2 font-medium">{v.overdue}</th>
              {headings.map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-foreground">{row.name}</td>
                <td className="px-4 py-2">
                  {row.stock == null ? (
                    <span className="text-muted">{v.notCounted}</span>
                  ) : (
                    <>
                      <span className="text-foreground">{row.stock}</span>
                      {row.countedAt && (
                        <span className="block text-xs text-muted">
                          {v.countedOn(formatDate(row.countedAt, locale))}
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-2 text-foreground">{row.overdue}</td>
                {row.windows.map((w, i) => (
                  <td key={headings[i]} className="px-4 py-2">
                    <span className="text-foreground">{v.doses(w.needed)}</span>
                    {w.short != null && w.short > 0 && (
                      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        {v.short(w.short)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3 + headings.length} className="px-4 py-6 text-center text-muted">
                  {v.none}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{v.note}</p>
    </section>
  );
}
