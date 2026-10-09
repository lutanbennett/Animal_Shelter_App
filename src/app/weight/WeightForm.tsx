"use client";

import { ActionButton } from "@/components/ActionButton";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { createWeight, saveWeightEdit } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, formatWeightKg, todayIso, weightUnit } from "@/lib/format";
import { visitDate, type LinkableVisit } from "@/lib/clinics/linkable";

export type ClinicVisitOption = LinkableVisit;

/** Another reading of this resident's, for the one-weight-per-day notice. */
export type ExistingReading = { id: string; date: string; weight_kg: number };

export type WeightInitial = {
  id: string;
  date: string;
  weight_kg: number;
  clinic_visit_id: string | null;
  notes: string | null;
};

/**
 * Log a weight (/weight/new), or correct one (/weight/[id]/edit) when
 * `initial` is given.
 *
 * A resident has one weight per day (0106). Choosing a day that already has
 * a reading says so as soon as the date is picked: logging turns into a
 * correction of that reading, and an edit is stopped from moving onto it.
 * The database refuses the second row either way; this is so nobody finds
 * out only after pressing Save.
 */
export function WeightForm({
  residentId,
  residentDisplayName,
  clinicVisits,
  preselectedClinicVisitId = null,
  previousReading = null,
  readings,
  initial = null,
}: {
  residentId: string;
  residentDisplayName: string;
  /** Already filtered to visits this reading may link to (loadLinkableVisits). */
  clinicVisits: ClinicVisitOption[];
  preselectedClinicVisitId?: string | null;
  /** "Last reading: 12.4 kg on 3 Sep 2026", already localised; null when none. */
  previousReading?: string | null;
  /** The resident's other readings — never the one being edited. */
  readings: ExistingReading[];
  initial?: WeightInitial | null;
}) {
  const editing = initial !== null;
  const [state, onSubmit, pending] = useKeptForm(
    editing ? saveWeightEdit : createWeight,
    undefined,
  );
  const { t, locale } = useI18n();
  // Linking a clinic visit defaults the date to the visit's date until the user
  // has typed a date themselves — same behaviour as the blood-test form.
  const [dateTouched, setDateTouched] = useState(editing);
  const [date, setDate] = useState(() => {
    if (initial) return initial.date;
    if (preselectedClinicVisitId) {
      const match = clinicVisits.find((a) => a.id === preselectedClinicVisitId);
      if (match) return visitDate(match);
    }
    return todayIso();
  });

  const sameDay = readings.find((r) => r.date === date) ?? null;

  function handleClinicVisitChange(id: string) {
    if (dateTouched || !id) return;
    const match = clinicVisits.find((a) => a.id === id);
    if (match) setDate(visitDate(match));
  }

  const inputClass =
    "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />
      {initial && <input type="hidden" name="weightId" value={initial.id} />}
      {!editing && sameDay && (
        <input type="hidden" name="replaceWeightId" value={sameDay.id} />
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted">{t.weight.forResident(residentDisplayName)}</p>
        {previousReading && (
          <p className="text-xs text-muted">{previousReading}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="weightKg" className="text-sm font-medium text-muted">
            {t.weight.weightKg}
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
              defaultValue={initial?.weight_kg ?? undefined}
              autoFocus
              className={`${inputClass} w-full pr-10`}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted"
            >
              {weightUnit(locale)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-sm font-medium text-muted">
            {t.weight.dateWeighed}
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            max={todayIso()}
            onChange={(e) => {
              setDateTouched(true);
              setDate(e.target.value);
            }}
            className={inputClass}
          />
        </div>

        {sameDay && (
          <div
            role="status"
            className="flex flex-col gap-1 rounded border border-info/40 bg-info/10 px-3 py-2 text-sm text-foreground sm:col-span-2"
          >
            <p>
              {(editing ? t.weight.sameDay.taken : t.weight.sameDay.replace)(
                formatWeightKg(sameDay.weight_kg, locale),
                formatDate(sameDay.date, locale),
              )}
            </p>
            <div>
              <ActionLink
                href={`/weight/${sameDay.id}/edit`}
                label={t.weight.sameDay.editThat}
                icon={ACTION_ICONS.edit}
                iconOnlyOnMobile={false}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="clinicVisitId" className="text-sm font-medium text-muted">
            {t.weight.linkedVisit}
          </label>
          <select
            id="clinicVisitId"
            name="clinicVisitId"
            defaultValue={initial?.clinic_visit_id ?? preselectedClinicVisitId ?? ""}
            onChange={(e) => handleClinicVisitChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{t.weight.noLinkedVisit}</option>
            {clinicVisits.map((a) => (
              <option key={a.id} value={a.id}>
                {formatDate(a.appointment_date, locale)}
                {a.reason ? ` — ${a.reason}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">{t.weight.linkedVisitHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.weight.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder={t.weight.notesPlaceholder}
          defaultValue={initial?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending || (editing && !!sameDay)}>
          {pending
            ? t.weight.saving
            : editing
              ? t.weight.saveChanges
              : sameDay
                ? t.weight.sameDay.replaceButton
                : t.weight.saveButton}
        </ActionButton>
      </div>
    </form>
  );
}
