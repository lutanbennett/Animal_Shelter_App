"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DailyPoint } from "@/lib/management/daily-count";
import { HEIGHT, MARGIN, SERIES, yTicks } from "./TrendChart";

const RIGHT_MARGIN = 36;

/** Shelter dates are plain YYYY-MM-DD; noon UTC keeps the formatted month on the right day. */
function dayDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** The last day of each month in the series (the final day of a month still in progress). */
export function monthEnds(daily: DailyPoint[]): DailyPoint[] {
  return daily.filter(
    (p, i) => i === daily.length - 1 || daily[i + 1].date.slice(0, 7) !== p.date.slice(0, 7),
  );
}

export function monthLabel(iso: string, locale: "en" | "th") {
  return formatMonth(dayDate(iso), locale, true);
}

/**
 * Daily residents-at-the-shelter line (right-hand scale) over running totals of intakes, adoptions
 * and deaths drawn as steps (left-hand scale), one point per shelter day.
 */
export function CumulativeChart({ daily }: { daily: DailyPoint[] }) {
  const { t, locale } = useI18n();
  const labels = t.management.dashboard.trend;
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (width == null || daily.length === 0) return null;
    const left = MARGIN.left;
    const plotW = Math.max(width - left - RIGHT_MARGIN, 40);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const baselineY = MARGIN.top + plotH;
    const leftTicks = yTicks(Math.max(...daily.map((p) => Math.max(p.intakes, p.adoptions, p.deaths))));
    const rightTicks = yTicks(Math.max(...daily.map((p) => p.atShelter)));
    const leftTop = leftTicks[leftTicks.length - 1];
    const rightTop = rightTicks[rightTicks.length - 1];
    const x = (i: number) => left + (daily.length === 1 ? plotW / 2 : (i / (daily.length - 1)) * plotW);
    const yl = (n: number) => baselineY - (n / leftTop) * plotH;
    const yr = (n: number) => baselineY - (n / rightTop) * plotH;
    const step = (key: "intakes" | "adoptions" | "deaths") =>
      daily.map((p, i) => (i === 0 ? `M${x(0)},${yl(p[key])}` : `H${x(i)}V${yl(p[key])}`)).join("");
    const residents = daily.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${yr(p.atShelter)}`).join("");
    const every = width < 520 ? 3 : 1;
    const monthTicks = daily
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => i === 0 || p.date.endsWith("-01"))
      .filter((_, k) => k % every === 0)
      .map(({ p, i }) => ({ i, label: formatMonth(dayDate(p.date), locale, i === 0 || p.date.endsWith("-01-01")) }));
    return { left, plotW, baselineY, leftTicks, rightTicks, x, yl, yr, step, residents, monthTicks };
  }, [width, daily, locale]);

  function pick(clientX: number, el: Element) {
    if (!layout) return;
    const r = el.getBoundingClientRect();
    const frac = (clientX - r.left - layout.left) / layout.plotW;
    setActive(Math.min(daily.length - 1, Math.max(0, Math.round(frac * (daily.length - 1)))));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = daily.length - 1;
    const by = e.shiftKey ? 7 : 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i == null ? last : Math.max(0, i - by)));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i == null ? last : Math.min(last, i + by)));
    } else if (e.key === "Escape") setActive(null);
  }

  const point = active != null ? daily[active] : null;
  const tipX = layout && active != null ? layout.x(active) : 0;
  const tipLeft = tipX < (width ?? 0) / 2;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4" style={{ background: s.fill }} />
            {labels[s.key]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0.5 w-4" style={{ background: "var(--foreground)" }} />
          {labels.residents}
        </span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height: HEIGHT }}
        onPointerLeave={() => setActive(null)}
      >
        {layout && width != null && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={labels.cumulativeAriaLabel(daily.length)}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onFocus={() => setActive((i) => i ?? daily.length - 1)}
            onBlur={() => setActive(null)}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{ touchAction: "pan-y" }}
          >
            {layout.leftTicks.map((tick) => (
              <g key={tick}>
                <line x1={layout.left} x2={layout.left + layout.plotW} y1={layout.yl(tick)} y2={layout.yl(tick)} stroke="var(--border)" strokeWidth={1} />
                <text x={layout.left - 8} y={layout.yl(tick)} dy="0.35em" textAnchor="end" fontSize={11} fill="var(--muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {tick}
                </text>
              </g>
            ))}
            {layout.rightTicks.map((tick) => (
              <text key={tick} x={layout.left + layout.plotW + 6} y={layout.yr(tick)} dy="0.35em" fontSize={11} fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {tick}
              </text>
            ))}
            {SERIES.map((s) => (
              <path key={s.key} d={layout.step(s.key)} fill="none" stroke={s.fill} strokeWidth={2} strokeLinejoin="round" />
            ))}
            <path d={layout.residents} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
            {layout.monthTicks.map((m) => (
              <text key={m.i} x={layout.x(m.i)} y={layout.baselineY + 18} textAnchor={m.i === 0 ? "start" : "middle"} fontSize={11} fill="var(--muted)">
                {m.label}
              </text>
            ))}
            {active != null && (
              <line x1={layout.x(active)} x2={layout.x(active)} y1={MARGIN.top} y2={layout.baselineY} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
            )}
          </svg>
        )}
        {point && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 flex flex-col gap-0.5 rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg"
            style={tipLeft ? { left: tipX + 12 } : { right: (width ?? 0) - tipX + 12 }}
          >
            <span className="font-semibold text-foreground">
              {point.date.slice(8)} {monthLabel(point.date, locale)}
            </span>
            <span className="text-muted">
              {labels.residents}: <span className="text-foreground">{point.atShelter}</span>
            </span>
            {SERIES.map((s) => (
              <span key={s.key} className="text-muted">
                {labels[s.key]}: <span className="text-foreground">{point[s.key]}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted">{labels.cumulativeNote}</p>
      <table className="sr-only">
        <caption>{labels.cumulativeCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.monthEnd}</th>
            <th scope="col">{labels.residents}</th>
            <th scope="col">{labels.intakes}</th>
            <th scope="col">{labels.adoptions}</th>
            <th scope="col">{labels.deaths}</th>
          </tr>
        </thead>
        <tbody>
          {monthEnds(daily).map((p) => (
            <tr key={p.date}>
              <th scope="row">{monthLabel(p.date, locale)}</th>
              <td>{p.atShelter}</td>
              <td>{p.intakes}</td>
              <td>{p.adoptions}</td>
              <td>{p.deaths}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
