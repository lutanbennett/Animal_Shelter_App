"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { isoWeekday } from "@/lib/medication-list/due";
import type { ScheduleFormValues } from "@/lib/prescriptions/schedule";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const chipClass =
  "flex cursor-pointer items-center justify-center gap-1 rounded border border-border bg-surface px-2 py-2 text-sm font-medium text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/10 focus-within:ring-2 focus-within:ring-primary/40";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Which DAYS a prescription is given on (0283): every N days, every N weeks on chosen weekdays, every N
 * months on chosen days of the month, or as needed. The times on those days are the round ticks, beside it.
 * Controlled; the inputs carry the names parseScheduleForm() reads on the server
 * (scheduleUnit, scheduleEvery, scheduleWeekday, scheduleMonthDay).
 */
export function ScheduleDays({
  value,
  onChange,
  startDate,
}: {
  value: ScheduleFormValues;
  onChange: (next: ScheduleFormValues) => void;
  /** YYYY-MM-DD; the weekday or day of the month a newly chosen pattern starts from. */
  startDate: string;
}) {
  const { t } = useI18n();
  const d = t.prescriptions.days;

  function setUnit(unit: string) {
    const next = { ...value, unit };
    const start = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : null;
    if (unit === "week" && next.weekdays.length === 0 && start) next.weekdays = [String(isoWeekday(start))];
    if (unit === "month" && next.monthDays.length === 0 && start) next.monthDays = [String(Number(start.slice(8, 10)))];
    onChange(next);
  }
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="flex flex-col gap-2">
      <select
        name="scheduleUnit"
        aria-label={d.unit}
        value={value.unit}
        onChange={(e) => setUnit(e.target.value)}
        className={inputClass}
      >
        <option value="day">{d.unitDay}</option>
        <option value="week">{d.unitWeek}</option>
        <option value="month">{d.unitMonth}</option>
        <option value="asNeeded">{d.unitAsNeeded}</option>
      </select>

      {value.unit !== "asNeeded" && (
        <label className="flex items-center gap-2 text-sm text-muted">
          {d.every}
          <input
            name="scheduleEvery"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            value={value.every}
            onChange={(e) => onChange({ ...value, every: e.target.value })}
            className={`${inputClass} w-20`}
          />
          {d.unitWord[value.unit]}
        </label>
      )}

      {value.unit === "week" && (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-xs text-muted">{d.weekdays}</legend>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((n) => (
              <label key={n} className={chipClass}>
                <input
                  type="checkbox"
                  name="scheduleWeekday"
                  value={n}
                  checked={value.weekdays.includes(String(n))}
                  onChange={() => onChange({ ...value, weekdays: toggle(value.weekdays, String(n)) })}
                  className="sr-only"
                />
                {d.weekdayShort[n - 1]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {value.unit === "month" && (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-xs text-muted">{d.monthDays}</legend>
          <div className="grid grid-cols-7 gap-1">
            {MONTH_DAYS.map((n) => (
              <label key={n} className={chipClass}>
                <input
                  type="checkbox"
                  name="scheduleMonthDay"
                  value={n}
                  checked={value.monthDays.includes(String(n))}
                  onChange={() => onChange({ ...value, monthDays: toggle(value.monthDays, String(n)) })}
                  className="sr-only"
                />
                {n}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">{d.monthHint}</p>
        </fieldset>
      )}

      {value.unit === "asNeeded" && <p className="text-xs text-muted">{d.asNeededHint}</p>}
    </div>
  );
}
