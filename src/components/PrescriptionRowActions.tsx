"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { endPrescriptionToday } from "@/app/prescriptions/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * The Edit link and "End today" button on a current prescription row. End
 * today is only offered once the course has started (0027 rejects an end
 * before the start), so a row dated to start later gets Edit alone. The
 * action refreshes the page itself; an error stays on the row.
 */
export function PrescriptionRowActions({
  residentId,
  prescriptionId,
  canEndToday,
}: {
  residentId: string;
  prescriptionId: string;
  canEndToday: boolean;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function endToday() {
    setError(null);
    startTransition(async () => {
      const result = await endPrescriptionToday(residentId, prescriptionId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <Link
          href={`/prescriptions/${prescriptionId}/edit`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t.common.edit}
        </Link>
        {canEndToday && (
          <button
            type="button"
            disabled={isPending}
            onClick={endToday}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isPending ? t.prescriptions.ending : t.prescriptions.endToday}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
