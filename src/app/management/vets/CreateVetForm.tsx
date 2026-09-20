"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createVet } from "./actions";

export function CreateVetForm() {
  const [state, formAction, pending] = useActionState(createVet, undefined);
  const { t } = useI18n();

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-muted">
          {t.management.vets.createForm.name}
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={t.management.vets.createForm.namePlaceholder}
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="clinicName" className="text-sm font-medium text-muted">
          {t.management.vets.createForm.clinic}
        </label>
        <input
          id="clinicName"
          name="clinicName"
          placeholder={t.management.vets.createForm.clinicPlaceholder}
          className="w-56 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="contactInfo" className="text-sm font-medium text-muted">
          {t.management.vets.createForm.contact}
        </label>
        <input
          id="contactInfo"
          name="contactInfo"
          placeholder={t.management.vets.createForm.contactPlaceholder}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
        <span className="text-xs text-muted">
          {t.management.vets.createForm.contactHint}
        </span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? t.common.creating : t.management.vets.createForm.addButton}
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
