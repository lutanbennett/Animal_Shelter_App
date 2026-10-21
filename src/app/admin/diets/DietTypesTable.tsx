"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DIET_UNITS, dietUnitLabel } from "@/lib/i18n/enum-labels";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { deleteDietType, updateDietDefinition, type DietDefinitionFields } from "./actions";

/** One row of Settings → Diets, ingredient half: the option-list columns of a diet_types row (0239). */
export type DietDefinitionRow = {
  id: string;
  name: string;
  name_th: string | null;
  unit: string;
  notes: string | null;
  /** The diets (recipes) this ingredient is in — any at all blocks delete. */
  recipe_count: number;
  /** Older resident records that still name it — any at all blocks delete. */
  record_count: number;
};

/** name, unit, in diets, actions. */
const COLUMNS = 4;

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function fieldsOf(row: DietDefinitionRow): DietDefinitionFields {
  return {
    name: row.name,
    nameTh: row.name_th ?? "",
    unit: row.unit,
    notes: row.notes ?? "",
  };
}

function IngredientRow({ ingredient }: { ingredient: DietDefinitionRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const m = t.management.diets;
  const [fields, setFields] = useState<DietDefinitionFields>(() => fieldsOf(ingredient));
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof DietDefinitionFields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  function reset() {
    setFields(fieldsOf(ingredient));
    setEditing(false);
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateDietDefinition(ingredient.id, fields);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!(await confirm({ body: m.deleteConfirm(ingredient.name), confirmLabel: t.common.delete }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteDietType(ingredient.id);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  const blocked = ingredient.recipe_count > 0 || ingredient.record_count > 0;

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              <input
                value={fields.name}
                onChange={(e) => set("name")(e.target.value)}
                aria-label={m.table.name}
                className={`${inputClass} min-w-48`}
              />
              <input
                value={fields.nameTh}
                onChange={(e) => set("nameTh")(e.target.value)}
                placeholder={t.translations.thaiName}
                aria-label={t.translations.thaiName}
                lang="th"
                className={`${inputClass} min-w-48`}
              />
              <input
                value={fields.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder={m.createForm.notes}
                aria-label={m.createForm.notes}
                className={`${inputClass} min-w-48`}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{ingredient.name}</span>
              {ingredient.name_th && (
                <span lang="th" className="text-sm text-foreground">
                  {ingredient.name_th}
                </span>
              )}
              {ingredient.notes && <span className="text-xs text-muted">{ingredient.notes}</span>}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <select
              value={fields.unit}
              onChange={(e) => set("unit")(e.target.value)}
              aria-label={m.table.unit}
              className={`${inputClass} min-w-24`}
            >
              {DIET_UNITS.map((u) => (
                <option key={u} value={u}>
                  {dietUnitLabel(t, u)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted">{dietUnitLabel(t, ingredient.unit)}</span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">{m.table.inDiets(ingredient.recipe_count)}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 md:min-w-[8rem]">
            {editing ? (
              <>
                <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={handleSave}>
                  {t.common.save}
                </ActionButton>
                <ActionButton icon={ACTION_ICONS.clear} compact disabled={isPending} onClick={reset}>
                  {t.common.cancel}
                </ActionButton>
              </>
            ) : (
              <>
                <RowActionButton
                  onClick={() => setEditing(true)}
                  label={t.common.edit}
                  subject={ingredient.name}
                  icon={ACTION_ICONS.edit}
                />
                <RowActionButton
                  disabled={isPending || blocked}
                  onClick={handleDelete}
                  label={t.common.delete}
                  hint={
                    ingredient.recipe_count > 0
                      ? m.errors.inRecipes(ingredient.recipe_count)
                      : ingredient.record_count > 0
                        ? m.errors.hasDiets(ingredient.record_count)
                        : undefined
                  }
                  subject={ingredient.name}
                  icon={ACTION_ICONS.delete}
                  tone="danger"
                />
              </>
            )}
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={COLUMNS}
            className={`px-4 pb-2 text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function DietTypesTable({ dietTypes }: { dietTypes: DietDefinitionRow[] }) {
  const { t } = useI18n();
  const m = t.management.diets;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{m.table.name}</th>
            <th className="px-4 py-2 font-medium">{m.table.unit}</th>
            <th className="px-4 py-2 font-medium">{m.table.recipes}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {dietTypes.map((ingredient) => (
            <IngredientRow key={ingredient.id} ingredient={ingredient} />
          ))}
          {dietTypes.length === 0 && (
            <tr>
              <td colSpan={COLUMNS} className="px-4 py-6 text-center text-muted">
                {m.table.noIngredients}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
