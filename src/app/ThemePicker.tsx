"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import { THEMES, THEME_METADATA_KEY, THEME_PREVIEW, themeAttribute, parseTheme, type Theme } from "@/lib/theme/themes";

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
 *
 * PI FAILOVER (D), 2026-11-01: THE SAVE MOVED OUT OF A SERVER ACTION AND INTO
 * THE BROWSER, which is why `src/app/account/theme/actions.ts` is gone.
 *
 * The account menu is in the shared header, so this control is on EVERY
 * signed-in address; a Server Action POSTs to the address of the page the
 * person is on, so while this was one, no page in the app could go on
 * WRAPPED_WRITE_PATHS until it was wrapped. It could not simply be wrapped:
 * `claim_write_request()` raises for a login `holds_app_role()` answers false
 * for (0292_write_requests.sql), and this menu is drawn for every signed-in
 * login -- including one that has not been given a role yet, which reaches
 * /account/password to set its first password. Wrapping would have met that
 * login with "something went wrong" where the theme saves today. So the write
 * left the address instead of being wrapped at it: there is now nothing here
 * for the Worker to replay, which is strictly stronger than a claim.
 *
 * It is the same call the server action made -- `auth.updateUser` merging one
 * key into the person's own `user_metadata`, under their own session, no
 * service role -- and the same shape `SignOutButton` already uses for
 * `auth.signOut()`. Nothing is granted here and nothing is trusted: the value
 * is read back through `parseTheme()` in the root layout, so a tampered one
 * renders as the default. docs/decisions/2026-11-01-header-writes-wrapped.md.
 */
export function ThemePicker() {
  const { t } = useI18n();
  const labels = t.header.theme;
  const router = useRouter();
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
      // Saving the default stores null, which removes the key rather than
      // recording "dark" -- as the server action did.
      const supabase = createClient();
      const { error: failed } = await supabase.auth
        .updateUser({ data: { [THEME_METADATA_KEY]: next === "dark" ? null : next } })
        .catch(() => ({ error: new Error("theme") }));
      if (failed) {
        setTheme(previous);
        apply(previous);
        setError(labels.failed);
        return;
      }
      // The root layout renders the attribute from user_metadata, so the next
      // server render has to re-read it; the server action called
      // revalidatePath("/", "layout") for the same reason.
      router.refresh();
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
