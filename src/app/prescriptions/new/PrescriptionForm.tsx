"use client";

import { useActionState, useState } from "react";
import { createPrescription } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { DOSE_UNITS, doseUnitLabel } from "@/lib/i18n/enum-labels";

export type MedicationOption = { id: string; name: string; dose_unit: string };
export type FrequencyOption = {
  id: string;
  label: string;
  doses_per_day: number | null;
};
export type VetAppointmentOption = {
  id: string;
  appointment_date: string;
  reason: string | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PrescriptionForm({
  residentId,
  residentDisplayName,
  medications,
  frequencies,
  vetAppointments,
  preselectedVetAppointmentId,
}: {
  residentId: string;
  residentDisplayName: string;
  medications: MedicationOption[];
  frequencies: FrequencyOption[];
  vetAppointments: VetAppointmentOption[];
  preselectedVetAppointmentId: string | null;
}) {
  const [state, formAction, pending] = useActionState(createPrescription, undefined);
  const { t, locale } = useI18n();

  // Medication / frequency each switch between "pick one" and "add a new
  // one" the way the intake form's origin field does; whichever set of
  // inputs is mounted is what gets submitted.
  const [medicationId, setMedicationId] = useState("");
  const [isAddingMedication, setIsAddingMedication] = useState(
    medications.length === 0,
  );
  const [newMedicationUnit, setNewMedicationUnit] = useState<string>("tablet");
  const [isAddingFrequency, setIsAddingFrequency] = useState(false);

  // The dose is entered in whichever unit the chosen medication uses.
  const selectedMedication = medications.find((m) => m.id === medicationId);
  const doseUnit = isAddingMedication
    ? newMedicationUnit
    : (selectedMedication?.dose_unit ?? null);

  // A prescription written at a vet visit starts on the day of the visit
  // unless the user says otherwise.
  const [startTouched, setStartTouched] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    if (preselectedVetAppointmentId) {
      const match = vetAppointments.find((a) => a.id === preselectedVetAppointmentId);
      if (match) return match.appointment_date.slice(0, 10);
    }
    return todayIsoDate();
  });
  const [endDate, setEndDate] = useState("");

  function handleVetAppointmentChange(id: string) {
    if (startTouched || !id) return;
    const match = vetAppointments.find((a) => a.id === id);
    if (match) setStartDate(match.appointment_date.slice(0, 10));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />

      <p className="text-sm text-muted">
        {t.prescriptions.forResident(residentDisplayName)}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="medicationId" className="text-sm font-medium text-muted">
          {t.prescriptions.medication} <span className="text-danger">*</span>
        </label>
        {isAddingMedication ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                id="newMedicationName"
                name="newMedicationName"
                required
                autoFocus={medications.length > 0}
                placeholder={t.prescriptions.newMedicationPlaceholder}
                className={`${inputClass} flex-1`}
              />
              {medications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingMedication(false)}
                  title={t.prescriptions.chooseExistingMedication}
                  className="rounded border border-border px-3 text-sm text-muted hover:bg-surface-hover"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="newMedicationUnit"
                className="text-sm font-medium text-muted"
              >
                {t.prescriptions.newMedicationUnit}
              </label>
              <select
                id="newMedicationUnit"
                name="newMedicationUnit"
                value={newMedicationUnit}
                onChange={(e) => setNewMedicationUnit(e.target.value)}
                className={inputClass}
              >
                {DOSE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {doseUnitLabel(t, unit)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">
                {t.prescriptions.newMedicationUnitHint}
              </p>
            </div>
          </div>
        ) : (
          <select
            id="medicationId"
            name="medicationId"
            required
            value={medicationId}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setIsAddingMedication(true);
                setMedicationId("");
              } else {
                setMedicationId(e.target.value);
              }
            }}
            className={inputClass}
          >
            <option value="">{t.prescriptions.selectMedication}</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({doseUnitLabel(t, m.dose_unit)})
              </option>
            ))}
            <option value="__new__">{t.prescriptions.addNewMedication}</option>
          </select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="doseQuantity" className="text-sm font-medium text-muted">
            {t.prescriptions.dose}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="doseQuantity"
              name="doseQuantity"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="1"
              className={`${inputClass} w-full`}
            />
            {doseUnit && (
              <span className="shrink-0 text-sm text-muted">
                {doseUnitLabel(t, doseUnit)}
              </span>
            )}
          </div>
          {doseUnit && (
            <p className="text-xs text-muted">
              {t.prescriptions.doseHint(doseUnitLabel(t, doseUnit))}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="frequencyId" className="text-sm font-medium text-muted">
            {t.prescriptions.frequency}
          </label>
          {isAddingFrequency ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  id="newFrequencyLabel"
                  name="newFrequencyLabel"
                  required
                  autoFocus
                  placeholder={t.prescriptions.newFrequencyPlaceholder}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setIsAddingFrequency(false)}
                  title={t.prescriptions.chooseExistingFrequency}
                  className="rounded border border-border px-3 text-sm text-muted hover:bg-surface-hover"
                >
                  ×
                </button>
              </div>
              <label
                htmlFor="newFrequencyDosesPerDay"
                className="text-sm font-medium text-muted"
              >
                {t.prescriptions.newFrequencyDosesPerDay}
              </label>
              <input
                id="newFrequencyDosesPerDay"
                name="newFrequencyDosesPerDay"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className={inputClass}
              />
              <p className="text-xs text-muted">
                {t.prescriptions.newFrequencyDosesPerDayHint}
              </p>
            </div>
          ) : (
            <select
              id="frequencyId"
              name="frequencyId"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value === "__new__") setIsAddingFrequency(true);
              }}
              className={inputClass}
            >
              <option value="">{t.prescriptions.selectFrequency}</option>
              {frequencies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
              <option value="__new__">{t.prescriptions.addNewFrequency}</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-sm font-medium text-muted">
            {t.prescriptions.startDate} <span className="text-danger">*</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => {
              setStartTouched(true);
              setStartDate(e.target.value);
            }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="endDate" className="text-sm font-medium text-muted">
            {t.prescriptions.endDate}
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
          <p className="text-xs text-muted">{t.prescriptions.endDateHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="vetAppointmentId" className="text-sm font-medium text-muted">
          {t.prescriptions.linkedVisit}
        </label>
        <select
          id="vetAppointmentId"
          name="vetAppointmentId"
          defaultValue={preselectedVetAppointmentId ?? ""}
          onChange={(e) => handleVetAppointmentChange(e.target.value)}
          className={inputClass}
        >
          <option value="">{t.prescriptions.noLinkedVisit}</option>
          {vetAppointments.map((a) => (
            <option key={a.id} value={a.id}>
              {formatDate(a.appointment_date, locale)}
              {a.reason ? ` — ${a.reason}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.prescriptions.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder={t.prescriptions.notesPlaceholder}
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
          {pending ? t.prescriptions.saving : t.prescriptions.saveButton}
        </button>
      </div>
    </form>
  );
}
