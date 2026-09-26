"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { deleteDelivery } from "./actions";

/** A delivery typed wrong is deleted and recorded again. */
export function DeleteDeliveryButton({ id, label }: { id: string; label: string }) {
  const { t } = useI18n();
  const d = t.deliveries;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(d.recent.deleteConfirm(label))) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteDelivery(id);
            if (!result.ok) setError(result.error);
          });
        }}
        className="rounded border border-border px-3 py-1 text-xs font-medium text-danger hover:bg-surface-hover disabled:opacity-50"
      >
        {pending ? d.recent.deleting : t.common.delete}
      </button>
      {error && <p className="max-w-64 text-xs text-danger">{error}</p>}
    </div>
  );
}
