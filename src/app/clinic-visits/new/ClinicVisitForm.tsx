"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { bookClinicVisit } from "./actions";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DoctorNamesByClinic } from "@/lib/clinics/doctors";
import { DoctorNameField } from "../DoctorNameField";

export type { ResidentOption };

export type ClinicOption = {
  id: string;
  name: string;
};

/**
 * `fixedClinic` is a doctor login's only current clinic (src/lib/clinics/scope.ts):
 * shown as the clinic the visit is for rather than a dropdown with one entry.
 * A doctor who works at several chooses among theirs.
 */
export function ClinicVisitForm({
  residents,
  clinics,
  fixedClinic,
  lockedDoctor,
  doctorNamesByClinic,
  preselectedResidentIds,
}: {
  residents: ResidentOption[];
  clinics: ClinicOption[];
  fixedClinic: ClinicOption | null;
  /** A doctor login's own doctor entry: the Doctor field is them, locked. */
  lockedDoctor: string | null;
  doctorNamesByClinic: DoctorNamesByClinic;
  preselectedResidentIds: string[];
}) {
  const [state, onSubmit, pending] = useKeptForm(bookClinicVisit, undefined);
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselectedResidentIds,
  );
  const [clinicId, setClinicId] = useState(fixedClinic?.id ?? "");
  const [statusTouched, setStatusTouched] = useState(false);
  const [status, setStatus] = useState<"scheduled" | "completed">(
    "scheduled",
  );

  function handleDateChange(value: string) {
    if (statusTouched || !value) return;
    setStatus(new Date(value).getTime() <= Date.now() ? "completed" : "scheduled");
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted">
          {t.vetVisits.residentsLabel}
        </label>
        <ResidentPicker
          residents={residents}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          triggerLabel={t.vetVisits.selectResidents}
        />
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="residentIds" value={id} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="clinicId" className="text-sm font-medium text-muted">
            {t.vetVisits.vetClinic}
          </label>
          {fixedClinic ? (
            <>
              <input type="hidden" name="clinicId" value={fixedClinic.id} />
              <p id="clinicId" className="py-2 text-sm text-foreground">
                {fixedClinic.name}
              </p>
              <p className="text-xs text-muted">{t.vetVisits.ownClinicHint}</p>
            </>
          ) : (
          <select
            id="clinicId"
            name="clinicId"
            required
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="" disabled>
              {t.vetVisits.selectVet}
            </option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          )}
        </div>

        <DoctorNameField
          clinicId={clinicId}
          namesByClinic={doctorNamesByClinic}
          lockedName={lockedDoctor}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="appointmentDate"
            className="text-sm font-medium text-muted"
          >
            {t.vetVisits.dateTime}
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            type="datetime-local"
            required
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted">{t.vetVisits.dateTimeHint}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reason" className="text-sm font-medium text-muted">
            {t.vetVisits.reason}
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            placeholder={t.vetVisits.reasonPlaceholder}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-muted">
            {t.vetVisits.status}
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => {
              setStatusTouched(true);
              setStatus(e.target.value as "scheduled" | "completed");
            }}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="scheduled">{t.vetVisits.statusScheduled}</option>
            <option value="completed">{t.vetVisits.statusCompleted}</option>
          </select>
          <p className="text-xs text-muted">{t.vetVisits.statusHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.vetVisits.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder={t.vetVisits.notesPlaceholder}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending}>
          {pending ? t.vetVisits.booking : t.vetVisits.bookButton(selectedIds.length)}
        </ActionButton>
      </div>
    </form>
  );
}
