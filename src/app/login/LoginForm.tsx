"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { login, signInWithGoogle } from "./actions";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * `next` is where to go after signing in (src/lib/auth/next-path.ts);
 * both forms carry it as a hidden field so either route back there.
 */
export function LoginForm({
  error,
  next,
}: {
  error?: string;
  next?: string | null;
}) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const { t } = useI18n();

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-muted">
            {t.login.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-muted">
            {t.login.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        {(state?.error || error) && (
          <p className="text-sm text-danger">{state?.error ?? error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.login.signingIn : t.login.signIn}
        </button>
        <Link href="/login/forgot" className="text-center text-sm text-muted hover:text-foreground">
          {t.login.forgotPassword}
        </Link>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-border" />
        {t.login.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Separate form: the OAuth action needs no fields, and forms can't nest. */}
      <form action={signInWithGoogle}>
        {next && <input type="hidden" name="next" value={next} />}
        <GoogleButton label={t.login.continueWithGoogle} />
      </form>
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
    >
      <GoogleLogo />
      {label}
    </button>
  );
}

/** Google "G" mark, per Google's sign-in branding guidelines. */
function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
