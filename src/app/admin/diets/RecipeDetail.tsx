"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { formatQuantity } from "@/lib/diets/options";
import { SIZES, totalText, type BookIngredient, type BookRecipe, type Size } from "@/lib/diets/recipe-book";
import {
  deleteRecipe,
  removeRecipeLine,
  saveRecipeLine,
  setStandardRecipe,
  updateRecipe,
  type RecipeLineFields,
} from "./recipe-actions";
import { Sheet, sheetInputClass } from "./Sheet";

const labelClass = "flex flex-col gap-1 text-sm font-medium text-muted";
const EMPTY_LINE: RecipeLineFields = { ingredientId: "", servingUnit: "", small: "", medium: "", large: "" };

/** The small form behind Add ingredient and a line's Edit: the ingredient, how it is measured, three amounts. */
function LineSheet({
  open,
  dietId,
  dietName,
  ingredients,
  editing,
  initial,
  onClose,
}: {
  open: boolean;
  dietId: string;
  dietName: string;
  /** What may be picked: the ingredients not yet in the diet, or just the one being edited. */
  ingredients: BookIngredient[];
  editing: BookIngredient | null;
  initial: RecipeLineFields | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const r = t.admin.diets.recipes;
  const b = t.admin.diets.book;
  const [fields, setFields] = useState<RecipeLineFields>(initial ?? EMPTY_LINE);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ingredient = ingredients.find((i) => i.id === fields.ingredientId);
  const set = (key: keyof RecipeLineFields) => (value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  function close() {
    setMessage(null);
    setFields(initial ?? EMPTY_LINE);
    onClose();
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveRecipeLine(dietId, fields);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      close();
    });
  }

  const amount = (key: Size, label: string) => (
    <label className={labelClass}>
      {label}
      <input
        value={fields[key]}
        onChange={(e) => set(key)(e.target.value)}
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        className={sheetInputClass}
      />
    </label>
  );

  return (
    <Sheet open={open} title={editing ? b.editLineTitle(editing.name) : b.addLineTitle(dietName)} onClose={close}>
      <div className="flex flex-col gap-3">
        {ingredients.length === 0 && !editing ? (
          <p className="text-sm text-muted">{b.noneToAdd}</p>
        ) : (
          <>
            <label className={labelClass}>
              {r.ingredient}
              <select
                value={fields.ingredientId}
                onChange={(e) => setFields((prev) => ({ ...prev, ingredientId: e.target.value, servingUnit: "" }))}
                disabled={editing !== null}
                className={sheetInputClass}
              >
                {editing === null && <option value="">{r.pickIngredient}</option>}
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {b.measure}
              <select
                value={fields.servingUnit}
                onChange={(e) => set("servingUnit")(e.target.value)}
                disabled={!ingredient}
                className={sheetInputClass}
              >
                <option value="">{ingredient ? dietUnitLabel(t, ingredient.unit) : ""}</option>
                {ingredient?.conversions.map((c) => (
                  <option key={c.id} value={c.unit}>
                    {c.unit}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal">{b.measureHint}</span>
            </label>
            <p className="text-sm text-muted">{b.amountsHint}</p>
            <div className="grid grid-cols-3 gap-2">
              {amount("small", r.small)}
              {amount("medium", r.medium)}
              {amount("large", r.large)}
            </div>
            {message && <p className="text-sm text-danger">{message}</p>}
            <div className="flex gap-2">
              <ActionButton icon={ACTION_ICONS.save} variant="primary" disabled={pending} onClick={save}>
                {t.common.save}
              </ActionButton>
              <ActionButton icon={ACTION_ICONS.clear} disabled={pending} onClick={close}>
                {t.common.cancel}
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

function RenameSheet({ open, recipe, onClose }: { open: boolean; recipe: BookRecipe; onClose: () => void }) {
  const { t } = useI18n();
  const r = t.admin.diets.recipes;
  const b = t.admin.diets.book;
  const [fields, setFields] = useState({ name: recipe.name, nameTh: recipe.nameTh ?? "", notes: recipe.notes ?? "" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof fields) => (value: string) => setFields((prev) => ({ ...prev, [key]: value }));
  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateRecipe(recipe.id, fields);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      onClose();
    });
  }
  return (
    <Sheet open={open} title={b.renameTitle} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className={labelClass}>
          {r.name}
          <input value={fields.name} onChange={(e) => set("name")(e.target.value)} className={sheetInputClass} />
        </label>
        <label className={labelClass}>
          {t.translations.thaiName}
          <input value={fields.nameTh} onChange={(e) => set("nameTh")(e.target.value)} lang="th" className={sheetInputClass} />
        </label>
        <label className={labelClass}>
          {r.notes}
          <input value={fields.notes} onChange={(e) => set("notes")(e.target.value)} className={sheetInputClass} />
        </label>
        {message && <p className="text-sm text-danger">{message}</p>}
        <div className="flex gap-2">
          <ActionButton icon={ACTION_ICONS.save} variant="primary" disabled={pending} onClick={save}>
            {t.common.save}
          </ActionButton>
          <ActionButton icon={ACTION_ICONS.clear} disabled={pending} onClick={onClose}>
            {t.common.cancel}
          </ActionButton>
        </div>
      </div>
    </Sheet>
  );
}

/** One recipe's own page: its ingredient lines, the total daily serve, and Standard / rename / delete. */
export function RecipeDetail({
  recipe,
  ingredients,
  standardName,
}: {
  recipe: BookRecipe;
  ingredients: BookIngredient[];
  standardName: string | null;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const router = useRouter();
  const r = t.admin.diets.recipes;
  const b = t.admin.diets.book;
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const unused = ingredients.filter((i) => !recipe.lines.some((l) => l.ingredientId === i.id));
  const ownLabel = (unit: string) => dietUnitLabel(t, unit);
  const sizeLabel: Record<Size, string> = { small: r.small, medium: r.medium, large: r.large };

  function run(action: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "");
        return;
      }
      done?.();
    });
  }

  async function handleMakeStandard() {
    if (!(await confirm({ body: r.standardConfirm(recipe.name, standardName) }))) return;
    run(() => setStandardRecipe(recipe.id));
  }

  async function handleDelete() {
    if (!(await confirm({ body: r.deleteConfirm(recipe.name), confirmLabel: t.common.delete }))) return;
    run(
      () => deleteRecipe(recipe.id),
      () => router.push("/admin/diets"),
    );
  }

  const editing = editingId ? (byId.get(editingId) ?? null) : null;
  const editingLine = recipe.lines.find((l) => l.ingredientId === editingId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-foreground">
          {recipe.name}
          {recipe.isStandard && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium">
              <span aria-hidden>★</span>
              {t.management.diets.standard.badge}
            </span>
          )}
        </h1>
        {recipe.nameTh && (
          <span lang="th" className="text-sm text-foreground">
            {recipe.nameTh}
          </span>
        )}
        {recipe.notes && <span className="text-sm text-muted">{recipe.notes}</span>}
        <span className="text-sm text-muted">{b.cardResidents(recipe.residentsNow)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ActionButton icon={ACTION_ICONS.edit} compact disabled={pending} onClick={() => setRenaming(true)}>
          {b.rename}
        </ActionButton>
        {!recipe.isStandard && (
          <ActionButton icon={ACTION_ICONS.makeStandard} compact disabled={pending} onClick={handleMakeStandard}>
            {r.makeStandard}
          </ActionButton>
        )}
        <ActionButton
          icon={ACTION_ICONS.delete}
          compact
          variant="danger"
          disabled={pending || recipe.records > 0}
          onClick={handleDelete}
        >
          {t.common.delete}
        </ActionButton>
      </div>
      {recipe.records > 0 && <p className="text-xs text-muted">{b.deleteBlocked(recipe.records)}</p>}

      <section className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{b.listTitle}</h2>
        {recipe.lines.length === 0 && <p className="text-sm text-warning">{r.noIngredients}</p>}
        <ul className="flex flex-col divide-y divide-border">
          {recipe.lines.map((line) => {
            const ingredient = byId.get(line.ingredientId);
            if (!ingredient) return null;
            const unit = line.servingUnit ?? ownLabel(ingredient.unit);
            return (
              <li key={line.ingredientId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{ingredient.name}</span>
                  <span className="text-sm text-muted">
                    {b.lineAmounts(formatQuantity(line.small), formatQuantity(line.medium), formatQuantity(line.large), unit)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <RowActionButton
                    onClick={() => setEditingId(line.ingredientId)}
                    label={b.editLine}
                    subject={ingredient.name}
                    icon={ACTION_ICONS.edit}
                  />
                  <RowActionButton
                    disabled={pending}
                    onClick={() => run(() => removeRecipeLine(recipe.id, line.ingredientId))}
                    label={r.removeLine}
                    subject={ingredient.name}
                    icon={ACTION_ICONS.delete}
                    tone="danger"
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <div>
          <ActionButton icon={ACTION_ICONS.add} variant="primary" disabled={pending} onClick={() => setAdding(true)}>
            {r.addIngredient}
          </ActionButton>
        </div>
        {message && <p className="text-sm text-danger">{message}</p>}
      </section>

      <section className="flex flex-col gap-1 rounded border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{b.totalTitle}</h2>
        {SIZES.map((size) => (
          <p key={size} className={size === "medium" ? "font-medium text-foreground" : "text-sm text-muted"}>
            {b.total(
              sizeLabel[size],
              totalText(recipe.lines, size, (id) => byId.get(id)?.unit ?? "g", ownLabel) ?? b.totalNone,
            )}
          </p>
        ))}
      </section>

      <LineSheet
        key={`add-${recipe.lines.length}`}
        open={adding}
        dietId={recipe.id}
        dietName={recipe.name}
        ingredients={unused}
        editing={null}
        initial={null}
        onClose={() => setAdding(false)}
      />
      {editing && editingLine && (
        <LineSheet
          key={`edit-${editing.id}-${editingLine.small}-${editingLine.medium}-${editingLine.large}-${editingLine.servingUnit}`}
          open
          dietId={recipe.id}
          dietName={recipe.name}
          ingredients={[editing]}
          editing={editing}
          initial={{
            ingredientId: editing.id,
            servingUnit: editingLine.servingUnit ?? "",
            small: formatQuantity(editingLine.small),
            medium: formatQuantity(editingLine.medium),
            large: formatQuantity(editingLine.large),
          }}
          onClose={() => setEditingId(null)}
        />
      )}
      <RenameSheet
        key={`rename-${recipe.name}-${recipe.nameTh}-${recipe.notes}`}
        open={renaming}
        recipe={recipe}
        onClose={() => setRenaming(false)}
      />
    </div>
  );
}
