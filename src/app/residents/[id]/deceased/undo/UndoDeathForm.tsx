"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { undoDeath } from "../actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PLACEMENT_ICONS } from "@/components/hub-icons";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const textareaClass = `${inputClass} field-sizing-content`;

export function UndoDeathForm({
  residentId,
  displayName,
  death,
  returnTo,
}: {
  residentId: string;
  displayName: string;
  death: { date: string; causeOfDeath: string | null };
  /** The placement the death closed — enclosure, or carer if off-site. */
  returnTo: {
    enclosureName: string | null;
    zoneName: string | null;
    carerName: string | null;
  };
}) {
  const { t, locale } = useI18n();
  const u = t.residents.deceased.undo;
  const [state, formAction, pending] = useActionState(
    undoDeath.bind(null, residentId),
    undefined,
  );
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Set once the confirmation has been accepted so the re-submit goes through.
  const confirmedRef = useRef(false);

  const returnLabel =
    [returnTo.enclosureName, returnTo.zoneName].filter(Boolean).join(" · ") ||
    t.common.dash;

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(e) => {
          if (confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          // Reopening a closed record is as deliberate an act as closing
          // it, so it never submits straight off the button either.
          e.preventDefault();
          setConfirming(true);
        }}
        className="flex max-w-2xl flex-col gap-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-1 text-sm font-medium text-muted">{u.recordedAs}</h2>
            <p className="text-base font-semibold text-foreground">
              {t.residents.hub.passed(formatDate(death.date, locale))}
            </p>
            {death.causeOfDeath && (
              <p className="text-xs text-muted">
                {t.residents.deceased.banner.cause(death.causeOfDeath)}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-1 text-sm font-medium text-muted">{u.returnsTo}</h2>
            <p className="text-base font-semibold text-foreground">{returnLabel}</p>
            {returnTo.carerName && (
              <p className="text-xs text-muted">
                {t.residents.hub.carer(returnTo.carerName)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reason" className="text-sm font-medium text-muted">
            {u.fields.reason} <span className="text-danger">*</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            required
            placeholder={u.fields.reasonPlaceholder}
            className={textareaClass}
          />
          <p className="text-xs text-muted">{u.fields.reasonHint}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-medium text-muted">{u.whatHappens.title}</h2>
          <ul className="ml-4 list-disc text-sm text-muted">
            {u.whatHappens.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? u.undoing : u.undoButton}
          </button>
          <Link
            href={`/residents/${residentId}`}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t.common.cancel}
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={confirming}
        icon={PLACEMENT_ICONS.deceasedInError}
        title={u.confirm.title(displayName)}
        body={u.confirm.body}
        consequences={u.whatHappens.items}
        confirmLabel={u.confirm.confirmButton}
        pendingLabel={u.undoing}
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          confirmedRef.current = true;
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
