"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatAxisDate,
  formatDate,
  formatWeightDelta,
  formatWeightKg,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type WeightPoint = { id: string; date: string; weightKg: number };

const HEIGHT = 240;
// Room for the y tick labels on the left and the end-of-line value label on
// the right; the x tick labels sit in the bottom band.
const MARGIN = { top: 16, right: 64, bottom: 28, left: 48 };
const DAY_MS = 24 * 60 * 60 * 1000;

const Y_STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];

/** Round y-axis ticks: pick the step that gives 3–6 gridlines. */
function yTicks(min: number, max: number): { lo: number; hi: number; ticks: number[] } {
  const span = Math.max(max - min, 0.2);
  const step =
    Y_STEPS.find((s) => Math.ceil(span / s) <= 5) ?? Y_STEPS[Y_STEPS.length - 1];
  const lo = Math.max(0, Math.floor((min - span * 0.15) / step) * step);
  const hi = Math.ceil((max + span * 0.15) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 1000; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return { lo, hi, ticks };
}

/**
 * A resident's weight over time: one line, real dates on the x axis (a gap
 * of a year looks like a year, not one step), the reading at the end
 * labelled, and a crosshair that snaps to the nearest reading on hover or
 * with the arrow keys. The list under it on the Weight tab is the table
 * view of the same rows, so nothing here is the only way to read a value.
 * Renders nothing with fewer than two readings — one point isn't a trend.
 */
export function WeightChart({ points }: { points: WeightPoint[] }) {
  const { t, locale } = useI18n();
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

  const sorted = useMemo(
    () =>
      [...points].sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      ),
    [points],
  );

  const layout = useMemo(() => {
    if (width == null || sorted.length < 2) return null;
    const plotW = Math.max(width - MARGIN.left - MARGIN.right, 40);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const times = sorted.map((p) => new Date(p.date).getTime());
    let tMin = Math.min(...times);
    let tMax = Math.max(...times);
    if (tMax === tMin) {
      tMin -= DAY_MS;
      tMax += DAY_MS;
    }
    const x = (ms: number) => MARGIN.left + ((ms - tMin) / (tMax - tMin)) * plotW;

    const values = sorted.map((p) => p.weightKg);
    const { lo, hi, ticks } = yTicks(Math.min(...values), Math.max(...values));
    const y = (kg: number) => MARGIN.top + plotH - ((kg - lo) / (hi - lo)) * plotH;

    const coords = sorted.map((p, i) => ({ ...p, cx: x(times[i]), cy: y(p.weightKg) }));

    // X ticks: evenly spaced in time, as many as fit at ~100px apart. Years
    // are shown once the range is long enough for the month alone to be
    // ambiguous.
    const spanDays = (tMax - tMin) / DAY_MS;
    const tickCount = Math.max(2, Math.min(6, Math.floor(plotW / 100) + 1));
    const xTicks = Array.from({ length: tickCount }, (_, i) => {
      const ms = tMin + ((tMax - tMin) * i) / (tickCount - 1);
      return { px: x(ms), label: formatAxisDate(ms, locale, spanDays > 300) };
    });

    const linePath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`)
      .join(" ");
    const baselineY = MARGIN.top + plotH;
    const areaPath = `${linePath} L${coords[coords.length - 1].cx.toFixed(1)},${baselineY} L${coords[0].cx.toFixed(1)},${baselineY} Z`;

    return { plotW, plotH, coords, ticks, y, xTicks, linePath, areaPath, baselineY };
  }, [width, sorted, locale]);

  if (sorted.length < 2) return null;

  const activePoint = layout && active != null ? layout.coords[active] : null;
  const previousPoint =
    layout && active != null && active > 0 ? layout.coords[active - 1] : null;

  function pick(clientX: number) {
    if (!layout || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    layout.coords.forEach((c, i) => {
      const d = Math.abs(c.cx - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!layout) return;
    const last = layout.coords.length - 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i == null ? last : Math.max(0, i - 1)));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i == null ? last : Math.min(last, i + 1)));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(last);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  const last = layout?.coords[layout.coords.length - 1];
  // Keep the tooltip inside the chart: flip it to the left of the crosshair
  // once the point is past the middle.
  const tooltipLeft = activePoint && width != null ? activePoint.cx < width / 2 : true;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height: HEIGHT }}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={() => setActive(null)}
    >
      {layout && width != null && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={t.weight.chart.ariaLabel(sorted.length)}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? layout.coords.length - 1)}
          onBlur={() => setActive(null)}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {/* Gridlines and y ticks: hairline, one step off the surface. */}
          {layout.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + layout.plotW}
                y1={layout.y(tick)}
                y2={layout.y(tick)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={layout.y(tick)}
                dy="0.35em"
                textAnchor="end"
                fontSize={11}
                fill="var(--muted)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {tick}
              </text>
            </g>
          ))}
          {/* X ticks along the baseline. */}
          {layout.xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.px}
              y={layout.baselineY + 18}
              textAnchor={i === 0 ? "start" : i === layout.xTicks.length - 1 ? "end" : "middle"}
              fontSize={11}
              fill="var(--muted)"
            >
              {tick.label}
            </text>
          ))}

          <path d={layout.areaPath} fill="var(--primary)" fillOpacity={0.1} />
          <path
            d={layout.linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {activePoint && (
            <line
              x1={activePoint.cx}
              x2={activePoint.cx}
              y1={MARGIN.top}
              y2={layout.baselineY}
              stroke="var(--muted)"
              strokeWidth={1}
            />
          )}

          {layout.coords.map((c, i) => (
            <circle
              key={c.id}
              cx={c.cx}
              cy={c.cy}
              r={i === active ? 5 : 4}
              fill="var(--primary)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}

          {/* Only the end of the line is labelled; the axis, the tooltip and
              the list carry the rest. */}
          {last && (
            <text
              x={last.cx + 10}
              y={last.cy}
              dy="0.35em"
              fontSize={12}
              fontWeight={600}
              fill="var(--foreground)"
            >
              {formatWeightKg(last.weightKg, locale)}
            </text>
          )}
        </svg>
      )}

      {activePoint && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 flex flex-col gap-0.5 rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={
            tooltipLeft
              ? { left: activePoint.cx + 12 }
              : { right: (width ?? 0) - activePoint.cx + 12 }
          }
        >
          <span className="text-sm font-semibold text-foreground">
            {formatWeightKg(activePoint.weightKg, locale)}
          </span>
          <span className="text-muted">{formatDate(activePoint.date, locale)}</span>
          {previousPoint && (
            <span className="text-muted">
              {t.weight.chart.sincePrevious(
                formatWeightDelta(activePoint.weightKg - previousPoint.weightKg, locale),
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
