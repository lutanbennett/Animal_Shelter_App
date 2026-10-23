"use client";

import { useKeptForm } from "@/lib/use-kept-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createUnit } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/** Add a unit: its English name, an optional Thai name, and which list offers it. */
export function CreateUnitForm() {
  const [state, onSubmit, pending] = useKeptForm(createUnit, undefined);
  const { t } = useI18n();
  const s = t.admin.units;

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="unit-name" className="text-sm font-medium text-muted">
          {s.createForm.name}
        </label>
        <input id="unit-name" name="name" required placeholder={s.createForm.namePlaceholder} className={`w-48 ${inputClass}`} />
        <span className="max-w-48 text-xs text-muted">{s.createForm.nameHint}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="unit-name-th" className="text-sm font-medium text-muted">
          {t.translations.thaiName}
        </label>
        <input id="unit-name-th" name="nameTh" lang="th" className={`w-48 ${inputClass}`} />
        <span className="max-w-48 text-xs text-muted">{t.translations.thaiNameOptionalHint}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="unit-used-for" className="text-sm font-medium text-muted">
          {s.createForm.usedFor}
        </label>
        <select id="unit-used-for" name="usedFor" defaultValue="ingredients" className={`w-40 ${inputClass}`}>
          <option value="ingredients">{s.tags.ingredients}</option>
          <option value="medicines">{s.tags.medicines}</option>
          <option value="both">{s.tags.both}</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-0"
      >
        <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
        {pending ? t.common.creating : s.createForm.addButton}
      </button>
      {state && !state.ok && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
