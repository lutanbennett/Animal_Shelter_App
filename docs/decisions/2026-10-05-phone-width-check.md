# The 375 px overflow check: a script run by hand, six roles, seeded awkward data

2026-10-05, `claude/phone-width-check`. The guard F-06 asked for and
`docs/decisions/2026-10-03-phone-width.md` deliberately did not half-build:
`scripts/check-phone-width.mjs`. It exists because two icon-button areas each
had to measure overflow and Thai wrapping by hand in the same fortnight, and one
of them found a real wrapping defect (the friend rows) that a script would have
caught.

## What it does

Starts nothing itself (it needs `node scripts/worktree.mjs dev` running) and
refuses any Supabase project but dev. For each role and each language it opens
every page in its list at 375 px in headless Edge/Chrome (`playwright-core`, as
`manual-screenshots.mjs` does), waits for the page to stop streaming, and fails if
`scrollingElement.scrollWidth` exceeds `clientWidth` by more than a pixel. It then
prints the deepest boxes whose right edge is past the viewport and that no
scrolling or clipping ancestor contains, with a short selector path and their
text: `Page X overflows by 117 px at div > a > h3 "Blue Enclosure 3…"`, which is
what gets fixed.

## Red means something is scrolling

The `test-plan` check was designed so a red is always someone's mistake. This
follows it. A page the role cannot open (redirected, 404), a page that errors, or
an element it cannot measure is printed as `skipped` or `warning` and does not
fail the run. Exit 0 = nothing overflowed, 1 = something did, 2 = it could not
run (no server, not the dev project). Elements inside an `overflow-x: auto` table
or a fixed-position bar are not counted: they scroll on their own or do not scroll
the page.

## Where it runs, and where it does not

By hand, and in the release smoke test (`docs/release-smoke-test.md`, *Before the
deploy*). Not in `npm run lint`, not in `scripts/gates.mjs`, not in CI. The gates
run on every push from every stream, and a check that needs a server, a browser,
a database and seeded rows would make them slow and flaky. A guard that is
sometimes red for reasons nobody can act on is a guard that is switched off.

## Roles: six, and why

`admin`, `management`, `staff`, `vet`, `volunteer` and `head_of_medical`.

- **admin, management, staff** have the widest page sets, and staff are about 100%
  on phones (2026-10-03). Between them they open nearly every page.
- **vet** and **volunteer** open different, narrower sets (a vet's own screens, the
  volunteer's R1 set) and see different nav entries, so a page only they reach is
  covered.
- **head_of_medical** stands for the configured roles (Head of Medical,
  Head of Maintenance, the 2IC): a role assembled from jobs, whose nav is built
  from what it holds. One is enough because they all go through the same
  permission path; the 2IC and Head of Maintenance add no page the others do not.

A role that cannot open a page cannot overflow it, so the page list is the same
for every role and a redirect is a skip. Each role's own nav links are added to
the list at run time, so a page added after the list was written is still visited.
All eight would add about a third to the run and, from the pages involved, no new
pages. **What this misses:** a page reachable only by a role not on the list, and
roles' differing *data* (a role that sees a longer string than another).

## How the role accounts are made

The same way the per-role dry runs do it, and without reading
`DEV_TEST_USER_PASSWORD`: the service role creates a login per role
(`phonewidth-<role>-<tag>@example.invalid`, a random password made for this run),
gives it a `user_roles` row (a configured role by `role_id`), and signs in through
the app's own `@supabase/ssr` client, so the cookies are exactly the ones the app
sets. Those are handed to Playwright. Everything is deleted at the end, whether or
not the run passed (`--keep` leaves it for a look). It cannot reach pages that need
2-step (`/admin/security`, aal2), which redirect and show as skipped.

## The data is part of the test

Short dev names pass while the real site fails, so the script seeds rows named
`ZZ Width <tag> …` with deliberately awkward strings: a zone and an enclosure
called "…Blue Enclosure 3 (Hallway Small Dogs Only, near the old laundry)", a vet
whose clinic is "…(CMCAH) Faculty of Veterinary Medicine", a contact with a long
name, email and address, a resident with a long name and breed in that enclosure,
and a second resident in hospital so the Return from hospital page opens. They are
removed at the end. It does not seed Thai-length strings; the Thai run measures
the app's own Thai labels against the English data.

## The page list

The F-06 regression set first (Enclosures, Vets, Deliveries, Intake, Edit resident,
Return from hospital, Rehome, a vet's page, Contacts, Book vet visit), then the
other day-to-day screens, then management and admin. Pages not in the list are
found through each role's nav.

## What it deliberately does not do

- **Other widths and heights.** Only 375 px (the narrowest phone we design for).
- **Horizontal overflow inside a component** that scrolls on purpose.
- **Pages behind records it does not create** (a pending adoption, a stocktake in
  progress, a delivery with a photo). Add the record to `seed()` when a page like
  that is found to overflow.
- **44 px tap targets.** Two icon-button areas measured those by hand in the same
  browser session, and a third is coming. It is nearly free to add the same way
  (`getBoundingClientRect` on `a, button, input, select`); it was left out because
  the item asked for overflow and a tap-target rule would need its own decisions
  about which controls are exempt. It is offered, not built.
- **Fix the pages.** The first run's findings are on the backlog, not in this PR.
