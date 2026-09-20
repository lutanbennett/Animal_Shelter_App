"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  OCCUPANCY_TONE,
  occupancyLevel,
  occupancyPercent,
} from "@/lib/enclosures/occupancy";
import type { StatCardTone } from "@/components/StatCard";

const BAR_CLASSES: Record<StatCardTone, string> = {
  success: "bg-success",
  warning: "bg-primary",
  danger: "bg-danger",
  neutral: "bg-muted",
};

const TEXT_CLASSES: Record<StatCardTone, string> = {
  success: "text-success",
  warning: "text-primary",
  danger: "text-danger",
  neutral: "text-muted",
};

const BADGE_CLASSES: Record<StatCardTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-primary/15 text-primary",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-surface-hover text-muted",
};

/**
 * "3 / 5" + a capacity bar + a status label (Space available / Nearly full /
 * Full / Over capacity). Enclosures with no capacity recorded show only the
 * resident count, since there's nothing to measure against.
 */
export function OccupancyIndicator({
  count,
  capacity,
  size = "sm",
}: {
  count: number;
  capacity: number | null;
  size?: "sm" | "lg";
}) {
  const { t } = useI18n();
  const level = occupancyLevel(count, capacity);
  const tone = OCCUPANCY_TONE[level];
  const percent = occupancyPercent(count, capacity);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-semibold ${size === "lg" ? "text-2xl" : "text-lg"} ${TEXT_CLASSES[tone]}`}
        >
          {level === "unknown"
            ? t.enclosures.residentsCount(count)
            : t.enclosures.occupancy(count, capacity ?? 0)}
        </span>
        {level !== "unknown" && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[tone]}`}
          >
            {t.enclosures.levels[level]}
          </span>
        )}
      </div>
      {level === "unknown" ? (
        <span className="text-xs text-muted">{t.enclosures.noCapacity}</span>
      ) : (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={capacity ?? 0}
          aria-valuenow={count}
          aria-label={t.enclosures.occupancy(count, capacity ?? 0)}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover"
        >
          <div
            className={`h-full rounded-full ${BAR_CLASSES[tone]}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
