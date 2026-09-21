"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * The Edit link and optional "End today" button on a dated record row
 * (prescriptions, diets). `endToday` is a server action already bound to
 * the row; it is only passed for a current row whose course has started,
 * since ending a future-dated one today would fail the end-after-start
 * check — those get Edit alone. The action refreshes the page itself; an
 * error stays on the row.
 */
export function RecordRowActions({
  editHref,
  endToday,
  labels,
}: {
  editHref: string;
  endToday: (() => Promise<{ error: string } | undefined>) | null;
  labels: { endToday: string; ending: string };
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleEndToday() {
    if (!endToday) return;
    setError(null);
    startTransition(async () => {
      const result = await endToday();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <Link href={editHref} className="text-xs font-medium text-primary hover:underline">
          {t.common.edit}
        </Link>
        {endToday && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleEndToday}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isPending ? labels.ending : labels.endToday}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
