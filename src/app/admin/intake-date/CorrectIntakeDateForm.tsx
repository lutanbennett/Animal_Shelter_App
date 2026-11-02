"use client";

import { useWriteForm } from "@/lib/use-write-form";
import { DateInput } from "@/components/DateInput";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { correctIntakeDate } from "./actions";

/**
 * The Save control. `canCorrect` defaults to false so a caller that forgets it offers nothing; the page passes
 * can(perms, "resident.correct_intake_date"), the activity correct_intake_date() asks.
 */
export function CorrectIntakeDateForm({
  residentId,
  currentDate,
  canCorrect = false,
}: {
  residentId: string;
  currentDate: string;
  canCorrect?: boolean;
}) {
  const [state, onSubmit, pending] = useWriteForm(correctIntakeDate, undefined);
  const { t } = useI18n();
  const s = t.admin.intakeDate;
  if (!canCorrect) return null;

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="residentId" value={residentId} />
      <div className="flex flex-col gap-1">
        <label htmlFor="new-intake-date" className="text-sm font-medium text-muted">{s.newDate}</label>
        <DateInput
          id="new-intake-date"
          name="newDate"
          required
          defaultValue={currentDate}
          className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-0"
      >
        {pending ? t.common.saving : s.save}
      </button>
      {state && !state.ok && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
