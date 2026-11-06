"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { addClosedRecordNote } from "@/app/residents/[id]/closed-note-actions";
import type { ClosedNoteKind } from "@/lib/closed-record/notes";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";

/**
 * "Add a note" on a row of a resident who has died: the one write 0320 permits on these rows. A note field, not an edit
 * form. The page draws it only where can(perms, <the table's activity>) says so (CLOSED_NOTE_KINDS).
 */
export function ClosedRecordNoteControl({
  kind,
  residentId,
  id,
  subject,
}: {
  kind: ClosedNoteKind;
  residentId: string;
  id: string;
  subject?: string;
}) {
  const { t } = useI18n();
  const c = t.closedRecordNote;
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const save = useWriteCall();

  if (!open) {
    return <RowActionButton onClick={() => setOpen(true)} label={c.add} subject={subject} icon={ACTION_ICONS.edit} />;
  }
  return (
    <form
      className="flex w-full max-w-md flex-col gap-2 rounded border border-border bg-surface p-2 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await save((rid) => addClosedRecordNote(kind, residentId, id, note, rid));
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          setNote("");
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {c.label}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          autoFocus
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <p className="text-xs text-muted">{c.explain}</p>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <ActionButton type="submit" icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending}>
          {c.save}
        </ActionButton>
        <ActionButton
          icon={X}
          compact
          disabled={isPending}
          onClick={() => {
            setOpen(false);
            setNote("");
            setError(null);
          }}
        >
          {t.common.cancel}
        </ActionButton>
      </div>
    </form>
  );
}
