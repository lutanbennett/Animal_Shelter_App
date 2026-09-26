"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, ClipboardCheck, Search, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { readStock } from "@/lib/management/stock";
import {
  rowOutcome,
  summarise,
  isBigChange,
  type RowEntry,
  type SheetSummary,
  type StocktakeItem,
  type StocktakeKind,
} from "@/lib/management/stocktake";
import { saveStocktake } from "./actions";

type Items = Record<StocktakeKind, StocktakeItem[]>;
type Entries = Record<StocktakeKind, Record<string, RowEntry>>;

const KINDS: StocktakeKind[] = ["medication", "diet"];
const EMPTY: Entries = { medication: {}, diet: {} };

function countedDaysAgo(item: StocktakeItem): number {
  return (
    readStock(
      { stock_on_hand: item.lastCount, stock_counted_at: item.lastCountedAt, reorder_lead_days: null },
      0,
    ).countedDaysAgo ?? 0
  );
}

/**
 * The count sheet. Every row's entry lives here across both tabs, so a
 * count typed on Medications survives a look at Diets, and one Save sends
 * both in one record_stocktake() call. A blank row is left out of that
 * call — "not counted this time" — never sent as "clear it"
 * (src/lib/management/stocktake.ts).
 */
export function StocktakeSheet({
  items: initialItems,
  initialTab,
}: {
  items: Items;
  initialTab: StocktakeKind;
}) {
  const { t, locale } = useI18n();
  const s = t.stocktake;
  const [items, setItems] = useState(initialItems);
  const [entries, setEntries] = useState<Entries>(EMPTY);
  const [tab, setTab] = useState<StocktakeKind>(initialTab);
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const reviewButton = useRef<HTMLButtonElement>(null);

  const summary = useMemo(() => summarise(items, entries), [items, entries]);
  const dirty = summary.lines.length > 0 || summary.invalid.length > 0;

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q ? items[tab].filter((item) => item.name.toLocaleLowerCase().includes(q)) : items[tab];
  }, [items, tab, query]);

  // Leaving with unsaved counts: the browser's own prompt for a reload,
  // close or typed URL, and a confirm for the app's links, which navigate
  // without unloading. Captured at the document so it runs before Next's
  // <Link> handler, which skips a click whose default was prevented.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;
      if (!window.confirm(s.leaveWarning)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, s.leaveWarning]);

  const setEntry = useCallback((kind: StocktakeKind, id: string, entry: RowEntry) => {
    setMessage(null);
    setEntries((prev) => ({ ...prev, [kind]: { ...prev[kind], [id]: entry } }));
  }, []);

  /** Enter moves down the shelf: the next row shown, then the Save button. */
  function focusNext(id: string) {
    const index = visible.findIndex((item) => item.id === id);
    const next = visible[index + 1];
    if (next) {
      const el = inputs.current.get(`${tab}:${next.id}`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      reviewButton.current?.focus();
    }
  }

  function openReview() {
    setMessage(null);
    if (summary.invalid.length > 0) {
      const first = summary.invalid[0];
      setTab(first.kind);
      setQuery("");
      setMessage({ type: "error", text: s.fixFirst(summary.invalid.length) });
      requestAnimationFrame(() => inputs.current.get(`${first.kind}:${first.item.id}`)?.focus());
      return;
    }
    if (summary.lines.length === 0) {
      setMessage({ type: "error", text: s.errors.nothingToSave });
      return;
    }
    setReviewing(true);
  }

  function save() {
    const { medication, diet, lines } = summary;
    startTransition(async () => {
      const result = await saveStocktake(medication, diet);
      if (!result.ok) {
        setReviewing(false);
        setMessage({ type: "error", text: result.error });
        return;
      }
      // counted_at comes back from the function, so the sheet shows the new
      // counts without reading them back.
      const saved = new Map(lines.map((line) => [`${line.kind}:${line.item.id}`, line.outcome.count]));
      setItems((prev) => {
        const next = { ...prev };
        for (const kind of KINDS) {
          next[kind] = prev[kind].map((item) => {
            const count = saved.get(`${kind}:${item.id}`);
            return count == null ? item : { ...item, lastCount: count, lastCountedAt: result.countedAt };
          });
        }
        return next;
      });
      setEntries(EMPTY);
      setReviewing(false);
      setMessage({
        type: "success",
        text: s.saved(result.medicationUpdated + result.dietUpdated, formatDateTime(result.countedAt, locale)),
      });
    });
  }

  const tabCount = (kind: StocktakeKind) =>
    summary.lines.filter((line) => line.kind === kind).length;
  const confirmedCount = summary.lines.filter((line) => line.outcome.kind === "confirmed").length;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={s.title} className="grid grid-cols-2 gap-2 sm:flex">
        {KINDS.map((kind) => {
          const n = tabCount(kind);
          return (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={tab === kind}
              onClick={() => setTab(kind)}
              className={`min-h-12 rounded border px-4 text-sm font-medium ${
                tab === kind
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:bg-surface-hover"
              }`}
            >
              {s.tabs[kind]}
              {n > 0 && <span className="ml-2 rounded-full bg-background/30 px-2 py-0.5 text-xs">{n}</span>}
            </button>
          );
        })}
      </div>

      <label className="relative block">
        <span className="sr-only">{s.searchLabel}</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.searchPlaceholder}
          className="min-h-12 w-full rounded border border-border bg-background pl-9 pr-3 text-base text-foreground outline-none focus:border-primary"
        />
      </label>

      <p className="text-xs text-muted">{s.blankHint}</p>

      {items[tab].length === 0 ? (
        <p className="text-sm text-muted">{s.noItems[tab]}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">{s.noMatches(query.trim())}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item, index) => (
            <StocktakeRow
              key={item.id}
              item={item}
              entry={entries[tab][item.id]}
              last={index === visible.length - 1}
              inputRef={(el) => {
                const key = `${tab}:${item.id}`;
                if (el) inputs.current.set(key, el);
                else inputs.current.delete(key);
              }}
              onChange={(entry) => setEntry(tab, item.id, entry)}
              onEnter={() => focusNext(item.id)}
            />
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {summary.lines.length === 0
              ? s.footerNone
              : s.footer(summary.lines.length - confirmedCount, confirmedCount)}
          </p>
          <button
            ref={reviewButton}
            type="button"
            onClick={openReview}
            disabled={pending}
            className="inline-flex min-h-12 items-center gap-2 rounded bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
            {s.review}
          </button>
        </div>
      </div>

      <ReviewDialog
        open={reviewing}
        summary={summary}
        pending={pending}
        onCancel={() => setReviewing(false)}
        onConfirm={save}
      />
    </div>
  );
}

function StocktakeRow({
  item,
  entry,
  last,
  inputRef,
  onChange,
  onEnter,
}: {
  item: StocktakeItem;
  entry: RowEntry | undefined;
  last: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (entry: RowEntry) => void;
  onEnter: () => void;
}) {
  const { t } = useI18n();
  const s = t.stocktake;
  const outcome = rowOutcome(item, entry);
  const same = entry?.same ?? false;
  const neverCounted = item.lastCount == null;

  const lastLine = neverCounted
    ? s.notCounted
    : `${s.lastCount(formatQuantity(item.lastCount), item.unit)} · ${t.management.stock.countedAgo(
        countedDaysAgo(item),
      )}`;

  return (
    <li
      className={`flex flex-col gap-2 rounded border p-3 ${
        outcome.kind === "invalid"
          ? "border-danger"
          : outcome.kind === "untouched"
            ? "border-border bg-surface"
            : "border-primary/50 bg-primary/5"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-medium text-foreground">{item.name}</span>
        <span className="text-xs text-muted">{lastLine}</span>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          enterKeyHint={last ? "done" : "next"}
          autoComplete="off"
          value={same ? "" : (entry?.value ?? "")}
          onChange={(e) => onChange({ value: e.target.value, same: false })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
          placeholder={
            same && item.lastCount != null
              ? s.samePlaceholder(formatQuantity(item.lastCount), item.unit)
              : s.countPlaceholder(item.unit)
          }
          aria-label={s.countLabel(item.name, item.unit)}
          aria-invalid={outcome.kind === "invalid" || undefined}
          className={`min-h-12 min-w-0 flex-1 rounded border bg-background px-3 text-lg text-foreground outline-none focus:border-primary ${
            outcome.kind === "invalid" ? "border-danger" : "border-border"
          }`}
        />
        <button
          type="button"
          aria-pressed={same}
          disabled={neverCounted}
          title={neverCounted ? s.sameUnavailable : undefined}
          onClick={() => onChange({ value: "", same: !same })}
          className={`inline-flex min-h-12 shrink-0 items-center gap-1 rounded border px-3 text-sm font-medium disabled:opacity-40 ${
            same
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-foreground hover:bg-surface-hover"
          }`}
        >
          <Check aria-hidden="true" className={`h-4 w-4 ${same ? "" : "opacity-30"}`} />
          {s.same}
        </button>
      </div>
      {outcome.kind === "invalid" && <p className="text-xs text-danger">{s.invalid}</p>}
      {outcome.kind === "counted" && (
        <ChangeLine lastCount={item.lastCount} count={outcome.count} unit={item.unit} />
      )}
    </li>
  );
}

/** "12 → 10 tablets", with a big difference called out. */
function ChangeLine({ lastCount, count, unit }: { lastCount: number | null; count: number; unit: string }) {
  const { t } = useI18n();
  const s = t.stocktake;
  const big = isBigChange(lastCount, count);
  return (
    <p className={`flex flex-wrap items-center gap-2 text-sm ${big ? "text-foreground" : "text-muted"}`}>
      <span>
        {lastCount == null
          ? s.firstCount(formatQuantity(count), unit)
          : s.change(formatQuantity(lastCount), formatQuantity(count), unit)}
      </span>
      {big && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-foreground">
          <TriangleAlert aria-hidden="true" className="h-3 w-3" />
          {s.bigChange}
        </span>
      )}
    </p>
  );
}

function ReviewDialog({
  open,
  summary,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  summary: SheetSummary;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  const s = t.stocktake;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const bigCount = summary.lines.filter((line) => line.big).length;
  // Big differences first, so the ones worth a second look are not below
  // the fold on a phone.
  const lines = [...summary.lines].sort((a, b) => Number(b.big) - Number(a.big));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stocktake-review-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 rounded-t border border-border bg-surface p-4 shadow-xl sm:rounded"
      >
        <div>
          <h2 id="stocktake-review-title" className="text-lg font-semibold text-foreground">
            {s.reviewTitle}
          </h2>
          <p className="text-sm text-muted">{s.reviewBody(summary.lines.length)}</p>
          {bigCount > 0 && (
            <p className="mt-1 text-sm font-medium text-foreground">{s.reviewBig(bigCount)}</p>
          )}
        </div>

        <ul className="flex min-h-0 flex-col divide-y divide-border overflow-y-auto rounded border border-border">
          {lines.map((line) => (
            <li
              key={`${line.kind}:${line.item.id}`}
              className={`flex flex-col gap-0.5 px-3 py-2 text-sm ${line.big ? "bg-warning/15" : ""}`}
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-medium text-foreground">{line.item.name}</span>
                <span className="text-xs text-muted">{s.tabs[line.kind]}</span>
              </span>
              {line.outcome.kind === "confirmed" ? (
                <span className="text-muted">
                  {s.confirmedLine(formatQuantity(line.outcome.count), line.item.unit)}
                </span>
              ) : (
                <ChangeLine lastCount={line.item.lastCount} count={line.outcome.count} unit={line.item.unit} />
              )}
            </li>
          ))}
        </ul>

        {summary.untouched > 0 && <p className="text-xs text-muted">{s.reviewUntouched(summary.untouched)}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            autoFocus
            className="min-h-12 rounded border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            {s.back}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="min-h-12 rounded bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t.common.saving : s.save(summary.lines.length)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
