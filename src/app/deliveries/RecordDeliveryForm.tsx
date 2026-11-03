"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useId, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localLabel } from "@/lib/translations/labels";
import { localizedValidity } from "@/lib/i18n/validity";
import { formatQuantity } from "@/lib/diets/options";
import { defaultUnit, type UnitConversion } from "@/lib/units";
import { packTotal, parseDeliveryQuantity, type DeliveryKind, type DeliveryTiming } from "@/lib/management/stock-receipts";
import { previewBase } from "@/lib/management/delivery-lines";
import { MedicationLabelThumb } from "@/components/MedicationLabelThumb";
import { useWriteCall } from "@/lib/use-write-form";
import { recordDelivery, type BillTotals } from "./actions";
import { BillTotalsLine } from "./BillTotalsLine";
import { attachCardToDelivery } from "@/app/bills/actions";
import { BillPhotoField } from "@/components/BillPhotoField";
import { useDeferredUploads } from "@/components/DeferredUploads";
import { DateInput } from "@/components/DateInput";

/** What a bill's item can be: a list item (medication, food) or a typed description (0308). */
export type FormKind = DeliveryKind | "described";

export type DeliveryFormItem = {
  id: string;
  name: string;
  /** Already translated, e.g. "tablet", "g". */
  unit: string;
  /** Label photo of a medication (0129), so the box in hand can be matched; null/absent = none. */
  labelFileId?: string | null;
  /** Other units it is bought in (0118), as they are now. */
  conversions: UnitConversion[];
};

/** One size on the delivery: what it is counted in, how many, and what that cost. */
type Line = { key: number; unit: string; quantity: string; packs: string; perPack: string; cost: string };
let nextKey = 1;
const newLine = (unit = "", cost = ""): Line => ({ key: nextKey++, unit, quantity: "", packs: "", perPack: "", cost });

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * One bill, one or more items (0308). An item is a medication or a food from the list, in one or more sizes (2 × 20 kg
 * bag + 1 × 14 kg bag), or something else typed as words. The first save opens the bill: the day, supplier, total and
 * photos belong to the bill, so after a save they stay (and the day and supplier lock) while the item, lines and note
 * clear for the next item. "Finish this bill" closes it. The bill's total is shown against the items added up, never
 * blocking.
 */
export function RecordDeliveryForm({
  initialKind,
  today,
  items,
  countDays,
  suppliers,
  fromBill,
  billCost,
}: {
  initialKind: DeliveryKind;
  /** The shelter's today, YYYY-MM-DD, from the server. */
  today: string;
  items: Record<DeliveryKind, DeliveryFormItem[]>;
  /** Item id → the shelter days it was counted in a stocktake. */
  countDays: Record<DeliveryKind, Record<string, string[]>>;
  suppliers: { id: string; name: string }[];
  /** A card in the bills inbox this delivery is being recorded from; its photos move onto the delivery. */
  fromBill?: string | null;
  billCost?: string;
}) {
  const formId = useId();
  const { t, locale } = useI18n();
  const recordWrite = useWriteCall();
  const attachWrite = useWriteCall();
  const d = t.deliveries;
  const f = d.form;

  const [kind, setKind] = useState<FormKind>(initialKind);
  const [describedText, setDescribedText] = useState("");
  const [describedUnit, setDescribedUnit] = useState("");
  const [amount, setAmount] = useState(billCost ?? "");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [totals, setTotals] = useState<BillTotals | null>(null);
  const [itemId, setItemId] = useState("");
  const [lines, setLines] = useState<Line[]>(() => [newLine("", billCost ?? "")]);
  const [date, setDate] = useState(today);
  const [timing, setTiming] = useState<DeliveryTiming | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [cardId, setCardId] = useState(fromBill ?? null);
  const bill = useDeferredUploads();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const listed = kind === "described" ? [] : items[kind];
  const item = listed.find((i) => i.id === itemId);
  // Only the first item of a bill asks: later items take the bill's own day.
  const countedThatDay = kind !== "described" && !deliveryId && itemId !== "" && (countDays[kind][itemId] ?? []).includes(date);
  // A line's unit is the English key the receipt stamps; what is shown is the reader's language (0166).
  const unitLabelOf = (unit: string) =>
    unit ? localLabel(locale, unit, item?.conversions.find((c) => c.unit === unit)?.unitTh) : item?.unit || "";
  const usualUnit = (it: DeliveryFormItem | undefined) =>
    it ? (defaultUnit(it.conversions, "purchase")?.unit ?? "") : "";
  const together = item ? previewBase(lines, item.conversions) : null;

  const patch = (key: number, change: Partial<Line>) =>
    setLines((all) => all.map((l) => (l.key === key ? { ...l, ...change } : l)));
  const setPack = (line: Line, packs: string, perPack: string) => {
    const total = packTotal(packs, perPack);
    patch(line.key, { packs, perPack, ...(total != null ? { quantity: String(total) } : {}) });
  };
  const chooseItem = (id: string) => {
    setItemId(id);
    setTiming(null);
    const next = listed.find((i) => i.id === id);
    setLines([newLine(usualUnit(next))]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const saved =
      kind === "described"
        ? { name: describedText.trim(), quantity: String(Number(lines[0]?.quantity) || 0), unit: describedUnit.trim() }
        : { name: item?.name ?? "", quantity: String(together ?? 0), unit: item?.unit ?? "" };
    startTransition(async () => {
      const result = await recordWrite((requestId) => recordDelivery({
        kind,
        itemId,
        described: kind === "described" ? { description: describedText, unit: describedUnit } : undefined,
        lines: lines.map((l) => ({ quantity: l.quantity, unit: l.unit, cost: l.cost })),
        date,
        timing: countedThatDay ? timing : null,
        supplierId,
        note,
        deliveryId,
        amount,
        cardId,
      }, requestId));
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }

      // The bill: a card it was recorded from moves onto the bill (the header, so every item shares the photos), and
      // photos picked here are filed on it.
      let billNote = "";
      if (result.deliveryId && cardId) {
        const moved = await attachWrite((requestId) => attachCardToDelivery(cardId, result.deliveryId!, requestId));
        if (!moved.ok) billNote = moved.error;
        setCardId(null);
      }
      if (result.deliveryId && bill.queued.length > 0) {
        const filed = await bill.upload(`/api/bills/stock_delivery/${result.deliveryId}`);
        if (filed.failed) billNote = t.bills.photo.failed;
      }
      setDeliveryId(result.deliveryId ?? null);
      setTotals(result.totals ?? null);
      bill.reset();
      setMessage({
        ok: !billNote,
        text: d.saved(saved.name, formatQuantity(Number(saved.quantity)), saved.unit) + (billNote ? " " + billNote : ""),
      });
      setItemId("");
      setLines([newLine()]);
      setTiming(null);
      setNote("");
      setDescribedText("");
    });
  };

  const finishBill = () => {
    setDeliveryId(null);
    setTotals(null);
    setAmount("");
    setCardId(null);
    setMessage(null);
  };

  return (
    <form onSubmit={submit} {...localizedValidity(t, locale)} className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
      <div role="tablist" aria-label={f.kind} className="flex gap-2">
        {(["medication", "diet", "described"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              if (k === kind) return;
              setKind(k);
              setItemId("");
              setLines([newLine()]);
              setTiming(null);
            }}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              kind === k ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-surface-hover"
            }`}
          >
            {d.kinds[k]}
          </button>
        ))}
      </div>

      {kind === "described" && (
        <fieldset className="flex flex-col gap-3 rounded border border-border p-3">
          <p className="text-sm text-muted">{f.describedHint}</p>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
              <label htmlFor="delivery-described" className="text-sm font-medium text-muted">
                {f.describedWhat}
              </label>
              <input
                id="delivery-described"
                required
                value={describedText}
                onChange={(e) => setDescribedText(e.target.value)}
                placeholder={f.describedPlaceholder}
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="delivery-described-quantity" className="text-sm font-medium text-muted">
                {f.quantity}
              </label>
              <input
                id="delivery-described-quantity"
                required
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={lines[0]?.quantity ?? ""}
                onChange={(e) => patch(lines[0].key, { quantity: e.target.value })}
                className={`${inputClass} w-32`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="delivery-described-unit" className="text-sm font-medium text-muted">
                {f.describedUnit}
              </label>
              <input
                id="delivery-described-unit"
                required
                value={describedUnit}
                onChange={(e) => setDescribedUnit(e.target.value)}
                placeholder={f.describedUnitPlaceholder}
                className={`${inputClass} w-36`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="delivery-described-cost" className="text-sm font-medium text-muted">
                {f.describedCost}
              </label>
              <input
                id="delivery-described-cost"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={lines[0]?.cost ?? ""}
                onChange={(e) => patch(lines[0].key, { cost: e.target.value })}
                className={`${inputClass} w-36`}
              />
            </div>
          </div>
          <span className="text-xs text-muted">{f.describedNotStock}</span>
        </fieldset>
      )}

      {kind !== "described" && (
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="delivery-item" className="text-sm font-medium text-muted">
            {f.item}
          </label>
          <select
            id="delivery-item"
            required
            value={itemId}
            onChange={(e) => chooseItem(e.target.value)}
            className={`${inputClass} w-72 max-w-full`}
          >
            <option value="">{listed.length ? f.itemPlaceholder : d.noItems[kind as DeliveryKind]}</option>
            {listed.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        {kind === "medication" && item?.labelFileId && (
          <MedicationLabelThumb
            fileId={item.labelFileId}
            alt={t.management.medications.label.alt(item.name)}
            size={96}
          />
        )}
      </div>
      )}

      {kind !== "described" && lines.map((line, index) => {
        const quantityOk = parseDeliveryQuantity(line.quantity).ok;
        const label = unitLabelOf(line.unit);
        const id = `${formId}-line-${index}`;
        return (
          <fieldset key={line.key} className="flex flex-col gap-3 rounded border border-border p-3">
            {lines.length > 1 && <legend className="px-1 text-sm font-semibold text-foreground">{f.sizeN(index + 1)}</legend>}
            <div className="flex flex-wrap items-start gap-3">
              {item && item.conversions.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${id}-unit`} className="text-sm font-medium text-muted">
                    {t.units.entry.unit}
                  </label>
                  <select
                    id={`${id}-unit`}
                    value={line.unit}
                    onChange={(e) => patch(line.key, { unit: e.target.value })}
                    className={`${inputClass} w-44`}
                  >
                    <option value="">{item.unit}</option>
                    {item.conversions.map((c) => (
                      <option key={c.id} value={c.unit}>
                        {localLabel(locale, c.unit, c.unitTh)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-quantity`} className="text-sm font-medium text-muted">
                  {item ? f.quantityIn(label) : f.quantity}
                </label>
                <input
                  id={`${id}-quantity`}
                  required
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) => patch(line.key, { quantity: e.target.value, packs: "", perPack: "" })}
                  aria-invalid={line.quantity !== "" && !quantityOk}
                  className={`${inputClass} w-36`}
                />
                {index === 0 && <span className="text-xs text-muted">{f.quantityHint}</span>}
                {item && line.unit && quantityOk && (
                  <span className="text-xs text-muted">
                    {t.units.entry.equals(formatQuantity(previewBase([line], item.conversions) ?? 0), item.unit)} ·{" "}
                    {t.units.entry.approx}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-cost`} className="text-sm font-medium text-muted">
                  {f.cost}
                </label>
                <input
                  id={`${id}-cost`}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={line.cost}
                  onChange={(e) => patch(line.key, { cost: e.target.value })}
                  className={`${inputClass} w-36`}
                />
                {index === 0 && <span className="text-xs text-muted">{f.costHint}</span>}
              </div>
              <fieldset className="flex flex-col gap-1">
                <legend className="text-sm font-medium text-muted">{f.packs}</legend>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    aria-label={f.packsCount}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={line.packs}
                    onChange={(e) => setPack(line, e.target.value, line.perPack)}
                    className={`${inputClass} w-20`}
                  />
                  <span aria-hidden="true">×</span>
                  <input
                    aria-label={item ? f.perPackIn(label) : f.perPack}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={line.perPack}
                    onChange={(e) => setPack(line, line.packs, e.target.value)}
                    className={`${inputClass} w-24`}
                  />
                  {item && <span className="text-muted">{label}</span>}
                </div>
                {index === 0 && <span className="text-xs text-muted">{f.packsHint}</span>}
              </fieldset>
            </div>
            {lines.length > 1 && (
              <div>
                <button
                  type="button"
                  onClick={() => setLines((all) => all.filter((l) => l.key !== line.key))}
                  className="min-h-10 rounded border border-border px-3 text-sm text-foreground hover:bg-surface-hover"
                >
                  {f.removeSize}
                </button>
              </div>
            )}
          </fieldset>
        );
      })}
      {kind !== "described" && item && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLines((all) => [...all, newLine(usualUnit(item))])}
            className="min-h-10 rounded border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {f.addSize}
          </button>
          {lines.length > 1 && together != null && (
            <span className="text-sm font-medium text-foreground">{f.together(formatQuantity(together), item.unit)}</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-date" className="text-sm font-medium text-muted">
            {f.date}
          </label>
          <DateInput
            id="delivery-date"
            required
            disabled={deliveryId != null}
            max={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTiming(null);
            }}
            className={`${inputClass} w-44`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-amount" className="text-sm font-medium text-muted">
            {f.billTotal}
          </label>
          <input
            id="delivery-amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} w-44`}
          />
          <span className="text-xs text-muted">{f.billTotalHint}</span>
        </div>

        {countedThatDay && (
          <fieldset className="flex max-w-md flex-col gap-1 rounded border border-warning/40 bg-warning/10 px-3 py-2">
            <legend className="px-1 text-sm font-medium text-foreground">{f.timing.question}</legend>
            {(["before", "after"] as const).map((value) => (
              <label key={value} className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="delivery-timing"
                  required
                  value={value}
                  checked={timing === value}
                  onChange={() => setTiming(value)}
                  className="mt-0.5"
                />
                {f.timing[value]}
              </label>
            ))}
            <span className="text-xs text-muted">{f.timing.why}</span>
          </fieldset>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-supplier" className="text-sm font-medium text-muted">
            {f.supplier}
          </label>
          <select
            id="delivery-supplier"
            disabled={deliveryId != null}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={`${inputClass} w-64 max-w-full`}
          >
            <option value="">{suppliers.length ? f.supplierNone : f.supplierNoVendors}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex basis-full flex-col gap-1">
          <BillPhotoField uploads={bill} />
        </div>
        {/* basis-48, not a min-width on the input: the box wraps onto its own
            line when the supplier leaves under 12rem (a phone), then takes the row.
            With min-w-0 flex-1 it stayed beside the supplier and its input
            overflowed the form by 76px (114 in Thai). */}
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
          <label htmlFor="delivery-note" className="text-sm font-medium text-muted">
            {f.note}
          </label>
          <input
            id="delivery-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={f.notePlaceholder}
            className={`${inputClass} w-full`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending}>
          {pending ? t.common.saving : deliveryId ? f.saveAnother : f.save}
        </ActionButton>
        {deliveryId && (
          <button
            type="button"
            onClick={finishBill}
            disabled={pending}
            className="min-h-10 rounded border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {f.finishBill}
          </button>
        )}
        <span className="text-xs text-muted">{f.notACount}</span>
      </div>
      {deliveryId && <BillTotalsLine totals={totals} />}
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
