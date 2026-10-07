"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton, RowActionLink } from "@/components/RowAction";
import { deleteAdoptionUpdate } from "./actions";

/** Edit and Delete on one update; the confirm says how many photos go with it. */
export function AdoptionUpdateActions({
  residentId,
  updateId,
  photoCount,
  subject,
}: {
  residentId: string;
  updateId: string;
  photoCount: number;
  /** Names the update for screen readers, e.g. its date. */
  subject?: string;
}) {
  const { t } = useI18n();
  const a = t.adoptionUpdates;
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAdoptionUpdate(residentId, updateId);
        if (!result.ok) setError(result.error);
      } catch (err) {
        console.error("Deleting adoption update failed:", err);
        setError(a.errors.deleteFailed);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-foreground">{a.deleteConfirm(photoCount)}</span>
          <ActionButton icon={ACTION_ICONS.delete} variant="danger" compact disabled={pending} onClick={handleDelete}>
            {pending ? a.deleting : a.confirmDelete}
          </ActionButton>
          <ActionButton icon={X} compact disabled={pending} onClick={() => setConfirming(false)}>
            {t.common.cancel}
          </ActionButton>
        </div>
      ) : (
        <div className="flex gap-2">
          <RowActionLink
            href={`/residents/${residentId}/adoption-updates/${updateId}/edit`}
            label={a.editOrAddPhotos}
            subject={subject}
            icon={ACTION_ICONS.edit}
          />
          <RowActionButton
            onClick={() => setConfirming(true)}
            label={t.common.delete}
            subject={subject}
            tone="danger"
            icon={ACTION_ICONS.delete}
          />
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
