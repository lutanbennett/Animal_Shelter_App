"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { updateVetVisitEstimate } from "./actions";

/**
 * The one operational figure on this page (0071): what a typical vet visit
 * costs, used by the cashflow forecast to price visits that are booked but
 * not yet invoiced. Its own card rather than a field inside
 * SiteSettingsForm — everything in that form is public website copy, and
 * this is neither public nor copy.
 *
 * Blank is a real answer: it clears the figure back to "not priced yet",
 * and the forecast then shows vet visits as a gap rather than as zero.
 */
export function VetVisitEstimate({ estimate }: { estimate: number | null }) {
  const [state, formAction, pending] = useActionState(
    updateVetVisitEstimate,
    undefined,
  );
  const { t } = useI18n();
  const v = t.admin.website.vetVisit;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded border border-border bg-surface p-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">{v.heading}</h2>
        <p className="text-sm text-muted">{v.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label
          htmlFor="vetVisitEstimate"
          className="flex flex-col gap-1 text-sm font-medium text-muted"
        >
          {v.label}
          <input
            id="vetVisitEstimate"
            name="vetVisitEstimate"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={estimate ?? ""}
            placeholder={v.placeholder}
            className="w-40 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.saving : t.common.saveChanges}
        </button>
      </div>

      <p className="text-xs text-muted">{v.hint}</p>

      {state && "error" in state && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
