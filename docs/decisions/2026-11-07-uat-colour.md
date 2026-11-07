# UAT gets its own colour: blue-indigo (2026-11-07)

Backlog `#o1v9f`. Lutan, 2026-11-06: test green, UAT different, prod orange; *"It can be a different colour eg blue - just needs to be different to prod"*. This **reverses** the old rule in `src/lib/app-env.ts` that UAT wears production's exact colours; the comment there now quotes the superseded sentence and says so.

## The hue, and why

Blue-indigo, accent `#7c8cff`. The brief freed the hue and recommended blue: it is far from production's orange, from test's teal and from `--danger` red, so nothing had to be traded off. Red was not taken, so no delete-button/error-message trade was needed. A delete button and error notice keep `--danger` (`#ff453a`, light themes `#b42318` and `#c0261a`), which the UAT block never touches. Checked by reading the tokens: under `data-env="uat"` the computed `--danger` is the same as under production.

## What changed

- `globals.css`: a `:root[data-env="uat"]` block beside **both** `dev` blocks, the app tokens (blue-cast surfaces, indigo primary) and the public site's `--site-*` values (blue-cast cream, indigo action, indigo footer link). Both are placed before the theme blocks, so a chosen theme still wins in the app, exactly as dev's teal does.
- `AppHeader.tsx`: UAT badge now indigo (it was `#ff9f0a`, production's accent) and `strip: true`, with an indigo diagonal strip in fixed colours no theme can touch.
- `app-env.ts`: header comment rewritten, old sentence quoted and marked superseded.
- `scripts/check-theme-contrast.mjs`: see next section.

## The contrast check

The planner's worry was that the check keys on the dev block by name. Established by running it: it did ignore a `uat` block (UAT would have gone unchecked), and its list of "tokens a theme must set" (`devOnly`) came from dev alone. Now it builds a `dark (uat)` column from the default plus the UAT block, and `devOnly` is the union of the dev and UAT token names. Every existing theme (light, contrast, magenta) already sets all of those tokens, because the UAT set is the same as dev's, so **no theme needed editing**. Result: `Every pair meets WCAG AA`, `dark (uat)` included.

The zone-chip accent distance is ΔE 5.2 from the Blue zone. The default (5.0 from Orange) and dev (4.5 from Teal) are already exempt for the same reason, so `dark (uat)` is exempt and reported `KNWN`. **Found, not fixed:** if that is unwelcome, the accent could move toward a violet-blue, but that gets nearer the Purple zone swatch. The zones do not move to suit an app colour (`#a4ei2`).

## Rendering a UAT build locally

`getAppEnv()` answers `uat` from the Supabase project ref or the `NEXT_PUBLIC_APP_ENV` pin; a plain dev server answers `dev`. I did **not** build with the pin. I set `data-env` by hand on `<html>` in the browser pane and read the computed tokens on the public home page for every theme × environment (default, light, contrast, magenta × uat, dev, production).

## What was proved and what was not

- Proved, public page (`/`, signed out): under `uat` the public tokens are indigo (`--primary #3f4fd0`, background `#eceff8`), `dev` still teal (`#0f6b63`), production still terracotta (`#b4461f`), the same under every theme, which is correct because the public site ignores the app themes.
- Proved by the contrast check: the UAT app tokens pass AA; the three other themes are unchanged.
- **Not done:** a signed-in app page looked at on screen under each theme with the strip drawn, a delete button and an error message seen together, and a read of the live zone colours (`zones.colour`) on dev. The zone swatch palette (`src/lib/zones/palette.ts`) was read instead, which is the set a zone can hold. These are listed for a person in the test plan.
- Test and production colours: the diff only adds `uat` blocks and changes the UAT badge and strip; no `dev` or `:root` line was edited.

## Release notes

None: UAT only, and nothing is live until Lutan does the Pi side (`#uat7p`).
