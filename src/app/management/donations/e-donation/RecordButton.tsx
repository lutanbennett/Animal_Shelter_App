"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { markRecordedInEDonation } from "../actions";

/** Drawn only by a page that already asked donation.receipt, the activity markRecordedInEDonation asks. */
export function RecordButton({ donationId }: { donationId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const call = useWriteCall();
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await call((requestId) => markRecordedInEDonation(donationId, requestId));
            if (!r.ok) return setError(r.error);
            router.refresh();
          })
        }
        className="min-h-11 rounded bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {t.donations.taxId.markRecorded}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
