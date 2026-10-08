"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SignOutButton } from "./login/SignOutButton";

/**
 * The header's "who am I": the person's name and role, and on tap the email
 * they signed in with (a name alone cannot tell two accounts apart — the
 * three test logins are all "Lutan", two staff may both be "Noi"), a way to
 * change their name, and Sign out. The header keeps its own Sign out button
 * beside this; the menu's copy is for someone who opened it to check which
 * account they were on.
 */
export function AccountMenu({
  name,
  role,
  email,
  className = "",
}: {
  /** The login's name, or null when it has none (the email stands in). */
  name: string | null;
  /** The role as its display name, in the page's language. */
  role: string | null;
  email: string;
  /**
   * Where the header puts it, including its min width: below sm it must wrap
   * to its own row (a name and role will not fit beside the buttons at
   * 375 px), and a min-w-0 here let it squeeze onto row 1 instead.
   */
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (ev: PointerEvent) => {
      if (!root.current?.contains(ev.target as Node)) setOpen(false);
    };
    const escape = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const who = name ?? email;
  const label = role ? `${who} · ${role}` : who;

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t.header.accountMenu}: ${label}`}
        title={label}
        className="flex min-h-11 min-w-11 max-w-full items-center gap-1 rounded text-sm md:min-h-9 text-muted hover:text-foreground sm:max-w-[16rem]"
      >
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 flex w-64 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded border border-border bg-surface p-3 text-sm shadow-lg"
        >
          <div>
            <p className="text-xs text-muted">{t.header.signedInAs}</p>
            {name && <p className="break-words font-medium text-foreground">{name}</p>}
            {role && <p className="text-foreground">{role}</p>}
            <p className="break-all text-muted">{email}</p>
          </div>
          <Link
            href="/account/password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="rounded py-1 text-foreground underline hover:text-primary"
          >
            {t.header.yourProfile}
          </Link>
          <SignOutButton className="self-start whitespace-nowrap rounded py-1 text-sm font-medium text-foreground hover:text-primary" />
        </div>
      )}
    </div>
  );
}
