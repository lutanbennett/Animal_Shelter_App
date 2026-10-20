"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SIGNUP_STATUSES, type SignupStatus } from "@/lib/desexing/form";
import { deleteSignup, setSignupStatus } from "./actions";

/** One sign-up's status and its removal, beside the person's details. */
export function SignupControls({ id, driveId, status }: { id: string; driveId: string; status: SignupStatus }) {
  const { t } = useI18n();
  const a = t.desexingAdmin;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => ReturnType<typeof setSignupStatus>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) return setError(result.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm text-muted">
        {a.signups.status}
        <select
          value={status}
          disabled={pending}
          onChange={(e) => run(() => setSignupStatus(id, driveId, e.target.value as SignupStatus))}
          className="min-h-11 rounded border border-border bg-background px-2 text-sm text-foreground"
        >
          {SIGNUP_STATUSES.map((s) => (
            <option key={s} value={s}>{a.signups.statuses[s]}</option>
          ))}
        </select>
      </label>
      {confirm ? (
        <span className="flex items-center gap-2 text-sm text-foreground">
          {a.signups.removeConfirm}
          <button type="button" disabled={pending} onClick={() => run(() => deleteSignup(id, driveId))} className="min-h-11 rounded border border-danger px-3 text-danger">
            {t.common.confirm}
          </button>
          <button type="button" onClick={() => setConfirm(false)} className="min-h-11 px-2 text-muted underline">
            {t.common.cancel}
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="min-h-11 self-start px-1 text-sm text-danger underline">
          {a.signups.remove}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
