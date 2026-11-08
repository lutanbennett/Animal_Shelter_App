"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { archiveSupplier, restoreSupplier } from "@/app/management/suppliers/actions";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

/**
 * Archive (with an optional reason) or Restore a supplier, for the management table row and the supplier's own page. The
 * shape of ArchiveContactControl, with the supplier's words. Both server actions ask suppliers.directory at edit, so the
 * caller draws this only when the login holds it. There is no delete: a supplier is archived.
 */
export function ArchiveSupplierControl({
  supplier,
  iconOnly = false,
}: {
  supplier: { id: string; name: string; archived_at: string | null };
  /** A table row: Archive / Restore as icon buttons named for the supplier. */
  iconOnly?: boolean;
}) {
  const { t } = useI18n();
  const a = t.contacts.archive;
  const s = t.management.suppliers.archive;
  const [open, setOpen] = useState(false);
  // One per action: a request id kept from an unknown save must never reach another action.
  const archiveCall = useWriteCall();
  const restoreCall = useWriteCall();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const archived = supplier.archived_at !== null;

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

  const restore = () => run(() => restoreCall((requestId) => restoreSupplier(supplier.id, requestId)));

  return (
    <div className="flex flex-col items-start gap-2">
      {archived ? (
        iconOnly ? (
          <RowActionButton disabled={isPending} onClick={restore} label={a.restore} subject={supplier.name} icon={ACTION_ICONS.restore} />
        ) : (
          <ActionButton icon={ACTION_ICONS.restore} disabled={isPending} onClick={restore}>
            {a.restore}
          </ActionButton>
        )
      ) : open ? (
        <form
          className="flex min-w-56 flex-col gap-2 rounded border border-border bg-surface p-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => archiveCall((requestId) => archiveSupplier(supplier.id, reason, requestId)));
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            {a.reasonLabel}
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={a.reasonPlaceholder} autoFocus className={inputClass} />
          </label>
          <p className="text-xs text-muted">{s.explain}</p>
          <div className="flex gap-2">
            <ActionButton type="submit" icon={ACTION_ICONS.archive} variant="primary" compact disabled={isPending}>
              {s.confirmArchive}
            </ActionButton>
            <ActionButton
              icon={X}
              compact
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                setReason("");
                setError(null);
              }}
            >
              {t.common.cancel}
            </ActionButton>
          </div>
        </form>
      ) : iconOnly ? (
        <RowActionButton disabled={isPending} onClick={() => setOpen(true)} label={a.archive} subject={supplier.name} icon={ACTION_ICONS.archive} />
      ) : (
        <ActionButton icon={ACTION_ICONS.archive} disabled={isPending} onClick={() => setOpen(true)}>
          {a.archive}
        </ActionButton>
      )}
      {error && <p className="max-w-64 text-xs text-danger">{error}</p>}
    </div>
  );
}
