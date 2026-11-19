# 2026-11-20 — the website switch moves onto the shelter (#wbsof)

**Decided by the item itself ("nothing to decide"); built on `claude/public-site-per-shelter`.**

## What changed

- `shelters.public_site` (`0426`): `'open' | 'locked' | 'off'`, **default `'locked'`**, so a brand-new shelter has strangers out until
  someone opens it. Lanna's existing row is set to `'open'` once, when the column is first added, so `PUBLIC_SITE` alone keeps governing
  it as before. Not seeded in `0416` (that seeds `site_content`; the column default does this one).
- `resolve_shelter_site(p_host)` returns `{id, site}` in the same call the Worker already made (`resolve_shelter_host` stays).
  `worker/shelter.mjs` caches both for the same minute and forwards `x-public-site`; it deletes any inbound `x-public-site` and
  `x-shelter-id`, and sends none for a front-door/unknown host or an unrecognised value.
- `src/lib/public-site.ts` is now pure: `publicSiteStateFor(shelterValue)` returns the **more closed** of the deployment floor
  (`PUBLIC_SITE`) and the shelter's value. A shelter can close itself further, never open past the floor (tested, including `off`
  floor with every shelter value). `getPublicSiteState()` (`public-site-request.ts`) reads the header per request.
- The Worker edge cache is **skipped for a shelter that is not open**, so a page cached while open cannot outlive the switch by the
  10-minute edge TTL. Cost: a locked shelter's signed-out sign-in landing is no longer edge-cached (locked shelters get little traffic).

## The seventeen `PUBLIC_SITE` readers

| File | Outcome |
|---|---|
| `src/lib/public-site.ts` | per-shelter (floor + shelter value) |
| `src/lib/public-paths.ts` | no change: pure, takes `locked`/`off` from its caller (comment only mentions the variable) |
| `src/lib/site-origin.ts`, `src/lib/site/share.ts`, `src/app/admin/status/actions.ts`, `src/app/auth/callback/route.ts` (origin part) | no change: they read `NEXT_PUBLIC_SITE_URL`, not `PUBLIC_SITE` |
| `src/lib/auth/require-role.ts` | per-shelter, by a different route: `refuseFor` is synchronous and `never`-typed, so it now sends a non-app login to `/` and the proxy (which has the state) forwards it to `/no-access` when off. One extra redirect, cannot loop |
| `src/app/page.tsx`, `src/lib/auth/app-access.ts` (`signedInLandingPath`, new `site` argument), `src/app/auth/callback/route.ts`, `src/app/login/actions.ts` | per-shelter |
| `src/app/robots.ts`, `src/app/sitemap.ts` | per-shelter (named in the done-when) |
| `src/lib/supabase/proxy.ts` | per-shelter (reads the header off the request) — covers the signed-out path list and the `noindex` header |
| `worker/index.mjs` | per-shelter cache bypass (above) |
| `scripts/check-env-leak.mjs`, `scripts/deploy.mjs`, `scripts/lib/env-leak.mjs`, `scripts/lib/runtime-config.mjs`, `scripts/pi/write-env.mjs` | stay deployment-level: they are about the variable itself (the floor) |

## Cost of the extra read

**No extra database read.** The state rides on the host lookup that was already made and cached for 60 s per host per isolate, so a
cache hit does the same zero subrequests as before and a miss still does one. Added Worker work on every request: one extra
`headers.delete`/`set` and reading `row.id`/`row.site` from the cached object. Measured: `withShelter` on a cache hit, 200,000 calls
x 5 runs, old and new interleaved, **machine load 73% CPU with other streams building**, so only the order of magnitude is defensible:
both are **~8-35 microseconds per request** and indistinguishable. Against the free plan's 10 ms CPU per request that is under 0.5%.
`#egq18`'s per-host public-page measurement is unaffected. Not measured: a real Worker (no deploy from here).

## Things to know

- **Nothing in the app sets the column yet.** It is changed by SQL (or the platform console later). A control is a separate item.
- **Production owes `0426`** before the Worker that sends `x-public-site` is deployed to it (the new RPC must exist or the lookup
  fails, which sends no header and no rows). Apply first, then deploy. Production stays `locked` by the floor either way.
- Lanna's row is `open`: the day production's `PUBLIC_SITE` is removed to launch, Lanna's website opens with it, as today.
- Not driven in a browser (no Worker in `next dev` to send the header; the unit tests cover the decision and the real RPC was
  called on dev for a known host, an unknown host and the shelters list).
