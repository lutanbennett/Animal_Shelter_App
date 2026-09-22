"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const assistantInputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * The one thing you type into. Owns its own draft text so neither the
 * page nor the slide-over has to, and hands the finished sentence up.
 *
 * Like the message list, it knows nothing about intents — version 2 keeps
 * it as it is.
 */
export function AssistantInput({
  onSend,
  autoFocus = false,
  value,
  onValueChange,
}: {
  onSend: (text: string) => void;
  autoFocus?: boolean;
  /** Controlled, for the "try something like" examples that prefill it. */
  value?: string;
  onValueChange?: (text: string) => void;
}) {
  const { t } = useI18n();
  const a = t.assistant;
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const setText = onValueChange ?? setOwn;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
      }}
      className="sticky bottom-0 mt-auto flex gap-2 bg-background py-2"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={a.placeholder}
        aria-label={a.placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        className={`${assistantInputClass} min-w-0 flex-1`}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {a.send}
      </button>
    </form>
  );
}
