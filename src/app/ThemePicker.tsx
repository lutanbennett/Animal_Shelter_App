"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { THEMES, THEME_PREVIEW, themeAttribute, parseTheme, type Theme } from "@/lib/theme/themes";
import { setOwnTheme } from "./account/theme/actions";

/** The theme the page is showing now: the attribute the layout (or a pick) set on <html>. */
function currentTheme(): Theme {
  return parseTheme(document.documentElement.dataset.theme ?? "dark");
}

function apply(theme: Theme) {
  const attr = themeAttribute(theme);
  if (attr) document.documentElement.dataset.theme = attr;
  else delete document.documentElement.dataset.theme;
}

/**
 * The account menu's colour choice (src/lib/theme/themes.ts). A pick shows at
 * once — the attribute on <html> changes before the save — and a save that
 * fails puts the previous theme back and says so, so the page never shows a
 * choice that was not kept.
 *
 * A radio group of four rows rather than swatches in a line: each row is
 * full-width with its name, so Thai labels never widen the menu (its width is
 * fixed, batch 72), and each preview shows that theme's own colours.
 */
export function ThemePicker() {
  const { t } = useI18n();
  const labels = t.header.theme;
  const [theme, setTheme] = useState<Theme>(() => (typeof document === "undefined" ? "dark" : currentTheme()));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: Theme) {
    if (next === theme) return;
    const previous = theme;
    setTheme(next);
    setError(null);
    apply(next);
    startTransition(async () => {
      const result = await setOwnTheme(next).catch(() => ({ error: labels.failed }));
      if ("error" in result) {
        setTheme(previous);
        apply(previous);
        setError(result.error);
      }
    });
  }

  return (
    <fieldset className="flex flex-col gap-1" aria-busy={pending}>
      <legend className="mb-1 text-xs text-muted">{labels.label}</legend>
      {THEMES.map((id) => {
        const [bg, surface, accent] = THEME_PREVIEW[id];
        const checked = id === theme;
        return (
          <label
            key={id}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded px-1 md:min-h-8 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 ${checked ? "bg-surface-hover" : "hover:bg-surface-hover"}`}
          >
            <input
              type="radio"
              name="theme"
              value={id}
              checked={checked}
              onChange={() => choose(id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="flex h-5 w-8 shrink-0 items-center justify-end overflow-hidden rounded border border-border pr-0.5"
              style={{ background: `linear-gradient(90deg, ${bg} 50%, ${surface} 50%)` }}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
            </span>
            <span className="min-w-0 flex-1 text-foreground">{labels[id]}</span>
            {checked && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />}
          </label>
        );
      })}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
