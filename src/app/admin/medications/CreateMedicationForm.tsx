"use client";

import { useKeptForm } from "@/lib/use-kept-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DOSE_UNITS, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { createMedication } from "./actions";

/** Name and unit only: the price, reorder lead and safety stock are set on Management → Medication stock. */
export function CreateMedicationForm() {
  const [state, onSubmit, pending] = useKeptForm(createMedication, undefined);
  const { t } = useI18n();
  const m = t.management.medications;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="medication-name" className="text-sm font-medium text-muted">
          {m.createForm.name}
        </label>
        <input
          id="medication-name"
          name="name"
          required
          placeholder={m.createForm.namePlaceholder}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="medication-unit" className="text-sm font-medium text-muted">
          {m.createForm.unit}
        </label>
        <select
          id="medication-unit"
          name="doseUnit"
          required
          defaultValue="tablet"
          className="w-40 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        >
          {DOSE_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {doseUnitLabel(t, unit)}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">{m.createForm.unitHint}</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-0"
      >
        <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
        {pending ? t.common.creating : m.createForm.addButton}
      </button>
      <p className="w-full text-xs text-muted">{m.createForm.priceElsewhere}</p>
      {state && !state.ok && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
