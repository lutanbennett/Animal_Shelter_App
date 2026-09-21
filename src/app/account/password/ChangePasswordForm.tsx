"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function ChangePasswordForm({
  minLength,
  continueAfter,
}: {
  minLength: number;
  /** Go on to the app after saving (forced change, recovery) rather than staying here. */
  continueAfter: boolean;
}) {
  const [state, formAction, pending] = useActionState(changeOwnPassword, undefined);
  const { t } = useI18n();
  const p = t.account.password;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {continueAfter && <input type="hidden" name="continue" value="1" />}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-muted">
          {p.newPassword}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={minLength}
          autoComplete="new-password"
          autoFocus
          className={inputClass}
        />
        <p className="text-xs text-muted">{p.hint(minLength)}</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className="text-sm font-medium text-muted">
          {p.confirmPassword}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={minLength}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state && "error" in state && <p className="text-sm text-danger">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{p.changed}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.saving : p.submit}
        </button>
      </div>
    </form>
  );
}
