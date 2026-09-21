"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createDiet, updateDiet } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dietUnitLabel, sizeLabel } from "@/lib/i18n/enum-labels";
import {
  defaultDailyQuantity,
  formatQuantity,
  type DietTypeOption,
} from "@/lib/diets/options";

export type { DietTypeOption };

/** The columns the edit page loads to prefill the form. */
export type DietInitial = {
  id: string;
  diet_type_id: string;
  start_date: string;
  end_date: string | null;
  meals_per_day: number;
  daily_quantity: number | null;
  notes: string | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * One form for adding and editing a resident's diet, the shape of
 * PrescriptionForm. The quantity hint follows the chosen diet type and the
 * resident's size so the user sees what "leave blank" will mean.
 */
export function DietForm({
  mode = "create",
  residentId,
  residentDisplayName,
  residentSize,
  dietTypes,
  initial = null,
  cancelHref,
}: {
  mode?: "create" | "edit";
  residentId: string;
  residentDisplayName: string;
  residentSize: string | null;
  dietTypes: DietTypeOption[];
  initial?: DietInitial | null;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createDiet : updateDiet,
    undefined,
  );
  const { t } = useI18n();

  const [dietTypeId, setDietTypeId] = useState(initial?.diet_type_id ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayIsoDate());
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");

  const selectedType = dietTypes.find((type) => type.id === dietTypeId);
  const unit = selectedType ? dietUnitLabel(t, selectedType.unit) : null;
  const quantityHint = selectedType
    ? residentSize
      ? t.diets.dailyQuantityHint(
          formatQuantity(defaultDailyQuantity(selectedType, residentSize)),
          unit ?? selectedType.unit,
          sizeLabel(t, residentSize),
        )
      : t.diets.dailyQuantityNoSize
    : null;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />
      {mode === "edit" && initial && <input type="hidden" name="dietId" value={initial.id} />}

      <p className="text-sm text-muted">{t.diets.forResident(residentDisplayName)}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="dietTypeId" className="text-sm font-medium text-muted">
          {t.diets.dietType} <span className="text-danger">*</span>
        </label>
        <select
          id="dietTypeId"
          name="dietTypeId"
          required
          value={dietTypeId}
          onChange={(e) => setDietTypeId(e.target.value)}
          className={inputClass}
        >
          <option value="">{t.diets.selectDietType}</option>
          {dietTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {dietTypes.length === 0 && (
          <p className="text-xs text-danger">{t.diets.noDietTypes}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="mealsPerDay" className="text-sm font-medium text-muted">
            {t.diets.mealsPerDay} <span className="text-danger">*</span>
          </label>
          <input
            id="mealsPerDay"
            name="mealsPerDay"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            defaultValue={initial?.meals_per_day ?? 2}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dailyQuantity" className="text-sm font-medium text-muted">
            {t.diets.dailyQuantity}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="dailyQuantity"
              name="dailyQuantity"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              defaultValue={initial?.daily_quantity ?? ""}
              className={`${inputClass} w-full`}
            />
            {unit && <span className="shrink-0 text-sm text-muted">{unit}</span>}
          </div>
          {quantityHint && <p className="text-xs text-muted">{quantityHint}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-sm font-medium text-muted">
            {t.diets.startDate} <span className="text-danger">*</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="endDate" className="text-sm font-medium text-muted">
            {t.diets.endDate}
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-muted">{t.diets.endDateHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.diets.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder={t.diets.notesPlaceholder}
          defaultValue={initial?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || dietTypes.length === 0}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.diets.saving : mode === "create" ? t.diets.saveButton : t.common.saveChanges}
        </button>
        <Link href={cancelHref} className="text-sm text-muted hover:text-foreground">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
