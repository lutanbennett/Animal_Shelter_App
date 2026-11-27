# The product platform gets a front door on test and on UAT (#pltst)

**Decided 2026-11-27.** Lutan, in his own words: *"I would prefer to replicate the product platform on
`lannacare.org`. That way we have a test and UAT environment for the product as well."* He chose both
rungs over a single extra host on test.

## Why

Until this change production was the only environment with a `PLATFORM_HOST`, so the first run of any
change to the platform/shelter split was on the live site.

## What changed in the code

`wrangler.jsonc` only:

| env | new route (`custom_domain: true`) | new var |
|---|---|---|
| test | `cooperjaidee-test.lannacare.org` | `PLATFORM_HOST` = same |
| uat | `cooperjaidee-uat.lannacare.org` | `PLATFORM_HOST` = same |

**Names.** The planner chose these: they read as the product, use the product name as one word
(CooperJaidee) and sort together. Lutan was offered them against `platform-*` and had not answered when
this was built. Changing the name is one line for the route and one for the var in each environment.

**No `www.` form.** `www.cooperjaidee.org` exists because people type it on a real domain. A test
sub-subdomain needs no `www.`, and `addressesAnsweredOn()` (`scripts/lib/deployed-hosts.mjs`) only
expects a `www.` row when that form is routed, so leaving it out does not trip `check-deployed-hosts`.

**`check-site-hosts.mjs` fixture.** It asserted that *"uat has no PLATFORM_HOST, which is correct"*.
That was true until this decision. It now removes the var from a copy and asserts that an environment
without one still passes, which keeps the original intent: the var is optional.

## How `PLATFORM_HOST` reaches the Pi (the #plhbd trap)

Nothing new was needed, and this is why:

1. `scripts/lib/runtime-config.mjs` registers `PLATFORM_HOST` as `where: "pi"`, `source: "wrangler"`,
   so it is in `PI_WRANGLER_VARS`.
2. `scripts/pi/write-env.mjs` reads **its own environment's** block
   (`readWranglerConfig().env?.[name].vars`) and writes every `PI_WRANGLER_VARS` entry that has a value
   into `.env.production.local`. `deploy-pi.sh --env test` and `--env uat` therefore pick it up on their
   next build. Nothing is set by hand on the Pi.
3. `scripts/deploy.mjs` loops over `SITE_HOST_VARS` and puts the env's values into the build shell, so
   `serverActions.allowedOrigins` includes the new host. `node scripts/check-site-hosts.mjs` checks both
   paths and prints `all right` on this branch.

**The order that matters:** the Pi build must happen **after** this merges, or a button pressed on the
new address is refused while every page loads (the #plhbd symptom). The ordinary release order (Pi
first, then Worker) gives the right result.

**The tunnel needs no change.** The Worker reaches the Pi on `ORIGIN_HOST` and sends the visitor's host
in `x-lanna-public-host`. `httpHostHeader` stays the environment's `APP_HOST`, which is unchanged.

## Should `site_url` move to the platform host? Yes on both, with a check first

`site_url` is where Supabase sends a sign-in whose `redirectTo` is not on the allow-list. On production
it is `https://cooperjaidee.org` (`2026-11-23-platform-signs-in-on-its-own-domain.md`).

**Decision: move it on test and on UAT, to match production.** UAT's job is to rehearse production, and
`#plsso`'s rehearsal is about this exact fallback: where an administrator lands when a shelter's address
is unreachable. If UAT's `site_url` still pointed at the shelter address, the rehearsal would test a
different system from the live one. Test follows for the same reason, and goes first because its stakes
are lower.

**What moving it does:** it changes only where an unlisted sign-in lands. It signs nobody out, and
sign-ins on listed addresses keep returning to their own address. The open risk is the same one the
2026-11-23 file names: if an email template uses `{{ .SiteURL }}`, invite or magic-link emails would
point at the product address instead of the shelter's.

**What it must not do:** the UAT sign-in break of 2026-11-26 was a bad write to auth config through the
API. **Change the one field, Site URL, in the Supabase dashboard. Do not use a scripted PATCH of
`config/auth`,** which re-sends the whole provider block. This stream changed no auth setting.

On the dev project (which test uses) `site_url` also catches local dev sign-ins on unlisted ports. It
was `http://localhost:3000` (recorded 2026-11-05), which was already the wrong page for every worktree
port, so moving it does not make local dev worse.

## Still to do, not by this stream

The handover checklist is `docs/domain-checklist.md` section G. In short, for each environment:
1. A front-door `shelter_hosts` row with `shelter_id` set to null.
2. Its `/auth/callback` on the allow-list.
3. The Pi build, then the Worker deploy.
4. `site_url`, after checking the email templates.
5. The proof: `check-deployed-hosts --env <env>` lists the address as ok, and an administrator saves
   something on it.

Until then `#plsso`'s rehearsal is still impossible.
