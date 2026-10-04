"use client";

import { useEffect, useRef } from "react";

/**
 * The chat's furniture: the scrolling list and the two kinds of bubble.
 *
 * Deliberately free of anything about intents, drafts or parsers — this
 * is the part version 2 keeps unchanged when the brain is swapped for a
 * model, so it must not know what a Draft is.
 */

export function AssistantMessageList({ children }: { children: React.ReactNode }) {
  return <ol className="flex flex-col gap-4">{children}</ol>;
}

/**
 * One request and its reply. It scrolls itself into view when it appears and
 * again when its reply changes (`settled`): a confirm card opens below the
 * message box, and on a phone Confirm sat off-screen (dry run 2026-10-03,
 * F-14). `nearest` brings the bottom edge up and leaves the panel alone when
 * the turn is already visible.
 */
export function AssistantTurn({
  children,
  settled,
}: {
  children: React.ReactNode;
  settled?: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [settled]);
  return (
    <li ref={ref} className="flex flex-col gap-2">
      {children}
    </li>
  );
}

/** What the person said. */
export function RequestBubble({ text }: { text: string }) {
  return (
    <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
      {text}
    </p>
  );
}

/** What the assistant said back. `tone` dims it or marks it as a problem. */
export function ReplyBubble({
  tone = "normal",
  children,
}: {
  tone?: "normal" | "muted" | "danger";
  children: React.ReactNode;
}) {
  const text =
    tone === "muted" ? "text-muted" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div
      className={`max-w-[85%] self-start rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2 text-sm ${text}`}
    >
      {children}
    </div>
  );
}

/**
 * The assistant's reply while a lookup is running. A word rather than an
 * animation: the answer is one query away, and a spinner that flashes for
 * 200ms reads as a fault.
 */
export function PendingBubble({ label }: { label: string }) {
  return (
    <ReplyBubble tone="muted">
      <span className="animate-pulse">{label}</span>
    </ReplyBubble>
  );
}
