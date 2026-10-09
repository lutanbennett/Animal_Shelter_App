"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import { driveFileUrl } from "@/lib/google/drive-client";
import { RECEIPT_COUNTRIES, type ReceiptCountry } from "@/lib/donations/issuer";
import { issueReceipt, markReceiptSent, retryDriveFiling, voidReceipt } from "../actions";

export type ReceiptCardData = {
  id: string;
  number: string;
  country: ReceiptCountry;
  issuedOn: string;
  voided: { on: string; reason: string } | null;
  sentOn: string | null;
  driveFileId: string | null;
  fileName: string;
};

const button =
  "inline-flex min-h-11 items-center justify-center rounded border border-border px-4 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60";
const primary =
  "inline-flex min-h-11 items-center justify-center rounded bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60";

/**
 * One receipt and what can be done with it. Sending is the Director's own:
 * the app never emails a donor (the shelter's sending setup reaches only
 * verified addresses, and a receipt should come from her). On a phone, Share
 * hands the PDF to the share sheet (Web Share API with files); on a PC,
 * Download plus an email draft, with the PDF attached by hand because a
 * mailto: link cannot attach.
 */
export function ReceiptCard({
  receipt,
  donorName,
  donorEmail,
  notice,
}: {
  receipt: ReceiptCardData;
  donorName: string;
  donorEmail: string | null;
  notice: string | null;
}) {
  const { t } = useI18n();
  const d = t.donations.detail;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    notice === "issued"
      ? { kind: "ok", text: d.issued(receipt.number) }
      : notice === "notOnDrive"
        ? { kind: "error", text: d.issuedNotOnDrive(receipt.number) }
        : null,
  );
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");

  const pdfUrl = `/management/donations/receipts/${receipt.id}/pdf`;
  const live = !receipt.voided;

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, ok?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage({ kind: "error", text: result.error });
      else {
        if (ok) setMessage({ kind: "ok", text: ok });
        router.refresh();
      }
    });
  }

  async function share() {
    setMessage(null);
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], receipt.fileName, { type: "application/pdf" });
      if (!navigator.canShare?.({ files: [file] })) {
        setMessage({ kind: "error", text: d.shareFailed });
        return;
      }
      await navigator.share({ files: [file], title: receipt.number });
    } catch (error) {
      // Closing the share sheet is not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage({ kind: "error", text: d.shareFailed });
    }
  }

  const mailto =
    `mailto:${encodeURIComponent(donorEmail ?? "")}` +
    `?subject=${encodeURIComponent(d.emailSubject(receipt.number))}` +
    `&body=${encodeURIComponent(d.emailBody(donorName, receipt.number))}`;

  async function confirmVoid() {
    if (!reason.trim()) {
      setMessage({ kind: "error", text: t.donations.errors.voidReason });
      return;
    }
    if (!(await confirm({ body: d.voidConfirm(receipt.number), confirmLabel: d.void }))) return;
    setVoiding(false);
    run(() => voidReceipt(receipt.id, reason));
  }

  return (
    <article className={`flex flex-col gap-3 rounded border p-4 ${live ? "border-border bg-surface" : "border-danger/40 bg-danger/5"}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-base font-semibold text-foreground">{receipt.number}</span>
        <span className="text-sm text-muted">{t.donations.countries[receipt.country]}</span>
        <span className="text-sm text-muted">{d.issuedOn(receipt.issuedOn)}</span>
        {receipt.voided && <span className="rounded bg-danger/10 px-1.5 text-xs font-medium text-danger">{t.donations.status.void}</span>}
        {receipt.sentOn && <span className="rounded bg-success/10 px-1.5 text-xs text-success">{d.sentOn(receipt.sentOn)}</span>}
      </div>
      {receipt.voided && <p className="text-sm text-danger">{d.voidedOn(receipt.voided.on, receipt.voided.reason)}</p>}

      <div className="flex flex-wrap gap-2">
        <a href={pdfUrl} target="_blank" rel="noopener" className={button}>{d.view}</a>
        <a href={`${pdfUrl}?download=1`} className={button}>{d.download}</a>
        {live && (
          <>
            <button type="button" onClick={share} className={button} title={d.shareHint}>{d.share}</button>
            <a href={mailto} className={button} title={d.emailHint}>{d.email}</a>
          </>
        )}
      </div>
      {live && <p className="text-xs text-muted">{d.emailHint}</p>}

      <p className="text-sm">
        {receipt.driveFileId ? (
          <a href={driveFileUrl(receipt.driveFileId)} target="_blank" rel="noopener" className="text-primary underline">
            {d.driveSaved} · {d.driveOpen}
          </a>
        ) : (
          <span className="text-warning">{d.driveNotSaved}</span>
        )}
      </p>
      {!receipt.driveFileId && (
        <button type="button" disabled={pending} onClick={() => run(() => retryDriveFiling(receipt.id), d.driveSaved)} className={`${button} self-start`}>
          {d.driveRetry}
        </button>
      )}

      {live && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {!receipt.sentOn && (
            <button type="button" disabled={pending} onClick={() => run(() => markReceiptSent(receipt.id))} className={primary}>
              {d.markSent}
            </button>
          )}
          {!voiding && (
            <button type="button" onClick={() => setVoiding(true)} className={`${button} text-danger`}>
              {d.void}
            </button>
          )}
        </div>
      )}
      {live && voiding && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`void-${receipt.id}`} className="text-sm font-medium text-muted">{d.voidReason}</label>
          <input
            id={`void-${receipt.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={d.voidReasonPlaceholder}
            className="rounded border border-border bg-background px-3 py-2 text-base text-foreground sm:text-sm"
          />
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={confirmVoid} className={`${button} text-danger`}>{d.void}</button>
            <button type="button" onClick={() => setVoiding(false)} className={button}>{t.common.cancel}</button>
          </div>
        </div>
      )}

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
    </article>
  );
}

/** Issue a receipt for a gift with none live: the first, or a re-issue after a void. */
export function IssueReceipt({ donationId, defaultCountry, again }: { donationId: string; defaultCountry: ReceiptCountry; again: boolean }) {
  const { t } = useI18n();
  const d = t.donations.detail;
  const router = useRouter();
  const [country, setCountry] = useState<ReceiptCountry>(defaultCountry);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function issue() {
    setError(null);
    startTransition(async () => {
      const result = await issueReceipt(donationId, country);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(`/management/donations/${donationId}?receipt=${result.receiptId}&notice=${result.savedToDrive ? "issued" : "notOnDrive"}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-dashed border-border p-4">
      {again && <p className="text-sm text-muted">{d.issueAgainHint}</p>}
      <div className="flex flex-wrap gap-4">
        {RECEIPT_COUNTRIES.map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-2 text-sm text-foreground">
            <input type="radio" name="issue-country" value={c} checked={country === c} onChange={() => setCountry(c)} />
            {t.donations.countries[c]}
          </label>
        ))}
      </div>
      <button type="button" disabled={pending} onClick={issue} className={`${primary} self-start`}>
        {again ? d.issueAgain : d.issue}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
