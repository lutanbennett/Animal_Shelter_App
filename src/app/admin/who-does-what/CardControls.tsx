"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCard, moveCard, removeCard, setShowMenu } from "./actions";

/**
 * The buttons on the cards page (Admin, with the authenticator app, only: the page shows them to no one else and
 * actions.ts refuses anyone else). A refusal says why beside the button; a success refreshes the page.
 */
type Op =
  | { kind: "add" | "remove"; roleKey: string; card: string }
  | { kind: "up" | "down"; roleKey: string; card: string };

/** The one place a card change is made, shared by the buttons and a drop: a drop is exactly what the button does. */
export function runCardOp(op: Op) {
  return op.kind === "add"
    ? addCard(op.roleKey, op.card)
    : op.kind === "remove"
      ? removeCard(op.roleKey, op.card)
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

/** Two buttons, the current choice pressed: Show the menu / Tiles only. */
export function ShowMenuToggle({ roleKey, show, onLabel, offLabel }: { roleKey: string; show: boolean; onLabel: string; offLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const choose = (next: boolean) => {
    if (next === show) return;
    setError(null);
    startTransition(async () => {
      const result = await setShowMenu(roleKey, next);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };
  return (
    <div className="flex flex-col gap-1">
      <div role="group" className="flex flex-wrap gap-2">
        {[{ v: true, label: onLabel }, { v: false, label: offLabel }].map((o) => (
          <button
            key={String(o.v)}
            type="button"
            disabled={pending}
            aria-pressed={show === o.v}
            onClick={() => choose(o.v)}
            className={`min-h-11 rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60 ${show === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </div>
  );
}
