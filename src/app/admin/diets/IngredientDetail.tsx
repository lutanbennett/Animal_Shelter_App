"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ItemUnits } from "@/components/UnitsPanel";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { UnitSelect } from "@/components/UnitSelect";
import { dayAmount, type DietServings } from "@/lib/diets/servings";
import { amountText, type BookIngredient, type BookLine } from "@/lib/diets/recipe-book";
import { deleteDietType, updateDietDefinition, type DietDefinitionFields } from "./actions";
import { useWriteCall } from "@/lib/use-write-form";
import { sheetInputClass } from "./Sheet";

const labelClass = "flex flex-col gap-1 text-sm font-medium text-muted";

export type UsedBy = { dietId: string; dietName: string; servings: DietServings; line: BookLine };

/** One ingredient's own page: its details, the ways it is measured, and the diets that use it. */
export function IngredientDetail({
  ingredient,
  usedBy,
  records,
}: {
  ingredient: BookIngredient;
  usedBy: UsedBy[];
  /** Older resident records that reach it through a diet — any at all blocks delete. */
  records: number;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const router = useRouter();
  const m = t.management.diets;
  const i = t.admin.diets.ingredientBook;
  const [fields, setFields] = useState<DietDefinitionFields>({
    name: ingredient.name,
    nameTh: ingredient.nameTh ?? "",
    unit: ingredient.unit,
    notes: ingredient.notes ?? "",
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // ONE useWriteCall PER ACTION, never shared (0292 refuses one id against two actions).
  const writeSave = useWriteCall();
  const writeDelete = useWriteCall();
  const set = (key: keyof DietDefinitionFields) => (value: string) => setFields((prev) => ({ ...prev, [key]: value }));
  const blocked = usedBy.length > 0 || records > 0;
  const ownLabel = dietUnitLabel(t, ingredient.unit);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await writeSave((requestId) => updateDietDefinition(ingredient.id, fields, requestId));
      setMessage(result.ok ? { ok: true, text: t.common.saved } : { ok: false, text: result.error });
    });
  }

  async function handleDelete() {
    if (!(await confirm({ body: m.deleteConfirm(ingredient.name), confirmLabel: t.common.delete }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await writeDelete((requestId) => deleteDietType(ingredient.id, requestId));
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      router.push("/admin/diets/ingredients");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{ingredient.name}</h1>
        {ingredient.nameTh && (
          <span lang="th" className="text-sm text-foreground">
            {ingredient.nameTh}
          </span>
        )}
        <span className="text-sm text-muted">{i.boughtBy(ownLabel.replace("(s)", ""))}</span>
      </div>

      <section className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{i.detailsTitle}</h2>
        <label className={labelClass}>
          {m.createForm.name}
          <input value={fields.name} onChange={(e) => set("name")(e.target.value)} className={sheetInputClass} />
        </label>
        <label className={labelClass}>
          {t.translations.thaiName}
          <input value={fields.nameTh} onChange={(e) => set("nameTh")(e.target.value)} lang="th" className={sheetInputClass} />
        </label>
        <label className={labelClass}>
          {i.countedIn}
          <UnitSelect
            list="ingredients"
            current={ingredient.unit}
            value={fields.unit}
            onChange={(e) => set("unit")(e.target.value)}
            className={sheetInputClass}
          />
        </label>
        <label className={labelClass}>
          {m.createForm.notes}
          <input value={fields.notes} onChange={(e) => set("notes")(e.target.value)} className={sheetInputClass} />
        </label>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={ACTION_ICONS.save} variant="primary" disabled={pending} onClick={save}>
            {t.common.save}
          </ActionButton>
          <ActionButton icon={ACTION_ICONS.delete} variant="danger" disabled={pending || blocked} onClick={handleDelete}>
            {t.common.delete}
          </ActionButton>
        </div>
        {blocked && <p className="text-xs text-muted">{i.deleteBlocked(usedBy.length, records)}</p>}
        {message && <p className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{i.measuresTitle}</h2>
        <p className="text-sm text-muted">{i.measuresHint}</p>
        <div className="rounded border border-border">
          <ItemUnits
            kind="diet"
            mode="conversions"
            plain
            open
            item={{
              id: ingredient.id,
              name: ingredient.name,
              baseUnit: ownLabel,
              conversions: ingredient.conversions,
              costPerBase: null,
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{i.usedByTitle}</h2>
        {usedBy.length === 0 ? (
          <p className="text-sm text-muted">{i.usedByNone}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {usedBy.map(({ dietId, dietName, servings, line }) => (
              <li key={dietId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link href={`/admin/diets/${dietId}`} className="font-medium text-primary hover:underline">
                  {dietName}
                </Link>
                <span className="text-muted">{i.usedByLine(amountText(dayAmount(line.qtyPerServing, servings, "Medium"), line.servingUnit, ownLabel))}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/management/diets" className="text-sm font-medium text-primary hover:underline">
          {i.stockLink}
        </Link>
      </section>
    </div>
  );
}
