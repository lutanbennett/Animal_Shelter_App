# The browser-pane entry, the aal1 list, and the owed `roles.is_admin` note

2026-10-28, stream `docs-truth-and-owed-note`. Docs plus one release-note line.

## What changed

1. **`CLAUDE.md`, new subsection "The built-in browser pane lies about pages you load by their address"**
   under *Getting a signed-in dev session*: the direct-load failure and its mechanism, the
   `requestAnimationFrame(()=>0)` test, click-through as the fix, plain-GET submission as a symptom,
   the hidden pane stopping painting (a `screenshot` wakes it), and the 800x600 screenshot frame
   against a 1024x768 page with `element.click()` as the way round. The `dev-signin.mjs --cards`
   re-keying fact sits beside the sign-in limits.
2. **The aal1 sentence is now two lists, dated 2026-10-28.** Re-driven by clicking through, with
   `requestAnimationFrame` confirmed firing (it read `never` on the hidden pane and `fires` after one
   `screenshot`, which re-proves the hidden-pane fact):
   - Page loads at aal1: `/management/purchasing`, `/admin/who-does-what`, `/admin/diets`.
   - `/admin/security` redirects to `/admin/security/verify` ("Set-up isn't open yet").
     `n/a: aal2 required, no authenticator`.
   - Actions: Purchasing's Print and Download CSV are present (not pressed). **Delete role was not
     pressed here**: it deletes from the shared dev database, so the claim that it wants the
     authenticator code is #1014's, cited as such. Diets edits were not pressed.

   The 2026-10-22 reading listed `/admin/security` as reachable. We cannot tell from here whether it
   was ever true at aal1 or was narrowed afterwards; that reading has a timestamp and so does this one.
3. **`unreleased` gained the `0275` line** (card tag `who_does_what`). It is true now: `0275` has been
   on production since 2026-10-27T17:57:23Z.

## Proposal: a marking pass on the fault log and `pending:` lines (not run, not started)

Counts measured 2026-10-28 with `grep`, so they are bounds and not a finding:

- `docs/card-access-faults.md` has **248 table rows** (lines starting `| `). **14** mention the pane,
  hydration, a plain GET, "dead" or "nothing happened". Those 14 are the candidates; the rest are not
  suspect on this evidence.
- Test plans: **1239** `pending:` lines across `docs/test-plans/`. **70 lines in 47 files** mention
  browser, signed-in, session, pane or hydration. Most will be honest "needs a person" lines; none says
  "does nothing" or "dead" outright, so the artefact is probably rare there.

A marking pass would: (1) for each of the 14 rows, check whether the stream drove the page by direct
address and whether `requestAnimationFrame` was ever tested; (2) re-drive the page by click-through
with the pane awake, in a stream of its own; (3) put one word in the row's existing column,
`pane-artefact`, `confirmed` or `not re-checked`, never delete a row; (4) leave #1001's row (pointer
written by #1017) alone. Lutan reviews the marked log as a set, which is gate 3 of Card review 2.
**The log was not edited by this stream.**

## Found, not fixed

- Other behaviour claims in `CLAUDE.md` were not searched beyond the aal1 sentence. A later stream
  should grep it for other undated behaviour claims and consider moving the aal1 list into a check,
  as the backlog item suggests.
- Who does what's Delete role button is not on the page's first view (no button matching
  delete, save or add at load), so a brief asking for that press should say where it is.

## The general lesson for the release-note rule

When the outstanding step is a command (a migration apply, a Worker deploy, a Pi rebuild, a hand
edit), nominate who carries the note when the step is named, or it falls between the command and the PR.
