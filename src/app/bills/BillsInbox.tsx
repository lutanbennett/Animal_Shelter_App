"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { useWriteCall } from "@/lib/use-write-form";
import { fileCardAsUtilityBill } from "./utilities/actions";
import { monthInputValue } from "@/lib/bills/utility";
import { deleteCard, matchBill, matchBillToJob, recordGeneralBill, saveCard, type SuggestionKind } from "./actions";
import type { KindRoute } from "@/lib/bills/kinds";
import { DateInput } from "@/components/DateInput";

export type BillCard = {
  id: string;
  /** YYYY-MM-DD the photo was added; suggestions nearest this day come first. */
  day: string;
  addedBy: string;
  amount: string;
  date: string;
  note: string;
  kindId: string;
  premisesId: string;
  accountId: string;
  photos: { id: string; url: string; name: string; isPdf: boolean }[];
};

export type BillSuggestion = {
  kind: SuggestionKind;
  id: string;
  day: string;
  title: string;
  detail: string;
};

/** A kind the login may choose, with what its form asks for (lib/bills/kinds.ts). Every field a kind implies is optional. */
export type KindOption = { id: string; label: string; parentId: string | null; offered: boolean; route: KindRoute; premises: boolean; account: boolean };
export type PlaceOption = { id: string; name: string };
export type AccountOption = { id: string; label: string; premisesId: string | null; kindId: string | null };

/** The match a card's chosen route is shown; a utility or general bill is matched to nothing. */
const ROUTE_SUGGESTION: Partial<Record<KindRoute, SuggestionKind>> = { visit: "clinic_visit", delivery: "stock_receipt", job: "maintenance_job" };

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const dayNumber = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);

/** How many likely matches one card offers: enough to tap one, not a list to search. */
const SHOWN = 4;

export function BillsInbox({
  cards,
  suggestions,
  canDeliver,
  kinds,
  places,
  accounts,
}: {
  cards: BillCard[];
  suggestions: BillSuggestion[];
  canDeliver: boolean;
  kinds: KindOption[];
  places: PlaceOption[];
  accounts: AccountOption[];
}) {
  const { t } = useI18n();
  const b = t.bills.page;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState<{ name: string; error: string }[]>([]);
  const busy = progress != null;
  const [openId, setOpenId] = useState<string | null>(null);
  // A bill that is filed leaves the list on refresh, which closes its dialog (openCard is then undefined).
  const openCard = cards.find((c) => c.id === openId);
  useEffect(() => {
    if (!openCard) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openCard]);

  // Each picked photo becomes its own card, one after another (the Drive folder lookup is not safe in parallel).
  // A photo that fails is listed; the others are already cards and stay.
  const addBills = async (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    if (files.length === 0) return;
    setFailed([]);
    const errors: { name: string; error: string }[] = [];
    for (const [i, file] of files.entries()) {
      setProgress({ done: i, total: files.length });
      const result = await uploadAttachmentFile(t, "/api/bills/new", file, () => {});
      if (result.error) errors.push({ name: file.name, error: result.error });
    }
    setProgress(null);
    setFailed(errors);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-base font-medium text-foreground" aria-live="polite">
          {b.waiting(cards.length)}
        </p>
        <div>
          <ActionButton variant="primary" icon={ACTION_ICONS.uploadImage} disabled={busy} onClick={() => inputRef.current?.click()}>
            {progress ? b.uploading(progress.done, progress.total) : b.addBills}
          </ActionButton>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => {
              void addBills(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-muted">{b.addHint}</p>
        {failed.length > 0 && (
          <div role="alert" className="text-sm text-danger">
            <p>{b.failedSome}</p>
            <ul className="list-disc pl-5">
              {failed.map((f) => (
                <li key={f.name}>{f.name}: {f.error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="rounded border border-border bg-surface p-4 text-sm text-muted">{b.none}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {cards.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => setOpenId(card.id)}
                aria-label={b.openBill(card.addedBy)}
                className="relative block w-full overflow-hidden rounded border border-border bg-surface-hover text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Thumb photo={card.photos[0]} alt={t.bills.photo.alt} />
                {card.photos.length > 1 && (
                  <span className="absolute right-1 top-1 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-medium text-background">
                    {card.photos.length}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {openCard && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-2 sm:p-6" onClick={() => setOpenId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={b.detailTitle}
            className="w-full max-w-2xl rounded-lg border border-border bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <CardView card={openCard} suggestions={suggestions} canDeliver={canDeliver} kinds={kinds} places={places} accounts={accounts} onClose={() => setOpenId(null)} />
          </div>
        </div>
      )}
      {cards.length > 0 && <p className="text-xs text-muted">{b.keep}</p>}
    </div>
  );
}

/** One tile: the bill's first page as a picture, or a document mark for a PDF (which has no picture to show). */
function Thumb({ photo, alt }: { photo: BillCard["photos"][number] | undefined; alt: string }) {
  if (!photo || photo.isPdf) {
    return (
      <span className="flex aspect-[3/4] flex-col items-center justify-center gap-1 p-1 text-center text-xs text-muted">
        <FileText aria-hidden="true" className="h-8 w-8" />
        {photo && <span className="line-clamp-2 break-all">{photo.name}</span>}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.url} alt={alt} loading="lazy" className="aspect-[3/4] w-full object-cover" />;
}

function CardView({
  card,
  suggestions,
  canDeliver,
  kinds,
  places,
  accounts,
  onClose,
}: {
  onClose: () => void;
  card: BillCard;
  suggestions: BillSuggestion[];
  canDeliver: boolean;
  kinds: KindOption[];
  places: PlaceOption[];
  accounts: AccountOption[];
}) {
  const { t, locale } = useI18n();
  const b = t.bills.page;
  const router = useRouter();
  const [amount, setAmount] = useState(card.amount);
  const [date, setDate] = useState(card.date);
  const [note, setNote] = useState(card.note);
  const [kindId, setKindId] = useState(card.kindId);
  const [premisesId, setPremisesId] = useState(card.premisesId);
  const [accountId, setAccountId] = useState(card.accountId);
  // The month a utility bill covers, a month input ("2026-10"); the action turns it into the first of that month.
  const [coversMonth, setCoversMonth] = useState(monthInputValue(card.date || card.day));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const pageInput = useRef<HTMLInputElement>(null);
  // One useWriteCall per action (use-write-form.ts): an id kept from an unknown Save must never reach Delete.
  const saveWrite = useWriteCall();
  const deleteWrite = useWriteCall();
  const matchWrite = useWriteCall();
  const matchJobWrite = useWriteCall();
  const generalWrite = useWriteCall();
  const utilityWrite = useWriteCall();

  const kind = kinds.find((k) => k.id === kindId);
  // The form the chosen kind implies: its place and account (both optional), and where the card is filed. No kind, Other, or a
  // kind the code does not know is the plain form, with the matching below exactly as it was.
  // One question first: the rest of the form appears once a type is chosen, or at once for a bill that already carries figures.
  const showDetails = kinds.length === 0 || !!kindId || !!(amount || date || note);
  const showPlace = !!kind?.premises;
  const showAccount = !!kind?.account;
  const details = {
    amount,
    date,
    note,
    kindId,
    premisesId: showPlace ? premisesId : "",
    accountId: showAccount ? accountId : "",
  };
  const accountChoices = accounts.filter(
    (a) =>
      (!premisesId || !a.premisesId || a.premisesId === premisesId) &&
      (!a.kindId || a.kindId === kindId || a.kindId === kind?.parentId || a.id === accountId),
  );
  const wanted = kind ? ROUTE_SUGGESTION[kind.route] : undefined;
  const shownSuggestions = kind ? suggestions.filter((x) => x.kind === wanted) : suggestions;
  const byNearness = [...shownSuggestions].sort(
    (x, y) => Math.abs(dayNumber(x.day) - dayNumber(card.day)) - Math.abs(dayNumber(y.day) - dayNumber(card.day)),
  );
  // The nearest of each kind first, so up to thirty recent jobs cannot push every delivery or visit off the card.
  const firstOfKind = byNearness.filter((x, i) => byNearness.findIndex((y) => y.kind === x.kind) === i);
  const nearest = [...firstOfKind, ...byNearness.filter((x) => !firstOfKind.includes(x))]
    .slice(0, SHOWN)
    .sort((x, y) => byNearness.indexOf(x) - byNearness.indexOf(y));

  const run = (work: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) =>
    startTransition(async () => {
      setMessage(null);
      const result = await work();
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setMessage({ ok: true, text: done });
      router.refresh();
    });

  const addPage = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setAdding(true);
    for (const file of Array.from(list)) {
      const result = await uploadAttachmentFile(t, `/api/bills/bill_inbox/${card.id}`, file, () => {});
      if (result.error) setMessage({ ok: false, text: result.error });
    }
    setAdding(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs text-muted">
          {card.addedBy} · {b.pages(card.photos.length)}
        </p>
        <ActionButton compact icon={ACTION_ICONS.back} onClick={onClose}>
          {b.close}
        </ActionButton>
      </div>

      <ul className="flex flex-col gap-2">
        {card.photos.map((p) => (
          <li key={p.id} className="overflow-hidden rounded border border-border bg-surface-hover">
            <a href={p.url} target="_blank" rel="noreferrer" className="block">
              {p.isPdf ? (
                <span className="flex flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted">
                  <FileText aria-hidden="true" className="h-12 w-12" />
                  <span className="break-all">{p.name}</span>
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={t.bills.photo.alt} className="max-h-[70vh] w-full object-contain" />
              )}
            </a>
          </li>
        ))}
      </ul>
      <div>
        <ActionButton compact icon={ACTION_ICONS.uploadImage} disabled={adding} onClick={() => pageInput.current?.click()}>
          {adding ? t.common.saving : b.addPage}
        </ActionButton>
        <input
          ref={pageInput}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            void addPage(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div>
  {kinds.length > 0 && (
    <label className="flex flex-col gap-1 text-base font-medium text-foreground">
      {b.kindLabel}
      <select
        value={kindId}
        onChange={(e) => {
          setKindId(e.target.value);
          setAccountId("");
        }}
        className={`${inputClass} w-full sm:w-72`}
      >
        <option value="">{b.kindNone}</option>
        {kinds
          .filter((k) => !k.parentId)
          .map((k) => {
            const children = kinds.filter((c) => c.parentId === k.id);
            return children.length === 0 ? (
              <option key={k.id} value={k.id} disabled={!k.offered}>
                {k.label}
              </option>
            ) : (
              <optgroup key={k.id} label={k.label}>
                <option value={k.id} disabled={!k.offered}>
                  {b.kindAnyOf(k.label)}
                </option>
                {children.map((c) => (
                  <option key={c.id} value={c.id} disabled={!c.offered}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
      </select>
    </label>
  )}
      </div>

      {showDetails && (
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {b.cost}
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} w-36`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {b.date}
          <DateInput value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-44`} />
        </label>
        {showPlace && (
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {b.placeLabel}
            <select
              value={premisesId}
              onChange={(e) => {
                setPremisesId(e.target.value);
                setAccountId("");
              }}
              className={`${inputClass} w-48`}
            >
              <option value="">{b.placeNone}</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {showAccount && (
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {b.accountLabel}
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`${inputClass} w-56`}>
              <option value="">{b.accountNone}</option>
              {accountChoices.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind?.route === "utility" && (
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {t.bills.utilities.covers}
            <input type="month" value={coversMonth} onChange={(e) => setCoversMonth(e.target.value)} className={`${inputClass} w-44`} />
          </label>
        )}
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium text-muted">
          {b.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
      </div>

      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{b.forWhat}</p>
        {kind?.route === "general" && (
          <div>
            <ActionButton
              variant="primary"
              icon={ACTION_ICONS.save}
              disabled={pending}
              onClick={() => run(() => generalWrite((id) => recordGeneralBill(card.id, details, id)), b.recorded)}
            >
              {b.recordBill}
            </ActionButton>
          </div>
        )}
        {kind?.route === "utility" && (
          <div>
            <ActionButton
              variant="primary"
              icon={ACTION_ICONS.save}
              disabled={pending}
              onClick={() => run(() => utilityWrite((id) => fileCardAsUtilityBill(card.id, { ...details, coversMonth }, id)), b.recorded)}
            >
              {t.bills.utilities.fileIt}
            </ActionButton>
          </div>
        )}
        {kind && !wanted ? null : nearest.length === 0 ? (
          <p className="text-xs text-muted">{b.noLikely}</p>
        ) : (
          <>
            <p className="text-xs text-muted">{b.likely}</p>
            <ul className="flex flex-col gap-2">
              {nearest.map((s) => (
                <li key={`${s.kind}-${s.id}`}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => {
                        if (s.kind === "maintenance_job") return matchJobWrite((id) => matchBillToJob(card.id, s.id, details, id));
                        const kind = s.kind;
                        return matchWrite((id) => matchBill(card.id, kind, s.id, details, id));
                      }, b.matchDone)
                    }
                    className="flex min-h-11 w-full flex-col items-start rounded border border-border px-3 py-2 text-left text-sm hover:bg-surface-hover disabled:opacity-50"
                  >
                    <span className="font-medium text-foreground">{s.title}</span>
                    <span className="text-xs text-muted">
                      {[formatDate(s.day, locale), s.detail].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {canDeliver && (
          <Link
            href={`/deliveries?fromBill=${card.id}${amount ? `&cost=${encodeURIComponent(amount)}` : ""}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
          >
            {b.newDelivery}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton icon={ACTION_ICONS.save} disabled={pending} onClick={() => run(() => saveWrite((id) => saveCard(card.id, details, id)), b.saved)}>
          {b.save}
        </ActionButton>
        <ActionButton
          variant="danger"
          icon={ACTION_ICONS.delete}
          disabled={pending}
          onClick={() => {
            if (window.confirm(b.deleteConfirm)) run(() => deleteWrite((id) => deleteCard(card.id, id)), b.deleted);
          }}
        >
          {b.deleteCard}
        </ActionButton>
      </div>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
