"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { formatQuantity } from "@/lib/diets/options";
import { useKeptForm } from "@/lib/use-kept-form";
import {
  createRecipe,
  deleteRecipe,
  removeRecipeLine,
  saveRecipeLine,
  setStandardRecipe,
  updateRecipe,
  type RecipeLineFields,
} from "./recipe-actions";

export type RecipeIngredient = {
  id: string;
  name: string;
  /** The ingredient's own unit (g, kg, can…). */
  unit: string;
  /** Names of its other units (item_unit_conversions) a recipe line may be measured in. */
  servingUnits: string[];
};

export type RecipeRow = {
  id: string;
  name: string;
  name_th: string | null;
  notes: string | null;
  is_standard: boolean;
  /** Every resident_diets row ever written for it. */
  resident_count: number;
  lines: {
    ingredientId: string;
    servingUnit: string | null;
    small: number;
    medium: number;
    large: number;
  }[];
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const EMPTY_LINE: RecipeLineFields = { ingredientId: "", servingUnit: "", small: "", medium: "", large: "" };

function LineEditor({
  dietId,
  ingredients,
  initial,
}: {
  dietId: string;
  /** The ingredients this row may pick from (just the one when editing a line). */
  ingredients: RecipeIngredient[];
  initial: RecipeLineFields | null;
}) {
  const { t } = useI18n();
  const r = t.admin.diets.recipes;
  const [fields, setFields] = useState<RecipeLineFields>(initial ?? EMPTY_LINE);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ingredient = ingredients.find((i) => i.id === fields.ingredientId);
  const set = (key: keyof RecipeLineFields) => (value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveRecipeLine(dietId, fields);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (!initial) setFields(EMPTY_LINE);
    });
  }

  const amount = (key: "small" | "medium" | "large", label: string) => (
    <input
      value={fields[key]}
      onChange={(e) => set(key)(e.target.value)}
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      aria-label={label}
      placeholder={label}
      className={`${inputClass} w-20`}
    />
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fields.ingredientId}
          onChange={(e) => setFields((prev) => ({ ...prev, ingredientId: e.target.value, servingUnit: "" }))}
          disabled={initial !== null}
          aria-label={r.ingredient}
          className={`${inputClass} w-48`}
        >
          {initial === null && <option value="">{r.pickIngredient}</option>}
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        {amount("small", r.small)}
        {amount("medium", r.medium)}
        {amount("large", r.large)}
        <select
          value={fields.servingUnit}
          onChange={(e) => set("servingUnit")(e.target.value)}
          disabled={!ingredient}
          aria-label={r.servingUnit}
          className={`${inputClass} w-52`}
        >
          <option value="">{ingredient ? r.ownUnit(dietUnitLabel(t, ingredient.unit)) : ""}</option>
          {ingredient?.servingUnits.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={save}>
          {initial ? r.saveLine : r.addIngredient}
        </ActionButton>
      </div>
      {message && <p className="text-xs text-danger">{message}</p>}
    </div>
  );
}

function RecipeCard({
  recipe,
  ingredients,
  standardName,
}: {
  recipe: RecipeRow;
  ingredients: RecipeIngredient[];
  standardName: string | null;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const r = t.admin.diets.recipes;
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({ name: recipe.name, nameTh: recipe.name_th ?? "", notes: recipe.notes ?? "" });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const unused = ingredients.filter((i) => !recipe.lines.some((l) => l.ingredientId === i.id));

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
    run(() => deleteRecipe(recipe.id));
  }

  return (
    <section className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              value={fields.name}
              onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
              aria-label={r.name}
              className={`${inputClass} min-w-56`}
            />
            <input
              value={fields.nameTh}
              onChange={(e) => setFields((p) => ({ ...p, nameTh: e.target.value }))}
              placeholder={t.translations.thaiName}
              aria-label={t.translations.thaiName}
              lang="th"
              className={`${inputClass} min-w-56`}
            />
            <input
              value={fields.notes}
              onChange={(e) => setFields((p) => ({ ...p, notes: e.target.value }))}
              placeholder={r.notes}
              aria-label={r.notes}
              className={`${inputClass} min-w-56`}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <h3 className="font-medium text-foreground">
              {recipe.name}
              {recipe.is_standard && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 align-middle text-xs font-medium">
                  <span aria-hidden>★</span>
                  {t.management.diets.standard.badge}
                </span>
              )}
            </h3>
            {recipe.name_th && (
              <span lang="th" className="text-sm text-foreground">
                {recipe.name_th}
              </span>
            )}
            {recipe.notes && <span className="text-xs text-muted">{recipe.notes}</span>}
            <span className="text-xs text-muted">{r.residents(recipe.resident_count)}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <ActionButton
                icon={ACTION_ICONS.save}
                variant="primary"
                compact
                disabled={isPending}
                onClick={() =>
                  run(
                    () => updateRecipe(recipe.id, fields),
                    () => setEditing(false),
                  )
                }
              >
                {t.common.save}
              </ActionButton>
              <ActionButton icon={ACTION_ICONS.clear} compact disabled={isPending} onClick={() => setEditing(false)}>
                {t.common.cancel}
              </ActionButton>
            </>
          ) : (
            <>
              <RowActionButton onClick={() => setEditing(true)} label={t.common.edit} subject={recipe.name} icon={ACTION_ICONS.edit} />
              {!recipe.is_standard && (
                <RowActionButton
                  disabled={isPending}
                  onClick={handleMakeStandard}
                  label={r.makeStandard}
                  subject={recipe.name}
                  icon={ACTION_ICONS.makeStandard}
                />
              )}
              <RowActionButton
                disabled={isPending || recipe.resident_count > 0}
                onClick={handleDelete}
                label={t.common.delete}
                hint={recipe.resident_count > 0 ? r.errors.inUse(recipe.resident_count) : undefined}
                subject={recipe.name}
                icon={ACTION_ICONS.delete}
                tone="danger"
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted">
          {r.perDay}: {r.small} / {r.medium} / {r.large}
        </p>
        {recipe.lines.length === 0 && <p className="text-sm text-warning">{r.noIngredients}</p>}
        {recipe.lines.map((line) => {
          const ingredient = byId.get(line.ingredientId);
          if (!ingredient) return null;
          return (
            <div key={line.ingredientId} className="flex flex-wrap items-center gap-2">
              <LineEditor
                dietId={recipe.id}
                ingredients={[ingredient]}
                initial={{
                  ingredientId: line.ingredientId,
                  servingUnit: line.servingUnit ?? "",
                  small: formatQuantity(line.small),
                  medium: formatQuantity(line.medium),
                  large: formatQuantity(line.large),
                }}
              />
              <RowActionButton
                disabled={isPending}
                onClick={() => run(() => removeRecipeLine(recipe.id, line.ingredientId))}
                label={r.removeLine}
                subject={ingredient.name}
                icon={ACTION_ICONS.delete}
                tone="danger"
              />
            </div>
          );
        })}
        {unused.length > 0 ? (
          <LineEditor dietId={recipe.id} ingredients={unused} initial={null} />
        ) : (
          <p className="text-xs text-muted">{r.allUsed}</p>
        )}
      </div>
      {message && <p className="text-xs text-danger">{message}</p>}
    </section>
  );
}

function CreateRecipeForm() {
  const [state, onSubmit, pending] = useKeptForm(createRecipe, undefined);
  const { t } = useI18n();
  const r = t.admin.diets.recipes;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="recipe-name" className="text-sm font-medium text-muted">
            {r.name}
          </label>
          <input id="recipe-name" name="name" required placeholder={r.namePlaceholder} className={`${inputClass} w-64`} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="recipe-name-th" className="text-sm font-medium text-muted">
            {t.translations.thaiName}
          </label>
          <input id="recipe-name-th" name="nameTh" lang="th" className={`${inputClass} w-64`} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="recipe-notes" className="text-sm font-medium text-muted">
            {r.notes}
          </label>
          <input id="recipe-notes" name="notes" className={`${inputClass} min-w-48`} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-0"
        >
          <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
          {pending ? t.common.creating : r.add}
        </button>
      </div>
      {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}

/** Settings → Diets, the recipe half: each diet with its ingredient lines. */
export function RecipesPanel({ recipes, ingredients }: { recipes: RecipeRow[]; ingredients: RecipeIngredient[] }) {
  const { t } = useI18n();
  const r = t.admin.diets.recipes;
  const standardName = recipes.find((x) => x.is_standard)?.name ?? null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">{r.title}</h2>
      {!standardName && (
        <p className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">{r.noStandard}</p>
      )}
      <CreateRecipeForm />
      {recipes.length === 0 && <p className="text-sm text-muted">{r.none}</p>}
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} ingredients={ingredients} standardName={standardName} />
      ))}
    </section>
  );
}
