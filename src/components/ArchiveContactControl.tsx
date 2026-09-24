"use client";

import { useState, useTransition } from "react";
import { archiveContact, restoreContact } from "@/app/management/contacts/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isArchived } from "@/lib/contacts/contacts";

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

/**
 * Archive (with an optional reason) or Restore, for the management table
 * row and the contact's own page. Archive opens a small inline form rather
 * than a browser prompt so the reason can be typed in Thai on a phone and
 * the explanation sits next to it.
 *
 * `blocker` mirrors the server's refusal (a resident living with the carer
 * now) so the button explains itself instead of failing on click.
 */
export function ArchiveContactControl({
  contact,
  blocker,
}: {
  contact: { id: string; name: string; archived_at: string | null };
  blocker?: string | null;
}) {
  const { t } = useI18n();
  const a = t.contacts.archive;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const archived = isArchived(contact);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setOpen(false);
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.failedToSave);
      }
    });
  }

  const buttonClass =
    "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2">
      {archived ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => restoreContact(contact.id))}
          className={buttonClass}
        >
          {a.restore}
        </button>
      ) : open ? (
        <form
          className="flex min-w-56 flex-col gap-2 rounded border border-border bg-surface p-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => archiveContact(contact.id, reason));
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            {a.reasonLabel}
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={a.reasonPlaceholder}
              autoFocus
              className={inputClass}
            />
          </label>
          <p className="text-xs text-muted">{a.explain}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {a.confirmArchive}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                setReason("");
                setError(null);
              }}
              className={buttonClass}
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          disabled={isPending || Boolean(blocker)}
          title={blocker ?? undefined}
          onClick={() => setOpen(true)}
          className={buttonClass}
        >
          {a.archive}
        </button>
      )}
      {error && <p className="max-w-56 text-xs text-danger">{error}</p>}
    </div>
  );
}
