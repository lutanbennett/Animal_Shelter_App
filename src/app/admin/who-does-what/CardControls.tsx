"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWriteCall } from "@/lib/use-write-form";
import { addCard, deleteRole, moveCard, removeCard, setShowMenu } from "./actions";

/**
 * The buttons on the cards page (Admin, with the authenticator app, only: the page shows them to no one else and
 * actions.ts refuses anyone else). A refusal says why beside the button; a success refreshes the page.
 */
type Op =
  | { kind: "add" | "remove"; roleKey: string; card: string }
  | { kind: "up" | "down"; roleKey: string; card: string };

/** The one place a card change is made, shared by the buttons and a drop: a drop is exactly what the button does. */
export function runCardOp(op: Op, requestId: string) {
  return op.kind === "add"
    ? addCard(op.roleKey, op.card, requestId)
    : op.kind === "remove"
      ? removeCard(op.roleKey, op.card, requestId)
      : moveCard(op.roleKey, op.card, op.kind, requestId);
}

/**
 * Pi failover (D): the useWriteCall for an op, picked by its kind.
 *
 * runCardOp dispatches to THREE different actions, so it must not be fed from one
 * useWriteCall: an id kept from an unknown Add and then sent to Remove is the same id
 * against a different action, which claim_write_request() refuses outright (0292). Up and
 * Down are both whoDoesWhat.moveCard -- one action -- so they correctly share one.
 */
export function useCardOpWrite() {
  const add = useWriteCall();
  const remove = useWriteCall();
  const move = useWriteCall();
  return (op: Op) => (op.kind === "add" ? add : op.kind === "remove" ? remove : move);
}

export type CardOp = Op;

export function CardButton({ op, label, ariaLabel, danger }: { op: Op; label: string; ariaLabel?: string; danger?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const writeFor = useCardOpWrite();
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
            const result = await writeFor(op)((requestId) => runCardOp(op, requestId));
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
  const writeShowMenu = useWriteCall();
  const choose = (next: boolean) => {
    if (next === show) return;
    setError(null);
    startTransition(async () => {
      const result = await writeShowMenu((requestId) => setShowMenu(roleKey, next, requestId));
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

/** Delete a role: one press asks, the second does it. The server refuses while a live login holds the role and says who. */
export function DeleteRoleButton({ roleKey, label, ariaLabel, confirmText, yesLabel, cancelLabel }: { roleKey: string; label: string; ariaLabel: string; confirmText: string; yesLabel: string; cancelLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writeDeleteRole = useWriteCall();
  return (
    <div className="flex flex-col gap-2">
      {!asking ? (
        <button type="button" aria-label={ariaLabel} onClick={() => { setError(null); setAsking(true); }} className="min-h-11 self-start rounded-md border border-danger px-3 py-2 text-sm font-medium text-danger">
          {label}
        </button>
      ) : (
        <div role="alertdialog" aria-label={ariaLabel} className="flex flex-col gap-2 rounded-md border border-danger p-3">
          <p className="text-sm text-foreground [overflow-wrap:anywhere]">{confirmText}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await writeDeleteRole((requestId) => deleteRole(roleKey, requestId));
                  if (!result.ok) { setError(result.error); setAsking(false); }
                  router.replace("/admin/who-does-what");
                  router.refresh();
                })
              }
              className="min-h-11 rounded-md border border-danger bg-danger px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {yesLabel}
            </button>
            <button type="button" disabled={pending} onClick={() => setAsking(false)} className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground">
              {cancelLabel}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </div>
  );
}
