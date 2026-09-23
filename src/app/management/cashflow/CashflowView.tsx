"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Coins, CalendarRange, CircleHelp, Download } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatBaht, formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  CASHFLOW_CATEGORIES,
  CATEGORY_FILL,
  CATEGORY_PRICE_PATH,
  buildCashflowMonths,
  cashflowCsv,
  categoryTotal,
  monthTotal,
  notPricedTarget,
  windowTotal,
  type CashflowCategory,
  type CashflowCell,
  type CashflowRow,
} from "@/lib/management/cashflow";
import { CashflowChart } from "./CashflowChart";

/**
 * Everything below the window picker: the totals, the stacked chart, the
 * table it is drawn from, and the category toggles that drive both.
 *
 * It is one client component rather than three because the toggle has to
 * reach all of them — the item's requirement is that switching a category
 * off removes it from the chart *and* the table, and a total that kept
 * counting a hidden category would be the kind of quiet wrongness this
 * page exists to avoid.
 *
 * The rows arrive already fetched; the folding is done here so the same
 * `shown` set drives every number on the page.
 */
/** The table footer row the "not priced yet" card jumps to. */
const NOT_PRICED_ANCHOR = "not-priced";

export function CashflowView({
  rows,
  vetEstimate,
  from,
  to,
}: {
  rows: CashflowRow[];
  /** The window, ISO — only used to name the CSV file. */
  from: string;
  to: string;
  /** The typical-vet-visit figure from site_content, or null if unset. */
  vetEstimate: number | null;
}) {
  const { t, locale } = useI18n();
  const c = t.management.cashflow;
  const [hidden, setHidden] = useState<ReadonlySet<CashflowCategory>>(new Set());

  const months = useMemo(() => buildCashflowMonths(rows), [rows]);
  const shown = useMemo(
    () => new Set(CASHFLOW_CATEGORIES.filter((k) => !hidden.has(k))),
    [hidden],
  );

  const total = useMemo(() => windowTotal(months, shown), [months, shown]);
  const totals = useMemo(
    () =>
      Object.fromEntries(
        CASHFLOW_CATEGORIES.map((k) => [k, categoryTotal(months, k)]),
      ) as Record<CashflowCategory, CashflowCell>,
    [months],
  );

  const gap = useMemo(
    () => notPricedTarget(totals, shown, NOT_PRICED_ANCHOR),
    [totals, shown],
  );

  function downloadCsv() {
    const csv = cashflowCsv(months, shown, {
      month: c.table.month,
      total: c.table.total,
      notPriced: c.csv.notPricedColumn,
      categories: c.categories,
    });
    // The BOM is what makes Excel read the file as UTF-8, so Thai headings
    // survive being double-clicked open.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflow-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggle(category: CashflowCategory) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  if (months.length === 0) {
    return <p className="text-sm text-muted">{c.empty}</p>;
  }

  const columns = CASHFLOW_CATEGORIES.filter((k) => shown.has(k));
  const perMonth = months.length > 0 ? total.amount / months.length : 0;

  /**
   * One cell. An amount of zero is only ever printed as zero when nothing
   * is missing — otherwise it reads "not priced yet", which is the whole
   * point of the feature: a silent zero in a cashflow forecast is worse
   * than a visible gap.
   */
  function Amount({ cell }: { cell: CashflowCell }) {
    if (cell.amount === 0 && cell.missing > 0) {
      return <span className="text-xs italic text-muted">{c.table.notPricedYet}</span>;
    }
    if (cell.amount === 0) {
      return <span className="text-muted">{c.table.nothing}</span>;
    }
    return (
      <>
        {formatBaht(cell.amount, locale)}
        {cell.missing > 0 && (
          <span
            className="ml-1 align-super text-[10px] text-primary"
            title={c.table.partialTitle(cell.missing)}
          >
            +{cell.missing}
          </span>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          title={c.stats.total}
          value={formatBaht(total.amount, locale)}
          detail={c.stats.totalDetail(months.length)}
          icon={Coins}
          tone={total.missing > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title={c.stats.perMonth}
          value={formatBaht(perMonth, locale)}
          detail={c.stats.perMonthDetail}
          icon={CalendarRange}
        />
        <StatCard
          title={c.stats.notPriced}
          value={String(total.missing)}
          detail={
            gap == null
              ? c.stats.notPricedNone
              : gap.categories.length === 1
                ? c.stats.notPricedOne(c.categories[gap.categories[0]])
                : c.stats.notPricedMany(gap.categories.length)
          }
          href={gap?.href}
          icon={CircleHelp}
          tone={total.missing > 0 ? "warning" : "success"}
        />
      </div>

      {/* The toggles double as the chart legend, so identity is never
          carried by colour alone — each swatch sits beside its name. */}
      <div className="flex flex-wrap gap-2">
        {CASHFLOW_CATEGORIES.map((category) => {
          const on = shown.has(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on
                  ? "border-border bg-surface text-foreground"
                  : "border-border/60 bg-transparent text-muted line-through"
              }`}
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{
                  background: on ? CATEGORY_FILL[category] : "var(--muted)",
                  opacity: on ? 1 : 0.4,
                }}
              />
              {c.categories[category]}
            </button>
          );
        })}
      </div>

      {/* The chart is the secondary read and the first thing to go on a
          phone: five stacked series in 375px is unreadable, and the table
          below says the same thing better at that width. */}
      <section className="hidden md:block">
        <CashflowChart months={months} shown={shown} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{c.table.heading}</h2>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={columns.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-50"
          >
            <Download aria-hidden className="h-3.5 w-3.5" />
            {c.csv.download}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">
                  {c.table.month}
                </th>
                {columns.map((category) => (
                  <th key={category} scope="col" className="px-3 py-2 text-right font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-sm"
                        style={{ background: CATEGORY_FILL[category] }}
                      />
                      {c.categories[category]}
                    </span>
                    <span className="block text-[10px] normal-case text-muted">
                      {c.basis[totals[category].basis]}
                    </span>
                  </th>
                ))}
                <th scope="col" className="py-2 pl-3 text-right font-medium">
                  {c.table.total}
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {months.map((month) => (
                <tr key={month.month} className="border-b border-border/60">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">
                    {formatMonth(new Date(month.month), locale, true)}
                  </th>
                  {columns.map((category) => (
                    <td key={category} className="px-3 py-2 text-right">
                      <Amount cell={month.cells[category]} />
                    </td>
                  ))}
                  <td className="py-2 pl-3 text-right font-medium text-foreground">
                    {formatBaht(monthTotal(month, shown), locale)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-b border-border font-semibold">
                <th scope="row" className="py-2 pr-3 text-left">
                  {c.table.total}
                </th>
                {columns.map((category) => (
                  <td key={category} className="px-3 py-2 text-right tabular-nums">
                    <Amount cell={totals[category]} />
                  </td>
                ))}
                <td className="py-2 pl-3 text-right tabular-nums">
                  {formatBaht(total.amount, locale)}
                </td>
              </tr>
              {/* The gap, and the one click that closes it. */}
              <tr id={NOT_PRICED_ANCHOR} className="scroll-mt-24 text-xs target:bg-primary/10">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">
                  {c.table.notPricedRow}
                </th>
                {columns.map((category) => (
                  <td key={category} className="px-3 py-2 text-right">
                    {totals[category].missing > 0 ? (
                      <Link
                        href={CATEGORY_PRICE_PATH[category]}
                        className="text-primary hover:underline"
                      >
                        {c.table.fixCount(totals[category].missing)}
                      </Link>
                    ) : (
                      <span className="text-muted">{c.table.nothing}</span>
                    )}
                  </td>
                ))}
                <td className="py-2 pl-3 text-right text-muted">{total.missing || ""}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-muted">
          {shown.has("vet") &&
            (vetEstimate == null ? (
              <>
                {c.vetNoteUnset}{" "}
                <Link href="/admin/website" className="text-primary hover:underline">
                  {c.vetNoteLink}
                </Link>
                .
              </>
            ) : (
              <>
                {c.vetNote(formatBaht(vetEstimate, locale))}{" "}
                <Link href="/admin/website" className="text-primary hover:underline">
                  {c.vetNoteLink}
                </Link>
                .
              </>
            ))}
        </p>
        <p className="text-xs text-muted">{c.table.basisNote}</p>
      </section>
    </div>
  );
}
