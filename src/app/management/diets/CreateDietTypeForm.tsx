"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DIET_UNITS, dietUnitLabel } from "@/lib/i18n/enum-labels";
import { createDietType } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function CreateDietTypeForm() {
  const [state, formAction, pending] = useActionState(createDietType, undefined);
  const { t } = useI18n();
  const m = t.management.diets;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="diet-name" className="text-sm font-medium text-muted">
            {m.createForm.name}
          </label>
          <input
            id="diet-name"
            name="name"
            required
            placeholder={m.createForm.namePlaceholder}
            className={`${inputClass} w-64`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="diet-unit" className="text-sm font-medium text-muted">
            {m.createForm.unit}
          </label>
          <select id="diet-unit" name="unit" required defaultValue="g" className={`${inputClass} w-32`}>
            {DIET_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {dietUnitLabel(t, unit)}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">{m.createForm.unitHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="diet-cost" className="text-sm font-medium text-muted">
            {m.createForm.cost}
          </label>
          <input
            id="diet-cost"
            name="costPerUnit"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue="0"
            className={`${inputClass} w-32`}
          />
          <span className="text-xs text-muted">{m.createForm.costHint}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <span className="w-full text-sm font-medium text-muted">{m.createForm.quantities}</span>
        {(
          [
            ["dailyQtySmall", m.createForm.small],
            ["dailyQtyMedium", m.createForm.medium],
            ["dailyQtyLarge", m.createForm.large],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={`diet-${name}`} className="text-xs text-muted">
              {label}
            </label>
            <input
              id={`diet-${name}`}
              name={name}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              required
              className={`${inputClass} w-28`}
            />
          </div>
        ))}
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="diet-notes" className="text-xs text-muted">
            {m.createForm.notes}
          </label>
          <input id="diet-notes" name="notes" className={`${inputClass} min-w-48`} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.creating : m.createForm.addButton}
        </button>
      </div>

      {state && "error" in state && <p className="text-sm text-danger">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}
