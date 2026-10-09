"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import Link from "next/link";
import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { updateVetVisit } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { vetOptionLabel, type VetOption } from "@/app/clinic-visits/new/ClinicVisitForm";
import type { DoctorNamesByClinic } from "@/lib/clinics/doctors";
import { DoctorNameField } from "../../DoctorNameField";

export type VetVisitInitial = {
  id: string;
  resident_id: string;
  clinic_id: string | null;
  appointment_date: string;
  status: string;
  reason: string | null;
  doctor_name: string | null;
  notes: string | null;
  cost: number | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/** An ISO timestamp as the local `datetime-local` value (minutes precision). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Edits one visit after it's booked — the booking form is for several
 * residents at once and has no cancelled state, so this is its own
 * single-row form: mark the visit completed or cancelled, fix the date or
 * vet, and record what it cost from the invoice.
 */
export function ClinicVisitEditForm({
  visit,
  vets,
  fixedVet,
  lockedDoctor,
  doctorNamesByVet,
  residentDisplayName,
  cancelHref,
}: {
  visit: VetVisitInitial;
  vets: VetOption[];
  /** A vet account's only clinic, when that is the only one on offer (src/lib/clinics/scope.ts). */
  fixedVet: VetOption | null;
  /**
   * A linked vet's Doctor field, locked: the visit's own doctor if it has
   * one (a vet does not reassign a colleague's visit), otherwise themselves.
   */
  lockedDoctor: string | null;
  doctorNamesByVet: DoctorNamesByClinic;
  residentDisplayName: string;
  cancelHref: string;
}) {
  const [state, onSubmit, pending] = useKeptForm(updateVetVisit, undefined);
  const { t } = useI18n();
  const v = t.vetVisits;
  const [clinicId, setVetId] = useState(fixedVet?.id ?? visit.clinic_id ?? "");

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="visitId" value={visit.id} />
      <input type="hidden" name="residentId" value={visit.resident_id} />

      <p className="text-sm text-muted">{v.forResident(residentDisplayName)}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="clinicId" className="text-sm font-medium text-muted">
            {v.vetClinic}
          </label>
          {fixedVet ? (
            <>
              <input type="hidden" name="clinicId" value={fixedVet.id} />
              <p id="clinicId" className="py-2 text-sm text-foreground">
                {vetOptionLabel(fixedVet)}
              </p>
              <p className="text-xs text-muted">{v.ownClinicHint}</p>
            </>
          ) : (
          <select
            id="clinicId"
            name="clinicId"
            required
            value={clinicId}
            onChange={(e) => setVetId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              {v.selectVet}
            </option>
            {vets.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vetOptionLabel(vet)}
              </option>
            ))}
          </select>
          )}
        </div>

        <DoctorNameField
          clinicId={clinicId}
          namesByVet={doctorNamesByVet}
          lockedName={lockedDoctor}
          defaultValue={visit.doctor_name ?? ""}
          className={inputClass}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="appointmentDate" className="text-sm font-medium text-muted">
            {v.dateTime}
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            type="datetime-local"
            required
            defaultValue={toLocalInput(visit.appointment_date)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reason" className="text-sm font-medium text-muted">
            {v.reason}
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            defaultValue={visit.reason ?? ""}
            placeholder={v.reasonPlaceholder}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-muted">
            {v.status}
          </label>
          <select id="status" name="status" defaultValue={visit.status} className={inputClass}>
            <option value="scheduled">{v.statusScheduled}</option>
            <option value="completed">{v.statusCompleted}</option>
            <option value="cancelled">{v.statusCancelled}</option>
          </select>
          <p className="text-xs text-muted">{v.statusHint}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cost" className="text-sm font-medium text-muted">
            {v.cost}
          </label>
          <input
            id="cost"
            name="cost"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            defaultValue={visit.cost ?? ""}
            placeholder="฿"
            className={inputClass}
          />
          <p className="text-xs text-muted">{v.costHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {v.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={visit.notes ?? ""}
          placeholder={v.notesPlaceholder}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-4">
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending}>
          {pending ? t.common.saving : t.common.saveChanges}
        </ActionButton>
        <Link href={cancelHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
