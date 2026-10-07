"use client";

import { useState, useTransition } from "react";
import { useKeptForm } from "@/lib/use-kept-form";
import { confirmTwoStep, startTwoStepSetup } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";

const inputClass =
  "w-40 rounded border border-border bg-surface px-3 py-2 text-center font-mono text-lg tracking-widest text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";


type Setup = { factorId: string; qrCode: string; secret: string };

/**
 * Enter the 6-digit code — and, the first time, set up the app it comes
 * from. Setup is a button rather than something the page does on load, so
 * a reload or a prefetch never makes a new key behind the admin's back.
 */
export function TwoStepForm({ enrolled }: { enrolled: boolean }) {
  const { t } = useI18n();
  const s = t.admin.security.twoStep;
  const [state, onSubmit, confirming] = useKeptForm(confirmTwoStep, undefined);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();

  function begin() {
    setSetupError(null);
    startTransition(async () => {
      try {
        const result = await startTwoStepSetup();
        if (result.ok) setSetup(result);
        else setSetupError(result.error);
      } catch {
        setSetupError(s.errors.couldntStart);
      }
    });
  }

  if (!enrolled && !setup) {
    return (
      <div className="flex max-w-prose flex-col gap-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
          <li>{s.stepInstall}</li>
          <li>{s.stepScan}</li>
          <li>{s.stepCode}</li>
        </ol>
        {setupError && <p className="text-sm text-danger">{setupError}</p>}
        <div>
          <ActionButton icon={ACTION_ICONS.allowTwoStep} variant="primary" onClick={begin} disabled={starting}>
            {starting ? s.starting : s.start}
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-prose flex-col gap-6">
      {setup && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL; next/image adds nothing */}
          <img
            src={setup.qrCode}
            alt={s.qrAlt}
            width={180}
            height={180}
            className="rounded border border-border bg-white p-2"
          />
          <div className="flex flex-col gap-1 text-sm">
            <p className="text-foreground">{s.scanThis}</p>
            <p className="text-muted">{s.orTypeKey}</p>
            <code className="break-all rounded bg-surface px-2 py-1 font-mono text-xs text-foreground select-all">
              {setup.secret}
            </code>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        {setup && <input type="hidden" name="factorId" value={setup.factorId} />}
        <label htmlFor="code" className="text-sm font-medium text-muted">
          {s.codeLabel}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
            autoFocus
            className={inputClass}
          />
          <ActionButton type="submit" icon={ACTION_ICONS.approve} variant="primary" disabled={confirming}>
            {confirming ? s.checking : setup ? s.confirmSetup : s.confirm}
          </ActionButton>
        </div>
        {state && !state.ok && !confirming && <p className="text-sm text-danger">{state.error}</p>}
      </form>

      {setup && <p className="text-xs text-muted">{s.noRecoveryCodes}</p>}
    </div>
  );
}
