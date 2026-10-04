"use client";

import Link from "next/link";
import { useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { updateVetVisit } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { vetOptionLabel, type VetOption } from "@/app/vet-visits/new/VetVisitForm";
import type { DoctorNamesByVet } from "@/lib/vets/doctors";
import { DoctorNameField } from "../../DoctorNameField";

export type VetVisitInitial = {
  id: string;
  resident_id: string;
  vet_id: string | null;
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
export function VetVisitEditForm({
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
  /** A vet account's only clinic, when that is the only one on offer (src/lib/vets/scope.ts). */
  fixedVet: VetOption | null;
  /**
   * A linked vet's Doctor field, locked: the visit's own doctor if it has
   * one (a vet does not reassign a colleague's visit), otherwise themselves.
   */
  lockedDoctor: string | null;
  doctorNamesByVet: DoctorNamesByVet;
  residentDisplayName: string;
  cancelHref: string;
}) {
  const [state, onSubmit, pending] = useKeptForm(updateVetVisit, undefined);
  const { t } = useI18n();
  const v = t.vetVisits;
  const [vetId, setVetId] = useState(fixedVet?.id ?? visit.vet_id ?? "");

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="visitId" value={visit.id} />
      <input type="hidden" name="residentId" value={visit.resident_id} />

      <p className="text-sm text-muted">{v.forResident(residentDisplayName)}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="vetId" className="text-sm font-medium text-muted">
            {v.vetClinic}
          </label>
          {fixedVet ? (
            <>
              <input type="hidden" name="vetId" value={fixedVet.id} />
              <p id="vetId" className="py-2 text-sm text-foreground">
                {vetOptionLabel(fixedVet)}
              </p>
              <p className="text-xs text-muted">{v.ownClinicHint}</p>
            </>
          ) : (
          <select
            id="vetId"
            name="vetId"
            required
            value={vetId}
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
          vetId={vetId}
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
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.saving : t.common.saveChanges}
        </button>
        <Link href={cancelHref} className="text-sm text-muted hover:text-foreground">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
