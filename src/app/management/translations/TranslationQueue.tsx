"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { TranslationPanel } from "@/components/TranslationPanel";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { OPEN_STATUSES } from "@/lib/translations/queries";
import { fieldKey, type TranslationQueueRow, type TranslationRow } from "@/lib/translations/types";

/**
 * The queue as a list of cards, one per field, each with the editor open
 * so a manager can work straight down the page. A card whose row is
 * approved leaves the list (unless approved rows were asked for) so the
 * count at the top is always "what's left".
 */
export function TranslationQueue({
  rows: initial,
  includeApproved,
}: {
  rows: TranslationQueueRow[];
  includeApproved: boolean;
}) {
  const { t } = useI18n();
  const [rows, setRows] = useState(initial);
  const tr = t.translations;

  const open = rows.filter((r) => OPEN_STATUSES.includes(r.status)).length;

  function onChange(saved: TranslationRow) {
    setRows((current) => {
      if (!includeApproved && saved.status === "approved") {
        return current.filter((r) => r.id !== saved.id);
      }
      return current.map((r) => (r.id === saved.id ? { ...r, ...saved } : r));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{tr.openCount(open)}</p>
        <Link
          href={includeApproved ? "/management/translations" : "/management/translations?all=1"}
          className="text-sm text-primary hover:underline"
        >
          {includeApproved ? tr.hideApproved : tr.showApproved}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted">
          {tr.queueEmpty}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-foreground">
                  {row.record_label ?? row.row_id}
                </span>
                <span className="text-xs text-muted">
                  {tr.fields[fieldKey(row.table_name, row.column_name)] ?? row.column_name}
                </span>
                {row.record_path && (
                  <Link
                    href={row.record_path}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {tr.openRecord}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </div>
              <TranslationPanel
                // Remount when the row changes under us (e.g. toggling `all`).
                key={`${row.id}:${row.updated_at}`}
                row={row}
                canManage
                showOriginal
                recordPath={row.record_path}
                defaultOpen={row.status !== "approved"}
                onChange={onChange}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
