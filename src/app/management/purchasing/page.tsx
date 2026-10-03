import Link from "next/link";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { formatDate } from "@/lib/format";
import { toCsv } from "@/lib/csv";
import { formatQuantity } from "@/lib/diets/options";
import { CsvDownloadButton } from "@/components/CsvDownloadButton";
import { PrintButton } from "@/components/PrintButton";
import { PurchasingSteps, type PhoneItem } from "./PurchasingSteps";
import { loadConversions } from "@/lib/units-server";
import { defaultUnit } from "@/lib/units";
import { loadReceipts } from "@/lib/management/receipts-server";
import { STOCK_RATE_DAYS } from "@/lib/management/stock";
import { shelterDate } from "@/lib/management/stock-usage";
import {
  PURCHASE_PERIOD_DAYS,
  groupBySupplier,
  parseIncludeLead,
  parsePeriod,
  purchaseRow,
  purchaseWindow,
  receivedSinceCount,
  usualSuppliers,
  windowDaysFor,
  type PurchaseRow,
  type ShoppingLine,
} from "@/lib/management/purchasing";

/**
 * Management → Purchasing: how much of each medicine and food to buy for a
 * period, with the working in every row. The sum and its rules are in
 * src/lib/management/purchasing.ts; "expected stock now" is the same
 * helper (stock.ts) Medications' and Diets' days-of-stock use.
 */

type Kind = "medication" | "diet";

type ItemQueryRow = {
  id: string;
  name: string;
  unit: string;
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  reorder_lead_days: number | null;
  safety_stock: number | string | null;
  is_standard?: boolean;
};

type ForecastRow = {
  medication_id?: string;
  diet_type_id?: string;
  quantity: number | string | null;
};

type Item = {
  kind: Kind;
  row: PurchaseRow;
  unitLabel: string;
  isStandard: boolean;
  /** The purchase unit, when the item has one. */
  pack: { unit: string; basePer: number } | null;
  supplierId: string | null;
  leadDays: number | null;
};

export default async function PurchasingPage(props: PageProps<"/management/purchasing">) {
  const { supabase, perms } = await requirePermission("stock.purchasing");
  const { t, locale } = await getT();
  const p = t.management.purchasing;
  const searchParams = await props.searchParams;
  const period = parsePeriod(searchParams.days);
  const includeLead = parseIncludeLead(searchParams.lead);

  const [medResult, dietResult, vendorsResult] = await Promise.all([
    supabase
      .from("medication")
      .select("id, name, unit:dose_unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock")
      .order("name")
      .returns<ItemQueryRow[]>(),
    supabase
      .from("diet_types")
      .select("id, name, unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock, is_standard")
      .order("name")
      .returns<ItemQueryRow[]>(),
    // Archived too: an old delivery still names its supplier.
    supabase.from("contacts").select("id, name").eq("type", "Vendor").returns<{ id: string; name: string }[]>(),
  ]);
  const meds = medResult.data ?? [];
  const diets = dietResult.data ?? [];

  // One forecast call per distinct window: the 30-day rate "used since the
  // count" is read at, the period, and period + each item's own lead time.
  const windowDays = new Set<number>([STOCK_RATE_DAYS, period]);
  for (const item of [...meds, ...diets]) {
    windowDays.add(windowDaysFor(period, item.reorder_lead_days, includeLead));
  }
  const forecastCalls = [...windowDays].map(async (days) => {
    const w = purchaseWindow(days);
    const [m, d] = await Promise.all([
      supabase.rpc("medication_forecast", { p_from: w.from, p_to: w.to }),
      supabase.rpc("diet_forecast", { p_from: w.from, p_to: w.to }),
    ]);
    return { days, m, d };
  });
  const [forecasts, medReceipts, dietReceipts, medConversions, dietConversions] = await Promise.all([
    Promise.all(forecastCalls),
    loadReceipts(supabase, "medication"),
    loadReceipts(supabase, "diet"),
    loadConversions(supabase, "medication"),
    loadConversions(supabase, "diet"),
  ]);

  const usage = (kind: Kind) => {
    const byDays = new Map<number, Map<string, number>>();
    for (const f of forecasts) {
      const res = kind === "medication" ? f.m : f.d;
      byDays.set(
        f.days,
        new Map(
          ((res.data ?? []) as ForecastRow[]).map((r) => [
            (kind === "medication" ? r.medication_id : r.diet_type_id) as string,
            Number(r.quantity ?? 0),
          ]),
        ),
      );
    }
    return (id: string, days: number) => byDays.get(days)?.get(id) ?? 0;
  };

  const forecastError = forecasts.map((f) => f.m.error ?? f.d.error).find(Boolean)?.message ?? null;
  const loadError =
    medResult.error?.message ??
    dietResult.error?.message ??
    medReceipts.error ??
    dietReceipts.error ??
    medConversions.error ??
    dietConversions.error ??
    forecastError;

  function build(kind: Kind, rows: ItemQueryRow[]): Item[] {
    const receipts = kind === "medication" ? medReceipts.data : dietReceipts.data;
    const conversions = (kind === "medication" ? medConversions : dietConversions).data;
    const used = usage(kind);
    const received = receivedSinceCount(receipts, new Map(rows.map((r) => [r.id, r.stock_counted_at])));
    const suppliers = usualSuppliers(receipts);
    return rows.map((r) => {
      const purchase = defaultUnit(conversions[r.id] ?? [], "purchase");
      const days = windowDaysFor(period, r.reorder_lead_days, includeLead);
      return {
        kind,
        unitLabel: kind === "medication" ? doseUnitLabel(t, r.unit) : dietUnitLabel(t, r.unit),
        isStandard: r.is_standard ?? false,
        pack: purchase ? { unit: purchase.unit, basePer: purchase.basePer } : null,
        supplierId: suppliers.get(r.id) ?? null,
        leadDays: r.reorder_lead_days,
        row: purchaseRow({
          id: r.id,
          name: r.name,
          counted: r.stock_on_hand == null ? null : Number(r.stock_on_hand),
          countedAt: r.stock_counted_at,
          usedInRateWindow: used(r.id, STOCK_RATE_DAYS),
          usedInWindow: used(r.id, days),
          windowDays: days,
          receivedSince: received.get(r.id) ?? 0,
          safetyStock: r.safety_stock == null ? null : Number(r.safety_stock),
          packBase: purchase?.basePer ?? null,
        }),
      };
    });
  }

  const medItems = build("medication", meds);
  // Special diets matter most (Lutan, 2026-09-28): ahead of the standard one.
  const dietItems = build("diet", diets).sort(
    (a, b) => Number(a.isStandard) - Number(b.isStandard) || a.row.name.localeCompare(b.row.name),
  );

  const supplierName = new Map((vendorsResult.data ?? []).map((v) => [v.id, v.name]));
  const toBuy = [...medItems, ...dietItems].filter((i) => (i.row.buy ?? 0) > 0);
  const lines: ShoppingLine[] = toBuy.map((i) => ({
    kind: i.kind,
    name: i.row.name,
    quantity: i.row.packs ?? i.row.buy ?? 0,
    unit: i.row.packs != null && i.pack ? i.pack.unit : i.unitLabel,
    baseQuantity: i.row.buy ?? 0,
    baseUnit: i.unitLabel,
    supplier: i.supplierId ? (supplierName.get(i.supplierId) ?? null) : null,
  }));
  const groups = groupBySupplier(lines);
  const notCounted = [...medItems, ...dietItems].filter((i) => i.row.state === "notCounted" && i.row.needed > 0);

  const csv = toCsv([
    [p.csv.supplier, p.csv.kind, p.csv.item, p.csv.buy, p.csv.unit, p.csv.inBase, p.csv.baseUnit],
    ...groups.flatMap((g) =>
      g.lines.map((l) => [
        g.supplier ?? p.noSupplier,
        l.kind === "medication" ? p.sections.medication : p.sections.diet,
        l.name,
        formatQuantity(l.quantity),
        l.unit,
        formatQuantity(l.baseQuantity),
        l.baseUnit,
      ]),
    ),
  ]);

  const periodLabel = (n: number) => p.periods[String(n) as "7" | "14" | "30"];
  const href = (days: number, lead: boolean) => `/management/purchasing?days=${days}${lead ? "" : "&lead=off"}`;
  const chip = (active: boolean) =>
    `rounded border px-3 py-1.5 text-sm font-medium ${
      active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted hover:bg-surface-hover"
    }`;

  const q = (n: number) => formatQuantity(Math.round(n * 100) / 100);

  function working(item: Item) {
    const r = item.row;
    const u = item.unitLabel;
    const lead = includeLead && item.leadDays ? item.leadDays : 0;
    const needLine = p.working.need(
      q(r.periodUse),
      r.windowDays,
      lead > 0 ? p.working.withLead(period, lead) : "",
      u,
      r.safetyStock != null && r.safetyStock > 0 ? p.working.safety(q(r.safetyStock)) : "",
      q(r.needed),
    );
    if (r.state === "notCounted") {
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-danger">{p.working.neverCounted}</span>
          <span className="text-xs">{needLine}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <span>
          {p.working.counted(
            q(r.counted as number),
            u,
            formatDate(shelterDate(r.countedAt as string), locale),
            r.countedDaysAgo ?? 0,
          )}
          {" · "}
          {p.working.used(q(r.usedSince))}
          {" · "}
          {p.working.received(q(r.receivedSince))}
          {" → "}
          <span className="text-foreground">
            {r.expected != null && r.expected <= 0 ? p.working.usedUp : p.working.expected(q(r.expected as number), u)}
          </span>
        </span>
        <span className="text-xs">{needLine}</span>
        {r.stale && <span className="text-xs font-medium text-danger">{p.working.stale(r.countedDaysAgo ?? 0)}</span>}
      </div>
    );
  }

  function buyCell(item: Item) {
    const r = item.row;
    if (r.state === "notCounted") return <span className="text-muted">{p.cantTell}</span>;
    if (!(r.buy && r.buy > 0)) return <span className="text-muted">{p.nothingToBuy}</span>;
    if (r.packs != null && item.pack) {
      return (
        <>
          <span className="font-medium text-foreground">{p.qty(String(r.packs), item.pack.unit)}</span>
          <br />
          <span className="text-xs text-muted">{p.equals(formatQuantity(r.buy), item.unitLabel)}</span>
        </>
      );
    }
    return <span className="font-medium text-foreground">{p.qty(formatQuantity(r.buy), item.unitLabel)}</span>;
  }

  function section(kind: Kind, items: Item[]) {
    return (
      <section className="flex flex-col gap-3 print:hidden" aria-labelledby={`purchasing-${kind}`}>
        <h2 id={`purchasing-${kind}`} className="text-lg font-semibold text-foreground">
          {p.sections[kind]}
        </h2>
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">{p.table.item}</th>
                <th className="px-4 py-2 font-medium">{p.table.working}</th>
                <th className="px-4 py-2 font-medium">{p.table.buy}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.row.id} className="align-top">
                  <td className="px-4 py-2">
                    <span className="font-medium text-foreground">{item.row.name}</span>
                    {item.isStandard && (
                      <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                        {p.standardBadge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{working(item)}</td>
                  <td className="px-4 py-2">{buyCell(item)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">
                    {p.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-8 p-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
        <p className="text-sm text-muted">{p.subtitle}</p>
      </div>

      {loadError && (
        <p className="text-sm text-danger md:hidden print:hidden">
          {p.couldntLoad}: {loadError}
        </p>
      )}

      {/* A phone gets three short steps; from md up, the table. Printing always
          takes the desk list, so the two cannot disagree on paper. */}
      <div className="md:hidden print:hidden">
        <PurchasingSteps
          items={[...medItems, ...dietItems].map(
            (i): PhoneItem => ({
              kind: i.kind,
              row: i.row,
              unitLabel: i.unitLabel,
              isStandard: i.isStandard,
              packUnit: i.pack?.unit ?? null,
              countedOn: i.row.countedAt ? formatDate(shelterDate(i.row.countedAt), locale) : null,
              leadDays: i.leadDays ?? 0,
            }),
          )}
          groups={groups}
          csv={csv}
          period={period}
          includeLead={includeLead}
          canCount={can(perms, "stock.count")}
        />
      </div>

      <div className="hidden flex-col gap-8 md:flex print:flex">
        {loadError && (
          <p className="text-sm text-danger print:hidden">
            {p.couldntLoad}: {loadError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-sm font-medium text-muted">{p.period}</span>
          {PURCHASE_PERIOD_DAYS.map((n) => (
            <Link key={n} href={href(n, includeLead)} className={chip(n === period)} aria-current={n === period}>
              {periodLabel(n)}
            </Link>
          ))}
          <span className="mx-2 h-5 border-l border-border" />
          <Link href={href(period, !includeLead)} className={chip(includeLead)} aria-pressed={includeLead}>
            {p.leadToggle}
          </Link>
        </div>
        <p className="text-xs text-muted print:hidden">{p.leadHint}</p>

        {notCounted.length > 0 && (
          <p className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground print:hidden">
            {p.neverCountedBanner(notCounted.length)}{" "}
            <Link href="/stocktake" className="font-medium text-primary hover:underline">
              {p.stocktakeLink}
            </Link>
          </p>
        )}

        {section("medication", medItems)}
        {section("diet", dietItems)}

        <section className="flex flex-col gap-3" aria-labelledby="purchasing-list">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="purchasing-list" className="text-lg font-semibold text-foreground">
              {p.list.title} — {periodLabel(period)}
            </h2>
            <div className="flex gap-2 print:hidden">
              <CsvDownloadButton
                csv={csv}
                filename={`purchasing-${period}-days.csv`}
                label={p.list.csv}
                disabled={lines.length === 0}
              />
              <PrintButton label={p.list.print} />
            </div>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-muted">{p.list.empty}</p>
          ) : (
            groups.map((g) => (
              <div key={g.supplier ?? "none"} className="rounded border border-border p-3">
                <h3 className="mb-2 text-sm font-semibold text-foreground">{g.supplier ?? p.noSupplier}</h3>
                <ul className="flex flex-col gap-1 text-sm">
                  {g.lines.map((l) => (
                    <li key={`${l.kind}-${l.name}`} className="flex flex-wrap justify-between gap-2">
                      <span className="text-foreground">{l.name}</span>
                      <span className="text-muted">
                        <span className="font-medium text-foreground">{p.qty(formatQuantity(l.quantity), l.unit)}</span>
                        {l.unit !== l.baseUnit && <> ({p.equals(formatQuantity(l.baseQuantity), l.baseUnit)})</>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
          <p className="text-xs text-muted print:hidden">{p.note}</p>
        </section>
      </div>
    </main>
  );
}
