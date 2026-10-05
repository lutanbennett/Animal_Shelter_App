"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { type AlertActionResult, runAlertCheckNow, sendTestAlertNow } from "./actions";

/**
 * The Alerts tile's two buttons: the way to test an alert path that is
 * otherwise invisible until the day it is needed. Each says what happened
 * to every address, including the ones that were skipped and why.
 */
export function AlertActions() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const a = t.admin.status.alerts;
  const [result, setResult] = useState<AlertActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<AlertActionResult>) {
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await action());
      } catch {
        // Only the call itself failing (offline); the actions return their refusals.
        setResult({ ok: false, error: a.callFailed });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={ACTION_ICONS.refresh} disabled={isPending} onClick={() => run(runAlertCheckNow)}>
          {a.runNow}
        </ActionButton>
        <ActionButton
          icon={ACTION_ICONS.send}
          disabled={isPending}
          onClick={async () => {
            if (await confirm({ body: a.testConfirm })) run(sendTestAlertNow);
          }}
        >
          {a.sendTest}
        </ActionButton>
      </div>
      {isPending && <p className="text-xs text-muted">{t.admin.status.checking}</p>}
      {result && !result.ok && <p className="text-xs text-danger">{result.error}</p>}
      {result?.ok && (
        <div className="text-xs text-foreground">
          <p>{result.message}</p>
          {result.skipped.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-muted">
              {result.skipped.map((s) => (
                <li key={s.address} className="break-words">
                  {a.skippedLine({ address: s.address, reason: s.reason })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
