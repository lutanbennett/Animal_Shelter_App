"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TrendBucket } from "@/lib/management/report";

const HEIGHT = 220;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 32 };
const GROUP_GAP = 6;
const BAR_GAP = 1;
const BAR_MAX_WIDTH = 18;

type SeriesKey = "intakes" | "adoptions" | "deaths";

// Intakes in the brand colour, adoptions in the success tone, deaths in the
// danger tone — the same meaning those tones carry on the stat cards.
const SERIES: { key: SeriesKey; fill: string }[] = [
  { key: "intakes", fill: "var(--primary)" },
  { key: "adoptions", fill: "var(--success)" },
  { key: "deaths", fill: "var(--danger)" },
];

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

function yTicks(max: number): number[] {
  const top = Math.max(max, 1);
  const step = [1, 2, 5, 10, 20, 50, 100].find((s) => top / s <= 5) ?? 100;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < top) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/**
 * Intakes, adoptions and deaths per month as one group of three bars per
 * month, oldest on the left, with a legend and a hover/keyboard tooltip
 * giving the three counts. Follows the vet hub's VisitsChart.
 */
export function TrendChart({ buckets }: { buckets: TrendBucket[] }) {
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
    if (width == null || buckets.length === 0) return null;
    const plotW = Math.max(width - MARGIN.left - MARGIN.right, 40);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const max = Math.max(...buckets.flatMap((b) => [b.intakes, b.adoptions, b.deaths]));
    const ticks = yTicks(max);
    const top = ticks[ticks.length - 1];
    const y = (n: number) => MARGIN.top + plotH - (n / top) * plotH;
    const slot = plotW / buckets.length;
    const barW = Math.min(
      BAR_MAX_WIDTH,
      Math.max((slot - GROUP_GAP * 2 - BAR_GAP * (SERIES.length - 1)) / SERIES.length, 2),
    );
    const groupW = barW * SERIES.length + BAR_GAP * (SERIES.length - 1);
    const baselineY = MARGIN.top + plotH;

    const groups = buckets.map((b, i) => {
      const d = new Date(b.month);
      const withYear = i === 0 || d.getMonth() === 0;
      const x0 = MARGIN.left + slot * i + (slot - groupW) / 2;
      return {
        ...b,
        cx: MARGIN.left + slot * (i + 0.5),
        label: formatMonth(d, locale, withYear),
        bars: SERIES.map((s, j) => ({
          key: s.key,
          fill: s.fill,
          x: x0 + j * (barW + BAR_GAP),
          y: y(b[s.key]),
          h: baselineY - y(b[s.key]),
          w: barW,
          value: b[s.key],
        })),
      };
    });
    const labelEvery = slot < 40 ? 2 : 1;
    return { plotW, ticks, y, groups, baselineY, slot, labelEvery };
  }, [width, buckets, locale]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!layout) return;
    const last = layout.groups.length - 1;
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

  const activeGroup = layout && active != null ? layout.groups[active] : null;
  const tooltipLeft = activeGroup && width != null ? activeGroup.cx < width / 2 : true;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: s.fill }}
            />
            {labels[s.key]}
          </span>
        ))}
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
            aria-label={labels.ariaLabel(buckets.length)}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onFocus={() => setActive((i) => i ?? layout.groups.length - 1)}
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

            {layout.groups.map((group, i) => (
              <g key={group.month}>
                <rect
                  x={MARGIN.left + layout.slot * i}
                  y={MARGIN.top}
                  width={layout.slot}
                  height={layout.baselineY - MARGIN.top}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                />
                {group.bars.map(
                  (bar) =>
                    bar.value > 0 && (
                      <path
                        key={bar.key}
                        d={barPath(bar.x, bar.y, bar.w, bar.h, 3)}
                        fill={bar.fill}
                        fillOpacity={active == null || active === i ? 1 : 0.5}
                        style={{ pointerEvents: "none" }}
                      />
                    ),
                )}
                {i % layout.labelEvery === 0 && (
                  <text
                    x={group.cx}
                    y={layout.baselineY + 18}
                    textAnchor="middle"
                    fontSize={11}
                    fill={active === i ? "var(--foreground)" : "var(--muted)"}
                  >
                    {group.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}

        {activeGroup && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 flex flex-col gap-0.5 rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg"
            style={
              tooltipLeft
                ? { left: activeGroup.cx + 12 }
                : { right: (width ?? 0) - activeGroup.cx + 12 }
            }
          >
            <span className="font-semibold text-foreground">
              {formatMonth(activeGroup.month, locale, true)}
            </span>
            {activeGroup.bars.map((bar) => (
              <span key={bar.key} className="inline-flex items-center gap-1.5 text-muted">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: bar.fill }}
                />
                {labels[bar.key]}: <span className="text-foreground">{bar.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
