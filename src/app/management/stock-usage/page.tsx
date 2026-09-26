import Link from "next/link";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import {
  departedDuring,
  editedSince,
  latestPairs,
  planWindow,
  shelterDate,
  readUsage,
  standsOut,
  stocktakePairs,
  stocktakeSessions,
  type Assignment,
  type CountPair,
  type CountRow,
  type UsageReading,
} from "@/lib/management/stock-usage";

/**
 * Management → Stock between counts. Each item's count history (0093)
 * against the plan (medication_forecast 0044, diet_forecast 0051) for the
 * same dates. What the comparison can honestly say — and why nothing here
 * is called "actual usage" — is in src/lib/management/stock-usage.ts.
 *
 * Default: each item's latest count against its last count on an earlier
 * day. `?from=<stocktake>&to=<stocktake>` compares two saved sheets
 * instead; a plain GET form, so the choice survives a reload and can be
 * sent as a link.
 */

type Kind = "medication" | "diet";

type HistoryRow = {
  stocktake_id: string;
  item_kind: "medication" | "diet_type";
  medication_id: string | null;
  diet_type_id: string | null;
  counted_quantity: number | string;
  unit: string;
  counted_at: string;
};

type ItemRow = { id: string; name: string; unit: string; stock_counted_at: string | null };

/** Forecast statuses each RPC leaves out (0044 / 0051). */
const EXCLUDED: Record<Kind, string[]> = {
  medication: ["Deceased", "Adopted"],
  diet: ["Deceased", "Adopted", "Fostered"],
};

type Line = {
  item: ItemRow;
  pair: CountPair;
  days: number | null;
  planned: number | null;
  reading: UsageReading;
  departed: number;
  edited: boolean;
};

export default async function StockUsagePage(props: PageProps<"/management/stock-usage">) {
  await requireManagementUser();
  const { t, locale } = await getT();
  const u = t.management.stockUsage;
  const searchParams = await props.searchParams;
  const param = (name: string) => {
    const v = searchParams[name];
    return typeof v === "string" ? v : "";
  };

  const supabase = await createClient();
  const [historyResult, medicationResult, dietResult, stateResult] = await Promise.all([
    supabase
      .from("stock_counts")
      .select("stocktake_id, item_kind, medication_id, diet_type_id, counted_quantity, unit, counted_at")
      .order("counted_at")
      .returns<HistoryRow[]>(),
    supabase
      .from("medication")
      .select("id, name, unit:dose_unit, stock_counted_at")
      .order("name")
      .returns<ItemRow[]>(),
    supabase
      .from("diet_types")
      .select("id, name, unit, stock_counted_at")
      .order("name")
      .returns<ItemRow[]>(),
    // Residents whose status today keeps them out of a forecast, for the
    // "plan reads low" caveat. Few rows: only those who have left.
    supabase
      .from("resident_current_state")
      .select("resident_id, current_status, current_placement_id")
      .in("current_status", EXCLUDED.diet)
      .returns<{ resident_id: string; current_status: string; current_placement_id: string | null }[]>(),
  ]);

  const history = historyResult.data ?? [];
  const rowsOf = (kind: Kind): CountRow[] =>
    history
      .filter((r) => r.item_kind === (kind === "medication" ? "medication" : "diet_type"))
      .map((r) => ({
        stocktake_id: r.stocktake_id,
        item_id: (kind === "medication" ? r.medication_id : r.diet_type_id) ?? "",
        counted_quantity: Number(r.counted_quantity),
        unit: r.unit,
        counted_at: r.counted_at,
      }));
  const rows: Record<Kind, CountRow[]> = { medication: rowsOf("medication"), diet: rowsOf("diet") };
  const items: Record<Kind, ItemRow[]> = {
    medication: medicationResult.data ?? [],
    diet: dietResult.data ?? [],
  };

  // Every saved sheet, whichever kinds it counted.
  const sessions = stocktakeSessions([...rows.medication, ...rows.diet]);
  const fromId = param("from");
  const toId = param("to");
  const fromSession = sessions.find((s) => s.id === fromId);
  const toSession = sessions.find((s) => s.id === toId);
  const picked = fromSession && toSession && fromId !== toId;
  const pickedSame = fromId !== "" && fromId === toId;

  const pairs: Record<Kind, Map<string, CountPair>> = {
    medication: picked ? stocktakePairs(rows.medication, fromId, toId) : latestPairs(rows.medication),
    diet: picked ? stocktakePairs(rows.diet, fromId, toId) : latestPairs(rows.diet),
  };

  // One forecast call per distinct date window per kind. Latest-pairs mode
  // has one window per pair of sheets, so this stays a handful.
  const windowKey = (w: { from: string; to: string }) => `${w.from}|${w.to}`;
  const windows = new Map<string, { from: string; to: string }>();
  for (const kind of ["medication", "diet"] as const) {
    for (const pair of pairs[kind].values()) {
      const w = planWindow(pair);
      if (w) windows.set(windowKey(w), w);
    }
  }
  const windowList = [...windows.values()];

  const [medPlans, dietPlans, prescriptionsResult, dietsResult, placementsResult] = await Promise.all([
    Promise.all(
      windowList.map((w) =>
        supabase.rpc("medication_forecast", { p_from: w.from, p_to: w.to }),
      ),
    ),
    Promise.all(
      windowList.map((w) => supabase.rpc("diet_forecast", { p_from: w.from, p_to: w.to })),
    ),
    supabase
      .from("prescriptions")
      .select("item_id:medication_id, resident_id, start_date, end_date")
      .returns<Assignment[]>(),
    supabase
      .from("resident_diets")
      .select("item_id:diet_type_id, resident_id, start_date, end_date")
      .returns<Assignment[]>(),
    // When each departed resident's current placement began — the day they
    // were adopted, fostered or died. current_placement is the open row.
    supabase
      .from("placement_history")
      .select("id, start_date")
      .in(
        "id",
        (stateResult.data ?? []).flatMap((s) => (s.current_placement_id ? [s.current_placement_id] : [])),
      )
      .returns<{ id: string; start_date: string }[]>(),
  ]);

  const planned = (kind: Kind) => {
    const results = kind === "medication" ? medPlans : dietPlans;
    const byWindow = new Map<string, Map<string, number>>();
    windowList.forEach((w, i) => {
      const data = (results[i]?.data ?? []) as {
        medication_id?: string;
        diet_type_id?: string;
        quantity: number | string | null;
      }[];
      byWindow.set(
        windowKey(w),
        new Map(data.map((r) => [(r.medication_id ?? r.diet_type_id) as string, Number(r.quantity ?? 0)])),
      );
    });
    return byWindow;
  };
  const plans: Record<Kind, Map<string, Map<string, number>>> = {
    medication: planned("medication"),
    diet: planned("diet"),
  };
  const planError = [...medPlans, ...dietPlans].find((r) => r.error)?.error;

  // placement_history.start_date is a timestamptz; departedDuring compares shelter days.
  const leftOn = new Map((placementsResult.data ?? []).map((p) => [p.id, shelterDate(p.start_date)]));
  const excludedFor = (kind: Kind) =>
    new Map(
      (stateResult.data ?? []).flatMap((s) => {
        const date = s.current_placement_id ? leftOn.get(s.current_placement_id) : undefined;
        return EXCLUDED[kind].includes(s.current_status) && date ? [[s.resident_id, date] as const] : [];
      }),
    );
  const assignments: Record<Kind, Assignment[]> = {
    medication: prescriptionsResult.data ?? [],
    diet: dietsResult.data ?? [],
  };

  // The newest history row per item, to know when `to` is the latest count.
  const newest = (kind: Kind) => {
    const m = new Map<string, string>();
    for (const r of rows[kind]) m.set(r.item_id, r.counted_at); // rows are in time order
    return m;
  };

  const linesOf = (kind: Kind): { lines: Line[]; skipped: string[] } => {
    const excluded = excludedFor(kind);
    const latestAt = newest(kind);
    // Items worth naming when they have no pair: counted in one of the two
    // picked sheets, or (latest mode) counted at all. Never-counted items
    // would only bury the list.
    const inPicked = new Set(
      rows[kind].filter((r) => r.stocktake_id === fromId || r.stocktake_id === toId).map((r) => r.item_id),
    );
    const lines: Line[] = [];
    const skipped: string[] = [];
    for (const item of items[kind]) {
      const pair = pairs[kind].get(item.id);
      if (!pair) {
        if (picked ? inPicked.has(item.id) : latestAt.has(item.id)) skipped.push(item.name);
        continue;
      }
      const w = planWindow(pair);
      const plan = w ? (plans[kind].get(windowKey(w))?.get(item.id) ?? 0) : null;
      lines.push({
        item,
        pair,
        days: w?.days ?? null,
        planned: plan,
        reading: readUsage(pair, plan ?? 0, item.unit),
        departed: w ? departedDuring(assignments[kind], excluded, item.id, w) : 0,
        edited:
          latestAt.get(item.id) === pair.to.counted_at && editedSince(pair, item.stock_counted_at),
      });
    }
    // The gaps first, then by name (items are already in name order).
    lines.sort((a, b) => Number(standsOut(b.reading)) - Number(standsOut(a.reading)));
    return { lines, skipped };
  };

  const unitLabel = (kind: Kind, unit: string) =>
    kind === "medication" ? doseUnitLabel(t, unit) : dietUnitLabel(t, unit);
  const qty = (kind: Kind, n: number, unit: string) => `${formatQuantity(n)} ${unitLabel(kind, unit)}`;

  const readingText = (kind: Kind, line: Line): { text: string; why?: string } => {
    const r = line.reading;
    const q = (n: number) => qty(kind, n, line.item.unit);
    switch (r.state) {
      case "asPlanned":
        return { text: u.readings.asPlanned };
      case "moreThanPlanned":
        return { text: u.readings.moreThanPlanned(q(r.gap)), why: u.readings.moreThanPlannedWhy };
      case "lessThanPlanned":
        return { text: u.readings.lessThanPlanned(q(r.gap)), why: u.readings.lessThanPlannedWhy };
      case "fellUnplanned":
        return { text: u.readings.fellUnplanned(q(r.fall)), why: u.readings.fellUnplannedWhy };
      case "rose":
        return { text: u.readings.rose, why: u.readings.roseWhy };
      case "unchangedUnplanned":
        return { text: u.readings.unchangedUnplanned };
      case "unitChanged":
        return { text: u.readings.unitChanged };
      case "sameDay":
        return { text: u.readings.sameDay };
    }
  };

  const changeText = (kind: Kind, line: Line) => {
    const { from, to } = line.pair;
    if (from.unit !== to.unit) return "—";
    const change = Math.round((to.counted_quantity - from.counted_quantity) * 100) / 100;
    if (change === 0) return u.held;
    return change > 0 ? u.rose(qty(kind, change, to.unit)) : u.fell(qty(kind, -change, to.unit));
  };

  const sections = (["medication", "diet"] as const).map((kind) => ({ kind, ...linesOf(kind) }));
  const nothing = sections.every((s) => s.lines.length === 0);

  const selectClass =
    "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
  const sessionLabel = (s: { counted_at: string; items: number }) =>
    u.picker.session(formatDateTime(s.counted_at, locale), s.items);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{u.title}</h1>
        <p className="text-sm text-muted">{u.subtitle}</p>
      </div>

      <div role="note" className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
        <span className="font-semibold">{u.cannotSayLead}</span> {u.cannotSay}
      </div>

      <LargerScreenNotice>
        {historyResult.error && (
          <p className="text-sm text-danger">
            {u.couldntLoad}: {historyResult.error.message}
          </p>
        )}
        {planError && (
          <p className="text-sm text-danger">
            {u.couldntLoadPlan}: {planError.message}
          </p>
        )}

        <section className="flex flex-col gap-6">
          {sessions.length >= 2 && (
            <form method="get" action="/management/stock-usage" className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="usage-from" className="text-sm font-medium text-muted">
                  {u.picker.from}
                </label>
                <select id="usage-from" name="from" defaultValue={picked ? fromId : ""} className={selectClass}>
                  <option value="">{u.picker.latest}</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {sessionLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="usage-to" className="text-sm font-medium text-muted">
                  {u.picker.to}
                </label>
                <select id="usage-to" name="to" defaultValue={picked ? toId : ""} className={selectClass}>
                  <option value="">{u.picker.latest}</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {sessionLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                {u.picker.show}
              </button>
              {(fromId || toId) && (
                <Link href="/management/stock-usage" className="text-sm text-muted hover:text-foreground">
                  {u.picker.clear}
                </Link>
              )}
              {picked && (
                <p className="w-full text-sm text-muted">
                  {u.picker.showing(
                    formatDateTime(
                      Date.parse(fromSession.counted_at) <= Date.parse(toSession.counted_at)
                        ? fromSession.counted_at
                        : toSession.counted_at,
                      locale,
                    ),
                    formatDateTime(
                      Date.parse(fromSession.counted_at) <= Date.parse(toSession.counted_at)
                        ? toSession.counted_at
                        : fromSession.counted_at,
                      locale,
                    ),
                  )}
                </p>
              )}
              {pickedSame && <p className="w-full text-sm text-danger">{u.picker.sameSession}</p>}
            </form>
          )}

          {nothing && !historyResult.error && <p className="text-sm text-muted">{u.empty}</p>}

          {sections.map(({ kind, lines, skipped }) =>
            lines.length === 0 && skipped.length === 0 ? null : (
              <div key={kind} className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground">{u.sections[kind]}</h2>
                {lines.length > 0 && (
                  <div className="overflow-x-auto rounded border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface text-muted">
                        <tr>
                          <th className="px-4 py-2 font-medium">{u.table.item}</th>
                          <th className="px-4 py-2 font-medium">{u.table.from}</th>
                          <th className="px-4 py-2 font-medium">{u.table.to}</th>
                          <th className="px-4 py-2 font-medium">{u.table.change}</th>
                          <th className="px-4 py-2 font-medium">{u.table.planned}</th>
                          <th className="px-4 py-2 font-medium">{u.table.reading}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lines.map((line) => {
                          const { text, why } = readingText(kind, line);
                          const marked = standsOut(line.reading);
                          return (
                            <tr
                              key={line.item.id}
                              className={`align-top ${marked ? "bg-warning/10" : ""}`}
                              data-reading={line.reading.state}
                            >
                              <td className="px-4 py-2 font-medium text-foreground">{line.item.name}</td>
                              <td className="whitespace-nowrap px-4 py-2">
                                {qty(kind, line.pair.from.counted_quantity, line.pair.from.unit)}
                                <br />
                                <span className="text-xs text-muted">
                                  {formatDate(line.pair.from.counted_at, locale)}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-2">
                                {qty(kind, line.pair.to.counted_quantity, line.pair.to.unit)}
                                <br />
                                <span className="text-xs text-muted">
                                  {formatDate(line.pair.to.counted_at, locale)}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-2">{changeText(kind, line)}</td>
                              <td className="whitespace-nowrap px-4 py-2">
                                {line.planned == null ? (
                                  "—"
                                ) : (
                                  <>
                                    {qty(kind, line.planned, line.item.unit)}
                                    <br />
                                    <span className="text-xs text-muted">{u.days(line.days ?? 0)}</span>
                                  </>
                                )}
                              </td>
                              <td className="min-w-64 px-4 py-2">
                                <span className={marked ? "font-medium text-foreground" : "text-muted"}>
                                  {text}
                                </span>
                                {why && <p className="text-xs text-muted">{why}</p>}
                                {line.departed > 0 && (
                                  <p className="text-xs text-foreground">{u.departed(line.departed)}</p>
                                )}
                                {line.edited && line.item.stock_counted_at && (
                                  <p className="text-xs text-muted">
                                    {u.editedSince(formatDate(line.item.stock_counted_at, locale))}
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {skipped.length > 0 && (
                  <p className="text-xs text-muted">
                    {(picked ? u.notInBoth : u.notCompared)(skipped.join(", "))}
                  </p>
                )}
              </div>
            ),
          )}

          <p className="text-xs text-muted">{u.note}</p>
        </section>
      </LargerScreenNotice>
    </main>
  );
}
