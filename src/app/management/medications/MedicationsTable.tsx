"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useRef, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DOSE_UNITS, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { formatBahtPrice, parseBahtAmount } from "@/lib/format";
import {
  parseLeadDays,
  parseSafetyStock,
  parseStockCount,
  type StockFigures,
  type StockReading,
} from "@/lib/management/stock";
import { DaysOfStockCell, StockOnHandCell } from "@/components/StockCells";
import { MedicationLabelThumb } from "@/components/MedicationLabelThumb";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import {
  deleteMedication,
  mergeMedication,
  removeMedicationLabel,
  updateMedication,
  updateMedicationStock,
  uploadMedicationLabel,
} from "./actions";

export type MedicationRow = {
  id: string;
  name: string;
  dose_unit: string;
  /** Baht per one dose_unit (0071). Null means nobody has priced it yet. */
  cost_per_unit: number | null;
  /** Every prescription ever written for it — any at all blocks delete. */
  prescription_count: number;
  /**
   * One entry per forecast window (same order as the table's forecastHeadings):
   * living, non-adopted residents with a dose due, whole doses due, and the
   * quantity in dose_unit (0044 medication_forecast).
   */
  forecast: { residents: number; doses: number; quantity: number }[];
  /** Stock on hand, when it was counted and the reorder lead time (0083). */
  stock: StockFigures;
  /** Days-of-stock, computed on the server from the 30-day forecast. */
  stockReading: StockReading;
  /** Stock on hand in the purchase unit (0118); null without one. */
  purchaseUnit: { quantity: number; unit: string } | null;
  /** Safety stock in base units; null = no floor, 0 = a floor of nothing (0128). */
  safetyStock: number | null;
  /** Drive id of the box/bottle label photo (0129); null = none. */
  labelFileId: string | null;
  /** The item's other units by name, for typing the safety stock in one. */
  unitOptions: string[];
};

/** Columns besides the forecast windows: label, name, unit, cost, stock, days, prescriptions, actions. */
const FIXED_COLUMNS = 8;

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
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const m = t.management.medications;
  const [name, setName] = useState(medication.name);
  const [doseUnit, setDoseUnit] = useState(medication.dose_unit);
  const [costPerUnit, setCostPerUnit] = useState(
    medication.cost_per_unit?.toString() ?? "",
  );
  const [leadDays, setLeadDays] = useState(
    medication.stock.reorder_lead_days?.toString() ?? "",
  );
  const [safetyValue, setSafetyValue] = useState(medication.safetyStock?.toString() ?? "");
  const [safetyUnit, setSafetyUnit] = useState("");
  const [count, setCount] = useState("");
  const [mode, setMode] = useState<"view" | "edit" | "merge" | "count">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const labelInput = useRef<HTMLInputElement>(null);

  function reset() {
    setName(medication.name);
    setDoseUnit(medication.dose_unit);
    setCostPerUnit(medication.cost_per_unit?.toString() ?? "");
    setLeadDays(medication.stock.reorder_lead_days?.toString() ?? "");
    setSafetyValue(medication.safetyStock?.toString() ?? "");
    setSafetyUnit("");
    setMergeInto("");
    setMode("view");
  }

  async function handleSave() {
    // Blank is a real answer (not priced yet); a bad number is not, and
    // must never reach the forecast as a zero.
    const parsedCost = parseBahtAmount(costPerUnit);
    if (!parsedCost.ok) {
      setMessage({ type: "error", text: m.errors.costInvalid });
      return;
    }
    if (!parseLeadDays(leadDays).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.leadDaysInvalid });
      return;
    }
    if (!parseSafetyStock(safetyValue).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.safetyInvalid });
      return;
    }
    // The unit is what every prescription's dose is measured in, so
    // changing it rewrites their meaning (0027). Make that explicit.
    if (doseUnit !== medication.dose_unit && medication.prescription_count > 0) {
      const ok = await confirm({ body: m.unitChangeConfirm(
          medication.name,
          medication.prescription_count,
          doseUnitLabel(t, medication.dose_unit),
          doseUnitLabel(t, doseUnit),
        ) });
      if (!ok) return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateMedication(medication.id, {
        name,
        doseUnit,
        costPerUnit: parsedCost.value,
        reorderLeadDays: leadDays,
        safetyStock: safetyValue,
        safetyUnit,
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  function openCount() {
    // Seeded when opened, not at mount: the row re-renders with the saved
    // count, and useState would keep the old one.
    setCount(medication.stock.stock_on_hand?.toString() ?? "");
    setMessage(null);
    setMode("count");
  }

  function handleCount() {
    if (!parseStockCount(count).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.countInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateMedicationStock(medication.id, count);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: m.deleteConfirm(medication.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteMedication(medication.id);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  function uploadLabel(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setMessage(null);
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () =>
        uploadMedicationLabel(medication.id, formData),
      );
      setMessage(
        result.ok
          ? { type: "success", text: result.success }
          : { type: "error", text: result.error },
      );
    });
  }

  async function handleRemoveLabel() {
    if (!(await confirm({ body: m.label.removeConfirm(medication.name), confirmLabel: m.label.remove }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeMedicationLabel(medication.id);
      setMessage(
        result.ok
          ? { type: "success", text: result.success }
          : { type: "error", text: result.error },
      );
    });
  }

  async function handleMerge() {
    const target = mergeTargets.find((row) => row.id === mergeInto);
    if (!target) return;
    if (
      !await confirm({ body: m.mergeConfirm(medication.name, target.name, medication.prescription_count) })
    ) {
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
          <MedicationLabelThumb fileId={medication.labelFileId} alt={m.label.alt(medication.name)} />
        </td>
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
        <td className="px-4 py-2">
          {editing ? (
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder={m.table.costPlaceholder}
              aria-label={m.table.cost}
              className={`${inputClass} min-w-28`}
            />
          ) : medication.cost_per_unit == null ? (
            // Never "฿0" — an unpriced medication is a gap in the cashflow
            // forecast, and the forecast page counts these rows.
            <span className="text-muted">{m.table.notPricedYet}</span>
          ) : (
            <span className="text-foreground">
              {m.table.costPerUnit(
                formatBahtPrice(medication.cost_per_unit, locale),
                doseUnitLabel(t, medication.dose_unit),
              )}
            </span>
          )}
        </td>
        {medication.forecast.map((window, i) => (
          <td key={i} className="px-4 py-2 text-muted">
            {window.doses > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {m.table.forecastQuantity(window.quantity, doseUnitLabel(t, medication.dose_unit))}
                </span>
                <br />
                <span className="text-xs">
                  {m.table.forecastDetail(window.doses, window.residents)}
                </span>
              </>
            ) : (
              m.table.noneDue
            )}
          </td>
        ))}
        <StockOnHandCell
          figures={medication.stock}
          reading={medication.stockReading}
          unit={doseUnitLabel(t, medication.dose_unit)}
          counting={mode === "count"}
          countValue={count}
          onCountChange={setCount}
          inPurchaseUnit={medication.purchaseUnit}
        />
        <DaysOfStockCell
          figures={medication.stock}
          reading={medication.stockReading}
          editing={editing}
          leadDaysValue={leadDays}
          onLeadDaysChange={setLeadDays}
          safety={{
            stored: medication.safetyStock,
            baseUnitLabel: doseUnitLabel(t, medication.dose_unit),
            unitOptions: medication.unitOptions,
            value: safetyValue,
            unit: safetyUnit,
            onValueChange: setSafetyValue,
            onUnitChange: setSafetyUnit,
          }}
        />
        <td className="px-4 py-2 text-muted">
          {m.table.prescriptionCount(medication.prescription_count)}
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {(mode === "edit" || mode === "count") && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={mode === "edit" ? handleSave : handleCount}
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
                <button type="button" onClick={openCount} className={smallButton}>
                  {t.management.stock.count}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => labelInput.current?.click()}
                  className={smallButton}
                >
                  {isPending ? t.common.uploading : medication.labelFileId ? m.label.replace : m.label.upload}
                </button>
                {medication.labelFileId && (
                  <button type="button" disabled={isPending} onClick={handleRemoveLabel} className={smallButton}>
                    {m.label.remove}
                  </button>
                )}
                <input
                  ref={labelInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) uploadLabel(file);
                  }}
                />
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
          <td colSpan={FIXED_COLUMNS + medication.forecast.length} className="px-4 pb-2 text-xs text-muted">
            {m.merge.hint}
          </td>
        </tr>
      )}
      {message && (
        <tr>
          <td
            colSpan={FIXED_COLUMNS + medication.forecast.length}
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

export function MedicationsTable({
  medications,
  forecastHeadings,
}: {
  medications: MedicationRow[];
  /** One column heading per forecast window, in the order the rows' forecast arrays use. */
  forecastHeadings: string[];
}) {
  const { t } = useI18n();
  const m = t.management.medications;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{m.label.heading}</th>
            <th className="px-4 py-2 font-medium">{m.table.name}</th>
            <th className="px-4 py-2 font-medium">{m.table.unit}</th>
            <th className="px-4 py-2 font-medium">{m.table.cost}</th>
            {forecastHeadings.map((heading) => (
              <th key={heading} className="px-4 py-2 font-medium">
                {heading}
              </th>
            ))}
            <th className="px-4 py-2 font-medium">{t.management.stock.stockHeading}</th>
            <th className="px-4 py-2 font-medium">{t.management.stock.daysHeading}</th>
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
              <td
                colSpan={FIXED_COLUMNS + forecastHeadings.length}
                className="px-4 py-6 text-center text-muted"
              >
                {m.table.noMedications}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
