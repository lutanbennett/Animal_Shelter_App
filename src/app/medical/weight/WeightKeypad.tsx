"use client";

import { useKeptForm } from "@/lib/use-kept-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { weightUnit } from "@/lib/format";
import { saveMedicalWeight } from "./actions";

/**
 * The one number the Head of Medical's helpers must type: big, with the decimal keypad open
 * (`inputMode="decimal"`, focused on arrival). A refused save keeps what was typed (useKeptForm).
 */
export function WeightKeypad({
  residentId,
  replacing,
}: {
  residentId: string;
  /** Today already has a reading, so saving replaces it. */
  replacing: boolean;
}) {
  const { t, locale } = useI18n();
  const w = t.medicalJobs.weight;
  const [state, onSubmit, pending] = useKeptForm(saveMedicalWeight, undefined);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="residentId" value={residentId} />
      <label htmlFor="weightKg" className="text-base font-semibold text-foreground">
        {w.kgLabel}
      </label>
      <div className="relative">
        <input
          id="weightKg"
          name="weightKg"
          type="number"
          inputMode="decimal"
          required
          min="0.01"
          step="0.01"
          placeholder="0.00"
          autoFocus
          className="min-h-24 w-full rounded-lg border-2 border-foreground bg-surface px-4 pr-16 text-5xl font-semibold text-foreground outline-none focus:ring-4 focus:ring-primary/40"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-2xl font-medium text-muted"
        >
          {weightUnit(locale)}
        </span>
      </div>
      {state?.error && (
        <p role="alert" className="rounded border-2 border-red-400 bg-red-50 p-3 text-base text-red-800">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-16 rounded-lg bg-primary px-4 text-xl font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? w.saving : replacing ? w.replace : w.save}
      </button>
    </form>
  );
}
