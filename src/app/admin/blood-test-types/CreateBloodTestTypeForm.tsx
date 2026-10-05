"use client";

import { useKeptForm } from "@/lib/use-kept-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createBloodTestType } from "./actions";

export function CreateBloodTestTypeForm() {
  const [state, onSubmit, pending] = useKeptForm(
    createBloodTestType,
    undefined,
  );
  const { t } = useI18n();

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-muted">
          {t.admin.bloodTestTypes.createForm.name}
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={t.admin.bloodTestTypes.createForm.namePlaceholder}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.add} disabled={pending}>
        {pending
          ? t.common.creating
          : t.admin.bloodTestTypes.createForm.addButton}
      </ActionButton>
      {state && !state.ok && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state && state.ok && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
