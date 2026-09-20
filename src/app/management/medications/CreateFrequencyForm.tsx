"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createFrequency } from "./actions";

export function CreateFrequencyForm() {
  const [state, formAction, pending] = useActionState(createFrequency, undefined);
  const { t } = useI18n();
  const m = t.management.medications;

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="frequency-label" className="text-sm font-medium text-muted">
          {m.frequencyForm.label}
        </label>
        <input
          id="frequency-label"
          name="label"
          required
          placeholder={m.frequencyForm.labelPlaceholder}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="frequency-doses-per-day"
          className="text-sm font-medium text-muted"
        >
          {m.frequencyForm.dosesPerDay}
        </label>
        <input
          id="frequency-doses-per-day"
          name="dosesPerDay"
          type="number"
          min="0.001"
          step="any"
          inputMode="decimal"
          placeholder={m.frequencyForm.dosesPerDayPlaceholder}
          className="w-40 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
        <span className="text-xs text-muted">{m.frequencyForm.dosesPerDayHint}</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? t.common.creating : m.frequencyForm.addButton}
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
