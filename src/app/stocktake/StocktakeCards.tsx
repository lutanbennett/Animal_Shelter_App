"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, ClipboardCheck, List, Pill, SkipForward } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { driveImageUrl } from "@/lib/google/drive-client";
import { formatQuantity } from "@/lib/diets/options";
import { readStock } from "@/lib/management/stock";
import { inUnit } from "@/lib/units";
import {
  cardsAdvance,
  cardsBack,
  cardsRevisit,
  cardsTotal,
  currentCardId,
  entryUnit,
  rowOutcome,
  type CardsState,
  type RowEntry,
  type StocktakeItem,
} from "@/lib/management/stocktake";

type Message = { type: "success" | "error"; text: string } | null;

function countedDaysAgo(item: StocktakeItem): number {
  return (
    readStock({ stock_on_hand: item.lastCount, stock_counted_at: item.lastCountedAt, reorder_lead_days: null }, 0)
      .countedDaysAgo ?? 0
  );
}

/**
 * The medication count on a phone, one card at a time. A controlled view of
 * the sheet's own state — `entries` and `cards` live in StocktakeSheet, so a
 * count typed here shows on the list and the other way round, and Review
 * and save is the sheet's, unchanged. Every move has a button; nothing here
 * needs a gesture.
 */
export function StocktakeCards({
  items,
  sequence,
  entries,
  cards,
  setCards,
  onEntry,
  onClearEntry,
  onReview,
  onList,
  message,
}: {
  items: StocktakeItem[];
  sequence: string[];
  entries: Record<string, RowEntry>;
  cards: CardsState;
  setCards: (next: CardsState) => void;
  onEntry: (id: string, entry: RowEntry) => void;
  onClearEntry: (id: string) => void;
  onReview: () => void;
  onList: () => void;
  message: Message;
}) {
  const { t } = useI18n();
  const s = t.stocktake;
  const c = s.cards;
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const byId = new Map(items.map((item) => [item.id, item]));
  const id = currentCardId(cards, sequence);
  const item = id ? byId.get(id) : undefined;
  const total = cardsTotal(cards, sequence);
  const counted = items.filter((it) => rowOutcome(it, entries[it.id]).kind !== "untouched").length;

  const go = (next: CardsState, dir: "next" | "prev") => {
    setDirection(dir);
    setCards(next);
  };

  const messageEl = message && (
    <p
      role={message.type === "error" ? "alert" : "status"}
      className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}
    >
      {message.text}
    </p>
  );

  if (!item) {
    const skippedCount = cards.skipped.length;
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onList}
          className="inline-flex min-h-12 items-center gap-2 self-start rounded px-2 text-sm font-medium text-primary"
        >
          <List aria-hidden="true" className="h-5 w-5" />
          {c.toList}
        </button>
        {messageEl}
        <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
          <h2 className="text-xl font-semibold text-foreground">
            {skippedCount > 0 ? c.skippedTitle(skippedCount) : c.endTitle}
          </h2>
          {skippedCount > 0 && <p className="text-sm text-muted">{c.skippedBody}</p>}
          <p className="text-sm text-muted">{c.endCounted(counted)}</p>
          {skippedCount > 0 && (
            <BigButton onClick={() => go(cardsRevisit(cards, sequence), "next")} primary icon={<SkipForward aria-hidden="true" className="h-5 w-5" />}>
              {c.countSkipped}
            </BigButton>
          )}
          <BigButton onClick={onReview} primary={skippedCount === 0} icon={<ClipboardCheck aria-hidden="true" className="h-5 w-5" />}>
            {s.review}
          </BigButton>
          {total > 0 && (
            <BigButton onClick={() => go(cardsBack(cards), "prev")} icon={<ArrowLeft aria-hidden="true" className="h-5 w-5" />}>
              {c.previous}
            </BigButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <CardView
      key={`${cards.queue ? "q" : "a"}:${item.id}`}
      item={item}
      entry={entries[item.id]}
      position={cards.pos}
      total={total}
      secondPass={cards.queue != null}
      direction={direction}
      onSave={(entry) => {
        onEntry(item.id, entry);
        go(cardsAdvance(cards, sequence, "counted"), "next");
      }}
      onSame={() => {
        onEntry(item.id, { value: "", same: true, unit: entries[item.id]?.unit });
        go(cardsAdvance(cards, sequence, "counted"), "next");
      }}
      onSkip={() => {
        onClearEntry(item.id);
        go(cardsAdvance(cards, sequence, "skip"), "next");
      }}
      onBack={() => go(cardsBack(cards), "prev")}
      onList={onList}
      message={messageEl}
    />
  );
}

function BigButton({
  children,
  icon,
  onClick,
  primary,
  disabled,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded border px-3 text-base font-medium disabled:opacity-40 ${
        primary ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function CardView({
  item,
  entry,
  position,
  total,
  secondPass,
  direction,
  onSave,
  onSame,
  onSkip,
  onBack,
  onList,
  message,
}: {
  item: StocktakeItem;
  entry: RowEntry | undefined;
  position: number;
  total: number;
  secondPass: boolean;
  direction: "next" | "prev";
  onSave: (entry: RowEntry) => void;
  onSame: () => void;
  onSkip: () => void;
  onBack: () => void;
  onList: () => void;
  message: React.ReactNode;
}) {
  const { t } = useI18n();
  const s = t.stocktake;
  const c = s.cards;
  const [value, setValue] = useState(entry && !entry.same ? entry.value : "");
  const [unitChoice, setUnitChoice] = useState<string | undefined>(entry?.unit);
  const input = useRef<HTMLInputElement>(null);

  // The keypad opens on arrival: the person taps a button, the next card
  // appears, and the number field is already waiting.
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  const draft: RowEntry = { value, same: false, unit: unitChoice };
  const outcome = rowOutcome(item, draft);
  const unit = entryUnit(item, draft);
  const conversions = item.conversions ?? [];
  const typedUnit = unit ? conversions.find((cv) => cv.unit === unit) : undefined;
  const shownUnit = typedUnit ? typedUnit.unit : item.unit;
  const lastInUnit = typedUnit && item.lastCount != null ? inUnit(item.lastCount, typedUnit) : null;
  const neverCounted = item.lastCount == null;
  const canSave = outcome.kind === "counted";
  const wasSame = entry?.same ?? false;

  const submit = () => {
    if (canSave) onSave(draft);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onList}
          className="inline-flex min-h-12 items-center gap-2 rounded px-2 text-sm font-medium text-primary"
        >
          <List aria-hidden="true" className="h-5 w-5" />
          {c.toList}
        </button>
        <p className="shrink-0 text-sm font-medium text-foreground" aria-live="polite">
          {c.progress(position + 1, total)}
        </p>
      </div>
      {secondPass && <p className="text-sm font-medium text-muted">{c.secondPass}</p>}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={position + 1}
        aria-label={c.progress(position + 1, total)}
        className="h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div className="h-full bg-primary" style={{ width: `${((position + 1) / Math.max(total, 1)) * 100}%` }} />
      </div>

      <div className={`flex flex-col gap-3 ${direction === "next" ? "card-in-next" : "card-in-prev"}`}>
        <div className="relative flex h-[24vh] max-h-60 min-h-32 w-full items-center justify-center overflow-hidden rounded border border-border bg-white">
          {item.labelFileId ? (
            <Image
              src={driveImageUrl(item.labelFileId, 400)}
              alt={t.management.medications.label.alt(item.name)}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              className="object-contain"
              priority
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <Pill aria-hidden="true" className="h-10 w-10 text-muted" />
              <span className="break-words text-xl font-semibold text-neutral-900">{item.name}</span>
              <span className="text-xs text-neutral-600">{c.noPhoto}</span>
            </div>
          )}
        </div>

        <div>
          <h2 className="break-words text-xl font-semibold text-foreground">{item.name}</h2>
          <p className="text-sm text-muted">
            {neverCounted
              ? s.notCounted
              : `${s.lastCount(formatQuantity(item.lastCount), item.unit)}${
                  lastInUnit ? ` (${t.units.onHand(formatQuantity(lastInUnit), typedUnit!.unit)})` : ""
                } · ${t.management.stock.countedAgo(countedDaysAgo(item))}`}
          </p>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex gap-2">
            {conversions.length > 0 && (
              <select
                aria-label={t.units.entry.unit}
                value={unit}
                onChange={(e) => setUnitChoice(e.target.value)}
                className="min-h-14 max-w-36 shrink-0 rounded border border-border bg-background px-2 text-base text-foreground"
              >
                <option value="">{item.unit}</option>
                {conversions.map((cv) => (
                  <option key={cv.id} value={cv.unit}>
                    {cv.unit}
                  </option>
                ))}
              </select>
            )}
            <input
              ref={input}
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                wasSame && item.lastCount != null
                  ? s.samePlaceholder(formatQuantity(item.lastCount), item.unit)
                  : s.countPlaceholder(shownUnit)
              }
              aria-label={s.countLabel(item.name, shownUnit)}
              aria-invalid={outcome.kind === "invalid" || undefined}
              className={`min-h-14 min-w-0 flex-1 rounded border bg-background px-3 text-center text-2xl text-foreground outline-none focus:border-primary ${
                outcome.kind === "invalid" ? "border-danger" : "border-border"
              }`}
            />
          </div>
          {outcome.kind === "invalid" && <p className="text-sm text-danger">{s.invalid}</p>}
          {outcome.kind === "counted" && outcome.typed && (
            <p className="text-sm text-muted">
              {t.units.entry.equals(formatQuantity(outcome.count), item.unit)} · {t.units.entry.approx}
            </p>
          )}
          {outcome.kind === "counted" && (
            <p className="text-sm text-muted">
              {item.lastCount == null
                ? s.firstCount(formatQuantity(outcome.count), item.unit)
                : s.change(formatQuantity(item.lastCount), formatQuantity(outcome.count), item.unit)}
            </p>
          )}
          {message}
          <BigButton onClick={submit} primary disabled={!canSave} icon={<Check aria-hidden="true" className="h-5 w-5" />}>
            {c.save}
          </BigButton>
        </form>

        <div className="grid grid-cols-2 gap-2">
          <BigButton
            onClick={onSame}
            disabled={neverCounted}
            title={neverCounted ? s.sameUnavailable : undefined}
            icon={<Check aria-hidden="true" className="h-5 w-5 shrink-0" />}
          >
            {c.same}
          </BigButton>
          <BigButton onClick={onSkip} icon={<SkipForward aria-hidden="true" className="h-5 w-5 shrink-0" />}>
            {c.skip}
          </BigButton>
        </div>
        {neverCounted && <p className="text-xs text-muted">{s.sameUnavailable}</p>}
        <BigButton onClick={onBack} disabled={position === 0} icon={<ArrowLeft aria-hidden="true" className="h-5 w-5" />}>
          {c.previous}
        </BigButton>
        <p className="text-xs text-muted">{c.kept}</p>
      </div>
    </div>
  );
}
