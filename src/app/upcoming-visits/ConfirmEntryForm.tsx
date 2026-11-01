"use client";

import type { ReactNode } from "react";
import { useWriteForm } from "@/lib/use-write-form";
import { confirmCalendarEntry } from "./confirm-actions";

/**
 * One calendar entry's form. It was a server-rendered `<form action>`, which cannot carry a write request id, so
 * it is a client form on useWriteForm; its fields are unchanged and arrive as children. Dismiss is a separate
 * button (DismissEntryButton) holding its own useWriteCall.
 */
export function ConfirmEntryForm({ children }: { children: ReactNode }) {
  const [state, onSubmit] = useWriteForm(confirmCalendarEntry, undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {children}
      {state && !state.ok && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
