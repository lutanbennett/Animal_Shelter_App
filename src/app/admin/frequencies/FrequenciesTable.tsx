"use client";

import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  FrequencyScheduleFields,
  scheduleToFields,
} from "@/components/FrequencyScheduleFields";
import { describeSchedule, type FrequencySchedule } from "@/lib/prescriptions/frequency";
import { deleteFrequency, mergeFrequency, updateFrequency } from "./actions";

export type FrequencyRow = FrequencySchedule & {
  id: string;
  label: string;
  /** Every prescription that uses it — any at all blocks delete. */
  prescription_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const smallButton =
  "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

function FrequencyRowItem({
  frequency,
  mergeTargets,
}: {
  frequency: FrequencyRow;
  mergeTargets: FrequencyRow[];
}) {
  const { t } = useI18n();
  const f = t.admin.frequencies;
  const [label, setLabel] = useState(frequency.label);
  const [schedule, setSchedule] = useState(() => scheduleToFields(frequency));
  const [mode, setMode] = useState<"view" | "edit" | "merge">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setLabel(frequency.label);
    setSchedule(scheduleToFields(frequency));
    setMergeInto("");
    setMode("view");
  }

  function fail(err: unknown, fallback: string) {
    setMessage({
      type: "error",
      text: err instanceof Error ? err.message : fallback,
    });
  }

  function describe(row: FrequencyRow) {
    return describeSchedule(t, row);
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateFrequency(frequency.id, { label, schedule });
        setMode("view");
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        fail(err, t.common.failedToSave);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(f.deleteConfirm(frequency.label))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteFrequency(frequency.id);
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
        f.mergeConfirm(
          frequency.label,
          target.label,
          frequency.prescription_count,
          describe(target),
        ),
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await mergeFrequency(frequency.id, target.id);
      } catch (err) {
        fail(err, f.errors.mergeFailed);
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`${inputClass} min-w-48`}
            />
          ) : (
            <span className="font-medium text-foreground">{frequency.label}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <FrequencyScheduleFields
              value={schedule}
              onChange={setSchedule}
              compact
              idPrefix={`frequency-${frequency.id}`}
            />
          ) : (
            <span className="text-muted">{describe(frequency)}</span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          {f.table.prescriptionCount(frequency.prescription_count)}
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
                  aria-label={f.merge.into}
                  className={`${inputClass} w-auto min-w-40`}
                >
                  <option value="">{f.merge.pickTarget}</option>
                  {mergeTargets.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label} ({describe(row)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending || !mergeInto}
                  onClick={handleMerge}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {f.merge.button}
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
                  {f.merge.open}
                </button>
                <button
                  type="button"
                  disabled={isPending || frequency.prescription_count > 0}
                  title={
                    frequency.prescription_count > 0
                      ? f.errors.hasPrescriptions(frequency.prescription_count)
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
          <td colSpan={4} className="px-4 pb-2 text-xs text-muted">
            {f.merge.hint}
          </td>
        </tr>
      )}
      {message && (
        <tr>
          <td
            colSpan={4}
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

export function FrequenciesTable({ frequencies }: { frequencies: FrequencyRow[] }) {
  const { t } = useI18n();
  const f = t.admin.frequencies;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{f.table.label}</th>
            <th className="px-4 py-2 font-medium">{f.table.schedule}</th>
            <th className="px-4 py-2 font-medium">{f.table.prescriptions}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {frequencies.map((frequency) => (
            <FrequencyRowItem
              key={frequency.id}
              frequency={frequency}
              mergeTargets={frequencies.filter((row) => row.id !== frequency.id)}
            />
          ))}
          {frequencies.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                {f.table.noFrequencies}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
