"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatBaht, formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  CASHFLOW_CATEGORIES,
  CATEGORY_FILL,
  monthTotal,
  type CashflowCategory,
  type CashflowMonth,
} from "@/lib/management/cashflow";

const HEIGHT = 260;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 64 };
const COLUMN_GAP = 10;
const COLUMN_MAX_WIDTH = 56;
/** Surface showing between stacked segments, so two fills never touch. */
const SEGMENT_GAP = 2;
const CORNER = 4;

/** Rounded top, square foot — the column's data end, anchored to the baseline. */
function topPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(CORNER, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + w - r}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}

/** Money ticks: 1 / 2 / 5 × 10ⁿ, at most five of them. */
function moneyTicks(max: number): number[] {
  if (max <= 0) return [0];
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => max / s <= 4) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(v);
  return ticks;
}

/** "฿84k" / "฿1.2M" — the axis has no room for grouped digits. */
function shortBaht(value: number, locale: "en" | "th"): string {
  if (value === 0) return formatBaht(0, locale);
  if (Math.abs(value) >= 1_000_000) return `${formatBaht(value / 1_000_000, locale)}M`;
  if (Math.abs(value) >= 1_000) return `${formatBaht(value / 1_000, locale)}k`;
  return formatBaht(value, locale);
}

/**
 * Forecast outgoings as one stacked column per month, one colour per
 * category, oldest on the left — a sibling to the dashboard's TrendChart
 * rather than a second chart library, and built the same way: a plain SVG
 * sized from a ResizeObserver, with a hover/keyboard tooltip.
 *
 * The difference is the stack. A grouped chart answers "which category is
 * biggest"; a stacked one answers "what does this month cost", which is the
 * question a cashflow page exists for, with the split as the secondary
 * read.
 *
 * Only categories in `shown` are drawn, and switching one off re-scales the
 * y-axis to what is left — the colours stay pinned to their category, so a
 * fill never changes meaning as the selection changes.
 */
export function CashflowChart({
  months,
  shown,
}: {
  months: CashflowMonth[];
  shown: ReadonlySet<CashflowCategory>;
}) {
  const { t, locale } = useI18n();
  const labels = t.management.cashflow;
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

  const order = useMemo(
    () => CASHFLOW_CATEGORIES.filter((c) => shown.has(c)),
    [shown],
  );

  const layout = useMemo(() => {
    if (width == null || months.length === 0) return null;
    const plotW = Math.max(width - MARGIN.left - MARGIN.right, 40);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const max = Math.max(...months.map((m) => monthTotal(m, shown)), 0);
    const ticks = moneyTicks(max);
    const top = Math.max(ticks[ticks.length - 1], 1);
    const y = (n: number) => MARGIN.top + plotH - (n / top) * plotH;
    const slot = plotW / months.length;
    const barW = Math.min(COLUMN_MAX_WIDTH, Math.max(slot - COLUMN_GAP, 2));
    const baselineY = MARGIN.top + plotH;

    const columns = months.map((m, i) => {
      const x = MARGIN.left + slot * i + (slot - barW) / 2;
      const total = monthTotal(m, shown);
      // Stack upward from the baseline in category order, so a colour is
      // always in the same band of the column.
      let cursor = baselineY;
      const segments = order.map((category) => {
        const value = m.cells[category].amount;
        const full = (value / top) * plotH;
        const segY = cursor - full;
        cursor = segY;
        return { category, value, y: segY, h: full };
      });
      const drawn = segments.filter((s) => s.h > 0);
      return {
        month: m.month,
        cx: MARGIN.left + slot * (i + 0.5),
        label: formatMonth(new Date(m.month), locale, i === 0 || m.month.endsWith("-01-01")),
        x,
        w: barW,
        total,
        segments,
        drawn,
      };
    });
    const labelEvery = slot < 44 ? 2 : 1;
    return { plotW, plotH, ticks, y, columns, baselineY, slot, labelEvery, max };
  }, [width, months, shown, order, locale]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!layout) return;
    const last = layout.columns.length - 1;
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

  const activeColumn = layout && active != null ? layout.columns[active] : null;
  const tooltipLeft = activeColumn && width != null ? activeColumn.cx < width / 2 : true;

  if (order.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{labels.chart.noCategories}</p>;
  }

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
          aria-label={labels.chart.ariaLabel(months.length)}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? layout.columns.length - 1)}
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
                {shortBaht(tick, locale)}
              </text>
            </g>
          ))}

          {layout.columns.map((column, i) => (
            <g key={column.month}>
              <rect
                x={MARGIN.left + layout.slot * i}
                y={MARGIN.top}
                width={layout.slot}
                height={layout.baselineY - MARGIN.top}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
              />
              {column.drawn.map((segment, j) => {
                // The gap is taken off the top of every segment but the
                // topmost, so the column's total height still reads true
                // against the axis and the foot stays on the baseline.
                const isTop = j === column.drawn.length - 1;
                const gap = isTop ? 0 : Math.min(SEGMENT_GAP, segment.h / 2);
                const h = Math.max(segment.h - gap, 0.5);
                const y = segment.y + gap;
                return isTop ? (
                  <path
                    key={segment.category}
                    d={topPath(column.x, y, column.w, h)}
                    fill={CATEGORY_FILL[segment.category]}
                    fillOpacity={active == null || active === i ? 1 : 0.5}
                    style={{ pointerEvents: "none" }}
                  />
                ) : (
                  <rect
                    key={segment.category}
                    x={column.x}
                    y={y}
                    width={column.w}
                    height={h}
                    fill={CATEGORY_FILL[segment.category]}
                    fillOpacity={active == null || active === i ? 1 : 0.5}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}
              {i % layout.labelEvery === 0 && (
                <text
                  x={column.cx}
                  y={layout.baselineY + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill={active === i ? "var(--foreground)" : "var(--muted)"}
                >
                  {column.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}

      {activeColumn && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 flex flex-col gap-0.5 rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={
            tooltipLeft
              ? { left: activeColumn.cx + 12 }
              : { right: (width ?? 0) - activeColumn.cx + 12 }
          }
        >
          <span className="font-semibold text-foreground">
            {formatMonth(new Date(activeColumn.month), locale, true)}
          </span>
          {activeColumn.segments.map((segment) => (
            <span
              key={segment.category}
              className="inline-flex items-center gap-1.5 text-muted"
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: CATEGORY_FILL[segment.category] }}
              />
              {labels.categories[segment.category]}:{" "}
              <span className="text-foreground">{formatBaht(segment.value, locale)}</span>
            </span>
          ))}
          <span className="mt-1 border-t border-border pt-1 font-semibold text-foreground">
            {labels.table.total}: {formatBaht(activeColumn.total, locale)}
          </span>
        </div>
      )}
    </div>
  );
}
