"use client";

import { useActionState, useState } from "react";
import { createWeight } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, weightUnit } from "@/lib/format";

export type VetAppointmentOption = {
  id: string;
  appointment_date: string;
  reason: string | null;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeightForm({
  residentId,
  residentDisplayName,
  vetAppointments,
  preselectedVetAppointmentId,
  previousReading,
}: {
  residentId: string;
  residentDisplayName: string;
  vetAppointments: VetAppointmentOption[];
  preselectedVetAppointmentId: string | null;
  /** "Last reading: 12.4 kg on 3 Sep 2026", already localised; null when none. */
  previousReading: string | null;
}) {
  const [state, formAction, pending] = useActionState(createWeight, undefined);
  const { t, locale } = useI18n();
  // Linking a vet visit defaults the date to the visit's date until the user
  // has typed a date themselves — same behaviour as the blood-test form.
  const [dateTouched, setDateTouched] = useState(false);
  const [date, setDate] = useState(() => {
    if (preselectedVetAppointmentId) {
      const match = vetAppointments.find((a) => a.id === preselectedVetAppointmentId);
      if (match) return match.appointment_date.slice(0, 10);
    }
    return todayIsoDate();
  });

  function handleVetAppointmentChange(id: string) {
    if (dateTouched || !id) return;
    const match = vetAppointments.find((a) => a.id === id);
    if (match) setDate(match.appointment_date.slice(0, 10));
  }

  const inputClass =
    "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />

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
            max={todayIsoDate()}
            onChange={(e) => {
              setDateTouched(true);
              setDate(e.target.value);
            }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="vetAppointmentId" className="text-sm font-medium text-muted">
            {t.weight.linkedVisit}
          </label>
          <select
            id="vetAppointmentId"
            name="vetAppointmentId"
            defaultValue={preselectedVetAppointmentId ?? ""}
            onChange={(e) => handleVetAppointmentChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{t.weight.noLinkedVisit}</option>
            {vetAppointments.map((a) => (
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
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.weight.saving : t.weight.saveButton}
        </button>
      </div>
    </form>
  );
}
