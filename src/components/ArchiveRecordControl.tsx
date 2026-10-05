"use client";

import { useState, useTransition } from "react";
import { archiveMedicalRecord, restoreMedicalRecord } from "@/app/residents/[id]/archive-actions";
import type { MedicalArchiveKind } from "@/lib/medical-archive/kinds";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

/**
 * Archive (with an optional reason) or Restore on a weight reading,
 * prescription, vet visit or immunization record. The same inline reason
 * form as ArchiveContactControl, so staff who learned one learned both.
 * The page only renders this where can(perms, "medical.archive") says the person may.
 */
export function ArchiveRecordControl({
  kind,
  residentId,
  id,
  archived,
  subject,
}: {
  kind: MedicalArchiveKind;
  residentId: string;
  id: string;
  archived: boolean;
  /** Names the row for screen readers, e.g. "Panda's weight on 2 Oct". */
  subject?: string;
}) {
  const { t } = useI18n();
  const a = t.recordArchive;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => ReturnType<typeof archiveMedicalRecord>) {
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

  return (
    <div className="flex flex-col items-end gap-1">
      {archived ? (
        <RowActionButton
          disabled={isPending}
          onClick={() => run(() => restoreMedicalRecord(kind, residentId, id))}
          label={a.restore}
          subject={subject}
          icon={ACTION_ICONS.restore}
        />
      ) : open ? (
        <form
          className="flex min-w-56 flex-col gap-2 rounded border border-border bg-surface p-2 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => archiveMedicalRecord(kind, residentId, id, reason));
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
              className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <RowActionButton
          disabled={isPending}
          onClick={() => setOpen(true)}
          label={a.archive}
          subject={subject}
          icon={ACTION_ICONS.archive}
        />
      )}
      {error && <p className="max-w-56 text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
