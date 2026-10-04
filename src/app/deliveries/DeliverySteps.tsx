"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, House, Pill, Plus, Truck, Wheat } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBahtPrice, formatDate, parseBahtAmount } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { defaultUnit, resolveEntered } from "@/lib/units";
import {
  packTotal,
  parseDeliveryQuantity,
  type DeliveryKind,
  type DeliveryTiming,
} from "@/lib/management/stock-receipts";
import { MedicationLabelThumb } from "@/components/MedicationLabelThumb";
import { recordDelivery } from "./actions";
import type { DeliveryFormItem } from "./RecordDeliveryForm";

type Step = "kind" | "item" | "amount" | "when" | "extras" | "confirm" | "done";

/** The steps counted in "Step n of 6"; the saved screen is not one of them. */
const COUNTED: Step[] = ["kind", "item", "amount", "when", "extras", "confirm"];

const inputClass =
  "min-h-14 w-full rounded border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary";

/**
 * Record a delivery on a phone: one question per screen — what arrived,
 * which one, how much, when, who sent it, then a sentence saying what will
 * be recorded. Every answer lives in this component, not in the screen, so
 * Back never clears anything and a refused save leaves the confirm screen
 * exactly as it was. Same fields, same server action and the same sums as
 * the desk form (RecordDeliveryForm); after a save the day and supplier
 * stay, because one van brings several items.
 */
export function DeliverySteps({
  initialKind,
  today,
  items,
  countDays,
  suppliers,
}: {
  initialKind: DeliveryKind;
  today: string;
  items: Record<DeliveryKind, DeliveryFormItem[]>;
  countDays: Record<DeliveryKind, Record<string, string[]>>;
  suppliers: { id: string; name: string }[];
}) {
  const { t, locale } = useI18n();
  const d = t.deliveries;
  const s = d.steps;

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<DeliveryKind>(initialKind);
  const [itemId, setItemId] = useState("");
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitName, setUnitName] = useState("");
  const [inPacks, setInPacks] = useState(false);
  const [packs, setPacks] = useState("");
  const [perPack, setPerPack] = useState("");
  const [earlier, setEarlier] = useState(false);
  const [earlierDate, setEarlierDate] = useState("");
  const [timing, setTiming] = useState<DeliveryTiming | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const amountInput = useRef<HTMLInputElement>(null);

  const item = items[kind].find((i) => i.id === itemId);
  const date = earlier ? earlierDate : today;
  const countedThatDay = itemId !== "" && date !== "" && (countDays[kind][itemId] ?? []).includes(date);
  const unitLabel = unitName || item?.unit || "";
  const quantityOk = parseDeliveryQuantity(quantity).ok;
  const preview = item && unitName && quantityOk ? resolveEntered(Number(quantity), unitName, item.conversions) : null;
  const supplier = suppliers.find((x) => x.id === supplierId);
  const costParsed = parseBahtAmount(cost);
  const kindWord = d.steps.kind[kind].toLowerCase();

  const go = (next: Step) => {
    setError(null);
    setStep(next);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (step === "amount") amountInput.current?.focus({ preventScroll: true });
  }, [step]);

  const chooseKind = (k: DeliveryKind) => {
    if (k !== kind) {
      setKind(k);
      setItemId("");
      setSearch("");
      setUnitName("");
      setTiming(null);
    }
    go("item");
  };

  const chooseItem = (id: string) => {
    if (id !== itemId) {
      setItemId(id);
      setTiming(null);
      const next = items[kind].find((i) => i.id === id);
      setUnitName(next ? (defaultUnit(next.conversions, "purchase")?.unit ?? "") : "");
    }
    go("amount");
  };

  const setPack = (nextPacks: string, nextPerPack: string) => {
    setPacks(nextPacks);
    setPerPack(nextPerPack);
    const total = packTotal(nextPacks, nextPerPack);
    if (total != null) setQuantity(String(total));
  };

  const whenOk = date !== "" && date <= today && (!countedThatDay || timing != null);
  const extrasOk = costParsed.ok;

  const record = () => {
    setError(null);
    const done = { name: item?.name ?? "", quantity, unit: unitLabel };
    startTransition(async () => {
      const result = await recordDelivery({
        kind,
        itemId,
        quantity,
        unit: unitName,
        date,
        timing: countedThatDay ? timing : null,
        supplierId,
        cost,
        note,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(d.saved(done.name, formatQuantity(Number(done.quantity)), done.unit));
      // The next item of the same delivery: day and supplier stay.
      setItemId("");
      setSearch("");
      setUnitName("");
      setQuantity("");
      setInPacks(false);
      setPacks("");
      setPerPack("");
      setTiming(null);
      setCost("");
      setNote("");
      go("done");
    });
  };

  const counted = COUNTED.indexOf(step);
  const filtered = items[kind].filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()));

  const when = earlier ? s.confirm.on(formatDate(date, locale)) : s.confirm.today;

  return (
    <div className="flex flex-col gap-4">
      {counted >= 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground" aria-live="polite">
            {s.stepOf(counted + 1, COUNTED.length)}
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={COUNTED.length}
            aria-valuenow={counted + 1}
            aria-label={s.stepOf(counted + 1, COUNTED.length)}
            className="h-1.5 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full bg-primary" style={{ width: `${((counted + 1) / COUNTED.length) * 100}%` }} />
          </div>
        </div>
      )}

      {step === "kind" && (
        <Screen title={s.kind.title}>
          <div className="grid grid-cols-1 gap-3">
            {(["medication", "diet"] as const).map((k) => (
              <BigButton
                key={k}
                primary={k === kind}
                onClick={() => chooseKind(k)}
                icon={k === "medication" ? <Pill aria-hidden="true" className="h-6 w-6" /> : <Wheat aria-hidden="true" className="h-6 w-6" />}
              >
                {s.kind[k]}
              </BigButton>
            ))}
          </div>
        </Screen>
      )}

      {step === "item" && (
        <Screen title={s.item.title(kindWord)}>
          {items[kind].length === 0 ? (
            <p className="rounded border border-border bg-surface p-4 text-base text-foreground">{s.item.empty(kindWord)}</p>
          ) : (
            <>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={s.item.search}
                aria-label={s.item.search}
                autoComplete="off"
                className={inputClass}
              />
              {filtered.length === 0 ? (
                <p className="text-sm text-muted">{s.item.none}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => chooseItem(i.id)}
                        aria-pressed={i.id === itemId}
                        className={`flex min-h-14 w-full items-center gap-3 rounded border px-3 py-2 text-left text-base ${
                          i.id === itemId
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface text-foreground"
                        }`}
                      >
                        {kind === "medication" && i.labelFileId && (
                          <MedicationLabelThumb fileId={i.labelFileId} alt={t.management.medications.label.alt(i.name)} size={48} />
                        )}
                        <span className="min-w-0 break-words font-medium">{i.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <BackButton onClick={() => go("kind")} />
        </Screen>
      )}

      {step === "amount" && item && (
        <Screen title={s.amount.title}>
          <div className="flex items-center gap-3">
            {kind === "medication" && item.labelFileId && (
              <MedicationLabelThumb fileId={item.labelFileId} alt={t.management.medications.label.alt(item.name)} size={96} />
            )}
            <p className="min-w-0 break-words text-lg font-semibold text-foreground">{item.name}</p>
          </div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (quantityOk) go("when");
            }}
          >
            {item.conversions.length > 0 && (
              <label className="flex flex-col gap-1 text-sm font-medium text-muted">
                {s.amount.unit}
                <select value={unitName} onChange={(e) => setUnitName(e.target.value)} className={inputClass}>
                  <option value="">{item.unit}</option>
                  {item.conversions.map((c) => (
                    <option key={c.id} value={c.unit}>
                      {c.unit}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm font-medium text-muted">
              {s.amount.label(unitLabel)}
              <input
                ref={amountInput}
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setPacks("");
                  setPerPack("");
                }}
                aria-invalid={(quantity !== "" && !quantityOk) || undefined}
                className={`${inputClass} text-center text-2xl ${quantity !== "" && !quantityOk ? "border-danger" : ""}`}
              />
            </label>
            {quantity !== "" && !quantityOk && <p className="text-sm text-danger">{s.amount.invalid}</p>}
            {preview?.ok && (
              <p className="text-sm text-muted">
                {s.amount.equals(formatQuantity(preview.base), item.unit)} · {t.units.entry.approx}
              </p>
            )}

            <label className="flex min-h-12 items-center gap-3 text-base text-foreground">
              <input
                type="checkbox"
                checked={inPacks}
                onChange={(e) => setInPacks(e.target.checked)}
                className="h-5 w-5 shrink-0"
              />
              {s.amount.packsToggle}
            </label>
            {inPacks && (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-muted">
                  {s.amount.packsCount}
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={packs}
                    onChange={(e) => setPack(e.target.value, perPack)}
                    className={`${inputClass} text-center text-xl`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-muted">
                  {s.amount.perPack(unitLabel)}
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={perPack}
                    onChange={(e) => setPack(packs, e.target.value)}
                    className={`${inputClass} text-center text-xl`}
                  />
                </label>
                {packTotal(packs, perPack) != null && (
                  <p className="col-span-2 text-sm text-muted">
                    {s.amount.packsTotal(formatQuantity(packTotal(packs, perPack) ?? 0), unitLabel)}
                  </p>
                )}
              </div>
            )}
            <BigButton primary disabled={!quantityOk} onClick={() => go("when")} icon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}>
              {s.next}
            </BigButton>
          </form>
          <BackButton onClick={() => go("item")} />
        </Screen>
      )}

      {step === "when" && (
        <Screen title={s.when.title}>
          <div className="grid grid-cols-2 gap-2">
            <BigButton
              primary={!earlier}
              onClick={() => {
                setEarlier(false);
                setTiming(null);
              }}
            >
              {s.when.today}
            </BigButton>
            <BigButton primary={earlier} onClick={() => setEarlier(true)}>
              {s.when.earlier}
            </BigButton>
          </div>
          {earlier && (
            <label className="flex flex-col gap-1 text-sm font-medium text-muted">
              {s.when.pick}
              <input
                type="date"
                max={today}
                value={earlierDate}
                onChange={(e) => {
                  setEarlierDate(e.target.value);
                  setTiming(null);
                }}
                className={inputClass}
              />
            </label>
          )}
          {countedThatDay && (
            <div className="flex flex-col gap-2 rounded border border-warning/40 bg-warning/10 p-4">
              <p className="text-base font-medium text-foreground">{s.when.timing}</p>
              <BigButton primary={timing === "before"} onClick={() => setTiming("before")}>
                {s.when.before}
              </BigButton>
              <BigButton primary={timing === "after"} onClick={() => setTiming("after")}>
                {s.when.after}
              </BigButton>
            </div>
          )}
          <BigButton primary disabled={!whenOk} onClick={() => go("extras")} icon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}>
            {s.next}
          </BigButton>
          <BackButton onClick={() => go("amount")} />
        </Screen>
      )}

      {step === "extras" && (
        <Screen title={s.extras.title}>
          <p className="text-sm text-muted">{s.extras.optional}</p>
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {s.extras.supplier}
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass}>
              <option value="">{suppliers.length ? d.form.supplierNone : d.form.supplierNoVendors}</option>
              {suppliers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {s.extras.cost}
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              aria-invalid={!extrasOk || undefined}
              className={`${inputClass} ${extrasOk ? "" : "border-danger"}`}
            />
            <span className="text-xs font-normal">{extrasOk ? s.extras.costHint : d.errors.costInvalid}</span>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {s.extras.note}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={s.extras.notePlaceholder}
              className={inputClass}
            />
          </label>
          <BigButton primary disabled={!extrasOk} onClick={() => go("confirm")} icon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}>
            {s.next}
          </BigButton>
          <BackButton onClick={() => go("when")} />
        </Screen>
      )}

      {step === "confirm" && item && (
        <Screen title={s.confirm.title}>
          <div className="flex flex-col gap-2 rounded border border-border bg-surface p-4 text-base text-foreground">
            <p className="font-medium">
              {s.confirm.will(formatQuantity(Number(quantity)), unitLabel, item.name, when)}
            </p>
            {preview?.ok && (
              <p className="text-sm text-muted">
                {s.amount.equals(formatQuantity(preview.base), item.unit)} · {t.units.entry.approx}
              </p>
            )}
            {countedThatDay && timing && <p>{s.confirm[timing]}</p>}
            {supplier && <p>{s.confirm.from(supplier.name)}</p>}
            {costParsed.ok && costParsed.value != null && (
              <p>
                {costParsed.value === 0 ? s.confirm.donated : s.confirm.cost(formatBahtPrice(costParsed.value, locale))}
              </p>
            )}
            {note.trim() && <p className="text-sm text-muted">{note.trim()}</p>}
            <p className="text-sm text-muted">{s.confirm.notACount}</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <BigButton
            primary
            disabled={pending}
            onClick={record}
            icon={<Check aria-hidden="true" className="h-5 w-5" />}
          >
            {pending ? t.common.saving : s.confirm.record}
          </BigButton>
          <BackButton onClick={() => go("extras")} disabled={pending} />
        </Screen>
      )}

      {step === "done" && (
        <Screen title={s.done.title}>
          {saved && (
            <p role="status" className="rounded border border-success/40 bg-success/10 p-4 text-base text-foreground">
              {saved}
            </p>
          )}
          <BigButton primary onClick={() => go("kind")} icon={<Plus aria-hidden="true" className="h-5 w-5" />}>
            {s.done.another}
          </BigButton>
          <p className="text-sm text-muted">{s.done.anotherHint}</p>
          <Link
            href="/home"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded border border-border bg-surface px-3 text-base font-medium text-foreground"
          >
            <House aria-hidden="true" className="h-5 w-5" />
            {s.done.home}
          </Link>
        </Screen>
      )}
    </div>
  );
}

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 card-in-next">
      <h2 className="flex items-center gap-2 break-words text-xl font-semibold text-foreground">
        <Truck aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function BackButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <BigButton onClick={onClick} disabled={disabled} icon={<ArrowLeft aria-hidden="true" className="h-5 w-5" />}>
      {t.deliveries.steps.back}
    </BigButton>
  );
}

function BigButton({
  children,
  icon,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded border px-3 text-base font-medium disabled:opacity-40 ${
        primary ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
