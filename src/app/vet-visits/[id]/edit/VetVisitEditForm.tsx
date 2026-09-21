"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateVetVisit } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { VetOption } from "@/app/vet-visits/new/VetVisitForm";

export type VetVisitInitial = {
  id: string;
  resident_id: string;
  vet_id: string | null;
  appointment_date: string;
  status: string;
  reason: string | null;
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
  residentDisplayName,
  cancelHref,
}: {
  visit: VetVisitInitial;
  vets: VetOption[];
  residentDisplayName: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(updateVetVisit, undefined);
  const { t } = useI18n();
  const v = t.vetVisits;

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="visitId" value={visit.id} />
      <input type="hidden" name="residentId" value={visit.resident_id} />

      <p className="text-sm text-muted">{v.forResident(residentDisplayName)}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="vetId" className="text-sm font-medium text-muted">
            {v.vetClinic}
          </label>
          <select id="vetId" name="vetId" required defaultValue={visit.vet_id ?? ""} className={inputClass}>
            <option value="" disabled>
              {v.selectVet}
            </option>
            {vets.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.clinic_name ? `${vet.name} — ${vet.clinic_name}` : vet.name}
              </option>
            ))}
          </select>
        </div>

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
