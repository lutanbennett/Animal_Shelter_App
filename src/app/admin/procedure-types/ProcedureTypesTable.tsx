"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import {
  deleteProcedureType,
  mergeProcedureType,
  updateProcedureType,
} from "./actions";

export type ProcedureTypeRow = {
  id: string;
  name: string;
  name_th: string | null;
  /** Every procedure logged with it — any at all blocks delete. */
  procedure_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function ProcedureTypeRowItem({
  procedureType,
  mergeTargets,
}: {
  procedureType: ProcedureTypeRow;
  mergeTargets: ProcedureTypeRow[];
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const p = t.admin.procedureTypes;
  const [name, setName] = useState(procedureType.name);
  const [nameTh, setNameTh] = useState(procedureType.name_th ?? "");
  const [mode, setMode] = useState<"view" | "edit" | "merge">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(procedureType.name);
    setNameTh(procedureType.name_th ?? "");
    setMergeInto("");
    setMode("view");
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProcedureType(procedureType.id, { name, nameTh });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: p.deleteConfirm(procedureType.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteProcedureType(procedureType.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  async function handleMerge() {
    const target = mergeTargets.find((row) => row.id === mergeInto);
    if (!target) return;
    if (
      !await confirm({ body: p.mergeConfirm(
          procedureType.name,
          target.name,
          procedureType.procedure_count,
        ) })
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await mergeProcedureType(procedureType.id, target.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  const editing = mode === "edit";

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass} min-w-48`}
              />
              <input
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder={t.translations.thaiName}
                aria-label={t.translations.thaiName}
                lang="th"
                className={`${inputClass} min-w-48`}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {procedureType.name}
              </span>
              {procedureType.name_th && (
                <span lang="th" className="text-sm text-foreground">
                  {procedureType.name_th}
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          {p.table.procedureCount(procedureType.procedure_count)}
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {mode === "edit" && (
              <>
                <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={handleSave}>
                  {t.common.save}
                </ActionButton>
                <ActionButton icon={ACTION_ICONS.clear} compact disabled={isPending} onClick={reset}>
                  {t.common.cancel}
                </ActionButton>
              </>
            )}
            {mode === "merge" && (
              <>
                <select
                  value={mergeInto}
                  onChange={(e) => setMergeInto(e.target.value)}
                  aria-label={p.merge.into}
                  className={`${inputClass} w-auto min-w-40`}
                >
                  <option value="">{p.merge.pickTarget}</option>
                  {mergeTargets.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
                <ActionButton icon={ACTION_ICONS.merge} variant="primary" compact disabled={isPending || !mergeInto} onClick={handleMerge}>
                  {p.merge.button}
                </ActionButton>
                <ActionButton icon={ACTION_ICONS.clear} compact disabled={isPending} onClick={reset}>
                  {t.common.cancel}
                </ActionButton>
              </>
            )}
            {mode === "view" && (
              <>
                <RowActionButton
                  onClick={() => setMode("edit")}
                  label={t.common.edit}
                  subject={procedureType.name}
                  icon={ACTION_ICONS.edit}
                />
                <RowActionButton
                  disabled={mergeTargets.length === 0}
                  onClick={() => setMode("merge")}
                  label={p.merge.open}
                  subject={procedureType.name}
                  icon={ACTION_ICONS.merge}
                />
                <RowActionButton
                  disabled={isPending || procedureType.procedure_count > 0}
                  hint={procedureType.procedure_count > 0
                      ? p.errors.hasProcedures(procedureType.procedure_count)
                      : undefined}
                  onClick={handleDelete}
                  label={t.common.delete}
                  subject={procedureType.name}
                  icon={ACTION_ICONS.delete}
                  tone="danger"
                />
              </>
            )}
          </div>
        </td>
      </tr>
      {mode === "merge" && (
        <tr>
          <td colSpan={3} className="px-4 pb-2 text-xs text-muted">
            {p.merge.hint}
          </td>
        </tr>
      )}
      {message && (
        <tr>
          <td
            colSpan={3}
            className={`px-4 pb-2 text-xs ${
              message.type === "error" ? "text-danger" : "text-success"
            }`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function ProcedureTypesTable({
  procedureTypes,
}: {
  procedureTypes: ProcedureTypeRow[];
}) {
  const { t } = useI18n();
  const p = t.admin.procedureTypes;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{p.table.name}</th>
            <th className="px-4 py-2 font-medium">{p.table.procedures}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {procedureTypes.map((procedureType) => (
            <ProcedureTypeRowItem
              key={procedureType.id}
              procedureType={procedureType}
              mergeTargets={procedureTypes.filter(
                (row) => row.id !== procedureType.id,
              )}
            />
          ))}
          {procedureTypes.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted">
                {p.table.noTypes}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
