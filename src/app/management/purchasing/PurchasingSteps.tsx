"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Download, Printer, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { downloadCsv } from "@/lib/csv";
import { formatQuantity } from "@/lib/diets/options";
import { WizardNav, WizardProgress } from "@/app/residents/new/WizardChrome";
import { PURCHASE_PERIOD_DAYS, type PurchaseRow, type ShoppingGroup } from "@/lib/management/purchasing";

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

const LOW = 0;
const HOW = 1;
const WHOM = 2;
const STEPS = 3;

const q = (n: number) => formatQuantity(Math.round(n * 100) / 100);

/**
 * Management → Purchasing on a phone: what is low, how much, from whom —
 * one screen each, in the chrome intake and the Shelter Friend wizard use.
 * Every sum is the desk page's (src/lib/management/purchasing.ts); the page
 * hands them over already worked out. Nothing here is typed and nothing is
 * saved, so going Back loses nothing. The period is a link, because it
 * changes the sums and so asks the server again.
 */
export function PurchasingSteps({
  items,
  groups,
  csv,
  period,
  includeLead,
  canCount,
}: {
  items: PhoneItem[];
  groups: ShoppingGroup[];
  csv: string;
  period: number;
  includeLead: boolean;
  canCount: boolean;
}) {
  const { t } = useI18n();
  const p = t.management.purchasing;
  const s = p.steps;
  const [step, setStep] = useState(LOW);
  const [maxVisited, setMaxVisited] = useState(LOW);

  const go = (next: number) => {
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
    window.scrollTo({ top: 0 });
  };

  const periodLabel = p.periods[String(period) as "7" | "14" | "30"];
  const toBuy = items.filter((i) => (i.row.buy ?? 0) > 0);
  const notCounted = items.filter((i) => i.row.state === "notCounted" && i.row.needed > 0);

  return (
    <div className="flex flex-col gap-4">
      <WizardProgress
        current={step}
        maxVisited={maxVisited}
        titles={[s.titles.low, s.titles.how, s.titles.whom]}
        pending={false}
        onGo={go}
        labels={s.wizard}
      />

      {step === LOW && (
        <section className="flex flex-col gap-4" aria-label={s.titles.low}>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-foreground">{s.periodTitle}</h3>
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
              <p className="text-sm text-foreground">{s.notCountedBody}</p>
              <ul className="list-disc pl-5 text-sm text-foreground">
                {notCounted.map((i) => (
                  <li key={`${i.kind}-${i.row.id}`} className="break-words">
                    {i.row.name}
                  </li>
                ))}
              </ul>
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

          {toBuy.length === 0 ? (
            <p className="rounded border border-border bg-surface p-4 text-base text-foreground">{s.lowNone}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{s.lowIntro(periodLabel)}</p>
              <ul className="flex flex-col gap-3">
                {toBuy.map((i) => (
                  <li key={`${i.kind}-${i.row.id}`} className="rounded border border-border bg-surface p-4">
                    <p className="break-words text-lg font-semibold text-foreground">{i.row.name}</p>
                    <ItemBadges item={i} />
                    <p className="mt-1 text-sm text-muted">
                      {i.row.expected != null && i.row.expected > 0
                        ? s.shelf(q(i.row.expected), q(i.row.needed), i.unitLabel)
                        : s.shelfNone(q(i.row.needed), i.unitLabel)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {step === HOW && (
        <section className="flex flex-col gap-4" aria-label={s.titles.how}>
          {toBuy.length === 0 ? (
            <p className="rounded border border-border bg-surface p-4 text-base text-foreground">{s.howNone}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{s.howIntro}</p>
              <ul className="flex flex-col gap-3">
                {toBuy.map((i) => (
                  <li key={`${i.kind}-${i.row.id}`} className="flex flex-col gap-2 rounded border border-border bg-surface p-4">
                    <p className="break-words text-lg font-semibold text-foreground">{i.row.name}</p>
                    <ItemBadges item={i} />
                    <BuyFigure item={i} />
                    <details className="group">
                      <summary className="flex min-h-12 cursor-pointer items-center text-sm font-medium text-primary">
                        {s.theWorking}
                      </summary>
                      <Working item={i} includeLead={includeLead} period={period} />
                    </details>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {step === WHOM && (
        <section className="flex flex-col gap-4" aria-label={s.titles.whom}>
          {groups.length === 0 ? (
            <p className="rounded border border-border bg-surface p-4 text-base text-foreground">{s.whomNone}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{s.whomIntro}</p>
              {groups.map((g) => (
                <div key={g.supplier ?? "none"} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="break-words text-lg font-semibold text-foreground">{g.supplier ?? p.noSupplier}</h3>
                    <span className="shrink-0 text-sm text-muted">{s.itemCount(g.lines.length)}</span>
                  </div>
                  <ul className="mt-2 flex flex-col divide-y divide-border">
                    {g.lines.map((l) => (
                      <li key={`${l.kind}-${l.name}`} className="flex flex-col gap-0.5 py-2">
                        <span className="break-words text-base text-foreground">{l.name}</span>
                        <span className="text-base font-medium text-foreground">
                          {p.qty(formatQuantity(l.quantity), l.unit)}
                          {l.unit !== l.baseUnit && (
                            <span className="text-sm font-normal text-muted">
                              {" "}
                              ({p.equals(formatQuantity(l.baseQuantity), l.baseUnit)})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </section>
      )}

      <WizardNav
        current={step}
        pending={false}
        onBack={() => go(step - 1)}
        onNext={() => go(step + 1)}
        reviewStep={STEPS - 1}
        labels={s.wizard}
        finalActions={
          <div className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={groups.length === 0}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded bg-primary px-3 text-base font-medium text-primary-foreground disabled:opacity-40"
            >
              <Printer aria-hidden="true" className="h-5 w-5" />
              {p.list.print}
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(`purchasing-${period}-days.csv`, csv)}
              disabled={groups.length === 0}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded border border-border bg-surface px-3 text-base font-medium text-foreground disabled:opacity-40"
            >
              <Download aria-hidden="true" className="h-5 w-5" />
              {p.list.csv}
            </button>
          </div>
        }
      />
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

/** "3 bags", and in the item's own unit under it when that is a different thing. */
function BuyFigure({ item }: { item: PhoneItem }) {
  const { t } = useI18n();
  const p = t.management.purchasing;
  const r = item.row;
  return (
    <p className="flex flex-col">
      <span className="text-sm text-muted">{t.management.purchasing.steps.buy}</span>
      {r.packs != null && item.packUnit ? (
        <>
          <span className="text-2xl font-semibold text-foreground">{p.qty(String(r.packs), item.packUnit)}</span>
          <span className="text-sm text-muted">{p.equals(formatQuantity(r.buy ?? 0), item.unitLabel)}</span>
        </>
      ) : (
        <span className="text-2xl font-semibold text-foreground">{p.qty(formatQuantity(r.buy ?? 0), item.unitLabel)}</span>
      )}
    </p>
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
