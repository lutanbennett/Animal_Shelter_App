"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DOSE_UNITS, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { deleteMedication, mergeMedication, updateMedicationDefinition } from "./actions";

/** One row of Settings → Medications: the option-list half of a medication. */
export type MedicationDefinitionRow = {
  id: string;
  name: string;
  dose_unit: string;
  /** Every prescription ever written for it — any at all blocks delete. */
  prescription_count: number;
};

/** name, unit, prescriptions, actions. */
const COLUMNS = 4;

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function MedicationRowItem({
  medication,
  mergeTargets,
}: {
  medication: MedicationDefinitionRow;
  /** Other medications with the same unit — the only valid merge targets. */
  mergeTargets: MedicationDefinitionRow[];
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const m = t.management.medications;
  const [name, setName] = useState(medication.name);
  const [doseUnit, setDoseUnit] = useState(medication.dose_unit);
  const [mode, setMode] = useState<"view" | "edit" | "merge">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(medication.name);
    setDoseUnit(medication.dose_unit);
    setMergeInto("");
    setMode("view");
  }

  async function handleSave() {
    // The unit is what every prescription's dose is measured in, so
    // changing it rewrites their meaning (0027). Make that explicit.
    if (doseUnit !== medication.dose_unit && medication.prescription_count > 0) {
      const ok = await confirm({
        body: m.unitChangeConfirm(
          medication.name,
          medication.prescription_count,
          doseUnitLabel(t, medication.dose_unit),
          doseUnitLabel(t, doseUnit),
        ),
      });
      if (!ok) return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateMedicationDefinition(medication.id, { name, doseUnit });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!(await confirm({ body: m.deleteConfirm(medication.name), confirmLabel: t.common.delete }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteMedication(medication.id);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  async function handleMerge() {
    const target = mergeTargets.find((row) => row.id === mergeInto);
    if (!target) return;
    if (!(await confirm({ body: m.mergeConfirm(medication.name, target.name, medication.prescription_count) }))) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await mergeMedication(medication.id, target.id);
      // This row disappears on revalidation; nothing to reset.
      if (!result.ok) setMessage({ type: "error", text: result.error });
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
              aria-label={m.table.name}
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
              aria-label={m.table.unit}
              className={`${inputClass} min-w-32`}
            >
              {DOSE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {doseUnitLabel(t, unit)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted">{doseUnitLabel(t, medication.dose_unit)}</span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">{m.table.prescriptionCount(medication.prescription_count)}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 md:min-w-[16rem]">
            {editing && (
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
                <ActionButton icon={ACTION_ICONS.merge} variant="primary" compact disabled={isPending || !mergeInto} onClick={handleMerge}>
                  {m.merge.button}
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
                  subject={medication.name}
                  icon={ACTION_ICONS.edit}
                />
                <RowActionButton
                  disabled={mergeTargets.length === 0}
                  onClick={() => setMode("merge")}
                  label={m.merge.open}
                  hint={mergeTargets.length === 0 ? m.merge.noTargets : undefined}
                  subject={medication.name}
                  icon={ACTION_ICONS.merge}
                />
                <RowActionButton
                  disabled={isPending || medication.prescription_count > 0}
                  onClick={handleDelete}
                  label={t.common.delete}
                  hint={
                    medication.prescription_count > 0
                      ? m.errors.hasPrescriptions(medication.prescription_count)
                      : undefined
                  }
                  subject={medication.name}
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
          <td colSpan={COLUMNS} className="px-4 pb-2 text-xs text-muted">
            {m.merge.hint}
          </td>
        </tr>
      )}
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

export function MedicationsTable({ medications }: { medications: MedicationDefinitionRow[] }) {
  const { t } = useI18n();
  const m = t.management.medications;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{m.table.name}</th>
            <th className="px-4 py-2 font-medium">{m.table.unit}</th>
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
                (row) => row.id !== medication.id && row.dose_unit === medication.dose_unit,
              )}
            />
          ))}
          {medications.length === 0 && (
            <tr>
              <td colSpan={COLUMNS} className="px-4 py-6 text-center text-muted">
                {m.table.noMedications}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
