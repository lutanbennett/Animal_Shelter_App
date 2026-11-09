"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { setTextApproval } from "@/app/text/approve/actions";

/** Drawn by TextApprovalBar only for a login holding text.approve, the activity setTextApproval asks. */
export function TextApprovalButtons({ kind, id, state }: { kind: string; id: string; state: string | null }) {
  const { t } = useI18n();
  const q = t.textApproval;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const call = useWriteCall();

  function decide(next: "public_ok" | "private_only") {
    setMessage(null);
    startTransition(async () => {
      const result = await call((requestId) => setTextApproval(kind, id, next, requestId));
      setMessage(result.ok ? { ok: true, text: next === "public_ok" ? q.approved : q.keptPrivate } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {state !== "public_ok" && <ActionButton icon={Check} disabled={pending} onClick={() => decide("public_ok")}>{q.approve}</ActionButton>}
        {state !== "private_only" && <ActionButton icon={EyeOff} variant="secondary" disabled={pending} onClick={() => decide("private_only")}>{q.keepPrivate}</ActionButton>}
      </div>
      {message && <p role="status" className={message.ok ? "text-success" : "text-danger"}>{message.text}</p>}
    </div>
  );
}
