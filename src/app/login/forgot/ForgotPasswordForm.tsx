"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);
  const { t } = useI18n();
  const f = t.login.forgot;

  if (state && "sent" in state) {
    return <p className="rounded border border-border bg-surface p-4 text-sm text-foreground">{f.sent}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          {t.login.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" autoFocus className={inputClass} />
      </div>
      {state && "error" in state && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? f.sending : f.submit}
      </button>
    </form>
  );
}
