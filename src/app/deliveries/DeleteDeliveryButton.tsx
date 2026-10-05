"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { useState, useTransition } from "react";
import { RowActionButton } from "@/components/RowAction";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { deleteDelivery } from "./actions";

/** A delivery typed wrong is deleted and recorded again. */
export function DeleteDeliveryButton({ id, label }: { id: string; label: string }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const d = t.deliveries;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <RowActionButton
        icon={ACTION_ICONS.delete}
        tone="danger"
        label={pending ? d.recent.deleting : t.common.delete}
        subject={label}
        disabled={pending}
        onClick={async () => {
          if (!await confirm({ body: d.recent.deleteConfirm(label), confirmLabel: t.common.delete })) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteDelivery(id);
            if (!result.ok) setError(result.error);
          });
        }}
      />
      {error && <p className="max-w-64 text-xs text-danger">{error}</p>}
    </div>
  );
}
