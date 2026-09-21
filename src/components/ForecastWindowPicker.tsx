"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * From / To dates for a custom forecast window on the management forecast
 * tables. A plain GET form: the page reads `from` and `to` from the query
 * string, so the window survives a reload and can be shared as a link.
 * Clear goes back to the fixed 7 / 30-day columns alone.
 */
export function ForecastWindowPicker({
  from,
  to,
  invalid,
}: {
  from: string;
  to: string;
  invalid: boolean;
}) {
  const { t } = useI18n();
  const w = t.management.forecastWindow;
  const pathname = usePathname();

  return (
    <form method="get" action={pathname} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="forecast-from" className="text-sm font-medium text-muted">
          {w.from}
        </label>
        <input id="forecast-from" name="from" type="date" required defaultValue={from} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="forecast-to" className="text-sm font-medium text-muted">
          {w.to}
        </label>
        <input id="forecast-to" name="to" type="date" required defaultValue={to} className={inputClass} />
      </div>
      <button
        type="submit"
        className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
      >
        {w.show}
      </button>
      {(from || to) && (
        <Link href={pathname} className="text-sm text-muted hover:text-foreground">
          {w.clear}
        </Link>
      )}
      <span className="w-full text-xs text-muted">{w.hint}</span>
      {invalid && <p className="w-full text-sm text-danger">{w.invalid}</p>}
    </form>
  );
}
