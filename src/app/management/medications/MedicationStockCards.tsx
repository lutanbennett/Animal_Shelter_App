"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { useRef, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { doseUnitLabel } from "@/lib/i18n/enum-labels";
import { formatUnitCost, parseUnitCost, UNIT_COST_DECIMALS } from "@/lib/format";
import {
  parseLeadDays,
  parseSafetyStock,
  parseStockCount,
  type StockFigures,
  type StockReading,
} from "@/lib/management/stock";
import { DaysOfStockCell, StockOnHandCell } from "@/components/StockCells";
import { ACTION_ICONS } from "@/components/hub-icons";
import { MedicationLabelThumb } from "@/components/MedicationLabelThumb";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import {
  removeMedicationLabel,
  updateMedicationStock,
  updateMedicationStockSettings,
  uploadMedicationLabel,
} from "./actions";

export type MedicationStockRow = {
  id: string;
  name: string;
  dose_unit: string;
  /** Baht per one dose_unit, up to 4 places (0071, 0161). Null means nobody has priced it yet. */
  cost_per_unit: number | null;
  /**
   * One entry per forecast window (same order as the page's forecastHeadings):
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

const inputClass =
  "w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary md:text-sm";

/**
 * Management → Medication stock, one card per medication: built for the
 * phone (a card stacks; a table of eight columns does not). Count, price,
 * reorder and the label photo. The name and unit are changed under
 * Settings → Medications.
 */
function MedicationCard({
  medication,
  forecastHeadings,
}: {
  medication: MedicationStockRow;
  forecastHeadings: string[];
}) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const m = t.management.medications;
  const s = t.management.stock;
  const unit = doseUnitLabel(t, medication.dose_unit);
  const [mode, setMode] = useState<"view" | "edit" | "count">("view");
  const [cost, setCost] = useState("");
  const [leadDays, setLeadDays] = useState("");
  const [safetyValue, setSafetyValue] = useState("");
  const [safetyUnit, setSafetyUnit] = useState("");
  const [count, setCount] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const labelInput = useRef<HTMLInputElement>(null);

  // Seeded when opened, not at mount: the card re-renders with the saved
  // figures, and useState would keep the old ones.
  function openEdit() {
    setCost(medication.cost_per_unit?.toString() ?? "");
    setLeadDays(medication.stock.reorder_lead_days?.toString() ?? "");
    setSafetyValue(medication.safetyStock?.toString() ?? "");
    setSafetyUnit("");
    setMessage(null);
    setMode("edit");
  }

  function openCount() {
    setCount(medication.stock.stock_on_hand?.toString() ?? "");
    setMessage(null);
    setMode("count");
  }

  function handleSave() {
    // Blank is a real answer (not priced yet); a bad number is not, and
    // must never reach the forecast as a zero.
    if (!parseUnitCost(cost).ok) {
      setMessage({ type: "error", text: m.errors.costInvalid });
      return;
    }
    if (!parseLeadDays(leadDays).ok) {
      setMessage({ type: "error", text: s.errors.leadDaysInvalid });
      return;
    }
    if (!parseSafetyStock(safetyValue).ok) {
      setMessage({ type: "error", text: s.errors.safetyInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateMedicationStockSettings(medication.id, {
        costPerUnit: cost,
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

  function handleCount() {
    if (!parseStockCount(count).ok) {
      setMessage({ type: "error", text: s.errors.countInvalid });
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

  function uploadLabel(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setMessage(null);
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () =>
        uploadMedicationLabel(medication.id, formData),
      );
      setMessage(result.ok ? { type: "success", text: result.success } : { type: "error", text: result.error });
    });
  }

  async function handleRemoveLabel() {
    if (!(await confirm({ body: m.label.removeConfirm(medication.name), confirmLabel: m.label.remove }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeMedicationLabel(medication.id);
      setMessage(result.ok ? { type: "success", text: result.success } : { type: "error", text: result.error });
    });
  }

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <MedicationLabelThumb fileId={medication.labelFileId} alt={m.label.alt(medication.name)} />
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-foreground">{medication.name}</h2>
          <p className="text-sm text-muted">{m.stockCard.unit(unit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted">{s.stockHeading}</span>
          <StockOnHandCell
            as="div"
            figures={medication.stock}
            reading={medication.stockReading}
            unit={unit}
            counting={mode === "count"}
            countValue={count}
            onCountChange={setCount}
            inPurchaseUnit={medication.purchaseUnit}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted">{s.daysHeading}</span>
          <DaysOfStockCell
            as="div"
            figures={medication.stock}
            reading={medication.stockReading}
            editing={mode === "edit"}
            leadDaysValue={leadDays}
            onLeadDaysChange={setLeadDays}
            safety={{
              stored: medication.safetyStock,
              baseUnitLabel: unit,
              unitOptions: medication.unitOptions,
              value: safetyValue,
              unit: safetyUnit,
              onValueChange: setSafetyValue,
              onUnitChange: setSafetyUnit,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">{m.table.cost}</span>
        {mode === "edit" ? (
          <label className="flex flex-col gap-1">
            <input
              type="number"
              min={0}
              step={10 ** -UNIT_COST_DECIMALS}
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder={m.table.costPlaceholder}
              className={inputClass}
            />
            <span className="text-xs text-muted">{m.stockCard.costHint(unit)}</span>
          </label>
        ) : medication.cost_per_unit == null ? (
          // Never "฿0": an unpriced medication is a gap in the cashflow
          // forecast, and the forecast page counts these rows.
          <span className="text-muted">{m.table.notPricedYet}</span>
        ) : (
          <span className="text-foreground">
            {m.table.costPerUnit(formatUnitCost(medication.cost_per_unit, locale), unit)}
          </span>
        )}
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        {medication.forecast.map((window, i) => (
          <div key={i} className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-muted">{forecastHeadings[i]}</dt>
            <dd className="text-right">
              {window.doses > 0 ? (
                <>
                  <span className="font-medium text-foreground">{m.table.forecastQuantity(window.quantity, unit)}</span>{" "}
                  <span className="text-xs text-muted">{m.table.forecastDetail(window.doses, window.residents)}</span>
                </>
              ) : (
                <span className="text-muted">{m.table.noneDue}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        {mode === "view" ? (
          <>
            <ActionButton icon={ACTION_ICONS.count} variant="primary" disabled={isPending} onClick={openCount}>
              {s.count}
            </ActionButton>
            <ActionButton icon={ACTION_ICONS.edit} disabled={isPending} onClick={openEdit}>
              {m.stockCard.editPrice}
            </ActionButton>
            <ActionButton
              icon={ACTION_ICONS.uploadImage}
              disabled={isPending}
              onClick={() => labelInput.current?.click()}
            >
              {isPending ? t.common.uploading : medication.labelFileId ? m.label.replace : m.label.upload}
            </ActionButton>
            {medication.labelFileId && (
              <ActionButton icon={ACTION_ICONS.removeImage} disabled={isPending} onClick={handleRemoveLabel}>
                {m.label.remove}
              </ActionButton>
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
          </>
        ) : (
          <>
            <ActionButton
              icon={ACTION_ICONS.save}
              variant="primary"
              disabled={isPending}
              onClick={mode === "edit" ? handleSave : handleCount}
            >
              {t.common.save}
            </ActionButton>
            <ActionButton icon={ACTION_ICONS.clear} disabled={isPending} onClick={() => setMode("view")}>
              {t.common.cancel}
            </ActionButton>
          </>
        )}
      </div>

      {message && (
        <p role="status" className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
    </li>
  );
}

export function MedicationStockCards({
  medications,
  forecastHeadings,
}: {
  medications: MedicationStockRow[];
  /** One heading per forecast window, in the order the rows' forecast arrays use. */
  forecastHeadings: string[];
}) {
  const { t } = useI18n();
  if (medications.length === 0) {
    return <p className="text-sm text-muted">{t.management.medications.stockCard.none}</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {medications.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} forecastHeadings={forecastHeadings} />
      ))}
    </ul>
  );
}
