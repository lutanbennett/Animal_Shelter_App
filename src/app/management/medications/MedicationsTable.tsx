"use client";

import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DOSE_UNITS, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { deleteMedication, mergeMedication, updateMedication } from "./actions";

export type MedicationRow = {
  id: string;
  name: string;
  dose_unit: string;
  /** Every prescription ever written for it — any at all blocks delete. */
  prescription_count: number;
  /** Living, non-adopted residents on a current prescription (0027 view). */
  current_residents: number;
  /** Today's consumption in dose_unit per day; null when nothing is current. */
  daily_quantity: number | null;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const smallButton =
  "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

function MedicationRowItem({
  medication,
  mergeTargets,
}: {
  medication: MedicationRow;
  /** Other medications with the same unit — the only valid merge targets. */
  mergeTargets: MedicationRow[];
}) {
  const { t } = useI18n();
  const m = t.management.medications;
  const [name, setName] = useState(medication.name);
  const [doseUnit, setDoseUnit] = useState(medication.dose_unit);
  const [mode, setMode] = useState<"view" | "edit" | "merge">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(medication.name);
    setDoseUnit(medication.dose_unit);
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
    // The unit is what every prescription's dose is measured in, so
    // changing it rewrites their meaning (0027). Make that explicit.
    if (doseUnit !== medication.dose_unit && medication.prescription_count > 0) {
      const ok = window.confirm(
        m.unitChangeConfirm(
          medication.name,
          medication.prescription_count,
          doseUnitLabel(t, medication.dose_unit),
          doseUnitLabel(t, doseUnit),
        ),
      );
      if (!ok) return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await updateMedication(medication.id, { name, doseUnit });
        setMode("view");
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        fail(err, t.common.failedToSave);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(m.deleteConfirm(medication.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteMedication(medication.id);
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
        m.mergeConfirm(medication.name, target.name, medication.prescription_count),
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await mergeMedication(medication.id, target.id);
        // This row disappears on revalidation; nothing to reset.
      } catch (err) {
        fail(err, m.errors.mergeFailed);
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
            <span className="font-medium text-foreground">{medication.name}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <select
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
              className={`${inputClass} min-w-32`}
            >
              {DOSE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {doseUnitLabel(t, unit)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted">
              {doseUnitLabel(t, medication.dose_unit)}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          {medication.daily_quantity != null
            ? m.table.currentUse(
                medication.current_residents,
                medication.daily_quantity,
                doseUnitLabel(t, medication.dose_unit),
              )
            : m.table.noneCurrent}
        </td>
        <td className="px-4 py-2 text-muted">
          {m.table.prescriptionCount(medication.prescription_count)}
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
                  aria-label={m.merge.into}
                  className={`${inputClass} w-auto min-w-40`}
                >
                  <option value="">{m.merge.pickTarget}</option>
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
                  {m.merge.button}
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
                  title={
                    mergeTargets.length === 0 ? m.merge.noTargets : undefined
                  }
                  onClick={() => setMode("merge")}
                  className={smallButton}
                >
                  {m.merge.open}
                </button>
                <button
                  type="button"
                  disabled={isPending || medication.prescription_count > 0}
                  title={
                    medication.prescription_count > 0
                      ? m.errors.hasPrescriptions(medication.prescription_count)
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
          <td colSpan={5} className="px-4 pb-2 text-xs text-muted">
            {m.merge.hint}
          </td>
        </tr>
      )}
      {message && (
        <tr>
          <td
            colSpan={5}
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

export function MedicationsTable({ medications }: { medications: MedicationRow[] }) {
  const { t } = useI18n();
  const m = t.management.medications;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{m.table.name}</th>
            <th className="px-4 py-2 font-medium">{m.table.unit}</th>
            <th className="px-4 py-2 font-medium">{m.table.currentUseHeading}</th>
            <th className="px-4 py-2 font-medium">{m.table.prescriptions}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {medications.map((medication) => (
            <MedicationRowItem
              key={medication.id}
              medication={medication}
              mergeTargets={medications.filter(
                (row) =>
                  row.id !== medication.id && row.dose_unit === medication.dose_unit,
              )}
            />
          ))}
          {medications.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted">
                {m.table.noMedications}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
