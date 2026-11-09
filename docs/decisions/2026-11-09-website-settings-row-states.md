# Settings → Website: three states, and why the create button is not here (#ipf1z)

**Decided in the stream, 2026-11-09.**

## What changed

`src/lib/site/content.ts` gains `readSiteContent()`, which returns `ok`, `missing` (no error, zero rows)
or `failed` (with the database's message). `loadSiteContent()` is now a thin wrapper that returns the
content or `null` exactly as before, so all ~30 public callers keep degrading quietly. Only
`src/app/admin/website/page.tsx` uses the three-way read, in both its full and its draft-only paths.
The screen prints `nothingSetUp` (muted, English and Thai) for a missing row and
`couldntLoad: <message>` (red) for a failed read.

## Why part (b), the create button, is not built

The brief gives this stream no migration slot, and the button cannot work without one. `site_content`
has RLS on and only a `select` policy and `admin_update_site_content` (0018, rewritten by 0153/0163 to
`has_permission('website.content')`); no migration has ever added an `insert` policy. A signed-in login's
insert is refused. The two other routes are worse: a service-role call site needs a new entry in the
hard-coded-security registry, and a `security definer` function is also a migration.

The follow-up is one small schema PR: an `insert` policy on `site_content` with
`check ((select has_permission('website.content')) and id)`, then the button, drawn only when
`can(perms, "website.content")`, the activity `updateSiteContent` asks, inserting `id = true` and nothing
else so the singleton holds.

## Part (c)

When this stream read dev, `site_content` already held its row and `public_site_content` returned it, so
the data step had been done by someone else. This stream inserted nothing (its attempt failed on a
column 0018 no longer has, which is also why the 0018 seed cannot simply be replayed today).

## Not done here

The empty state could not be driven in the browser without deleting Test's row while an outside tester
uses it; the three states are covered by `src/lib/site/content-read.test.mjs` instead.
