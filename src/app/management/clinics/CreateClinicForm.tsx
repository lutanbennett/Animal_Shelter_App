"use client";

import { useKeptForm } from "@/lib/use-kept-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createClinic } from "./actions";

export function CreateClinicForm() {
  const [state, onSubmit, pending] = useKeptForm(createClinic, undefined);
  const { t } = useI18n();

  return (
    <form
      onSubmit={onSubmit}
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
        <label htmlFor="nameTh" className="text-sm font-medium text-muted">
          {t.translations.thaiName}
        </label>
        <input
          id="nameTh"
          name="nameTh"
          lang="th"
          title={t.translations.thaiNameOptionalHint}
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
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
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.management.vets.createForm.notes}
        </label>
        <input
          id="notes"
          name="notes"
          placeholder={t.management.vets.createForm.notesPlaceholder}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-0"
      >
        <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
        {pending ? t.common.creating : t.management.vets.createForm.addButton}
      </button>
      {state && !state.ok && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state?.ok && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
