/**
 * The colour themes a person can choose from the account menu
 * (docs/decisions/2026-10-10-user-colour-themes.md). Each is a
 * `:root[data-theme="…"]` block in src/app/globals.css redefining the colour
 * tokens every component reads; the default has no block and no attribute.
 *
 * Saved in the person's own `user_metadata.theme` — a preference, not a
 * permission, so the user writing it through their own session is right,
 * and it follows them to every device. The root layout reads it on the
 * server and sets the attribute in the HTML itself, so there is no flash of
 * the default and no browser cache to go stale.
 *
 * Kept deliberately small: every theme is a contrast matrix to maintain
 * (`node scripts/check-theme-contrast.mjs`).
 */
export const THEMES = ["dark", "light", "contrast", "magenta"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";

/** The user_metadata key the choice is saved under. */
export const THEME_METADATA_KEY = "theme";

/**
 * A stored or posted value as a theme. Anything unknown — no value, a theme
 * since removed, a hand-edited metadata value — is the default, never an
 * error: a person should always get a working page.
 */
export function parseTheme(value: unknown): Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value)
    ? (value as Theme)
    : DEFAULT_THEME;
}

/** The `data-theme` attribute for a theme; undefined for the default, which has none. */
export function themeAttribute(theme: Theme): string | undefined {
  return theme === DEFAULT_THEME ? undefined : theme;
}

/**
 * Colours for the picker's little previews (background, surface, accent),
 * copied from globals.css so each option shows itself whatever theme is on.
 */
export const THEME_PREVIEW: Record<Theme, [string, string, string]> = {
  dark: ["#121212", "#1c1c1e", "#ff9f0a"],
  light: ["#f4f4f5", "#ffffff", "#a84a07"],
  contrast: ["#000000", "#0a0a0a", "#b3ff1a"],
  magenta: ["#121212", "#1c1c1e", "#e033ff"],
};
