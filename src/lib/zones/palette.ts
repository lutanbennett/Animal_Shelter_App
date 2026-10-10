/**
 * The zone colours on offer in Settings → Zones (zones.colour, 0162). A fixed
 * palette, not a colour wheel, so zones stay distinct from each other and the
 * dot reads on every surface the app draws on.
 *
 * Checked 2026-10-08 against all six of the app's dark surfaces (production
 * #121212 / #1c1c1e / #262629, dev and Test #0e1615 / #172221 / #1f2d2c): the
 * lowest is brown on dev's hover row at 4.5:1, above the 3:1 a graphic needs.
 * The public site is light but shows no zones. The light colour theme
 * (2026-10-10) is where white (1.0:1 on white) and sand fail as fills, so there
 * the dot's ring is dark (--zone-dot-ring, 8.6:1 against every light surface)
 * and the ring, not the fill, is what you see the dot by. The dark themes ring
 * it in the page background (ZoneDot), which keeps it visible on a filled chip
 * such as an active zone filter. `node scripts/check-theme-contrast.mjs`
 * re-checks all of this for every theme; the colours were not re-picked.
 *
 * The database checks only the `#rrggbb` form, so a swatch can be retuned here
 * without a migration; rows holding an old value still show their dot, just
 * without a swatch name (docs/decisions/2026-10-08-zone-colour-schema.md).
 *
 * Sand and white are in the palette although the backlog item's list of ten
 * left them out: the site already calls the House Zone sand and the Front Zone
 * white (docs/decisions/2026-10-08-zone-colour-palette.md).
 */
export const ZONE_SWATCHES = [
  { key: "blue", hex: "#4a90ff" },
  { key: "green", hex: "#34c759" },
  { key: "yellow", hex: "#ffd60a" },
  { key: "orange", hex: "#ff8a1f" },
  { key: "red", hex: "#ff5a4f" },
  { key: "pink", hex: "#ff7ac2" },
  { key: "purple", hex: "#b78cff" },
  { key: "brown", hex: "#b8865b" },
  { key: "grey", hex: "#9a9aa3" },
  { key: "teal", hex: "#2fc6c6" },
  { key: "sand", hex: "#dcc79c" },
  { key: "white", hex: "#f2f2f2" },
] as const;

export type ZoneSwatchKey = (typeof ZONE_SWATCHES)[number]["key"];

const HEX = /^#[0-9a-f]{6}$/i;

/** The colour as stored, or null when it is not a `#rrggbb` the dot can draw. */
export function zoneColour(value: string | null | undefined): string | null {
  return value && HEX.test(value) ? value.toLowerCase() : null;
}

/** The palette swatch a stored colour matches, ignoring case; null when it is off-palette or unset. */
export function swatchFor(value: string | null | undefined): ZoneSwatchKey | null {
  const hex = zoneColour(value);
  return hex ? (ZONE_SWATCHES.find((s) => s.hex === hex)?.key ?? null) : null;
}

/**
 * What a form posted, checked: a `#rrggbb`, or null for No colour; undefined
 * for anything else, which the action refuses. Off-palette hexes pass, as the
 * database's constraint lets them: the picker offers only swatches, and a
 * zone already holding an older shade must still save when only its name is edited.
 */
export function parseZoneColour(value: FormDataEntryValue | string | null | undefined): string | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  return zoneColour(value) ?? undefined;
}
