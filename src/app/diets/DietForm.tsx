"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import Link from "next/link";
import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { createDiet, updateDiet } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dietUnitLabel, sizeLabel } from "@/lib/i18n/enum-labels";
import { formatQuantity } from "@/lib/diets/options";
import { lineAmount, type DietOption } from "@/lib/diets/recipes";
import { todayIso } from "@/lib/format";
import { OptionalDateInput } from "@/components/OptionalDateInput";
import { DateInput } from "@/components/DateInput";

export type { DietOption };

/** The columns the edit page loads to prefill the form. */
export type DietInitial = {
  id: string;
  diet_id: string;
  start_date: string;
  end_date: string | null;
  meals_per_day: number;
  portion_factor: number | null;
  notes: string | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

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
  diets,
  initial = null,
  cancelHref,
}: {
  mode?: "create" | "edit";
  residentId: string;
  residentDisplayName: string;
  residentSize: string | null;
  diets: DietOption[];
  initial?: DietInitial | null;
  cancelHref: string;
}) {
  const [state, onSubmit, pending] = useKeptForm(
    mode === "create" ? createDiet : updateDiet,
    undefined,
  );
  const { t } = useI18n();

  const [dietPick, setDietPick] = useState(initial?.diet_id ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayIso());
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");

  const selected = diets.find((diet) => diet.id === dietPick);
  // "1.5 cup chicken, 1 cup kibble" at the resident's size (Medium when unset).
  const recipeText = selected
    ? selected.lines
        .map(
          (line) =>
            `${formatQuantity(lineAmount(line, residentSize))} ${line.servingUnit ?? dietUnitLabel(t, line.unit)} ${line.ingredient}`,
        )
        .join(", ")
    : null;
  const quantityHint = selected
    ? residentSize
      ? t.diets.dailyQuantityHint(recipeText ?? "", sizeLabel(t, residentSize))
      : `${t.diets.dailyQuantityNoSize} ${recipeText ?? ""}`
    : null;

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />
      {mode === "edit" && initial && <input type="hidden" name="dietId" value={initial.id} />}

      <p className="text-sm text-muted">{t.diets.forResident(residentDisplayName)}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="dietPick" className="text-sm font-medium text-muted">
          {t.diets.dietType} <span className="text-danger">*</span>
        </label>
        <select
          id="dietPick"
          name="dietPick"
          required
          value={dietPick}
          onChange={(e) => setDietPick(e.target.value)}
          className={inputClass}
        >
          <option value="">{t.diets.selectDietType}</option>
          {diets.map((diet) => (
            <option key={diet.id} value={diet.id}>
              {diet.name}
            </option>
          ))}
        </select>
        {diets.length === 0 && (
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
          <label htmlFor="portionFactor" className="text-sm font-medium text-muted">
            {t.diets.dailyQuantity}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="portionFactor"
              name="portionFactor"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              defaultValue={initial?.portion_factor ?? ""}
              placeholder="1"
              className={`${inputClass} w-full`}
            />
            <span className="shrink-0 text-sm text-muted">×</span>
          </div>
          {quantityHint && <p className="text-xs text-muted">{quantityHint}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-sm font-medium text-muted">
            {t.diets.startDate} <span className="text-danger">*</span>
          </label>
          <DateInput
            id="startDate"
            name="startDate"
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
          <OptionalDateInput
            id="endDate"
            name="endDate"
            label={t.diets.endDate}
            value={endDate}
            min={startDate || undefined}
            onValueChange={setEndDate}
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
      {state?.confirm && (
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" name="confirmBig" className="h-5 w-5" />
          {t.diets.errors.confirmBig}
        </label>
      )}

      <div className="flex items-center gap-4">
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending || diets.length === 0}>
          {pending ? t.diets.saving : mode === "create" ? t.diets.saveButton : t.common.saveChanges}
        </ActionButton>
        <Link href={cancelHref} className="text-sm text-muted hover:text-foreground">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
