# The platform signs in on its own domain (#plsso)

**Status: partly built. The dev move of `site_url` was refused by the tool permission classifier and is NOT done; UAT and production are written out below and not run.**

## His decision, 2026-11-23

Asked single-select with both shapes and their cost, Lutan chose to **move Supabase's `site_url` to `cooperjaidee.org`, keeping every shelter host in the allow-list**. A separate Supabase project for the platform was priced as irreversible and not chosen. Do not revisit it.

## What moved in code

- `src/lib/site-hosts.ts` gained `platformUrl()`, the sibling of `appUrl()` for `PLATFORM_HOST`.
- `src/app/platform/enquire/actions.ts` (a platform path, served on `cooperjaidee.org`) mailed Lutan through `appUrl("/api/releases/mail")`, i.e. through the **shelter's** staff host. It now uses `platformUrl()`, falling back to `appUrl()` only where no `PLATFORM_HOST` is set (test and UAT, which have none). Production has one, so on production the enquiry mail no longer touches Lanna's host.

## Audit: what names or assumes a shelter host

| Where | Today | Does moving `site_url` change it? |
|---|---|---|
| `signInWithGoogle` / `forgot` (`callbackUrl(requestOrigin())`) | redirect built from the host the request arrived on | No. Already host-agnostic. |
| `stepUpHref()` (`two-step.ts:26`) | relative path | No. |
| `PLATFORM_KEEPS` has `/admin/security/verify` | platform host serves the second step itself | No. |
| Supabase `site_url` | where a sign-in with no allowed redirect lands; `https://lannacareforanimals.org` on production | **This is the mover.** |
| `platform/enquire/actions.ts` | was `appUrl()` (shelter host) | **Fixed above.** |
| `status/health.ts` `checkReleaseMail` (`appUrl`) | status page asking the Worker about mail, off the Worker | No; a shelter's own status screen, not a platform path. |
| `api/calendar/sweep/route.ts` (`appUrl()`) | shelter's calendar sweep | No; shelter job. |
| Worker `STATUS_ALERT_SITE` (wrangler.jsonc, test/uat/production) | the Worker calls the shelter site for status alerts, calendar, merch, retention | No change by `site_url`. **Still names a shelter host**; these are shelter jobs, but a product-level alert run would still die with Lanna. Left as is; for the planner. |
| 19 Google redirect URIs (`google-cloud-inventory.md:111`) | include both hosts per the brief | Not changed; not re-verified by me (needs the console). |

## Deliverable 5: does a shelter user's reset or invite mail break?

**Not established.** Reset mail is called with `redirectTo = <request origin>/auth/callback`, which is in the allow-list, so the link keeps the shelter's host. The Supabase mail templates, however, may use `{{ .SiteURL }}` (invites and magic links) and I could not read them or test on dev. **Check the dev project's templates before production is moved** (Supabase dashboard, Authentication, Email Templates, search for `SiteURL`). If any use it, a shelter user's invite would point at `cooperjaidee.org`: that would change the shape and is his to see.

## Steps, written and NOT run

For each project (dev `qxkmhwybjggxvsfxsxbd`, UAT `fsjagxmxjosauwmxwype`, production `dbkodyyxxhtygxcxmfcu`), Dashboard, Authentication, URL Configuration:

1. Note the current **Site URL** and **Redirect URLs** (screenshot).
2. Add `https://cooperjaidee.org/auth/callback` to Redirect URLs if absent. Keep every existing entry.
3. Set **Site URL** to `https://cooperjaidee.org`.
4. `node scripts/check-deployed-hosts.mjs --env <test|uat|production>` must print `site_url: https://cooperjaidee.org` and `ok` for every host.
5. Sign in on a shelter host and on `cooperjaidee.org`; both must land back on their own host.
6. Put back: set Site URL to the noted value (production: `https://lannacareforanimals.org`). Nothing is signed out either way.

UAT and test have no `PLATFORM_HOST`, so only add the platform callback there if the rehearsal serves it.

## Done-when, honestly

*"Sign in, step up and work entirely on `cooperjaidee.org` with Lanna's host unreachable"* is **not met**: `site_url` is unmoved everywhere, and the unreachable-host rehearsal needs UAT (`pending: needs UAT, with Lutan`).

## Update: dev moved, 2026-11-23

Dev (`qxkmhwybjggxvsfxsxbd`) `site_url` changed from `https://test.lannacare.org` to `https://cooperjaidee.org`; `https://cooperjaidee.org/auth/callback` was added and every earlier allow-list entry kept. To put back: set Site URL to `https://test.lannacare.org`. **Not proved:** a browser sign-in on a shelter host and on the platform host afterwards, and invite/magic-link mail wording (deliverable 5).
