"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { addDoctor, addExistingDoctor } from "./actions";
import type { ElsewhereDoctor } from "./DoctorsTable";

/**
 * Adding a doctor by hand is for one nobody has recorded a visit with yet,
 * so they are suggested from the first booking. Everyone else arrives on
 * the list by being typed on a visit. It takes a name and nothing else: no
 * email, no account, no invitation (Lutan, 2026-10-01) — most doctors the
 * residents are taken to will never use the system. A doctor who already
 * works at another clinic is picked from the second form instead, so they
 * stay one person.
 */
export function AddDoctorForm({ vetId, elsewhere }: { vetId: string; elsewhere: ElsewhereDoctor[] }) {
  const [state, formAction, pending] = useActionState(addDoctor.bind(null, vetId), undefined);
  const [existingState, existingAction, existingPending] = useActionState(
    addExistingDoctor.bind(null, vetId),
    undefined,
  );
  const { t } = useI18n();
  const d = t.management.vetDoctors;

  return (
    <div className="flex flex-col gap-3">
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="doctorName" className="text-sm font-medium text-muted">
          {d.addForm.name}
        </label>
        <input
          id="doctorName"
          name="name"
          required
          autoComplete="off"
          placeholder={d.addForm.namePlaceholder}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? t.common.creating : d.addForm.addButton}
      </button>
      <p className="w-full text-xs text-muted">{d.addForm.hint}</p>
      {state && !state.ok && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.ok && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
    {elsewhere.length > 0 && (
      <form
        action={existingAction}
        className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="existingDoctor" className="text-sm font-medium text-muted">
            {d.existingForm.label}
          </label>
          <select
            id="existingDoctor"
            name="doctorId"
            required
            defaultValue=""
            className="w-72 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="" disabled>
              {d.existingForm.pick}
            </option>
            {elsewhere.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {d.existingForm.option(doctor.name, doctor.clinics)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={existingPending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {existingPending ? t.common.creating : d.existingForm.button}
        </button>
        <p className="w-full text-xs text-muted">{d.existingForm.hint}</p>
        {existingState && !existingState.ok && (
          <p className="w-full text-sm text-danger">{existingState.error}</p>
        )}
        {existingState?.ok && <p className="w-full text-sm text-success">{existingState.success}</p>}
      </form>
    )}
    </div>
  );
}
