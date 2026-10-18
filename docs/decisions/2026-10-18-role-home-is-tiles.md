# 2026-10-18 — A role's home is its who-does-what tiles; nothing redirects away from it

2026-10-18, `claude/role-home-is-tiles`. No migration.

## Lutan's ruling, in his words

> "the Home Screen should be their tiles as defined by the who does what feature."

He was answering the Doctor defect: signing in as the Doctor landed on `/appointments`, which the
Doctor's own cells refused, so the role could not open its own home. It had blocked
`scripts/check-phone-width.mjs` twice (PRs #689 and #723 could not see `/appointments`).

## What was actually sending the Doctor there

Not `roles.home_path`. On dev that column is `null` for the Doctor (and for Admin, Management and
Volunteer) and `/home` for the three configured roles; nothing on dev had a landing page set. The
Doctor was sent to Appointments by **three hard-coded places**, all now removed:

| Where | Keyed on | Now |
|---|---|---|
| `signedInLandingPath()` in `src/lib/auth/app-access.ts` — the sign-in redirect itself | `role.key === "doctor"` | every app login lands on `/home` |
| `src/app/home/page.tsx` | `scopes.clinical === "own_clinic"` | removed; the tiles draw |
| `src/app/my/page.tsx` (a doctor has no tasks) | `scopes.clinical === "own_clinic"` | redirects to `/home` instead |
| `src/app/no-access/page.tsx` offered "Go to Appointments" as its button | `role.key === "doctor"` | the Home button, for everyone |

`DOCTOR_HOME_PATH` and the two `goToAppointments` strings are gone with them. The brief counted two
redirects in `page.tsx`; the login-time one in `app-access.ts` ran before either and was the one a
real sign-in hit.

## `roles.home_path`: not honoured, not cleared

**Choice: the code stops reading it; no data migration.** Reasons, in order of weight:

1. **There is nothing to clear.** No live role on dev has a value that redirects anywhere, so a
   `0224` would change zero rows there, and production cannot be read from a workstream to know if it
   differs. A migration that exists to tidy a value nobody set is a release step for nothing.
2. **The Who does what screen does not show it.** The brief assumed it did; it only selects the column
   into the permissions object it hands `parsePermissions()`. There is no admin-facing value to be
   confused by.
3. The column, its check constraint and its place in `my_permissions()` (0132, 0196) stay as they
   are, and `Permissions.role.homePath` stays on the type, so the test fixtures and the harness
   scripts that insert roles are untouched. It is dead data until something decides to use it; the
   *Choose each role's home tiles in Settings* item is the natural place for that decision, and it
   may equally decide to drop the column.

The `page.tsx` header comment and this file are the record that it is deliberately unread.

## The `own_clinic` redirect

Removed outright. Nothing else depended on the Doctor landing on `/appointments`: the only other
readers of the scope in `src/app` are the bills guards (a clinic login may not see bills), which are
about bills, not landing. `scripts/check-menu-coverage.mjs` modelled the redirect to say how a role
gets in and reported it as `BROKEN HOME`; that branch is removed and the Doctor now reports 0
orphans (the all-roles count went from 68 unexplained to 66). `scripts/check-home-screens.mjs`'s
"a doctor's home is its appointments" case tests `homeTilesFor()` on a code-built doctor with cells
that open `/appointments`, which is unchanged and still true.

## What each role's home draws now (dev, 2026-10-18, `check-home-cards.mjs`)

Every live non-Admin role holds cards, so every one of them gets its card tiles, in `role_cards`
order; none draws an empty home.

| Role | Tiles | Opens |
|---|---|---|
| Doctor | View residents, Book clinic visits | `/residents`, `/appointments` |
| Volunteer | View residents, Enclosures | `/residents`, `/enclosures` |
| Head of Medical | Administer medication, Record weight, Add medical photos, Feed special diets | `/operations/medication-list`, `/medical/weight`, `/medical/photos`, `/medical/diets` |
| Head of Maintenance | Do maintenance | `/maintenance` |
| 2IC | Do stocktaking, Do purchasing, Record delivery, Do maintenance, View residents | `/stocktake`, `/purchasing`, `/deliveries/new`, `/maintenance`, `/residents` |
| Management | Recurring jobs, Residents | `/management/recurring-jobs`, `/residents` |
| Admin | unchanged: a phone goes to the Management home, a larger screen to Settings | — |

**The Doctor's second tile is dev data this stream added.** Before this change dev's Doctor held one
card, View residents, and the cells `resident.record` and `resident.microchip` — so with the
redirects gone it would have landed on a one-tile home it could open, and `/appointments` would
still have refused it, because the Doctor had no `medical.visits` cell. That is exactly the
ruling's point: the Doctor sees Appointments if and only if Who does what gives it the **Book clinic
visits** card. So on dev the card was given through the same database call the screen uses
(`set_role_cards`, with the bundle `cards.ts` computes: `resident.record` read, `visit.book`,
`medical.visits` read). Dev test data is disposable; the row stays. **On production this is Lutan's
click on Who does what**, not a migration: the Doctor role → Add a card → Book clinic visits. Until
he does, a production doctor lands on a home with View residents alone, which opens.

## Proof

- A real Doctor login on dev (`rolehome-doctor-…@example.invalid`, linked to `[roster] Test
  Clinic`; left in dev) at 375 px: sign-in lands on `/home` with the two tiles, in English and Thai;
  the Book clinic visits tile opens `/appointments`; `/my` bounces to `/home`; console clean.
- `MSYS_NO_PATHCONV=1 node scripts/check-phone-width.mjs --roles=doctor --pages=/home,/appointments`:
  `4 page view(s) measured (doctor; en + th), 0 skipped because the role cannot open them`. That is
  the check that had failed twice.
- `check-home-cards.mjs`: all ok, Doctor 2 tiles = its 2 cards in both languages.

## Not done, on purpose

Admin's device split; the Settings panel for choosing tiles; the left-hand menu; `cards.ts`
(owned by another stream this batch). The Doctor's wider cells (the red-harness item's "doctor holds
no `medical.*` cell") are still Lutan's to decide; this stream gave the Doctor one card, not a cell
set.
