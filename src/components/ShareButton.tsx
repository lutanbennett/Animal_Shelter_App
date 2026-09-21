"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * "Share" for a public page: the Web Share API where the browser has it
 * (phones — the LINE / Facebook / WhatsApp sheet), otherwise the link goes
 * to the clipboard. The URL is the page's own, read on the client so the
 * button works on whatever host the visitor is on.
 */
export function ShareButton({
  title,
  text,
  className = "",
}: {
  title: string;
  text?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  // Server-rendered as "Copy link" and corrected on hydration, without a
  // state update in an effect.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  async function share() {
    const url = window.location.href;
    if (canShare) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Cancelled, or the share sheet refused — fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.share.copyPrompt, url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {copied ? t.share.copied : canShare ? t.share.share : t.share.copyLink}
    </button>
  );
}
