"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import type { WebsiteDraft } from "@/lib/website/drafts";
import { approveWebsiteDraft, discardWebsiteDraft } from "./website-actions";

/**
 * Website changes drafted by someone who may not publish (0315). The tab holding it is drawn only for a login holding
 * website.approve; the two buttons ask that same activity, and `canDecide` defaults to false so a caller that forgets offers nothing.
 */
export function WebsiteDraftQueue({ drafts, canDecide = false }: { drafts: WebsiteDraft[]; canDecide?: boolean }) {
  const { t, locale } = useI18n();
  const q = t.photoApproval.website;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const approveCall = useWriteCall();
  const discardCall = useWriteCall();

  if (drafts.length === 0) return <p className="text-base text-muted">{q.empty}</p>;

  function decide(kind: "approve" | "discard", id: string) {
    setMessage(null);
    startTransition(async () => {
      const call = kind === "approve" ? approveCall : discardCall;
      const result = await call((requestId) => (kind === "approve" ? approveWebsiteDraft(id, requestId) : discardWebsiteDraft(id, requestId)));
      setMessage(result.ok ? { ok: true, text: kind === "approve" ? q.published : q.discarded } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4">
      {message && <p role="status" className={message.ok ? "text-success" : "text-danger"}>{message.text}</p>}
      <ul className="flex flex-col gap-4">
        {drafts.map((d) => (
          <li key={d.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <p className="text-base font-medium text-foreground">{d.target === "site_pages" ? q.page(d.rowKey) : q.home}</p>
            <p className="text-sm text-muted">{q.proposedBy(d.proposedBy, formatDate(d.proposedAt, locale))}</p>
            <dl className="flex flex-col gap-2">
              {Object.entries(d.patch).map(([column, value]) => (
                <div key={column}>
                  <dt className="text-sm font-medium text-foreground">{column}</dt>
                  <dd className="whitespace-pre-wrap text-base text-foreground">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                </div>
              ))}
            </dl>
            {canDecide && (
              <div className="flex flex-wrap gap-2">
                <ActionButton icon={Check} disabled={pending} onClick={() => decide("approve", d.id)}>{q.publish}</ActionButton>
                <ActionButton icon={Trash2} variant="secondary" disabled={pending} onClick={() => decide("discard", d.id)}>{q.discard}</ActionButton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
