"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { addDoctor } from "./actions";

/**
 * Adding a doctor by hand is for one nobody has recorded a visit with yet,
 * so they are suggested from the first booking. Everyone else arrives on
 * the list by being typed on a visit.
 */
export function AddDoctorForm({ vetId }: { vetId: string }) {
  const [state, formAction, pending] = useActionState(addDoctor.bind(null, vetId), undefined);
  const { t } = useI18n();
  const d = t.management.vetDoctors;

  return (
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
      {state && "error" in state && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state && "success" in state && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
