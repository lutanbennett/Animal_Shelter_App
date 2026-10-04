"use client";

import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { bookVetVisit } from "./actions";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DoctorNamesByVet } from "@/lib/vets/doctors";
import { DoctorNameField } from "../DoctorNameField";

export type { ResidentOption };

export type VetOption = {
  id: string;
  name: string;
  clinic_name: string | null;
};

export function vetOptionLabel(v: VetOption) {
  return v.clinic_name ? `${v.name} — ${v.clinic_name}` : v.name;
}

/**
 * `fixedVet` is a vet account's only clinic (src/lib/vets/scope.ts): shown
 * as the clinic the visit is for rather than a dropdown with one entry. A vet
 * who works at several chooses among theirs.
 */
export function VetVisitForm({
  residents,
  vets,
  fixedVet,
  lockedDoctor,
  doctorNamesByVet,
  preselectedResidentIds,
}: {
  residents: ResidentOption[];
  vets: VetOption[];
  fixedVet: VetOption | null;
  /** A linked vet's own doctor entry: the Doctor field is them, locked. */
  lockedDoctor: string | null;
  doctorNamesByVet: DoctorNamesByVet;
  preselectedResidentIds: string[];
}) {
  const [state, onSubmit, pending] = useKeptForm(bookVetVisit, undefined);
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselectedResidentIds,
  );
  const [vetId, setVetId] = useState(fixedVet?.id ?? "");
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
          <label htmlFor="vetId" className="text-sm font-medium text-muted">
            {t.vetVisits.vetClinic}
          </label>
          {fixedVet ? (
            <>
              <input type="hidden" name="vetId" value={fixedVet.id} />
              <p id="vetId" className="py-2 text-sm text-foreground">
                {vetOptionLabel(fixedVet)}
              </p>
              <p className="text-xs text-muted">{t.vetVisits.ownClinicHint}</p>
            </>
          ) : (
          <select
            id="vetId"
            name="vetId"
            required
            value={vetId}
            onChange={(e) => setVetId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="" disabled>
              {t.vetVisits.selectVet}
            </option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {vetOptionLabel(v)}
              </option>
            ))}
          </select>
          )}
        </div>

        <DoctorNameField
          vetId={vetId}
          namesByVet={doctorNamesByVet}
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
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.vetVisits.booking : t.vetVisits.bookButton(selectedIds.length)}
        </button>
      </div>
    </form>
  );
}
