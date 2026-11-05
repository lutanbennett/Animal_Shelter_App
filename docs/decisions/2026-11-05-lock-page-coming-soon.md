# The locked landing page: "under construction", the site's colours, the poodle

**2026-11-05, backlog item `#8jq4t`.** The day after the cutover Lutan saw `lannacareforanimals.org` greet the public with "Staff testing site" in the app's dark orange. His words: *"change the wording on the lannacareforanimals.org home page (lock page) to Site is coming soon"*, *"make it casual"*, *"make the color scheme the same as the website"*; then, settling the tone, *"softer and more public friendly with a message like this site is under construction and will be available soon"*. The softer sentence is what was written.

## What changed

- **Words** (`login.locked` in `en.ts` and `th.ts`): "Our site is under construction" / "We're busy putting it together, and it will be available soon…". The brief's draft was used unchanged.
- **Colours: one attribute.** `data-public-site` on the page's `<main>`. `globals.css` already repoints the generic tokens (`--background`, `--primary`, ...) and the body font at the `--site-*` palette for any page carrying it, and `LockedLanding` used only generic tokens. So no class changed and `globals.css` was not edited for colour. Preferred over new CSS because the palette's contrast ratios are checked pair by pair, and because going through `--site-*` keeps the dev/UAT tint (teal action, green-cast cream), so a test site is never mistaken for the live one. No hex was hard-coded. `grep data-public-site src/` showed only the public header, the loader and `globals.css` keying off it; none is affected by a page opting in.
- **Illustration.** `PuppyConstruction` (hi-vis jacket, hard hat, cone, in the house poodle style) **replaces** the logo in a white circle. Reason: the circle was an app-palette artefact and the scene is the site's own voice; the shop name stays as the `<h1>`, so branding is not lost. It is decorative (`aria-hidden`), and with it removed the title and body still carry the whole message. Still reads nothing from the database and loads no photo.
- **One wording on all three locked sites** (production, UAT, test). "Coming soon" is true on each, and the colour tint already says which site it is. No environment-keyed copy.
- **Manual**: line 95 named the old page and now names the new one. The Public viewer paragraph ("while the testing sites are closed to the public") is about that account and is still true, so it is unchanged.

## Thai is unreviewed

The Thai was written by Claude and nobody on the project reviews Thai before merge. It is listed in the test plan's manual table.

## Action controls (CLAUDE.md button rule)

Sign in, the language toggle and the Privacy link. None is card-gated: this page is what a signed-out visitor sees, so nobody holds a card.

## Found, not fixed

`src/lib/public-site.ts` and `.env.local` were not touched (cutover stream's). `PUBLIC_SITE=locked` was set locally in `.env.local` only to view the page.
