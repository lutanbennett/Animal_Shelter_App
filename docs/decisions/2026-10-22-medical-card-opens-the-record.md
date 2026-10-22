# Medical records card opens the whole record, read-only outside the medical sections

**Status: ruled by Lutan 2026-10-22; NOT BUILT. Blocked on a schema change (see "Why it stopped").**

## Ruling (Lutan, 2026-10-22)
The Medical records card opens the **full** resident page. Medical sections (visits, procedures, blood
tests, prescriptions, immunizations, weight, diet, archive) are editable; name, location, intake details
and history are **visible but not editable**. Judging a medical record needs the history around it.

## What was found (dev `roles`, read 2026-10-23)
- `/residents/[id]` redirects to `/r/<id>` when `readsWhoAndWhereOnly()` (`on_volunteer_floor()`, i.e.
  `roles.scope_residents = 'who_and_where'`).
- **Doctor is `own_clinic`, so it is NOT caught**; it already opens the page and holds medical edit on seven
  of the eight activities (no `medical.archive`). Nothing to fix for the vet.
- Caught AND holding medical edit: `head_of_medical` (weight), `second_in_command` (diet, immunizations,
  prescriptions, weight), and every card-only login made by `dev-signin.mjs --cards` (`who_and_where`).
- Admin/Management are `all` and open the page already.

## Why it stopped
Opening the page for those roles is not an app change. `residents_select_perm` (0144) requires
`sees_all_residents()` (`scope_residents = 'all'`), which is false for `who_and_where`; the page's data
(residents row, clinic visits, etc.) would come back empty. Removing the redirect alone would show a blank
page. The fix needs a **migration** (a narrower "may open the record because they hold a medical activity"
read, or scope change) plus a read-only mode on the hub's non-medical controls. The brief allows no
migration in this batch (`0248` is `residents-card-intake`'s) and forbids reshaping permissions.

## Why the volunteer/2IC/Heads redirect stays
0134 deliberately gives them no more than a stranger sees plus where it lives. Any migration must keep that
for volunteer and Head of Maintenance, and the Director must say whether the 2IC and Head of Medical are
meant to see intake and history (their medical edit cells suggest yes).

## Next session
Schema PR first (one migration, after `residents-card-intake`'s), then this page: replace the redirect with
"redirect unless the login holds a medical.* edit", gate non-medical hub controls on `can(...)` (most already do).
