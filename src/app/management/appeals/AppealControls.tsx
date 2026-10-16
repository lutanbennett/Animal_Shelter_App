"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import type { AppealStatus } from "@/lib/appeals/state";
import { closeAppeal, deleteDraftAppeal, moveAppeal, type AppealTransition } from "./actions";

const buttonClass =
  "min-h-11 rounded border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-60";
const primaryClass =
  "min-h-11 rounded bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60";
const dangerClass =
  "min-h-11 rounded border border-danger/40 px-4 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-60";

/**
 * Preview, publish, mark reached, take down, close with an outcome, delete a
 * draft. Which buttons show follows the status; the server action re-checks
 * the status itself, so a stale page cannot do the wrong thing.
 */
export function AppealControls({
  appealId,
  status,
  published,
  hasStory,
  residentPublic,
  outcome,
}: {
  appealId: string;
  status: AppealStatus;
  published: boolean;
  hasStory: boolean;
  residentPublic: boolean;
  outcome: string | null;
}) {
  const { t } = useI18n();
  const p = t.appealsAdmin.publish;
  const c = t.appealsAdmin.close;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [outcomeText, setOutcomeText] = useState(outcome ?? "");

  function move(move: AppealTransition, done: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await moveAppeal(appealId, move);
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      setMessage({ type: "ok", text: done });
      router.refresh();
    });
  }

  async function askThenMove(move_: AppealTransition, body: string, done: string) {
    if (!(await confirm({ body }))) return;
    move(move_, done);
  }

  async function close() {
    if (!(await confirm({ body: c.confirm, confirmLabel: c.button }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await closeAppeal(appealId, outcomeText);
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      setMessage({ type: "ok", text: c.closed });
      router.refresh();
    });
  }

  async function remove() {
    if (!(await confirm({ body: t.appealsAdmin.danger.deleteConfirm, confirmLabel: t.common.delete }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteDraftAppeal(appealId);
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      router.push("/management/appeals");
    });
  }

  const note =
    status === "draft" ? p.draftNote : status === "live" ? p.liveNote : status === "funded" ? p.fundedNote : p.closedNote;

  return (
    <section className="flex max-w-3xl flex-col gap-3 rounded border border-border bg-surface p-4">
      <h2 className="text-base font-semibold text-foreground">{p.heading}</h2>
      <p className="text-sm font-medium text-foreground">{note}</p>
      {status !== "closed" && !residentPublic && published && (
        <p className="rounded border border-border bg-background px-3 py-2 text-sm text-muted">{p.residentNotPublic}</p>
      )}
      {status === "draft" && !hasStory && (
        <p className="rounded border border-border bg-background px-3 py-2 text-sm text-muted">{p.needStory}</p>
      )}

      <div className="flex flex-col gap-1">
        <Link href={`/management/appeals/${appealId}/preview`} className={`${buttonClass} inline-flex items-center self-start`}>
          {p.preview}
        </Link>
        <span className="text-xs text-muted">{p.previewHint}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <button type="button" disabled={pending} onClick={() => move("publish", p.published)} className={primaryClass}>
            {pending ? p.working : p.publish}
          </button>
        )}
        {status === "live" && (
          <button type="button" disabled={pending} onClick={() => askThenMove("fund", p.fundConfirm, p.funded)} className={buttonClass}>
            {p.fund}
          </button>
        )}
        {status === "funded" && (
          <button type="button" disabled={pending} onClick={() => move("reopen", p.reopened)} className={buttonClass}>
            {p.reopen}
          </button>
        )}
        {(status === "live" || status === "funded") && (
          <button type="button" disabled={pending} onClick={() => askThenMove("unpublish", p.unpublishConfirm, p.unpublished)} className={buttonClass}>
            {p.unpublish}
          </button>
        )}
        {status === "draft" && (
          <button type="button" disabled={pending} onClick={remove} className={dangerClass}>
            {t.appealsAdmin.danger.delete}
          </button>
        )}
        {status === "draft" && <span className="self-center text-xs text-muted">{p.publishHint}</span>}
      </div>

      {(status === "live" || status === "funded" || status === "closed") && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <h3 className="text-sm font-semibold text-foreground">{status === "closed" ? c.editOutcome : c.heading}</h3>
          {status !== "closed" && <p className="text-sm text-muted">{c.hint}</p>}
          <label htmlFor="ap-outcome" className="text-sm font-medium text-muted">{c.outcome}</label>
          <textarea
            id="ap-outcome"
            rows={3}
            value={outcomeText}
            readOnly={status === "closed"}
            onChange={(e) => setOutcomeText(e.target.value)}
            className="min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm"
            lang="und"
          />
          {status !== "closed" && (
            <button type="button" disabled={pending} onClick={close} className={`${dangerClass} self-start`}>
              {pending ? c.working : c.button}
            </button>
          )}
        </div>
      )}

      {message && (
        <p role={message.type === "error" ? "alert" : "status"} className={`rounded border px-3 py-2 text-sm ${message.type === "error" ? "border-danger bg-danger/10 text-danger" : "border-success/50 bg-success/10 text-success"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
