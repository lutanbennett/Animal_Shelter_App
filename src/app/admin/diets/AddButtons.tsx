"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { UnitSelect } from "@/components/UnitSelect";
import { useKeptForm } from "@/lib/use-kept-form";
import { createDietType } from "./actions";
import { createRecipe } from "./recipe-actions";
import { Sheet, sheetInputClass } from "./Sheet";

const labelClass = "flex flex-col gap-1 text-sm font-medium text-muted";

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
    >
      <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
      {pending ? t.common.creating : label}
    </button>
  );
}

/** "Add a diet": a small form, then straight to the new recipe's page to add its ingredients. */
export function AddDietButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useKeptForm(async (prev: Parameters<typeof createRecipe>[0], data: FormData) => {
    const result = await createRecipe(prev, data);
    if (result?.ok) {
      setOpen(false);
      router.push(`/admin/diets/${result.id}`);
    }
    return result;
  }, undefined);
  const r = t.admin.diets.recipes;
  const b = t.admin.diets.book;
  return (
    <>
      <ActionButton icon={ACTION_ICONS.add} variant="primary" onClick={() => setOpen(true)}>
        {b.addDiet}
      </ActionButton>
      <Sheet open={open} title={b.addDiet} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-muted">{b.addDietHint}</p>
          <label className={labelClass}>
            {r.name}
            <input name="name" required placeholder={r.namePlaceholder} className={sheetInputClass} autoFocus />
          </label>
          <label className={labelClass}>
            {t.translations.thaiName}
            <input name="nameTh" lang="th" className={sheetInputClass} />
          </label>
          <label className={labelClass}>
            {r.notes}
            <input name="notes" className={sheetInputClass} />
          </label>
          {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
          <SubmitButton pending={pending} label={r.add} />
        </form>
      </Sheet>
    </>
  );
}

/** "Add an ingredient": name, what it is bought and counted in; its price stays on Diet stock. */
export function AddIngredientButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, onSubmit, pending] = useKeptForm(async (prev: Parameters<typeof createDietType>[0], data: FormData) => {
    const result = await createDietType(prev, data);
    if (result?.ok) {
      setOpen(false);
      router.push(`/admin/diets/ingredients/${result.id}`);
    }
    return result;
  }, undefined);
  const m = t.management.diets.createForm;
  const i = t.admin.diets.ingredientBook;
  return (
    <>
      <ActionButton icon={ACTION_ICONS.add} variant="primary" onClick={() => setOpen(true)}>
        {i.add}
      </ActionButton>
      <Sheet open={open} title={i.add} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className={labelClass}>
            {m.name}
            <input name="name" required placeholder={m.namePlaceholder} className={sheetInputClass} autoFocus />
          </label>
          <label className={labelClass}>
            {t.translations.thaiName}
            <input name="nameTh" lang="th" className={sheetInputClass} />
          </label>
          <label className={labelClass}>
            {i.countedIn}
            <UnitSelect list="ingredients" name="unit" required defaultValue="g" className={sheetInputClass} />
            <span className="text-xs font-normal">{i.countedInHint}</span>
          </label>
          <label className={labelClass}>
            {m.notes}
            <input name="notes" className={sheetInputClass} />
          </label>
          <p className="text-xs text-muted">{i.addHint}</p>
          {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
          <SubmitButton pending={pending} label={i.add} />
        </form>
      </Sheet>
    </>
  );
}
