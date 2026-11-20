# 2026-11-20 — A Worker setting its host lookup needs is declared in the registry (`#uatsb`, registry half)

## Shape chosen

`scripts/lib/runtime-config.mjs` already had a shape for a wrangler.jsonc var: `source: "wrangler"`
(PUBLIC_SITE, APP_HOST, PUBLIC_HOST, PLATFORM_HOST; all `where: "pi"`). `SUPABASE_URL` follows it with
`where: "worker"`, and two new optional fields, `routed: "required"` and `distinct: true` (plus `needs`,
the consumer named in the failure message). No fourth kind of entry. `check-runtime-config` rejects
`routed`/`distinct` on anything that is not a wrangler var.

New exports: `WORKER_WRANGLER_VARS`, `WORKER_ROUTED_VARS`. `scripts/lib/site-hosts-problems.mjs`
loops over `WORKER_ROUTED_VARS` instead of carrying #1765's hand-written SUPABASE_URL rule, so both of its
guarantees (missing on a routed environment; shared between environments) fall out of the registry. The
next setting that gains a second Worker consumer is one registry line.

## Missing versus not applicable

An environment is held to a routed-required setting only if it answers on a route (it can be reached),
and only for settings the registry marks `routed: "required"`. `test` and `uat` set no `PLATFORM_HOST`
and are not blamed, because PLATFORM_HOST is not marked. An environment with no routes owes nothing.

## Before and after: nothing a deploy pushes changed

`WORKER_REQUIRED_SECRETS`, `WORKER_OPTIONAL_SECRETS`, `PI_REQUIRED`, `PI_OPTIONAL`, `PI_WRANGLER_VARS`,
`PI_FORBIDDEN`, `SCRUB_NAMES` and `WORKER_BUILD_VARS` printed byte-identical before and after (`diff`
empty). **The brief expected `WORKER_BUILD_VARS` to gain this one name. It does not, deliberately:**
`next build` does not inline `SUPABASE_URL`; it is a run-time Worker var read from wrangler.jsonc, and
the name is not in `NEXT_PUBLIC_*`. Adding it to the build list would put a value in the build shell that
nothing reads. `deploy.mjs` needed no edit.

## Proof it fails

`scripts/check-site-hosts.mjs` fixtures, asserted by message:
- uat without it: `uat sets SUPABASE_URL, which its host lookup (worker/shelter.mjs resolveShelterSite) needs`
- uat sharing production's: `production: its SUPABASE_URL is its own (shared with uat)`
- a registry entry added later that no environment sets is caught with no new rule code.
- uat with no PLATFORM_HOST, and an unrouted environment without SUPABASE_URL, are not blamed.

No value in wrangler.jsonc, no env file and no deploy was touched.
