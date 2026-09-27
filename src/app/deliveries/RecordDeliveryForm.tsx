"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatQuantity } from "@/lib/diets/options";
import { packTotal, parseDeliveryQuantity, type DeliveryKind, type DeliveryTiming } from "@/lib/management/stock-receipts";
import { recordDelivery } from "./actions";

export type DeliveryFormItem = {
  id: string;
  name: string;
  /** Already translated, e.g. "tablet", "g". */
  unit: string;
};

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * One delivery of one item. After a save the item, quantity, cost and note
 * clear but the kind, day and supplier stay: one delivery van usually
 * brings several items, entered one after another.
 */
export function RecordDeliveryForm({
  initialKind,
  today,
  items,
  countDays,
  suppliers,
}: {
  initialKind: DeliveryKind;
  /** The shelter's today, YYYY-MM-DD, from the server. */
  today: string;
  items: Record<DeliveryKind, DeliveryFormItem[]>;
  /** Item id → the shelter days it was counted in a stocktake. */
  countDays: Record<DeliveryKind, Record<string, string[]>>;
  suppliers: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  const d = t.deliveries;
  const f = d.form;

  const [kind, setKind] = useState<DeliveryKind>(initialKind);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [packs, setPacks] = useState("");
  const [perPack, setPerPack] = useState("");
  const [date, setDate] = useState(today);
  const [timing, setTiming] = useState<DeliveryTiming | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const item = items[kind].find((i) => i.id === itemId);
  const countedThatDay = itemId !== "" && (countDays[kind][itemId] ?? []).includes(date);
  const quantityOk = parseDeliveryQuantity(quantity).ok;

  const setPack = (nextPacks: string, nextPerPack: string) => {
    setPacks(nextPacks);
    setPerPack(nextPerPack);
    const total = packTotal(nextPacks, nextPerPack);
    if (total != null) setQuantity(String(total));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const saved = { name: item?.name ?? "", quantity, unit: item?.unit ?? "" };
    startTransition(async () => {
      const result = await recordDelivery({
        kind,
        itemId,
        quantity,
        date,
        timing: countedThatDay ? timing : null,
        supplierId,
        cost,
        note,
      });
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setMessage({
        ok: true,
        text: d.saved(saved.name, formatQuantity(Number(saved.quantity)), saved.unit),
      });
      setItemId("");
      setQuantity("");
      setPacks("");
      setPerPack("");
      setTiming(null);
      setCost("");
      setNote("");
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
      <div role="tablist" aria-label={f.kind} className="flex gap-2">
        {(["medication", "diet"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              if (k === kind) return;
              setKind(k);
              setItemId("");
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

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="delivery-item" className="text-sm font-medium text-muted">
            {f.item}
          </label>
          <select
            id="delivery-item"
            required
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);
              setTiming(null);
            }}
            className={`${inputClass} w-72 max-w-full`}
          >
            <option value="">{items[kind].length ? f.itemPlaceholder : d.noItems[kind]}</option>
            {items[kind].map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-quantity" className="text-sm font-medium text-muted">
            {item ? f.quantityIn(item.unit) : f.quantity}
          </label>
          <input
            id="delivery-quantity"
            required
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setPacks("");
              setPerPack("");
            }}
            aria-invalid={quantity !== "" && !quantityOk}
            className={`${inputClass} w-36`}
          />
          <span className="text-xs text-muted">{f.quantityHint}</span>
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
              value={packs}
              onChange={(e) => setPack(e.target.value, perPack)}
              className={`${inputClass} w-20`}
            />
            <span aria-hidden="true">×</span>
            <input
              aria-label={item ? f.perPackIn(item.unit) : f.perPack}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={perPack}
              onChange={(e) => setPack(packs, e.target.value)}
              className={`${inputClass} w-24`}
            />
            {item && <span className="text-muted">{item.unit}</span>}
          </div>
          <span className="text-xs text-muted">{f.packsHint}</span>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-date" className="text-sm font-medium text-muted">
            {f.date}
          </label>
          <input
            id="delivery-date"
            required
            type="date"
            max={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTiming(null);
            }}
            className={`${inputClass} w-44`}
          />
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
        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-cost" className="text-sm font-medium text-muted">
            {f.cost}
          </label>
          <input
            id="delivery-cost"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={`${inputClass} w-36`}
          />
          <span className="text-xs text-muted">{f.costHint}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="delivery-note" className="text-sm font-medium text-muted">
            {f.note}
          </label>
          <input
            id="delivery-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={f.notePlaceholder}
            className={`${inputClass} w-full min-w-48`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.saving : f.save}
        </button>
        <span className="text-xs text-muted">{f.notACount}</span>
      </div>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
