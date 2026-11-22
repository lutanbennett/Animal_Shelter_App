# 2026-11-22 — Register the product site's search switch, and guard unregistered environment reads (#psreg)

**Step zero:** `PLATFORM_SEARCH` was in neither `runtime-config.mjs` nor `wrangler.jsonc` (0 and 0); every `isPlatformSearchOpen` call site passed no argument; no earlier decision or commit covered it. Not already built.

## The value: shape (a), a registered wrangler var copied to the Pi

`PLATFORM_SEARCH` is now a `wrangler.jsonc` var on production (committed value `closed`) and a `runtime-config.mjs` entry (`where: "pi"`, `source: "wrangler"`), so `write-env.mjs` copies it into the Pi's env exactly as it does `PLATFORM_HOST`.

**Why (a) and not the planner's lean, (b), a per-request header.** `PUBLIC_SITE`'s header carries *per-shelter database state* (`shelters.public_site`), which the Worker has to look up per host; that is why it needs a header. `PLATFORM_SEARCH` is a *per-deployment* constant like `PLATFORM_HOST`, which the same two pages already depend on arriving through the registry. A header would add a Worker change plus turning `robots.ts`, `sitemap.ts` and the page's synchronous reads into header reads, to guard against a Pi env file going stale, a risk that `PLATFORM_HOST` and `APP_HOST` already carry and that every Pi deploy regenerates. The cost is that a stale Pi env disagrees with the Worker until the next deploy; the failure direction is safe, because absent means closed. If a disagreement is ever seen, (b) is the next step.

**It stays closed.** The committed value is `closed`; only the exact word `open` opens it. Nothing sets `open` anywhere. Opening it is Lutan's decision (2026-11-22: "keep it closed ... until we are ready"). Test and UAT have no platform host, so they get no entry.

## The guard: `scripts/check-env-registered.mjs`, in `npm run lint`

A `process.env.X` read in `src/` (tests excluded) whose name is in neither the registry nor `wrangler.jsonc` fails. Names with a reason live in `docs/env-reads-allowlist.json`, dated, one reason per name; a record whose name has since been registered, or is no longer read, also fails, so the list cannot go stale.

**It blocks.** Reason: it needs no live state, it is green on `main` the moment it merges (the 35 names read in `src/` are all registered or ruled), and the fault it catches is silent by nature, so a report nobody reads is the failure it replaces. A new environment read must be registered in the same change that introduces it. Anyone adding a read (another stream's included) registers it or, having read what sets it, adds a reason.

## The names in neither place (the planner counted eleven; the scan finds ten besides `PLATFORM_SEARCH`)

| Name | Verdict |
|---|---|
| `PLATFORM_SEARCH` | **Real; this item.** Registered. |
| `SHELTER_ENQUIRY_MAIL_TO` | **Real; `#enqml`'s**, not fixed here. Listed under `openFaults` (printed every run, does not fail). Delete its record when `#enqml` registers it. |
| `BUILD_VERSION`, `BUILD_SHA`, `BUILD_MIGRATIONS` | Allowed: inlined at build by `next.config.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Allowed: optional fallback; `deploy.mjs` keeps it out of env files on purpose. |
| `PHOTO_CACHE_DIR`, `MIRROR_DEST` | Allowed: Pi-local, written by `write-env.mjs`; unset means off. |
| `PHOTO_CACHE_MAX_MB`, `MIRROR_SHELTER` | Allowed: optional, with defaults in code. |
| `STATUS_ALERT_SIMULATE_FAIL` | Allowed: simulation hook, dev database only. |

The scan counts 35 names in `src/`, not 37; the difference is probably test files, which the guard excludes on purpose.

## Proved, and not proved

- Proved: `PI_WRANGLER_VARS` contains `PLATFORM_SEARCH` and the production vars carry `closed`, so `write-env.mjs` would copy it. `write-env.mjs` itself refuses on Windows, so the Pi file was not written.
- Proved: `platformRobots()` is `disallow: /` with the value unset or `closed`, and allows `/platform/about` and its Thai twin only with `open` (run as a function, not in a browser).
- Proved: the guard goes red on a scratch `process.env.SCRATCH_UNREGISTERED` in `src/lib/`, and green once it is removed.
- **Not proved:** the live path. `PLATFORM_HOST` is production-only, so `/platform/about` was not driven locally, and nothing was deployed. The first proof of the value reaching the Pi is the next production deploy followed by `curl https://cooperjaidee.org/robots.txt`, which should still say `Disallow: /`.
