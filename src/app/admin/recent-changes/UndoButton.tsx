"use client";

import { useState, useTransition } from "react";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { undoChange } from "./actions";

type Words = {
  button: string;
  yes: string;
  cancel: string;
  working: string;
};

/**
 * Undo for one audit row, in two taps so a stray click changes nothing. The
 * words say what will happen; the refusal, if there is one, is the server's
 * sentence (a later change, a clash, a missing parent), shown in place.
 */
export function UndoButton({ id, confirmText, words }: { id: number; confirmText: string; words: Words }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!asking) {
    return (
      <ActionButton
        compact
        icon={ACTION_ICONS.undo}
        onClick={() => {
          setError(null);
          setAsking(true);
        }}
      >
        {words.button}
      </ActionButton>
    );
  }

  return (
    <div className="mt-1 rounded border border-border bg-surface p-2 text-xs">
      <p className="text-foreground">{confirmText}</p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          disabled={pending}
          className="rounded border border-border px-2 py-1 font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
          onClick={() =>
            start(async () => {
              const r = await undoChange(id);
              if (r.ok) setAsking(false);
              else setError(r.error);
            })
          }
        >
          {pending ? words.working : words.yes}
        </button>
        <button type="button" disabled={pending} className="underline" onClick={() => setAsking(false)}>
          {words.cancel}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
