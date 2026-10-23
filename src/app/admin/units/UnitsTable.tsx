"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { UnitRow } from "@/lib/unit-list";
import { setUnitArchived, updateUnit } from "./actions";

export type UnitTableRow = UnitRow & { ingredientCount: number; medicineCount: number };

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function UnitRowItem({ unit }: { unit: UnitTableRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const s = t.admin.units;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(unit.name);
  const [nameTh, setNameTh] = useState(unit.nameTh ?? "");
  const [forIngredients, setForIngredients] = useState(unit.forIngredients);
  const [forMedicines, setForMedicines] = useState(unit.forMedicines);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tag = unit.forIngredients && unit.forMedicines ? s.tags.both : unit.forIngredients ? s.tags.ingredients : s.tags.medicines;

  function reset() {
    setName(unit.name);
    setNameTh(unit.nameTh ?? "");
    setForIngredients(unit.forIngredients);
    setForMedicines(unit.forMedicines);
    setEditing(false);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateUnit(unit.id, { name, nameTh, forIngredients, forMedicines });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setEditing(false);
    });
  }

  async function toggleArchived() {
    if (!unit.archived && !(await confirm({ body: s.archiveConfirm(unit.name) }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setUnitArchived(unit.id, !unit.archived);
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <tr className="align-top hover:bg-surface-hover">
      <td className="px-4 py-2">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input value={name} onChange={(e) => setName(e.target.value)} aria-label={s.table.name} className={`${inputClass} min-w-40`} />
            <input
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              placeholder={t.translations.thaiName}
              aria-label={t.translations.thaiName}
              title={t.translations.thaiNameOptionalHint}
              lang="th"
              className={`${inputClass} min-w-40`}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {unit.name}
              {unit.archived && <span className="ml-2 rounded bg-surface-hover px-1.5 py-0.5 text-xs font-normal text-muted">{s.table.archivedBadge}</span>}
            </span>
            {unit.nameTh && (
              <span lang="th" className="text-sm text-foreground">
                {unit.nameTh}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-2">
        {editing ? (
          <div className="flex flex-col gap-1 text-sm text-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={forIngredients} onChange={(e) => setForIngredients(e.target.checked)} />
              {s.tags.ingredients}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={forMedicines} onChange={(e) => setForMedicines(e.target.checked)} />
              {s.tags.medicines}
            </label>
          </div>
        ) : (
          <span className="text-muted">{tag}</span>
        )}
      </td>
      <td className="px-4 py-2 text-muted">{s.table.usage(unit.ingredientCount, unit.medicineCount)}</td>
      <td className="px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={save}>
                {t.common.save}
              </ActionButton>
              <ActionButton icon={ACTION_ICONS.clear} compact disabled={isPending} onClick={reset}>
                {t.common.cancel}
              </ActionButton>
            </>
          ) : (
            <>
              <ActionButton icon={ACTION_ICONS.edit} compact disabled={isPending} onClick={() => setEditing(true)}>
                {t.common.edit}
              </ActionButton>
              <ActionButton icon={unit.archived ? ACTION_ICONS.restore : ACTION_ICONS.archive} compact disabled={isPending} onClick={toggleArchived}>
                {unit.archived ? s.restoreButton : s.archiveButton}
              </ActionButton>
            </>
          )}
        </div>
        {message && <p className="mt-2 max-w-sm text-sm text-danger">{message}</p>}
      </td>
    </tr>
  );
}

export function UnitsTable({ units }: { units: UnitTableRow[] }) {
  const { t } = useI18n();
  const s = t.admin.units.table;
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{s.name}</th>
            <th className="px-4 py-2 font-medium">{s.usedFor}</th>
            <th className="px-4 py-2 font-medium">{s.inUse}</th>
            <th className="px-4 py-2 font-medium">{s.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {units.map((unit) => (
            <UnitRowItem key={unit.id} unit={unit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
