# Each person picks the app's colours; the dev marker moves off the colour tokens

2026-10-10, `claude/user-colour-theme`. Backlog: "User preferences: pick a colour theme"
(requested by Lutan 2026-09-23).

## What shipped

Four themes, picked under **Colours** in the account menu (the header's name · role
button), beside *Your name and password*:

| Theme | Why it is in the set |
|---|---|
| **Dark** (default) | Today's look: dark surfaces, the brand orange. No attribute, no CSS block of its own. |
| **Light** | The one people ask for: readable in sunlight, which is most of the shelter's day. |
| **High contrast** | Black, white and a high-visibility lime; every text pair is 7:1 (AAA), borders 3:1+. |
| **Magenta** | The "alternative accent" the item asked for, on the default dark surfaces. |

Each is a `:root[data-theme="…"]` block in `src/app/globals.css` redefining the tokens
every component already reads. The set is deliberately small: every theme is a contrast
matrix to maintain.

## The theme is saved on the login and rendered by the server

The choice lives in the person's own `user_metadata.theme`, written through their own
session (`src/app/account/theme/actions.ts`). It is a preference, not a permission, so a
user editing their own metadata is correct, and it needs no table and no migration.

The root layout reads it and writes `data-theme` into the `<html>` tag of the **first
response**. So there is no flash of the default, a second device gets the theme on its
first page, and a browser with cleared storage still gets it. The item expected
`localStorage` as a no-flash cache; server rendering makes it unnecessary, and there is
no cache to go stale. One cost to name: the layout now needs the signed-in user. It
shares one `getUser()` with `AppHeader` per request through `getCurrentUser()`
(`src/lib/auth/current-user.ts`, React `cache()`), so the request makes no more auth
calls than before.

Signed out (the sign-in page, the public site) is always the default. The public pages
keep their own cream look even for a signed-in visitor with a theme, because the
public-site mapping comes after the theme blocks at the same specificity.

## The dev marker: Lutan chose "teal + stripe"

`:root[data-env="dev"]` recolours the same tokens teal so dev and Test are never mistaken
for production. A theme redefines those same tokens and, coming later in the file, wins.
So a theme would silently remove the signal, and the failure is the expensive kind:
somebody edits real animals believing they are on Test.

Options put to Lutan on 2026-10-10:

1. **Teal + stripe (chosen, and what was recommended).** Dev keeps its teal everywhere
   under the default theme, as today. On top of that, `AppHeader` draws a strip along the
   header's top edge and the DEV badge in **fixed colours, never tokens**, so no theme can
   touch them. Someone on Light or Magenta sees their own colours on Test, with only the
   strip and badge to mark it.
2. Stripe only: dev drops the teal, and dev and production look the same apart from the
   badge.
3. A dev variant of every theme: multiplies the contrast checking by the number of themes,
   and has to be redone for every theme added.

Why the strip is striped: one solid colour cannot stand out on both a white and a black
header. Teal and near-black diagonal bands do (`#2dd4bf` / `#0b3d38`): one band is always
visible. The badge had been `bg-primary`, which a theme recolours, so it would have
turned magenta on Magenta. It is now fixed teal with a dark ring. UAT's badge is fixed
orange for the same reason.

**Do not move the marker back into the colour tokens**, and do not let a theme set the
strip or badge colours. The only marker that survives every theme is one no theme
defines. `scripts/check-user-theme.mjs` fails if the strip or the fixed badge goes missing
under any theme.

A related trap, found while building: the first Magenta set only the accent, so on dev
it inherited dev's green-cast surfaces and looked different per environment. That
combination was never contrast-checked. Every theme now sets every token the dev block
changes, and `check-theme-contrast.mjs` fails a theme that leaves one out.

## Zone colours: dots, chips and accents

The twelve swatches (`src/lib/zones/palette.ts`, chosen deliberately on 2026-10-08) were
**not** re-picked. The themes were fitted around them instead:

- **Dots.** `ZoneDot`'s ring was the page background. On a light page the white and sand
  fills are 1.0:1 and ~1.6:1 against white and simply vanish. The ring is now a token,
  `--zone-dot-ring`: the background in the dark themes as before, and `#3f3f46` in Light
  (8.6:1 against every light surface). In Light you see the dot by its ring. The admin
  colour picker's unchosen swatches use the same edge.
- **Chips.** The zone filter chips (`PlaceZoneChips`) are edged in the zone's colour. In
  Light, white, yellow and sand edges are 1.0–1.5:1, which leaves a chip that is only
  floating text. Light darkens the edge to the zone colour mixed halfway with black: same
  hue, worst case 3.96:1 (white).
- **Accents (Lutan, mid-build: "make sure they don't clash with the chip colours for the
  Zones").** The active *All zones* chip is filled with the accent, so an accent too like a
  zone colour reads as that zone chosen. Measured as OKLab distance (ΔE ×100, where under
  ~5 reads as the same colour):
  - The first alternative accent, a violet, was **ΔE 1.9 from Purple**, effectively the
    same colour. Replaced by **magenta `#e033ff`**, found by searching every hue readable
    on the dark surfaces for the one furthest from all twelve swatches *and* the signal
    colours (danger red, success green, in-progress blue, dev teal). Nearest: Purple, 15.9.
  - High contrast's first accent, a bright orange, was ΔE ~9 from Orange, Yellow and Sand
    at once, and no orange bright enough for 7:1 gets clear of all three. Replaced by a
    **high-visibility lime `#b3ff1a`**: 13.6 from Yellow, 13.4 from success green, 17:1
    on black.
  - Light's burnt orange `#a84a07` is 15.0 from Brown.
  - **Left as they are, and reported:** the default orange is ΔE 5.0 from the Orange zone,
    and dev's teal is 4.5 from the Teal zone. Both predate this work and are brand and
    environment colours. The chosen chip carries a tick and a solid fill, so colour is
    never the only sign. Changing either is Lutan's call (backlog).

The checker fails any selectable theme whose accent is within ΔE 10 of a swatch.

## Contrast is measured, not eyeballed

`node scripts/check-theme-contrast.mjs` reads the token blocks straight out of
`globals.css`, so it measures the shipped colours. It checks, for every theme and for dev:

- text pairs at 4.5:1, including tinted ones (`text-danger` on `bg-danger/10`) blended as
  the browser draws them;
- graphics at 3:1: status dots, zone dot rings, zone chip edges, the cashflow chart series;
- accent distance from the zone swatches;
- that the picker's preview colours match the CSS.

Run it after changing any colour. Two findings beyond the themes:

- The default `--danger-foreground` was white on `#ff453a`, **3.4:1** (the offline banner,
  its only user). It is now dark text, 6+:1. The public pages keep white on their darker
  red, which passes.
- Two pairs on **dev only**, 4.34:1 (danger text on its tint) and 4.47:1 (info text), fall
  just short. They predate this work, are printed as known, and are on the backlog. Nothing
  selectable and nothing in production fails.

## Generated PDFs stay unthemed

PDFs are rendered by route handlers that never pass through the layout, and the archive
HTML carries its own fixed styles. `check-user-theme.mjs` downloads the manual PDF under
the default theme and under Light and confirms the two are the same document, timestamps
aside.
