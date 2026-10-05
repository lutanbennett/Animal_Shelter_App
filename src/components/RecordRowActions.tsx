"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton, RowActionLink } from "@/components/RowAction";

/**
 * The Edit and optional "End today" icon buttons on a dated record row
 * (prescriptions, diets); `subject` names the row for screen readers. `endToday` is a server action already bound to
 * the row; it is only passed for a current row whose course has started,
 * since ending a future-dated one today would fail the end-after-start
 * check — those get Edit alone. The action refreshes the page itself; an
 * error stays on the row.
 */
export function RecordRowActions({
  editHref,
  endToday,
  labels,
  subject,
}: {
  editHref: string;
  endToday: (() => Promise<{ error: string } | undefined>) | null;
  labels: { endToday: string; ending: string };
  subject?: string;
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
      <div className="flex items-center gap-2">
        <RowActionLink
          href={editHref}
          label={t.common.edit}
          subject={subject}
          icon={ACTION_ICONS.edit}
        />
        {endToday && (
          <RowActionButton
            disabled={isPending}
            onClick={handleEndToday}
            label={isPending ? labels.ending : labels.endToday}
            subject={subject}
            icon={ACTION_ICONS.endToday}
          />
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
