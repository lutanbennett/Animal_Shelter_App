"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Shows a freshly issued temporary password once, with a copy button. It
 * lives only in this render — a reload loses it, and the server never
 * shows it again; that is the point (the admin passes it on and the
 * person replaces it on first sign-in).
 */
export function TemporaryPasswordNotice({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { t } = useI18n();
  const s = t.admin.security.tempPassword;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded border border-primary/40 bg-primary/5 p-3 text-sm">
      <span className="font-medium text-foreground">{s.heading(email)}</span>
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded bg-background px-3 py-1.5 font-mono text-base tracking-wide text-foreground">
          {password}
        </code>
        <ActionButton icon={ACTION_ICONS.copy} compact onClick={copy}>
          {copied ? s.copied : s.copy}
        </ActionButton>
      </div>
      <span className="text-xs text-muted">{s.shownOnce}</span>
    </div>
  );
}
