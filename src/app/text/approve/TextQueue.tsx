"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { setTextApproval } from "./actions";

export type WaitingText = { kind: string; id: string; label: string; fields: Record<string, unknown>; changedAt: string | null };

/**
 * The words waiting for a reader. The page is drawn only for text.approve and both buttons ask that same activity;
 * `canApprove` defaults to false so a caller that forgets offers nothing.
 */
export function TextQueue({ items, canApprove = false }: { items: WaitingText[]; canApprove?: boolean }) {
  const { t } = useI18n();
  const q = t.textApproval;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const call = useWriteCall();

  if (items.length === 0) return <p className="text-base text-muted">{q.empty}</p>;

  function decide(item: WaitingText, state: "public_ok" | "private_only") {
    setMessage(null);
    startTransition(async () => {
      const result = await call((requestId) => setTextApproval(item.kind, item.id, state, requestId));
      setMessage(result.ok ? { ok: true, text: state === "public_ok" ? q.approved : q.keptPrivate } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4">
      {message && <p role="status" className={message.ok ? "text-success" : "text-danger"}>{message.text}</p>}
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.kind + item.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-muted">{q.kinds[item.kind] ?? item.kind}</p>
            <p className="text-base font-medium text-foreground">{item.label}</p>
            <dl className="flex flex-col gap-2">
              {Object.entries(item.fields).map(([column, value]) => (
                <div key={column}>
                  <dt className="text-sm font-medium text-foreground">{q.fields[column] ?? column}</dt>
                  <dd className="whitespace-pre-wrap text-base text-foreground">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                </div>
              ))}
            </dl>
            {canApprove && (
              <div className="flex flex-wrap gap-2">
                <ActionButton icon={Check} disabled={pending} onClick={() => decide(item, "public_ok")}>{q.approve}</ActionButton>
                <ActionButton icon={EyeOff} variant="secondary" disabled={pending} onClick={() => decide(item, "private_only")}>{q.keepPrivate}</ActionButton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
