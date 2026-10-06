"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * A tag's address (src/lib/tags/links.ts) with a Copy button, for handing
 * to whatever programs the enclosure QR code or resident RFID card. The
 * origin comes from the server (getTagOrigin — the real host behind
 * Cloudflare), so the link reads https://lannacare.org/… whichever
 * machine it was copied on; if the request had no host at all, the
 * browser's own origin fills in.
 *
 * `field` shows the URL beside the button so it can also be selected by
 * hand; the lists use the bare icon button instead.
 */
export function CopyTagLink({
  path,
  origin,
  name,
  label,
  field = false,
}: {
  path: string;
  origin: string | null;
  /** Who the link is for — in the button's accessible name and the toast. */
  name: string;
  /** Caption above the field (field variant only). */
  label?: string;
  field?: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = `${origin ?? ""}${path}`;

  async function copy() {
    const absolute = `${origin ?? window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.share.copyPrompt, absolute);
    }
  }

  if (!field) {
    return (
      <RowActionButton
        icon={copied ? Check : ACTION_ICONS.copy}
        label={copied ? t.tagLinks.copiedFor(name) : t.tagLinks.copyFor(name)}
        onClick={copy}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          readOnly
          value={url}
          aria-label={label}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground"
        />
        <ActionButton
          onClick={copy}
          aria-label={copied ? t.tagLinks.copiedFor(name) : t.tagLinks.copyFor(name)}
          icon={copied ? Check : ACTION_ICONS.copy}
        >
          {copied ? t.tagLinks.copied : t.tagLinks.copy}
        </ActionButton>
      </div>
    </div>
  );
}
