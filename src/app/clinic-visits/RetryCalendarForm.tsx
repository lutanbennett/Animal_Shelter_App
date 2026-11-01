"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteForm } from "@/lib/use-write-form";
import { retryCalendarSync } from "./calendar-actions";

/**
 * The Retry beside "Not in the shelter calendar yet" (Pi failover (D): the action goes through runWriteAction(),
 * so the form carries a request id). `children` is the line of text the form sits beside; the button is drawn
 * by the caller's gate, which is why it is passed as `canRetry` rather than checked here.
 */
export function RetryCalendarForm({
  visitId,
  residentId,
  canRetry,
}: {
  visitId: string;
  residentId: string;
  canRetry: boolean;
}) {
  const { t } = useI18n();
  const sv = t.shelterVisits;
  const [state, onSubmit, pending] = useWriteForm(retryCalendarSync, undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="visitId" value={visitId} />
      <input type="hidden" name="residentId" value={residentId} />
      <span className="text-xs text-muted">{sv.notInCalendar}</span>
      {canRetry && (
        <button type="submit" disabled={pending} className="text-xs font-medium text-primary hover:underline">
          {sv.retryCalendar}
        </button>
      )}
      {state && !state.ok && <span role="alert" className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
