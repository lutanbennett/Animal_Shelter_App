"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendToHospital } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import type { CurrentLocation } from "../move/MoveResidentForm";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const textareaClass = `${inputClass} field-sizing-content`;

export function SendToHospitalForm({
  residentId,
  current,
  defaultDate,
  defaultNotes,
  today,
}: {
  residentId: string;
  current: CurrentLocation;
  /** YYYY-MM-DD; the vet visit date when reached from a visit record. */
  defaultDate: string;
  defaultNotes: string;
  /** YYYY-MM-DD, server-computed so the max attribute matches the server's check. */
  today: string;
}) {
  const { t, locale } = useI18n();
  const h = t.residents.hospital;
  const [state, formAction, pending] = useActionState(
    sendToHospital.bind(null, residentId),
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-1 text-sm font-medium text-muted">
          {t.residents.move.currentLocation}
        </h2>
        <p className="text-base font-semibold text-foreground">
          {[current.enclosureName, current.zoneName].filter(Boolean).join(" · ") ||
            t.common.dash}
        </p>
        {current.since && (
          <p className="text-xs text-muted">
            {t.residents.hub.since(formatDate(current.since, locale))}
          </p>
        )}
        <p className="mt-2 text-xs text-muted">{h.returnHint}</p>
      </div>

      <fieldset className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="date" className="text-sm font-medium text-muted">
              {h.fields.date} <span className="text-danger">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              max={today}
              defaultValue={defaultDate}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-muted">
            {h.fields.notes}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={defaultNotes}
            placeholder={h.fields.notesPlaceholder}
            className={textareaClass}
          />
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? h.sending : h.sendButton}
        </button>
        <Link
          href={`/residents/${residentId}`}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
