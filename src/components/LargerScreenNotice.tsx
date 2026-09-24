"use client";

import { useState, type ReactNode } from "react";
import { Monitor } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Wraps the body of a Settings or Management page judged desktop-only
 * (docs/decisions.md, "Admin on mobile", 2026-09-24). Below `md` it shows a
 * notice in place of the page, with a button that reveals the page anyway;
 * from `md` up it renders the children untouched.
 *
 * A notice rather than a hidden page: someone following a link on a phone
 * can tell "not here" from "broken", and an admin who has to fix a typo in
 * the field still can. It is a layout choice, not access control — every
 * wrapped page keeps its own server-side role check.
 *
 * Which of the two shows is plain CSS until the button is pressed, so the
 * server render is already right at both widths and nothing flashes.
 */
export function LargerScreenNotice({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);

  return (
    <>
      {!shown && (
        <div
          role="note"
          className="flex flex-col gap-3 rounded border border-primary/40 bg-primary/5 p-4 text-sm md:hidden"
        >
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Monitor aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
            {t.largerScreen.title}
          </p>
          <p className="text-muted">{t.largerScreen.body}</p>
          <button
            type="button"
            onClick={() => setShown(true)}
            className="self-start rounded border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t.largerScreen.showAnyway}
          </button>
        </div>
      )}
      {/* display: contents, so the children stay items of the page's own
          flex column and keep its gap. */}
      <div className={shown ? "contents" : "hidden md:contents"}>{children}</div>
    </>
  );
}
