"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { MonthBucket } from "@/lib/vets/stats";

const HEIGHT = 200;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 32 };
// A 2px gap of surface between neighbouring bars keeps them countable.
const BAR_GAP = 2;
const BAR_MAX_WIDTH = 48;

/** A bar with its top two corners rounded and a square foot on the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + rr}`,
    `Q${x},${y} ${x + rr},${y}`,
    `H${x + w - rr}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}

/** Whole-number y ticks: 0..max in 1s, 2s, 5s or 10s so there are at most ~5. */
function yTicks(max: number): number[] {
  const top = Math.max(max, 1);
  const step = [1, 2, 5, 10, 20, 50, 100].find((s) => top / s <= 5) ?? 100;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < top) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/**
 * Visits per calendar month as one row of bars, oldest on the left. The
 * hovered (or keyboard-focused) bar gets a tooltip with its count; the
 * visit list under the chart is the table view of the same rows.
 */
export function VisitsChart({ buckets }: { buckets: MonthBucket[] }) {
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

  const layout = useMemo(() => {
    if (width == null || buckets.length === 0) return null;
    const plotW = Math.max(width - MARGIN.left - MARGIN.right, 40);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const ticks = yTicks(Math.max(...buckets.map((b) => b.count)));
    const top = ticks[ticks.length - 1];
    const y = (n: number) => MARGIN.top + plotH - (n / top) * plotH;
    const slot = plotW / buckets.length;
    const barW = Math.min(BAR_MAX_WIDTH, Math.max(slot - BAR_GAP * 2, 4));
    const baselineY = MARGIN.top + plotH;

    const bars = buckets.map((b, i) => {
      const d = new Date(b.month);
      // Year on the first bar and again wherever a January starts a new one.
      const withYear = i === 0 || d.getMonth() === 0;
      return {
        ...b,
        x: MARGIN.left + slot * i + (slot - barW) / 2,
        cx: MARGIN.left + slot * (i + 0.5),
        y: y(b.count),
        h: baselineY - y(b.count),
        w: barW,
        label: formatMonth(d, locale, withYear),
      };
    });
    // Drop every other month label once they'd collide.
    const labelEvery = slot < 40 ? 2 : 1;
    return { plotW, ticks, y, bars, baselineY, slot, labelEvery };
  }, [width, buckets, locale]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!layout) return;
    const last = layout.bars.length - 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i == null ? last : Math.max(0, i - 1)));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i == null ? last : Math.min(last, i + 1)));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  const activeBar = layout && active != null ? layout.bars[active] : null;
  const tooltipLeft = activeBar && width != null ? activeBar.cx < width / 2 : true;

  return (
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
          aria-label={t.vets.hub.chart.ariaLabel(buckets.length)}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? layout.bars.length - 1)}
          onBlur={() => setActive(null)}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
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

          {layout.bars.map((bar, i) => (
            <g key={bar.month}>
              {/* Hit target: the whole column, so thin bars are easy to hover. */}
              <rect
                x={MARGIN.left + layout.slot * i}
                y={MARGIN.top}
                width={layout.slot}
                height={layout.baselineY - MARGIN.top}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
              />
              {bar.count > 0 && (
                <path
                  d={barPath(bar.x, bar.y, bar.w, bar.h, 4)}
                  fill="var(--primary)"
                  fillOpacity={active == null || active === i ? 1 : 0.55}
                  style={{ pointerEvents: "none" }}
                />
              )}
              {i % layout.labelEvery === 0 && (
                <text
                  x={bar.cx}
                  y={layout.baselineY + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill={active === i ? "var(--foreground)" : "var(--muted)"}
                >
                  {bar.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}

      {activeBar && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 flex flex-col gap-0.5 rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={
            tooltipLeft
              ? { left: activeBar.cx + 12 }
              : { right: (width ?? 0) - activeBar.cx + 12 }
          }
        >
          <span className="text-sm font-semibold text-foreground">
            {t.vets.hub.chart.visits(activeBar.count)}
          </span>
          <span className="text-muted">{formatMonth(activeBar.month, locale, true)}</span>
        </div>
      )}
    </div>
  );
}
