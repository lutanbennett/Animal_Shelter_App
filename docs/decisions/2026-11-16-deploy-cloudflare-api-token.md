# `deploy.mjs` can authenticate wrangler with an API token instead of the expiring OAuth login

**2026-11-16, after `0.47.1`.** Lutan asked for it directly — *"yes make deploy.mjs use a Cloudflare
API token"* — having just paid for the problem it fixes.

## The problem, measured rather than assumed

`scripts/deploy.mjs` passed **no** Cloudflare credential at all. Every deploy of all three
environments rode on wrangler's interactive OAuth login, whose access token is short-lived, against
a command that takes a ten-minute build and then uploads.

On `0.47.1` Lutan's production deploy died at the upload:

```
X [ERROR] A request to the Cloudflare API
    (/accounts/.../workers/scripts/lanna-animal-care/versions) failed.
  Authentication error [code: 10000]
  errorType: AuthenticationError        durationMs: 138668
```

**The cause was established from a timestamp, not inferred:** wrangler rewrote
`…/.wrangler/config/default.toml` at **16:47:03**, the same second the deploy errored, and
`wrangler whoami` authenticated immediately afterwards. So the access token expired mid-upload and
refreshed on its way out. **The token was never short of a permission** — `whoami` shows it holds
`workers (write)` and `workers_scripts (write)`.

Nothing was half-deployed (the failure was on the POST that creates a version) and the plain retry
worked. **The cost was one extra ten-minute run by the one person whose only job in a release is
that command**, on a release whose target is two touches. Recorded as defect 1 of
`docs/releases/2026-11-16-0-47-1.md`.

**Wrangler's own advice was wrong and was not taken.** It printed *"run `wrangler login` to refresh
your token"*, but that warning names the scopes `k2.read` / `k2.write`, which nothing in this app
uses, and the token had already refreshed itself. Reading the timestamp beat taking the remedy the
tool offered — which is the general rule in `CLAUDE.md`, and this is a worked example of it.

## What was built

**Opt-in, per environment, and the default is unchanged.** `deploy.mjs` reads
`CLOUDFLARE_API_TOKEN` (and optionally `CLOUDFLARE_ACCOUNT_ID`) and hands them to wrangler. With
neither set, wrangler uses its own OAuth login exactly as before, so **no environment is required to
have a token and nothing breaks before one exists.**

Four decisions worth keeping:

- **They are `ACCOUNT_KEYS`, not a new mechanism.** `scripts/lib/env.mjs` already has a list for
  *"keys that say WHICH ACCOUNT a script acts as, not how it behaves"*, built on 2026-11-08 when the
  shell's Supabase token for the first account beat UAT's file and every UAT read failed. A
  Cloudflare token is the same kind of thing, so both keys joined that list and an environment's own
  file beats the shell. The alternative — hand-rolled precedence inside `deploy.mjs` — would have
  been a second mechanism doing the same job, which is the thing `CLAUDE.md` warns about.
- **The credential goes to wrangler and to nothing else.** It is deliberately not in `buildEnv`: a
  deploy-time credential has no business in `next build`'s environment, so it cannot be inlined or
  baked in however the adapter changes. `strip-baked-env.mjs` empties the baked snapshot anyway, but
  that snapshot is written from `.env*` rather than `.env.deploy.*`, and only one of those two facts
  is guaranteed to stay true.
- **Every deploy prints which credential it is using**, and `--plan` shows it before anything is
  built. That line is the point as much as the token is: the next `code: 10000` is one line away
  from being explained instead of being guessed at for 45 minutes.
- **The line names the layer the value actually came from**, because the first draft of this got it
  wrong. It read the *merged* environment, which cannot tell a value in the environment's file from
  one exported in the shell, and so reported a shell-only token as *"API token from .env.local"* — a
  line that would have sent the next reader to the wrong file. It now reads the layers
  (`loadLayers`) and says `the shell`, `.env.local` or the environment's own file. **Found by
  testing the case that looked least interesting.**

## The token to create, and where it must not go

Cloudflare → **My Profile → API Tokens → Create Token → Create Custom Token**:

| Scope | Permission | Why |
|---|---|---|
| Account | **Workers Scripts → Edit** | the upload itself, the version, the assets and the cron triggers |
| Account | **Account Settings → Read** | wrangler reads account membership before deploying (it prints it) |
| Zone | **Workers Routes → Edit** | the custom domains — `lannacareforanimals.org` and `www.` for production, `uat.lannacare.org` and `test.lannacare.org` on the `lannacare.org` zone |

Zone resources: **both zones**, `lannacareforanimals.org` and `lannacare.org`. The Worker's own
bindings (`ai`, `assets`, `send_email`) need no token permission to deploy. **Not a Global API
Key**, which can do everything to everything and cannot be scoped.

**If wrangler names a missing permission, add exactly that one and nothing more** — this table is
what a deploy of *this* Worker needs today, read from `wrangler.jsonc`'s bindings and routes, not a
general recipe.

**One token for all three environments, not three**, and the reason is a limitation worth knowing:
**`Workers Scripts → Edit` is an ACCOUNT-level permission and cannot be narrowed to one Worker.**
Any token that can deploy production can also deploy test and UAT, so three tokens would buy
isolation only on the zone-routes half while tripling the copies of a secret. This is unlike
`CLOUDFLARE_PURGE_TOKEN`, where per-zone scoping is real and UAT deliberately got its own
(`#prg4z`): there the permission *can* be narrowed, so it was.

**It goes in `.env.deploy.production` and `.env.deploy.uat`, and NOT in `.env.local`.**
`scripts/worktree.mjs new` copies `.env.local` into every worktree it creates, so a token there
would be duplicated onto disk once per workstream and would outlive each one until the folder was
removed. Test's deploys are Claude's and a retry costs nobody's attention, so test keeps the OAuth
login on purpose.

## What this does not do

- **It does not make a token required.** No guard refuses a deploy without one; the OAuth login
  stays a first-class path, named in the output when it is in use.
- **It does not touch the Pi**, which has no Cloudflare credential and must not get one — it is the
  internet-facing box (`scripts/pi/guard-release.mjs` exists for the same reason).
- **It does not change `purge-cache.mjs`**, which has its own correctly-scoped
  `CLOUDFLARE_PURGE_TOKEN` per zone. Do not merge the two: cache purge *can* be scoped to one zone
  and deploying cannot, so giving the purge the deploy token would widen it for no gain.
- **It does not stop a token expiring**, only a token expiring *mid-build*. An API token with an
  expiry date set will still stop working on that date — so either leave the expiry unset or put the
  date in the Desktop notes beside the purge token's, which expires 2027-12-31.
