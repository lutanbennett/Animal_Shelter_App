"use client";

import { useRef, useState } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { HeartCrack, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ActionLink } from "@/components/ActionLink";
import { recordDeath } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { CurrentLocation } from "../move/MoveResidentForm";
import { textareaClass } from "@/components/textareaClass";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function RecordDeathForm({
  residentId,
  displayName,
  current,
  today,
}: {
  residentId: string;
  displayName: string;
  current: CurrentLocation;
  /** YYYY-MM-DD, server-computed so the max attribute matches the server's check. */
  today: string;
}) {
  const { t, locale } = useI18n();
  const d = t.residents.deceased;
  const [state, submit, pending] = useKeptForm(
    recordDeath.bind(null, residentId),
    undefined,
  );
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Set once the confirmation has been accepted so the re-submit goes through.
  const confirmedRef = useRef(false);

  return (
    <>
      <form
        ref={formRef}
        onSubmit={(e) => {
          if (confirmedRef.current) {
            confirmedRef.current = false;
            submit(e);
            return;
          }
          // Nothing about this can be undone from the app, so it never
          // submits straight off the button.
          e.preventDefault();
          setConfirming(true);
        }}
        className="flex max-w-2xl flex-col gap-6"
      >
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
        </div>

        <fieldset className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="date" className="text-sm font-medium text-muted">
                {d.fields.date} <span className="text-danger">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                max={today}
                defaultValue={today}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="causeOfDeath"
                className="text-sm font-medium text-muted"
              >
                {d.fields.causeOfDeath}
              </label>
              <input
                id="causeOfDeath"
                name="causeOfDeath"
                type="text"
                placeholder={d.fields.causeOfDeathPlaceholder}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium text-muted">
              {t.common.notes}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder={d.fields.notesPlaceholder}
              className={textareaClass}
            />
          </div>
        </fieldset>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-medium text-muted">
            {d.whatHappens.title}
          </h2>
          <ul className="ml-4 list-disc text-sm text-muted">
            {d.whatHappens.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <div className="flex items-center gap-3">
          <ActionButton type="submit" icon={HeartCrack} variant="danger" disabled={pending}>
            {pending ? d.recording : d.recordButton}
          </ActionButton>
          <ActionLink
            href={`/residents/${residentId}`}
            label={t.common.cancel}
            icon={X}
            iconOnlyOnMobile={false}
          />
        </div>
      </form>

      <ConfirmDialog
        open={confirming}
        icon={HeartCrack}
        title={d.confirm.title(displayName)}
        body={d.confirm.body}
        consequences={d.whatHappens.items}
        confirmLabel={d.confirm.confirmButton}
        pendingLabel={d.recording}
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
