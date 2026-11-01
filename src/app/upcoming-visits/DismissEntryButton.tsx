"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useWriteCall } from "@/lib/use-write-form";
import { dismissCalendarEntry } from "./confirm-actions";

/** Hide one calendar entry. A plain button inside the entry's form, so it never submits it. */
export function DismissEntryButton({ eventId, children }: { eventId: string; children: ReactNode }) {
  const save = useWriteCall();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await save((requestId) => dismissCalendarEntry(eventId, requestId));
            if (!result.ok) setError(result.error);
          })
        }
        className="min-h-11 rounded-md border border-border px-4 text-sm"
      >
        {children}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </>
  );
}
