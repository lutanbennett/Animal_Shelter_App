"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { changeOwnPassword, type ChangePasswordState } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localizedValidity } from "@/lib/i18n/validity";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function ChangePasswordForm({
  minLength,
  continueAfter,
  askCurrent,
}: {
  minLength: number;
  /** Go on to the app after saving (forced change, recovery) rather than staying here. */
  continueAfter: boolean;
  /** The server wants the current password (a change by choice); the action re-checks this itself. */
  askCurrent: boolean;
}) {
  // Controlled and submitted from onSubmit: <form action> resets its fields
  // after every submit, controlled or not, so a refused change would empty
  // all three boxes (backlog F-10).
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: ChangePasswordState, formData: FormData) => {
      const next = await changeOwnPassword(prev, formData);
      if (next && "success" in next) {
        setCurrent("");
        setPassword("");
        setConfirm("");
      }
      return next;
    },
    undefined,
  );
  const { t, locale } = useI18n();
  const p = t.account.password;

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form method="post" onSubmit={onSubmit} {...localizedValidity(t, locale)} className="flex max-w-md flex-col gap-4">
      {continueAfter && <input type="hidden" name="continue" value="1" />}
      {askCurrent && (
        <div className="flex flex-col gap-1">
          <label htmlFor="current" className="text-sm font-medium text-muted">
            {p.currentPassword}
          </label>
          <input
            id="current"
            name="current"
            type="password"
            value={current}
            onChange={(ev) => setCurrent(ev.target.value)}
            required
            autoComplete="current-password"
            autoFocus
            className={inputClass}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-muted">
          {p.newPassword}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          minLength={minLength}
          autoComplete="new-password"
          autoFocus={!askCurrent}
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
          value={confirm}
          onChange={(ev) => setConfirm(ev.target.value)}
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
