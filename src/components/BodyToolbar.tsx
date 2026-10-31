"use client";

import type { RefObject } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MARK_COLORS, MARK_SIZES } from "@/lib/site/body";

const swatch = { ink: "bg-[#2a2118]", action: "bg-[#b4461f]", accent: "bg-[#2e5b4a]" } as const;
const button =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border bg-background px-2 text-sm text-foreground hover:bg-surface md:min-h-9 md:min-w-9";

/**
 * Style buttons for the page-text box. Each wraps the selected words in the
 * tags lib/site/body.ts reads ({b}…{/b}); nothing is stored but those tags.
 * The change is made with setRangeText and announced with an input event,
 * which is what the preview and the leave guard listen to; React's onChange
 * fires on it too, so a controlled box (TranslationPanel's Thai) works the
 * same as the website form's uncontrolled one. One toolbar for both, so the
 * English and the Thai can never offer different styles.
 */
export function BodyToolbar({ target }: { target: RefObject<HTMLTextAreaElement | null> }) {
  const { t } = useI18n();
  const m = t.admin.website.pages.marks;

  const wrap = (open: string, close: string) => {
    const el = target.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    el.focus();
    el.setRangeText(`${open}${value.slice(a, b)}${close}`, a, b, "end");
    if (a === b) el.setSelectionRange(a + open.length, a + open.length);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <div role="toolbar" aria-label={m.toolbar} className="flex flex-wrap items-center gap-1">
      <button type="button" className={`${button} font-bold`} aria-label={m.bold} title={m.bold} onClick={() => wrap("{b}", "{/b}")}>
        B
      </button>
      <button type="button" className={`${button} italic`} aria-label={m.italic} title={m.italic} onClick={() => wrap("{i}", "{/i}")}>
        I
      </button>
      <button type="button" className={`${button} underline`} aria-label={m.underline} title={m.underline} onClick={() => wrap("{u}", "{/u}")}>
        U
      </button>
      <span className="mx-1 text-xs text-muted">{m.colour}</span>
      {MARK_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={button}
          aria-label={`${m.colour}: ${m.colours[c]}`}
          title={m.colours[c]}
          onClick={() => wrap(`{c:${c}}`, "{/c}")}
        >
          <span className={`h-4 w-4 rounded-full ${swatch[c]}`} aria-hidden />
        </button>
      ))}
      <span className="mx-1 text-xs text-muted">{m.size}</span>
      {MARK_SIZES.map((s) => (
        <button key={s} type="button" className={button} title={m.sizes[s]} aria-label={`${m.size}: ${m.sizes[s]}`} onClick={() => wrap(`{s:${s}}`, "{/s}")}>
          <span className={s === "small" ? "text-xs" : s === "large" ? "text-base" : "text-xl"} aria-hidden>
            A
          </span>
        </button>
      ))}
    </div>
  );
}
