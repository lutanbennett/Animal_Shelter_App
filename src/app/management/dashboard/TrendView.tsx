"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TrendBucket } from "@/lib/management/report";
import type { DailyPoint } from "@/lib/management/daily-count";
import { PrintButton } from "@/components/PrintButton";
import { CopyTextButton } from "./CopyTextButton";
import { TrendChart } from "./TrendChart";
import { CumulativeChart, monthEnds, monthLabel } from "./CumulativeChart";

const MODE_KEY = "dashboard-trend-mode";
type Mode = "month" | "cumulative";

/**
 * The last 12 months as month-by-month bars or cumulative lines. The choice is remembered per
 * visitor; Print shows whichever view is on screen and Copy as text gives its figures.
 */
export function TrendView({ buckets, daily }: { buckets: TrendBucket[]; daily: DailyPoint[] }) {
  const { t, locale } = useI18n();
  const labels = t.management.dashboard.trend;
  const m = t.management.dashboard.month;
  const [mode, setMode] = useState<Mode>("month");

  useEffect(() => {
    try {
      if (localStorage.getItem(MODE_KEY) === "cumulative") setMode("cumulative");
    } catch {
      // A private window refuses storage; the default view is fine.
    }
  }, []);

  function choose(next: Mode) {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // Not remembered, still switched.
    }
  }

  const text = useMemo(() => {
    if (mode === "month") {
      return [
        `${labels.heading} — ${labels.modeMonth}`,
        ...buckets.map(
          (b) =>
            `${formatMonth(b.month, locale, true)}: ${labels.intakes} ${b.intakes}, ${labels.adoptions} ${b.adoptions}, ${labels.deaths} ${b.deaths}`,
        ),
      ].join("\n");
    }
    return [
      `${labels.heading} — ${labels.modeCumulative}`,
      ...monthEnds(daily).map(
        (p) =>
          `${monthLabel(p.date, locale)}: ${labels.residents} ${p.atShelter}, ${labels.intakes} ${p.intakes}, ${labels.adoptions} ${p.adoptions}, ${labels.deaths} ${p.deaths}`,
      ),
      labels.cumulativeNote,
    ].join("\n");
  }, [mode, buckets, daily, labels, locale]);

  const tabs: { key: Mode; label: string }[] = [
    { key: "month", label: labels.modeMonth },
    { key: "cumulative", label: labels.modeCumulative },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div
          role="group"
          aria-label={labels.modeLabel}
          className="inline-flex overflow-hidden rounded-md border border-border text-sm"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={mode === tab.key}
              onClick={() => choose(tab.key)}
              className={`px-3 py-1.5 ${mode === tab.key ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-border/40"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CopyTextButton text={text} label={m.copyText} copiedLabel={m.copied} promptLabel={m.copyPrompt} />
          <PrintButton label={m.print} />
        </div>
      </div>
      {mode === "month" ? <TrendChart buckets={buckets} /> : <CumulativeChart daily={daily} />}
    </div>
  );
}
