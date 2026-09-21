"use client";

import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  deleteBloodTestType,
  mergeBloodTestType,
  updateBloodTestType,
} from "./actions";

export type BloodTestTypeRow = {
  id: string;
  name: string;
  /** Every blood test logged with it — any at all blocks delete. */
  blood_test_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const smallButton =
  "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

function BloodTestTypeRowItem({
  bloodTestType,
  mergeTargets,
}: {
  bloodTestType: BloodTestTypeRow;
  mergeTargets: BloodTestTypeRow[];
}) {
  const { t } = useI18n();
  const p = t.admin.bloodTestTypes;
  const [name, setName] = useState(bloodTestType.name);
  const [mode, setMode] = useState<"view" | "edit" | "merge">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(bloodTestType.name);
    setMergeInto("");
    setMode("view");
  }

  function fail(err: unknown, fallback: string) {
    setMessage({
      type: "error",
      text: err instanceof Error ? err.message : fallback,
    });
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateBloodTestType(bloodTestType.id, { name });
        setMode("view");
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        fail(err, t.common.failedToSave);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(p.deleteConfirm(bloodTestType.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteBloodTestType(bloodTestType.id);
      } catch (err) {
        fail(err, t.common.failedToDelete);
      }
    });
  }

  function handleMerge() {
    const target = mergeTargets.find((row) => row.id === mergeInto);
    if (!target) return;
    if (
      !window.confirm(
        p.mergeConfirm(
          bloodTestType.name,
          target.name,
          bloodTestType.blood_test_count,
        ),
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await mergeBloodTestType(bloodTestType.id, target.id);
      } catch (err) {
        fail(err, p.errors.mergeFailed);
      }
    });
  }

  const editing = mode === "edit";

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} min-w-48`}
            />
          ) : (
            <span className="font-medium text-foreground">
              {bloodTestType.name}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          {p.table.bloodTestCount(bloodTestType.blood_test_count)}
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {mode === "edit" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {t.common.save}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={reset}
                  className={smallButton}
                >
                  {t.common.cancel}
                </button>
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
                <button
                  type="button"
                  disabled={isPending || !mergeInto}
                  onClick={handleMerge}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {p.merge.button}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={reset}
                  className={smallButton}
                >
                  {t.common.cancel}
                </button>
              </>
            )}
            {mode === "view" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={smallButton}
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  disabled={mergeTargets.length === 0}
                  onClick={() => setMode("merge")}
                  className={smallButton}
                >
                  {p.merge.open}
                </button>
                <button
                  type="button"
                  disabled={isPending || bloodTestType.blood_test_count > 0}
                  title={
                    bloodTestType.blood_test_count > 0
                      ? p.errors.hasBloodTests(bloodTestType.blood_test_count)
                      : undefined
                  }
                  onClick={handleDelete}
                  className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.common.delete}
                </button>
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

export function BloodTestTypesTable({
  bloodTestTypes,
}: {
  bloodTestTypes: BloodTestTypeRow[];
}) {
  const { t } = useI18n();
  const p = t.admin.bloodTestTypes;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{p.table.name}</th>
            <th className="px-4 py-2 font-medium">{p.table.bloodTests}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bloodTestTypes.map((bloodTestType) => (
            <BloodTestTypeRowItem
              key={bloodTestType.id}
              bloodTestType={bloodTestType}
              mergeTargets={bloodTestTypes.filter(
                (row) => row.id !== bloodTestType.id,
              )}
            />
          ))}
          {bloodTestTypes.length === 0 && (
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
