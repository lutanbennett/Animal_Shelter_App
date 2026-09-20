"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  INTERVAL_UNITS,
  SCHEDULE_KINDS,
  scheduleKind,
  type FrequencySchedule,
  type ScheduleKind,
} from "@/lib/prescriptions/frequency";

/** What the fields hold while editing — strings, as inputs are. */
export type ScheduleFieldValues = {
  kind: ScheduleKind;
  dosesPerDay: string;
  intervalCount: string;
  intervalUnit: string;
};

export function scheduleToFields(s: FrequencySchedule | null): ScheduleFieldValues {
  const kind = s ? scheduleKind(s) : "perDay";
  return {
    kind,
    dosesPerDay: s?.doses_per_day != null ? String(s.doses_per_day) : "",
    intervalCount: s?.interval_count != null ? String(s.interval_count) : "",
    intervalUnit: s?.interval_unit ?? "day",
  };
}

export const EMPTY_SCHEDULE_FIELDS: ScheduleFieldValues = {
  kind: "perDay",
  dosesPerDay: "",
  intervalCount: "",
  intervalUnit: "day",
};

/**
 * The three-kind schedule picker a frequency needs (0044): times per day,
 * every N days/weeks/months, or as needed. Controlled; the inputs carry
 * `name`s (prefixed) so the same component works inside a server-action
 * form and in an inline-edit table row. Pair with parseSchedule().
 */
export function FrequencyScheduleFields({
  value,
  onChange,
  namePrefix = "",
  compact = false,
  idPrefix = namePrefix || "schedule",
}: {
  value: ScheduleFieldValues;
  onChange: (next: ScheduleFieldValues) => void;
  /** e.g. "newFrequency" → newFrequencyKind, newFrequencyDosesPerDay, … */
  namePrefix?: string;
  /** Tighter inputs for table rows. */
  compact?: boolean;
  idPrefix?: string;
}) {
  const { t } = useI18n();
  const name = (suffix: string) =>
    namePrefix ? `${namePrefix}${suffix[0].toUpperCase()}${suffix.slice(1)}` : suffix;
  const inputClass = compact
    ? "rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
    : "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        id={`${idPrefix}-kind`}
        name={name("kind")}
        value={value.kind}
        onChange={(e) => onChange({ ...value, kind: e.target.value as ScheduleKind })}
        aria-label={t.frequency.kind}
        className={inputClass}
      >
        {SCHEDULE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {t.frequency.kinds[kind]}
          </option>
        ))}
      </select>

      {value.kind === "perDay" && (
        <>
          <input
            id={`${idPrefix}-doses-per-day`}
            name={name("dosesPerDay")}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            value={value.dosesPerDay}
            onChange={(e) => onChange({ ...value, dosesPerDay: e.target.value })}
            aria-label={t.frequency.dosesPerDay}
            placeholder="2"
            className={`${inputClass} w-20`}
          />
          <span className="text-sm text-muted">{t.frequency.timesADay}</span>
        </>
      )}

      {value.kind === "interval" && (
        <>
          <span className="text-sm text-muted">{t.frequency.everyWord}</span>
          <input
            id={`${idPrefix}-interval-count`}
            name={name("intervalCount")}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            value={value.intervalCount}
            onChange={(e) => onChange({ ...value, intervalCount: e.target.value })}
            aria-label={t.frequency.intervalCount}
            placeholder="1"
            className={`${inputClass} w-20`}
          />
          <select
            id={`${idPrefix}-interval-unit`}
            name={name("intervalUnit")}
            value={value.intervalUnit}
            onChange={(e) => onChange({ ...value, intervalUnit: e.target.value })}
            aria-label={t.frequency.intervalUnit}
            className={inputClass}
          >
            {INTERVAL_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {t.frequency.unitPlural[unit]}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
