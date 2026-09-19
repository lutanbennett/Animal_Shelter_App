"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createImmunizationType } from "./actions";

export function CreateImmunizationTypeForm() {
  const [state, formAction, pending] = useActionState(
    createImmunizationType,
    undefined,
  );
  const { t } = useI18n();

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-muted">
          {t.admin.immunizationTypes.createForm.name}
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={t.admin.immunizationTypes.createForm.namePlaceholder}
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="intervalMonths"
          className="text-sm font-medium text-muted"
        >
          {t.admin.immunizationTypes.createForm.intervalMonths}
        </label>
        <input
          id="intervalMonths"
          name="intervalMonths"
          type="number"
          min={1}
          placeholder={t.admin.immunizationTypes.createForm.intervalPlaceholder}
          className="w-40 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
        <span className="text-xs text-muted">
          {t.admin.immunizationTypes.createForm.intervalHint}
        </span>
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-muted">
        <input
          type="checkbox"
          name="isMandatory"
          defaultChecked
          className="h-4 w-4 accent-primary"
        />
        {t.admin.immunizationTypes.createForm.mandatory}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending
          ? t.common.creating
          : t.admin.immunizationTypes.createForm.addButton}
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
