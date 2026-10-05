"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { archiveContact, restoreContact } from "@/app/management/contacts/actions";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isArchived } from "@/lib/contacts/contacts";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

/**
 * Archive (with an optional reason) or Restore, for the management table
 * row and the contact's own page. Archive opens a small inline form rather
 * than a browser prompt so the reason can be typed in Thai on a phone and
 * the explanation sits next to it.
 *
 * `residentsInCare` mirrors the server's refusal (a resident living with the
 * carer now): the button is disabled, and the note under it links each of
 * those residents' Return to shelter form, so the way forward is one tap
 * away. The return keeps its own form because it needs a date and an
 * enclosure; archiving can't answer those for it.
 */
export function ArchiveContactControl({
  contact,
  residentsInCare = [],
  iconOnly = false,
}: {
  contact: { id: string; name: string; archived_at: string | null };
  residentsInCare?: { id: string; name: string }[];
  /** A table row: Archive / Restore as icon buttons named for the contact. */
  iconOnly?: boolean;
}) {
  const { t } = useI18n();
  const a = t.contacts.archive;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const archived = isArchived(contact);
  const blocker =
    residentsInCare.length > 0 ? a.errors.hasResidentsInCare(residentsInCare.length) : null;

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setReason("");
    });
  }

  const buttonClass =
    "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col items-start gap-2">
      {archived ? (
        iconOnly ? (
          <RowActionButton
            disabled={isPending}
            onClick={() => run(() => restoreContact(contact.id))}
            label={a.restore}
            subject={contact.name}
            icon={ACTION_ICONS.restore}
          />
        ) : (
          <ActionButton
            icon={ACTION_ICONS.restore}
            disabled={isPending}
            onClick={() => run(() => restoreContact(contact.id))}
          >
            {a.restore}
          </ActionButton>
        )
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
      ) : iconOnly ? (
        <RowActionButton
          disabled={isPending || Boolean(blocker)}
          onClick={() => setOpen(true)}
          label={a.archive}
          hint={blocker ?? undefined}
          subject={contact.name}
          icon={ACTION_ICONS.archive}
        />
      ) : (
        <ActionButton
          icon={ACTION_ICONS.archive}
          disabled={isPending || Boolean(blocker)}
          title={blocker ?? undefined}
          onClick={() => setOpen(true)}
        >
          {a.archive}
        </ActionButton>
      )}
      {!archived && blocker && (
        <div className="flex max-w-64 flex-col gap-1 text-xs text-muted">
          <p>{blocker}</p>
          <ul className="flex flex-col gap-0.5">
            {residentsInCare.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/residents/${r.id}/rehome/return`}
                  className="font-medium text-primary hover:underline"
                >
                  {a.returnResident(r.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="max-w-56 text-xs text-danger">{error}</p>}
    </div>
  );
}
