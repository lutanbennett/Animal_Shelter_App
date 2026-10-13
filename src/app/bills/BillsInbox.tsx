"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { deleteCard, matchBill, matchBillToJob, saveCard, type SuggestionKind } from "./actions";
import { DateInput } from "@/components/DateInput";

export type BillCard = {
  id: string;
  /** YYYY-MM-DD the photo was added; suggestions nearest this day come first. */
  day: string;
  addedBy: string;
  amount: string;
  date: string;
  note: string;
  photos: { id: string; url: string; name: string; isPdf: boolean }[];
};

export type BillSuggestion = {
  kind: SuggestionKind;
  id: string;
  day: string;
  title: string;
  detail: string;
};

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const dayNumber = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);

/** How many likely matches one card offers: enough to tap one, not a list to search. */
const SHOWN = 4;

export function BillsInbox({
  cards,
  suggestions,
  canDeliver,
}: {
  cards: BillCard[];
  suggestions: BillSuggestion[];
  canDeliver: boolean;
}) {
  const { t } = useI18n();
  const b = t.bills.page;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState<{ name: string; error: string }[]>([]);
  const busy = progress != null;

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
        <ul className="flex flex-col gap-4">
          {cards.map((card) => (
            <CardView key={card.id} card={card} suggestions={suggestions} canDeliver={canDeliver} />
          ))}
        </ul>
      )}
      {cards.length > 0 && <p className="text-xs text-muted">{b.keep}</p>}
    </div>
  );
}

function CardView({
  card,
  suggestions,
  canDeliver,
}: {
  card: BillCard;
  suggestions: BillSuggestion[];
  canDeliver: boolean;
}) {
  const { t, locale } = useI18n();
  const b = t.bills.page;
  const router = useRouter();
  const [amount, setAmount] = useState(card.amount);
  const [date, setDate] = useState(card.date);
  const [note, setNote] = useState(card.note);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const pageInput = useRef<HTMLInputElement>(null);

  const details = { amount, date, note };
  const nearest = [...suggestions]
    .sort((x, y) => Math.abs(dayNumber(x.day) - dayNumber(card.day)) - Math.abs(dayNumber(y.day) - dayNumber(card.day)))
    .slice(0, SHOWN);

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
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs text-muted">
          {card.addedBy} · {b.pages(card.photos.length)}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {card.photos.map((p) => (
          <li key={p.id} className="overflow-hidden rounded border border-border bg-surface-hover">
            <a href={p.url} target="_blank" rel="noreferrer" className="block">
              {p.isPdf ? (
                <span className="flex aspect-[3/4] flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                  <FileText aria-hidden="true" className="h-8 w-8" />
                  <span className="line-clamp-2 break-all">{p.name}</span>
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={t.bills.photo.alt} className="aspect-[3/4] w-full object-cover" />
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
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium text-muted">
          {b.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{b.forWhat}</p>
        {nearest.length === 0 ? (
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
                      run(
                        () =>
                          s.kind === "maintenance_job"
                            ? matchBillToJob(card.id, s.id, details)
                            : matchBill(card.id, s.kind, s.id, details),
                        b.matchDone,
                      )
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
        <ActionButton icon={ACTION_ICONS.save} disabled={pending} onClick={() => run(() => saveCard(card.id, details), b.saved)}>
          {b.save}
        </ActionButton>
        <ActionButton
          variant="danger"
          icon={ACTION_ICONS.delete}
          disabled={pending}
          onClick={() => {
            if (window.confirm(b.deleteConfirm)) run(() => deleteCard(card.id), b.deleted);
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
    </li>
  );
}
