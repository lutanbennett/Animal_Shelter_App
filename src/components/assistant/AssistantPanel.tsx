"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessagesSquare, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { AssistantContext } from "@/lib/assistant/data";
import { fetchAssistantContext } from "@/app/assistant/actions";
import { AssistantConversation } from "./AssistantConversation";

/**
 * The assistant as a slide-over, opened from the header so it can be used
 * from wherever the person already is — the resident they are looking at,
 * the enclosure they are standing in — instead of navigating away to
 * /assistant and losing their place. On a phone it covers the screen;
 * from `sm` up it is a panel down the right-hand side.
 *
 * The rows it matches sentences against are fetched when it opens rather
 * than with every page render, because most screens never open it — and
 * again on each open, since a panel that had been sitting on a tab all
 * afternoon would otherwise match names against enclosures that have
 * since changed.
 */
export function AssistantPanel() {
  const { t } = useI18n();
  const a = t.assistant;
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AssistantContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clearing the last error belongs with the click that reopens the
  // panel, not with the effect that then reloads it.
  function openPanel() {
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    fetchAssistantContext()
      .then((loaded) => {
        if (cancelled) return;
        setContext(loaded);
        if (loaded.error) setError(loaded.error);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        title={a.panel.open}
        aria-label={a.panel.open}
        className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover"
      >
        <MessagesSquare aria-hidden="true" className="h-4 w-4" />
        <span className="hidden sm:inline">{a.panel.open}</span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <aside
              role="dialog"
              aria-modal="true"
              aria-label={a.panel.title}
              className="flex h-full w-full flex-col gap-4 overflow-y-auto border-l border-border bg-background p-4 shadow-xl sm:max-w-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {a.panel.title}
                  </h2>
                  <p className="text-sm text-muted">{a.panel.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title={t.common.close}
                  aria-label={t.common.close}
                  className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <p className="text-sm text-danger">
                  {a.couldntLoad}: {error}
                </p>
              )}

              {context ? (
                <AssistantConversation context={context} autoFocus />
              ) : (
                !error && <p className="text-sm text-muted">{a.panel.loading}</p>
              )}
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
