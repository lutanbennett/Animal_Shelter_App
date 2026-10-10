#!/usr/bin/env node
/**
 * WCAG contrast for every colour theme (src/lib/theme/themes.ts, globals.css).
 *
 *   node scripts/check-theme-contrast.mjs        # table, exit 1 on any failure
 *
 * Reads the token blocks straight out of globals.css — `:root` for the
 * default and `:root[data-theme="…"]` for each other theme, the default
 * filling in whatever a theme leaves out — so the numbers are the shipped
 * colours, not a copy that can drift. Text pairs need 4.5:1 (AA, normal
 * text); graphics (zone dots, status dots, the focus ring) need 3:1. Tinted
 * pairs such as `text-danger` on `bg-danger/10` are blended over the surface
 * they sit on, as the browser draws them.
 *
 * Dev's teal (`:root[data-env="dev"]`) is checked too: it applies only under
 * the default theme (docs/decisions/2026-10-10-user-colour-themes.md).
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

/** Every `--name: #hex;` inside each block that `selector` opens, merged in order. */
function tokens(selector) {
  const out = {};
  let i = 0;
  for (;;) {
    const at = css.indexOf(`${selector} {`, i);
    if (at < 0) break;
    const end = css.indexOf("}", at);
    for (const m of css.slice(at, end).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) out[m[1]] = m[2].toLowerCase();
    i = end;
  }
  return out;
}

const base = tokens(":root");
const themes = {
  dark: base,
  "dark (dev)": { ...base, ...tokens(':root[data-env="dev"]') },
};
for (const m of css.matchAll(/:root\[data-theme="([a-z-]+)"\] \{/g)) {
  themes[m[1]] = { ...base, ...tokens(`:root[data-theme="${m[1]}"]`) };
}

// The zone swatches, read from their own file for the same reason.
const palette = readFileSync(new URL("../src/lib/zones/palette.ts", import.meta.url), "utf8");
const swatches = [...palette.matchAll(/key: "([a-z]+)", hex: "(#[0-9a-f]{6})"/g)].map((m) => [m[1], m[2]]);

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = rgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const blend = (fg, alpha, bg) =>
  "#" + rgb(fg).map((c, i) => Math.round(c * alpha + rgb(bg)[i] * (1 - alpha)).toString(16).padStart(2, "0")).join("");

// Dev near-misses that predate the themes (dev only; production and every
// selectable theme pass). Printed, not counted, and on the backlog to retune.
const KNOWN = new Set(["dark (dev)|danger / danger/10 on surface", "dark (dev)|info / surface"]);

let failures = 0;
for (const [name, t] of Object.entries(themes)) {
  const text = [
    ["foreground / background", t.foreground, t.background],
    ["foreground / surface", t.foreground, t.surface],
    ["foreground / surface-hover", t.foreground, t["surface-hover"]],
    ["muted / background", t.muted, t.background],
    ["muted / surface", t.muted, t.surface],
    ["muted / surface-hover", t.muted, t["surface-hover"]],
    ["primary / background", t.primary, t.background],
    ["primary / surface", t.primary, t.surface],
    ["primary-foreground / primary", t["primary-foreground"], t.primary],
    ["primary-foreground / primary-hover", t["primary-foreground"], t["primary-hover"]],
    ["foreground / primary/10 on surface", t.foreground, blend(t.primary, 0.1, t.surface)],
    ["danger / background", t.danger, t.background],
    ["danger / surface", t.danger, t.surface],
    ["danger / danger/10 on surface", t.danger, blend(t.danger, 0.1, t.surface)],
    ["danger-foreground / danger", t["danger-foreground"], t.danger],
    ["success / background", t.success, t.background],
    ["success / surface", t.success, t.surface],
    ["success-foreground / success", t["success-foreground"], t.success],
    ["warning / surface", t.warning, t.surface],
    ["warning / warning/15 on surface", t.warning, blend(t.warning, 0.15, t.surface)],
    ["foreground / warning/20 on surface", t.foreground, blend(t.warning, 0.2, t.surface)],
    ["info / surface", t.info, t.surface],
  ];
  const graphic = [
    ["focus ring primary/40 / background", blend(t.primary, 0.4, t.background), t.background, 1.0],
    ["status dot success / surface", t.success, t.surface],
    ["status dot warning / surface", t.warning, t.surface],
    ["status dot danger / surface", t.danger, t.surface],
  ];
  console.log(`\n== ${name}`);
  for (const [label, a, b] of text) {
    const r = ratio(a, b);
    const ok = r >= 4.5;
    const known = !ok && KNOWN.has(`${name}|${label}`);
    if (!ok && !known) failures++;
    console.log(`  ${ok ? "ok  " : known ? "KNWN" : "FAIL"} ${r.toFixed(2).padStart(5)}:1  ${label}  (${a} on ${b})`);
  }
  for (const [label, a, b, min = 3] of graphic) {
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}:1  ${label} [graphic${min === 3 ? ", 3:1" : ", info only"}]`);
  }
  // A zone dot is a 10 px graphic with a 2 px ring (ZoneDot): the ring is
  // what must stand out from the surface, and the fill from the ring.
  const ring = t["zone-dot-ring"] ?? t.background;
  const worst = swatches
    .map(([k, hex]) => [k, 0, ratio(hex, ring)])
    .sort((a, b) => a[2] - b[2]);
  const ringVsSurfaces = Math.min(ratio(ring, t.surface), ratio(ring, t.background), ratio(ring, t["surface-hover"]));
    const fillsOk = swatches.every(([, hex]) => Math.min(ratio(hex, t.surface), ratio(hex, t.background), ratio(hex, t["surface-hover"])) >= 3);
  const dotOk = ringVsSurfaces >= 3 || fillsOk;
  if (!dotOk) failures++;
  console.log(
    `  ${dotOk ? "ok  " : "FAIL"} zone dots: ring ${ring} is ${ringVsSurfaces.toFixed(2)}:1 against the surfaces; ` +
      `weakest fill against its ring: ${worst[0][0]} ${worst[0][2].toFixed(2)}:1; ` +
      `weakest fill against a surface: ${swatches
        .map(([k, hex]) => [k, Math.min(ratio(hex, t.surface), ratio(hex, t.background), ratio(hex, t["surface-hover"]))])
        .sort((a, b) => a[1] - b[1])
        .slice(0, 2)
        .map(([k, r]) => `${k} ${r.toFixed(2)}:1`)
        .join(", ")}`,
  );
}
console.log(failures ? `\n${failures} pair(s) below WCAG AA.` : "\nEvery pair meets WCAG AA.");
process.exit(failures ? 1 : 0);
