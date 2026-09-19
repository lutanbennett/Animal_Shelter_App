"use client";

import { useActionState, useState } from "react";
import { bookVetVisit } from "./actions";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type { ResidentOption };

export type VetOption = {
  id: string;
  name: string;
  clinic_name: string | null;
};

export function VetVisitForm({
  residents,
  vets,
  preselectedResidentIds,
}: {
  residents: ResidentOption[];
  vets: VetOption[];
  preselectedResidentIds: string[];
}) {
  const [state, formAction, pending] = useActionState(bookVetVisit, undefined);
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselectedResidentIds,
  );
  const [statusTouched, setStatusTouched] = useState(false);
  const [status, setStatus] = useState<"scheduled" | "completed">(
    "scheduled",
  );

  function handleDateChange(value: string) {
    if (statusTouched || !value) return;
    setStatus(new Date(value).getTime() <= Date.now() ? "completed" : "scheduled");
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
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
          <select
            id="vetId"
            name="vetId"
            required
            defaultValue=""
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="" disabled>
              {t.vetVisits.selectVet}
            </option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.clinic_name ? `${v.name} — ${v.clinic_name}` : v.name}
              </option>
            ))}
          </select>
        </div>

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
