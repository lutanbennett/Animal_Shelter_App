"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { deleteAdoptionUpdate } from "./actions";

/** Edit and Delete on one update; the confirm says how many photos go with it. */
export function AdoptionUpdateActions({
  residentId,
  updateId,
  photoCount,
}: {
  residentId: string;
  updateId: string;
  photoCount: number;
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
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="rounded bg-danger px-2 py-1 text-xs font-medium text-danger-foreground hover:brightness-110 disabled:opacity-60"
          >
            {pending ? a.deleting : a.confirmDelete}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
          >
            {t.common.cancel}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href={`/residents/${residentId}/adoption-updates/${updateId}/edit`}
            className="text-xs font-medium text-primary hover:underline"
          >
            {a.editOrAddPhotos}
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-medium text-danger hover:underline"
          >
            {t.common.delete}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
