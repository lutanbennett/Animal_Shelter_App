# Two addresses, both from settings; the app picks what to serve by the address it was reached on

Decided by Lutan 2026-10-10 (the split) and 2026-10-20 (`/r/` and `/e/` on the
public address). Built on `claude/domain-split-build`.

**Decision.** The public website goes to `lannacareforanimals.org`; the staff app
stays on `lannacare.org` and later moves to a Cooper `.org`. Neither address is
written in `src/` or `worker/`: `APP_HOST` and `PUBLIC_HOST` are `vars` per
environment in `wrangler.jsonc`, read through `src/lib/site-hosts.ts`.
`docs/domain-checklist.md` lists what lives outside the code.

**How it works, and the choices that were not obvious.**

- **Equal or unset means no split.** Test, UAT and production are all set to one
  address today, so this change alters nothing a user sees. The split starts when
  `PUBLIC_HOST` differs, which is a setting change at the cutover.
- **The Pi cannot see the visitor's host.** cloudflared rewrites `Host` and
  `x-forwarded-host`. The Worker therefore also sends `x-lanna-public-host`
  (`worker/origin.mjs`) and `requestHost()` prefers it. This replaces the old
  `NEXT_PUBLIC_SITE_URL` pin (written by `write-env.mjs` and `deploy.mjs`), which
  can name only one address and would be wrong for the other. A forged header only
  re-routes the forger's own redirects.
- **Rules (`hostRedirect`, called from `src/proxy.ts`), GET and HEAD only.** Public
  address: public pages, `/r/`, `/e/`, robots, sitemap, logo and the photo route are
  served; anything else goes to the app address. App address: staff pages are served;
  public pages go to the public address. `/api/*` answers wherever it is asked, and
  Server Actions (POSTs) are never redirected.
- **Exception: the app address keeps `/` and `/privacy`.** Google's consent screen
  names the app domain's home page and privacy notice; redirecting them would put the
  sign-in client at risk for a cosmetic gain. Revisit with the consent screen.
- **Staff who scan a tag on the public address see the public card,** not the hub:
  their session cookie belongs to the app address. Accepted.
- **`allowedOrigins`** for Server Actions is the two hosts plus `www.` of each, no
  longer `*.lannacare.org`. The browser's `Origin` is always an address-bar host, so
  the wildcard (for `pi.` and `test.`) added nothing. `scripts/check-site-hosts.mjs`
  now reads the settings from `wrangler.jsonc`.
- **Tag links print the public address** (`getTagOrigin`), whichever address the page
  printing them is on.
- **Left in `src/`:** two shipped release-note entries in `src/lib/releases.ts` that
  name `lannacare.org` as history; rewriting what users were already told would
  falsify the record. `src/lib/manual/en.ts` belongs to another stream this batch and
  was not changed; a follow-up should check it for addresses.

**Not built, by instruction.** DNS, Cloudflare routes, the old address forwarding
(point (c)), the UAT address and the cutover: each is a line in the checklist.
