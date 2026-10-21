/**
 * The home-screen icon drawing, once. Pure strings, so the Settings page (a browser canvas) and
 * scripts/sync-home-icons.mjs (sharp) draw the same picture. The glyph is the card's own lucide
 * icon in the app's colours; iOS rounds the corners itself, so the square is full-bleed.
 */

/** The app's default dark and light surface + primary (src/app/globals.css :root and [data-theme="light"]). */
export const ICON_PALETTES = {
  dark: { bg: "#1c1c1e", fg: "#ff9f0a" },
  light: { bg: "#ffffff", fg: "#a84a07" },
} as const;
export type IconStyle = keyof typeof ICON_PALETTES;

/** What a rendered lucide <svg> holds between its tags. */
export function iconInner(markup: string): string {
  return markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A square SVG on a 1024 grid; the caller scales it to 180 or 1024. */
export function buildIconSvg(opts: { inner: string; label: string; showName: boolean; style: IconStyle; size: number }): string {
  const { bg, fg } = ICON_PALETTES[opts.style];
  const glyph = opts.showName ? 460 : 580;
  const gx = (1024 - glyph) / 2;
  const gy = opts.showName ? 170 : (1024 - glyph) / 2;
  const fontSize = Math.min(120, Math.floor(880 / Math.max(opts.label.length * 0.56, 1)));
  const text = opts.showName
    ? `<text x="512" y="880" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="600" font-size="${fontSize}" fill="${fg}">${esc(opts.label)}</text>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}" viewBox="0 0 1024 1024">` +
    `<rect width="1024" height="1024" fill="${bg}"/>` +
    `<svg x="${gx}" y="${gy}" width="${glyph}" height="${glyph}" viewBox="0 0 24 24" fill="none" stroke="${fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${opts.inner}</svg>` +
    text +
    `</svg>`
  );
}
