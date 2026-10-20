"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";
import Link from "next/link";
import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { createPrescription, updatePrescription } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, todayIso } from "@/lib/format";
import { DOSE_UNITS, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { compareSchedules, describeSchedule, type FrequencySchedule } from "@/lib/prescriptions/frequency";
import { defaultRoundKeys, showsRoundTicks, tickVerdict } from "@/lib/prescriptions/rounds";
import {
  EMPTY_SCHEDULE_FIELDS,
  FrequencyScheduleFields,
} from "@/components/FrequencyScheduleFields";
import type {
  FrequencyOption,
  MedicationOption,
  ClinicVisitOption,
  RoundOption,
  FrequencyRoundDefaults,
} from "@/lib/prescriptions/options";
import { OptionalDateInput } from "@/components/OptionalDateInput";
import { visitDate } from "@/lib/clinics/linkable";
import { DateInput } from "@/components/DateInput";

export type { FrequencyOption, MedicationOption, ClinicVisitOption };

/** The columns the edit page loads to prefill the form. */
export type PrescriptionInitial = {
  id: string;
  medication_id: string | null;
  frequency_id: string | null;
  clinic_visit_id: string | null;
  dose_quantity: number | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  /** The rounds ticked now (prescription_rounds), as round ids. */
  round_ids?: string[];
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * One form for adding and editing. Edit mode prefills every field from
 * `initial` and submits `updatePrescription` instead; the inline "add a new
 * medication / frequency" affordances stay available either way.
 */
/**
 * The name, with the unit it is dosed in after it — unless the name already
 * says so ("Amoxicillin 250mg tablet" does not need "(tablet(s))" after it).
 */
function medicationOptionLabel(t: Parameters<typeof doseUnitLabel>[0], m: { name: string; dose_unit: string }) {
  return m.name.toLowerCase().includes(m.dose_unit.toLowerCase())
    ? m.name
    : `${m.name} (${doseUnitLabel(t, m.dose_unit)})`;
}

/** The schedule the inline "add a frequency" fields describe so far, or null while incomplete. */
function scheduleOfFields(v: typeof EMPTY_SCHEDULE_FIELDS): FrequencySchedule | null {
  if (v.kind === "asNeeded") return { doses_per_day: null, interval_count: null, interval_unit: null };
  const n = Number(v.kind === "perDay" ? v.dosesPerDay : v.intervalCount);
  if (!Number.isInteger(n) || n <= 0) return null;
  return v.kind === "perDay"
    ? { doses_per_day: n, interval_count: null, interval_unit: null }
    : { doses_per_day: null, interval_count: n, interval_unit: "day" };
}

export function PrescriptionForm({
  mode = "create",
  residentId,
  residentDisplayName,
  medications,
  frequencies,
  clinicVisits,
  rounds,
  frequencyRounds,
  preselectedClinicVisitId = null,
  initial = null,
  cancelHref,
}: {
  mode?: "create" | "edit";
  residentId: string;
  residentDisplayName: string;
  medications: MedicationOption[];
  frequencies: FrequencyOption[];
  clinicVisits: ClinicVisitOption[];
  rounds: RoundOption[];
  frequencyRounds: FrequencyRoundDefaults;
  preselectedClinicVisitId?: string | null;
  initial?: PrescriptionInitial | null;
  cancelHref: string;
}) {
  const [state, onSubmit, pending] = useKeptForm(
    mode === "create" ? createPrescription : updatePrescription,
    undefined,
  );
  const { t, locale } = useI18n();
  // A visit passed in the URL that the list does not offer (one after today)
  // is not preselected: the form starts unlinked rather than on a hidden value.
  const preselectedVisit =
    clinicVisits.find((a) => a.id === preselectedClinicVisitId) ?? null;

  // Medication / frequency each switch between "pick one" and "add a new
  // one" the way the intake form's origin field does; whichever set of
  // inputs is mounted is what gets submitted.
  const [medicationId, setMedicationId] = useState(initial?.medication_id ?? "");
  const [isAddingMedication, setIsAddingMedication] = useState(
    medications.length === 0,
  );
  const [newMedicationUnit, setNewMedicationUnit] = useState<string>("tablet");
  const [isAddingFrequency, setIsAddingFrequency] = useState(false);
  const [newSchedule, setNewSchedule] = useState(EMPTY_SCHEDULE_FIELDS);

  // The rounds ticked. Choosing a frequency pre-ticks its defaults; the person can change them.
  const [frequencyId, setFrequencyId] = useState(initial?.frequency_id ?? "");
  const [ticked, setTicked] = useState<Set<string>>(
    () =>
      new Set(
        initial?.round_ids ?? (initial?.frequency_id ? (frequencyRounds[initial.frequency_id] ?? []) : []),
      ),
  );
  const chosenFrequency = frequencies.find((f) => f.id === frequencyId) ?? null;
  const schedule: FrequencySchedule | null = isAddingFrequency
    ? scheduleOfFields(newSchedule)
    : chosenFrequency;
  const verdict = tickVerdict(schedule, ticked.size);

  function tickDefaultsFor(s: FrequencySchedule | null) {
    const keys = s ? defaultRoundKeys(s) : [];
    setTicked(new Set(rounds.filter((r) => keys.includes(r.key)).map((r) => r.id)));
  }
  function toggleRound(id: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // The dose is entered in whichever unit the chosen medication uses.
  const selectedMedication = medications.find((m) => m.id === medicationId);
  const doseUnit = isAddingMedication
    ? newMedicationUnit
    : (selectedMedication?.dose_unit ?? null);

  // A prescription written at a clinic visit starts on the day of the visit
  // unless the user says otherwise.
  const [startTouched, setStartTouched] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    if (initial) return initial.start_date;
    if (preselectedVisit) return visitDate(preselectedVisit);
    return todayIso();
  });
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");

  function handleClinicVisitChange(id: string) {
    if (startTouched || mode === "edit" || !id) return;
    const match = clinicVisits.find((a) => a.id === id);
    if (match) setStartDate(visitDate(match));
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />
      {mode === "edit" && initial && (
        <input type="hidden" name="prescriptionId" value={initial.id} />
      )}

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
                <RowActionButton
                  icon={ACTION_ICONS.clear}
                  label={t.prescriptions.chooseExistingMedication}
                  onClick={() => setIsAddingMedication(false)}
                />
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
                {medicationOptionLabel(t, m)}
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
              defaultValue={initial?.dose_quantity ?? ""}
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
                <RowActionButton
                  icon={ACTION_ICONS.clear}
                  label={t.prescriptions.chooseExistingFrequency}
                  onClick={() => {
                    setIsAddingFrequency(false);
                    setTicked(new Set(frequencyId ? (frequencyRounds[frequencyId] ?? []) : []));
                  }}
                />
              </div>
              <span className="text-sm font-medium text-muted">
                {t.prescriptions.newFrequencySchedule}
              </span>
              <FrequencyScheduleFields
                value={newSchedule}
                onChange={(v) => {
                  setNewSchedule(v);
                  tickDefaultsFor(scheduleOfFields(v));
                }}
                namePrefix="newFrequency"
              />
              <p className="text-xs text-muted">
                {t.prescriptions.newFrequencyScheduleHint}
              </p>
            </div>
          ) : (
            <select
              id="frequencyId"
              name="frequencyId"
              value={frequencyId}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setIsAddingFrequency(true);
                  setFrequencyId("");
                  tickDefaultsFor(null);
                  return;
                }
                setFrequencyId(e.target.value);
                setTicked(new Set(frequencyRounds[e.target.value] ?? []));
              }}
              className={inputClass}
            >
              <option value="">{t.prescriptions.selectFrequency}</option>
              {[...frequencies]
                .sort((a, b) => compareSchedules(a, b) || a.label.localeCompare(b.label))
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} — {describeSchedule(t, f)}
                  </option>
                ))}
              <option value="__new__">{t.prescriptions.addNewFrequency}</option>
            </select>
          )}
        </div>
      </div>

      {showsRoundTicks(schedule) && rounds.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-muted">{t.prescriptions.rounds}</legend>
          <div className="grid grid-cols-3 gap-2">
            {rounds.map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center justify-center gap-2 rounded border border-border bg-surface px-3 py-4 text-base font-medium text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name="roundId"
                  value={r.id}
                  checked={ticked.has(r.id)}
                  onChange={() => toggleRound(r.id)}
                  className="h-5 w-5"
                />
                {r.name}
              </label>
            ))}
          </div>
          {verdict === "tooMany" && schedule && (
            <p role="alert" className="text-sm text-danger">
              {t.prescriptions.roundsTooMany(describeSchedule(t, schedule), ticked.size)}
            </p>
          )}
          {verdict === "fewer" && schedule && (
            <p className="text-sm text-muted">
              {t.prescriptions.roundsFewer(describeSchedule(t, schedule), ticked.size)}
            </p>
          )}
          {verdict === "none" && <p className="text-sm text-muted">{t.prescriptions.roundsNone}</p>}
          <p className="text-xs text-muted">{t.prescriptions.roundsHint}</p>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-sm font-medium text-muted">
            {t.prescriptions.startDate} <span className="text-danger">*</span>
          </label>
          <DateInput
            id="startDate"
            name="startDate"
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
          <OptionalDateInput
            id="endDate"
            name="endDate"
            label={t.prescriptions.endDate}
            value={endDate}
            min={startDate || undefined}
            onValueChange={setEndDate}
            className={inputClass}
          />
          <p className="text-xs text-muted">{t.prescriptions.endDateHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="clinicVisitId" className="text-sm font-medium text-muted">
          {t.prescriptions.linkedVisit}
        </label>
        <select
          id="clinicVisitId"
          name="clinicVisitId"
          defaultValue={initial?.clinic_visit_id ?? preselectedVisit?.id ?? ""}
          onChange={(e) => handleClinicVisitChange(e.target.value)}
          className={inputClass}
        >
          <option value="">{t.prescriptions.noLinkedVisit}</option>
          {clinicVisits.map((a) => (
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
          defaultValue={initial?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-4">
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending}>
          {pending
            ? t.prescriptions.saving
            : mode === "create"
              ? t.prescriptions.saveButton
              : t.common.saveChanges}
        </ActionButton>
        <Link href={cancelHref} className="text-sm text-muted hover:text-foreground">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
