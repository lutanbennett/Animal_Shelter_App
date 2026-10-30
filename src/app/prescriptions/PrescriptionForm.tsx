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
import { doseUnitLabel } from "@/lib/i18n/enum-labels";
import { UnitSelect } from "@/components/UnitSelect";
import { defaultRoundKeys, showsRoundTicks, tickVerdict } from "@/lib/prescriptions/rounds";
import {
  parseScheduleForm,
  scheduleToForm,
  AS_NEEDED,
  type RxSchedule,
} from "@/lib/prescriptions/schedule";
import { ScheduleDays } from "./ScheduleDays";
import type { MedicationOption, ClinicVisitOption, RoundOption } from "@/lib/prescriptions/options";
import { OptionalDateInput } from "@/components/OptionalDateInput";
import { visitDate } from "@/lib/clinics/linkable";
import { DateInput } from "@/components/DateInput";

export type { MedicationOption, ClinicVisitOption };

/** The columns the edit page loads to prefill the form. */
export type PrescriptionInitial = {
  id: string;
  medication_id: string | null;
  clinic_visit_id: string | null;
  dose_quantity: number | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  /** Which days (0283): every N days / weeks / months, or none = as needed. */
  schedule_unit: RxSchedule["schedule_unit"];
  schedule_every: number | null;
  schedule_weekdays: number[] | null;
  schedule_month_days: number[] | null;
  /** The rounds ticked now (prescription_rounds), as round ids. */
  round_ids?: string[];
  /** The amount given in each ticked round (prescription_rounds.dose_quantity), by round id. */
  round_doses?: Record<string, number | null>;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * One form for adding and editing. Edit mode prefills every field from
 * `initial` and submits `updatePrescription` instead; the inline "add a new
 * medication" affordance stays available either way.
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

export function PrescriptionForm({
  mode = "create",
  residentId,
  residentDisplayName,
  medications,
  clinicVisits,
  rounds,
  preselectedClinicVisitId = null,
  initial = null,
  cancelHref,
}: {
  mode?: "create" | "edit";
  residentId: string;
  residentDisplayName: string;
  medications: MedicationOption[];
  clinicVisits: ClinicVisitOption[];
  rounds: RoundOption[];
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

  // Medication switches between "pick one" and "add a new
  // one" the way the intake form's origin field does; whichever set of
  // inputs is mounted is what gets submitted.
  const [medicationId, setMedicationId] = useState(initial?.medication_id ?? "");
  const [isAddingMedication, setIsAddingMedication] = useState(
    medications.length === 0,
  );
  const [newMedicationUnit, setNewMedicationUnit] = useState<string>("tablet");
  // Which days (0283); the ticks below are the times on those days, one dose each.
  const [ticked, setTicked] = useState<Set<string>>(
    () =>
      new Set(
        initial?.round_ids ??
          // A new prescription is every day, so it starts with the Morning dose ticked.
          rounds.filter((r) => defaultRoundKeys({ ...AS_NEEDED, schedule_unit: "day", schedule_every: 1 }).includes(r.key)).map((r) => r.id),
      ),
  );
  // Amount per ticked round, as typed; blank means "the dose above".
  const [roundDoses, setRoundDoses] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initial?.round_doses ?? {}).map(([id, q]) => [id, q == null ? "" : String(q)]),
    ),
  );

  function tickDefaultsFor(s: RxSchedule | null) {
    const keys = defaultRoundKeys(s);
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

  const [days, setDays] = useState(() =>
    scheduleToForm(
      initial
        ? {
            schedule_unit: initial.schedule_unit,
            schedule_every: initial.schedule_every,
            schedule_weekdays: initial.schedule_weekdays,
            schedule_month_days: initial.schedule_month_days,
          }
        : null,
      initial?.start_date ?? startDate,
    ),
  );
  const parsedDays = parseScheduleForm({
    unit: days.unit,
    every: days.every,
    weekdays: days.weekdays,
    monthDays: days.monthDays,
  });
  const schedule: RxSchedule | null = "schedule" in parsedDays ? parsedDays.schedule : null;
  const verdict = tickVerdict(schedule, ticked.size);

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
              <UnitSelect
                list="medicines"
                id="newMedicationUnit"
                name="newMedicationUnit"
                value={newMedicationUnit}
                onChange={(e) => setNewMedicationUnit(e.target.value)}
                className={inputClass}
              />
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
          <span className="text-sm font-medium text-muted">{t.prescriptions.schedule}</span>
          <ScheduleDays
            value={days}
            startDate={startDate}
            onChange={(v) => {
              setDays(v);
              // Ticks follow the kind of schedule, not each edit within it: switching to or from as needed.
              const was = days.unit === "asNeeded";
              const now = v.unit === "asNeeded";
              if (was !== now) tickDefaultsFor(now ? AS_NEEDED : { ...AS_NEEDED, schedule_unit: "day", schedule_every: 1 });
            }}
          />
          <p className="text-xs text-muted">{t.prescriptions.scheduleHint}</p>
        </div>
      </div>

      {showsRoundTicks(schedule) && rounds.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-muted">{t.prescriptions.rounds}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
          {rounds.some((r) => ticked.has(r.id)) && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {rounds
                .filter((r) => ticked.has(r.id))
                .map((r) => (
                  <label key={r.id} className="flex flex-col gap-1 text-xs text-muted">
                    {t.prescriptions.roundDose(r.name)}
                    <input
                      name={`roundDose_${r.id}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={roundDoses[r.id] ?? ""}
                      onChange={(e) => setRoundDoses((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className={inputClass}
                    />
                  </label>
                ))}
            </div>
          )}
          <p className="text-xs text-muted">{t.prescriptions.roundDosesHint}</p>
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
