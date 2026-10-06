"use client";

import Link from "next/link";
import { ChevronDown, ClipboardCheck, Download, Printer, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { downloadCsv } from "@/lib/csv";
import { formatQuantity } from "@/lib/diets/options";
import { PURCHASE_PERIOD_DAYS, groupBySupplier, type PurchaseRow, type ShoppingLine } from "@/lib/management/purchasing";

/** One medicine or food, reduced to what the steps show. Plain data: it crosses from the server page. */
export type PhoneItem = {
  kind: "medication" | "diet";
  row: PurchaseRow;
  unitLabel: string;
  isStandard: boolean;
  /** The purchase unit's name, when the item has one. */
  packUnit: string | null;
  /** The count date, already written for this locale. */
  countedOn: string | null;
  /** The supplier's lead time, in days, when it is counted into the period. */
  leadDays: number;
};

const q = (n: number) => formatQuantity(Math.round(n * 100) / 100);

/**
 * Management → Purchasing on a phone: one screen, one task — what to order,
 * and from whom. The period on top, anything uncounted flagged, then the
 * list grouped by supplier with each item's amount and its working one tap
 * away. Every sum is the desk page's (src/lib/management/purchasing.ts);
 * the page hands them over already worked out. Nothing is typed and nothing
 * is saved. The period is a link, because it changes the sums and so asks
 * the server again.
 */
export function PurchasingPhone({
  items,
  lines,
  csv,
  period,
  includeLead,
  canCount,
}: {
  items: PhoneItem[];
  lines: ShoppingLine[];
  csv: string;
  period: number;
  includeLead: boolean;
  canCount: boolean;
}) {
  const { t } = useI18n();
  const p = t.management.purchasing;
  const s = p.steps;

  const byKey = new Map(items.map((i) => [`${i.kind}|${i.row.name}`, i]));
  const notCounted = items.filter((i) => i.row.state === "notCounted");
  // Never counted and nothing to buy: not on the list, so the box has to name them.
  const notCountedZero = notCounted.filter((i) => i.row.needed <= 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">{s.periodTitle}</h2>
        <div className="grid grid-cols-3 gap-2">
          {PURCHASE_PERIOD_DAYS.map((n) => (
            <Link
              key={n}
              href={`/management/purchasing?days=${n}${includeLead ? "" : "&lead=off"}`}
              aria-current={n === period}
              className={`flex min-h-14 items-center justify-center rounded border px-2 text-center text-base font-medium ${
                n === period
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              {p.periods[String(n) as "7" | "14" | "30"]}
            </Link>
          ))}
        </div>
      </div>

      {notCounted.length > 0 && (
        <div className="flex flex-col gap-2 rounded border border-warning/40 bg-warning/10 p-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TriangleAlert aria-hidden="true" className="h-5 w-5 shrink-0" />
            {s.notCountedTitle(notCounted.length)}
          </h3>
          <p className="text-sm text-foreground">
            {notCountedZero.length < notCounted.length ? s.notCountedBody : s.notCountedBodyZeroOnly}
          </p>
          {notCountedZero.length > 0 && (
            <p className="break-words text-sm text-foreground">
              {s.notCountedZero(notCountedZero.map((i) => i.row.name).join(", "))}
            </p>
          )}
          {canCount && (
            <Link
              href="/stocktake"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded border border-border bg-surface px-3 text-base font-medium text-foreground"
            >
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
              {s.countThem}
            </Link>
          )}
        </div>
      )}

      {lines.length === 0 ? (
        <p className="rounded border border-border bg-surface p-4 text-base text-foreground">{s.none}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{s.intro}</p>
          {/* Medicine and food are bought at different shops, so each is its own fold. */}
          {(["medication", "diet"] as const).map((kind) => {
            const ofKind = lines.filter((l) => l.kind === kind);
            if (ofKind.length === 0) return null;
            const opensFirst = kind === "medication" || !lines.some((l) => l.kind === "medication");
            return (
              <details
                key={kind}
                open={opensFirst}
                className="rounded border border-border bg-surface [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-2 px-4 text-lg font-semibold text-foreground">
                  <span>{p.sections[kind]}</span>
                  <span className="flex items-center gap-2 text-sm font-normal text-muted">
                    {s.itemCount(ofKind.length)}
                    <ChevronDown aria-hidden="true" className="h-5 w-5" />
                  </span>
                </summary>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  {groupBySupplier(ofKind).map((g) => (
                    <section key={g.supplier ?? "none"}>
                      <h3 className="break-words border-b border-border pb-1 text-base font-semibold text-foreground">
                        {g.supplier ?? p.noSupplier}
                      </h3>
                      <ul className="flex flex-col divide-y divide-border">
                        {g.lines.map((l) => {
                          const i = byKey.get(`${l.kind}|${l.name}`);
                          return (
                            <li key={`${l.kind}-${l.name}`} className={i?.row.state === "notCounted" ? "-mx-2 rounded bg-warning/10 px-2" : undefined}>
                              <details className="[&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2">
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    {i?.row.state === "notCounted" && (
                                      <TriangleAlert
                                        aria-label={p.notCountedTag}
                                        className="h-4 w-4 shrink-0 text-warning"
                                      />
                                    )}
                                    {i?.row.stale && (
                                      <TriangleAlert
                                        aria-label={p.working.stale(i.row.countedDaysAgo ?? 0)}
                                        className="h-4 w-4 shrink-0 text-warning"
                                      />
                                    )}
                                    <span className="break-words text-base text-foreground">{l.name}</span>
                                  </span>
                                  <span className="flex shrink-0 items-center gap-1 text-lg font-semibold text-foreground">
                                    {p.qty(formatQuantity(l.quantity), l.unit)}
                                    <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted" />
                                  </span>
                                </summary>
                                <div className="flex flex-col gap-1 pb-3">
                                  {i && <ItemBadges item={i} />}
                                  {l.unit !== l.baseUnit && (
                                    <span className="text-sm text-muted">
                                      {p.equals(formatQuantity(l.baseQuantity), l.baseUnit)}
                                    </span>
                                  )}
                                  {i && (
                                    <>
                                      <span className="text-sm text-muted">
                                        {i.row.state === "notCounted"
                                          ? s.shelfAssumed(q(i.row.needed), i.unitLabel)
                                          : i.row.expected != null && i.row.expected > 0
                                            ? s.shelf(q(i.row.expected), q(i.row.needed), i.unitLabel)
                                            : s.shelfNone(q(i.row.needed), i.unitLabel)}
                                      </span>
                                      <p className="mt-1 text-sm font-medium text-foreground">{s.theWorking}</p>
                                      <Working item={i} includeLead={includeLead} period={period} />
                                    </>
                                  )}
                                </div>
                              </details>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              </details>
            );
          })}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded bg-primary px-3 text-base font-medium text-primary-foreground"
            >
              <Printer aria-hidden="true" className="h-5 w-5" />
              {p.list.print}
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(`purchasing-${period}-days.csv`, csv)}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded border border-border bg-surface px-3 text-base font-medium text-foreground"
            >
              <Download aria-hidden="true" className="h-5 w-5" />
              {p.list.csv}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ItemBadges({ item }: { item: PhoneItem }) {
  const { t } = useI18n();
  const p = t.management.purchasing;
  if (!item.isStandard && !item.row.stale) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {item.isStandard && (
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">{p.standardBadge}</span>
      )}
      {item.row.stale && (
        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-foreground">
          {p.working.stale(item.row.countedDaysAgo ?? 0)}
        </span>
      )}
    </div>
  );
}

/** The desk page's working, sentence for sentence. */
function Working({ item, includeLead, period }: { item: PhoneItem; includeLead: boolean; period: number }) {
  const { t } = useI18n();
  const w = t.management.purchasing.working;
  const r = item.row;
  const u = item.unitLabel;
  const lead = includeLead && item.leadDays > 0 ? item.leadDays : 0;
  const need = w.need(
    q(r.periodUse),
    r.windowDays,
    lead > 0 ? w.withLead(period, lead) : "",
    u,
    r.safetyStock != null && r.safetyStock > 0 ? w.safety(q(r.safetyStock)) : "",
    q(r.needed),
  );
  return (
    <div className="flex flex-col gap-2 pb-1 text-sm text-muted">
      {r.state === "notCounted" && <p className="font-medium text-foreground">{w.neverCounted}</p>}
      {r.state === "ok" && r.counted != null && (
        <p>
          {w.counted(q(r.counted), u, item.countedOn ?? "", r.countedDaysAgo ?? 0)}
          {" · "}
          {w.used(q(r.usedSince))}
          {" · "}
          {w.received(q(r.receivedSince))}
          {" → "}
          <span className="text-foreground">
            {r.expected != null && r.expected <= 0 ? w.usedUp : w.expected(q(r.expected ?? 0), u)}
          </span>
        </p>
      )}
      <p>{need}</p>
    </div>
  );
}
