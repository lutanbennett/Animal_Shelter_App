"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DIET_UNITS, dietUnitLabel } from "@/lib/i18n/enum-labels";
import { formatQuantity } from "@/lib/diets/options";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { deleteDietType, setStandardDietType, updateDietDefinition, type DietDefinitionFields } from "./actions";

/** One row of Settings → Diets: the option-list half of a diet type. */
export type DietDefinitionRow = {
  id: string;
  name: string;
  name_th: string | null;
  /** The shelter's standard diet (0087); at most one row, possibly none. */
  is_standard: boolean;
  unit: string;
  daily_qty_small: number;
  daily_qty_medium: number;
  daily_qty_large: number;
  notes: string | null;
  /** Every resident_diets row ever written for it — any at all blocks delete. */
  diet_count: number;
};

/** name, unit, daily, records, actions. */
const COLUMNS = 5;

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function fieldsOf(row: DietDefinitionRow): DietDefinitionFields {
  return {
    name: row.name,
    nameTh: row.name_th ?? "",
    unit: row.unit,
    dailyQtySmall: formatQuantity(row.daily_qty_small),
    dailyQtyMedium: formatQuantity(row.daily_qty_medium),
    dailyQtyLarge: formatQuantity(row.daily_qty_large),
    notes: row.notes ?? "",
  };
}

function DietTypeRowItem({
  dietType,
  standardName,
}: {
  dietType: DietDefinitionRow;
  /** The current standard's name, for the confirm; null when none is flagged. */
  standardName: string | null;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const m = t.management.diets;
  const [fields, setFields] = useState<DietDefinitionFields>(() => fieldsOf(dietType));
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof DietDefinitionFields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  function reset() {
    setFields(fieldsOf(dietType));
    setEditing(false);
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateDietDefinition(dietType.id, fields);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleMakeStandard() {
    if (!(await confirm({ body: m.standard.confirm(dietType.name, standardName) }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setStandardDietType(dietType.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!(await confirm({ body: m.deleteConfirm(dietType.name), confirmLabel: t.common.delete }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteDietType(dietType.id);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  const unit = dietUnitLabel(t, dietType.unit);
  const quantityInput = (key: "dailyQtySmall" | "dailyQtyMedium" | "dailyQtyLarge", label: string) => (
    <input
      value={fields[key]}
      onChange={(e) => set(key)(e.target.value)}
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      aria-label={label}
      className={`${inputClass} w-20`}
    />
  );

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
              <span className="font-medium text-foreground">
                {dietType.name}
                {dietType.is_standard && (
                  <span
                    title={m.standard.badgeHint}
                    className="ml-2 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 align-middle text-xs font-medium text-foreground"
                  >
                    <span aria-hidden>★</span>
                    {m.standard.badge}
                  </span>
                )}
              </span>
              {dietType.name_th && (
                <span lang="th" className="text-sm text-foreground">
                  {dietType.name_th}
                </span>
              )}
              {dietType.notes && <span className="text-xs text-muted">{dietType.notes}</span>}
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
            <span className="text-muted">{unit}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex gap-1">
              {quantityInput("dailyQtySmall", m.createForm.small)}
              {quantityInput("dailyQtyMedium", m.createForm.medium)}
              {quantityInput("dailyQtyLarge", m.createForm.large)}
            </div>
          ) : (
            <span className="text-muted">
              {[dietType.daily_qty_small, dietType.daily_qty_medium, dietType.daily_qty_large]
                .map(formatQuantity)
                .join(" / ")}{" "}
              {unit}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">{m.table.dietCount(dietType.diet_count)}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 md:min-w-[11rem]">
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
                  subject={dietType.name}
                  icon={ACTION_ICONS.edit}
                />
                {!dietType.is_standard && (
                  <RowActionButton
                    disabled={isPending}
                    onClick={handleMakeStandard}
                    label={m.standard.make}
                    subject={dietType.name}
                    icon={ACTION_ICONS.makeStandard}
                  />
                )}
                <RowActionButton
                  disabled={isPending || dietType.diet_count > 0}
                  onClick={handleDelete}
                  label={t.common.delete}
                  hint={dietType.diet_count > 0 ? m.errors.hasDiets(dietType.diet_count) : undefined}
                  subject={dietType.name}
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
  const standardName = dietTypes.find((row) => row.is_standard)?.name ?? null;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{m.table.name}</th>
            <th className="px-4 py-2 font-medium">{m.table.unit}</th>
            <th className="px-4 py-2 font-medium">{m.table.dailyQuantities}</th>
            <th className="px-4 py-2 font-medium">{m.table.residents}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {dietTypes.map((dietType) => (
            <DietTypeRowItem key={dietType.id} dietType={dietType} standardName={standardName} />
          ))}
          {dietTypes.length === 0 && (
            <tr>
              <td colSpan={COLUMNS} className="px-4 py-6 text-center text-muted">
                {m.table.noDiets}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
