"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { addCard, addExtra, moveCard, removeCard, removeExtra } from "./actions";

/**
 * The buttons on the cards page (Admin, with the authenticator app, only: the page shows them to no one else and
 * actions.ts refuses anyone else). A refusal says why beside the button; a success refreshes the page.
 */
type Op =
  | { kind: "add" | "remove"; roleKey: string; card: string }
  | { kind: "up" | "down"; roleKey: string; card: string }
  | { kind: "removeExtra"; roleKey: string; activity: string };

/** The one place a card change is made, shared by the buttons and a drop: a drop is exactly what the button does. */
export function runCardOp(op: Op) {
  return op.kind === "add"
    ? addCard(op.roleKey, op.card)
    : op.kind === "remove"
      ? removeCard(op.roleKey, op.card)
      : op.kind === "removeExtra"
        ? removeExtra(op.roleKey, op.activity)
        : moveCard(op.roleKey, op.card, op.kind);
}

export type CardOp = Op;

export function CardButton({ op, label, ariaLabel, danger }: { op: Op; label: string; ariaLabel?: string; danger?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // One branch per kind: two conflicting colour utilities on one element are settled by stylesheet order, not string order.
  const tone = danger
    ? "border-danger text-danger"
    : op.kind === "up" || op.kind === "down"
      ? "border-border bg-surface text-foreground"
      : "border-primary bg-primary text-primary-foreground";
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        aria-label={ariaLabel ?? label}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await runCardOp(op);
            if (!result.ok) setError(result.error);
            router.refresh();
          });
        }}
        className={`min-h-11 min-w-11 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60 ${tone}`}
      >
        {label}
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </div>
  );
}

export function AddExtraForm({ roleKey, options }: { roleKey: string; options: { key: string; label: string; kind: "level" | "yesno" }[] }) {
  const { t } = useI18n();
  const c = t.admin.whoDoesWhat.cardsView;
  const w = t.admin.whoDoesWhat;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState(options[0]?.key ?? "");
  const [level, setLevel] = useState(1);
  const [why, setWhy] = useState("");
  const kind = options.find((o) => o.key === activity)?.kind ?? "level";
  const field = "min-h-11 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground";
  return (
    <form
      className="flex max-w-xl flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await addExtra(roleKey, activity, kind === "yesno" ? 2 : level, why);
          if (!result.ok) setError(result.error);
          else setWhy("");
          router.refresh();
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-foreground">
        {c.extraActivity}
        <select value={activity} onChange={(e) => setActivity(e.target.value)} className={field}>
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {kind === "level" && (
        <label className="flex flex-col gap-1 text-sm text-foreground">
          {c.extraLevel}
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className={field}>
            <option value={1}>{w.levels.read}</option>
            <option value={2}>{w.levels.edit}</option>
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm text-foreground">
        {c.extraWhy}
        <input value={why} onChange={(e) => setWhy(e.target.value)} className={field} />
      </label>
      <button type="submit" disabled={pending} className="min-h-11 self-start rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {c.extraAdd}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </form>
  );
}
