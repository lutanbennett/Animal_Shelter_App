# Settings → Security redesign: one row per person, roles as chips, Add role in a pop-up

**Asked by Lutan, 2026-10-27:** the page was "a bit clunky … when one role is assigned … an additional role is in a box underneath and it's
hard to tell which roles have actually been assigned. Maybe separate the select role into a pop up so I click a button to add a role and it
pops up with the available roles then the security screen just shows what's been assigned." App only; no schema, no card change.

## What changed (all under `src/app/admin/security/`, plus strings)

- **One row per person**, not an eight-column table. Name/email/last sign-in on the left; **every role they hold is a chip** (main marked
  "main"; each extra with "until 4 Nov 2026" or "no end date" and a ✕ that keeps the existing confirm); "2-step on/off" on the right (warning
  style for an Admin without it).
- **Pop-ups** (`Modal.tsx`): Add role (radio list of the `addable` roles + optional last day), change main role (click the main chip), Edit
  name, Link a doctor record, Add person (`CreateUserForm` unchanged inside it). A pop-up is a bottom sheet at phone width.
- **"…" menu** (`RowMenu.tsx`) holds Edit name, Link a doctor record, Issue temporary password, Reset / Allow 2-step set-up, Archive or
  Restore, Delete. Each runs the same confirm and server action as before. **No server action changed its checks.**
- **Left the shelter (n)** is a collapsed list at the bottom; a search box filters by name or email (and opens that list while searching).

## Why a pop-up for "Add role"

The form used to open *inside* the table cell, which is the box he meant: it pushed the row open and made the assigned roles and the
choice-to-be-made look alike. A pop-up keeps the page showing only what is *assigned*, and the choice lives somewhere else until it is made.

## Two role-by-name faults removed (CLAUDE.md, "No code may fall back to a role BY NAME")

1. **"Link a doctor record" is offered on every login**, and `loadDoctorLogin` in `actions.ts` no longer demands the `doctor` role (it
   only checks the login exists). A shelter that renames or drops its doctor role keeps the feature. The now-unused `linkOnlyForVets`
   string is gone from both dictionaries.
2. **Admin is read from `roles.is_admin`**, not from the key `"admin"`: `loadRoleOptions` returns `isAdmin`, and the row asks that flag.
   `docs/hard-coded-security-registry.json` records for `UsersTable.tsx` now only `r.key !== "public_viewer"` (which roles may be added as a
   cover; the database trigger says the same) and for `actions.ts` no longer the doctor test.

## Buttons follow cards (#987)

The page is `requireAdminUser()` (Admin sits outside the card system), and every action re-checks Admin, so every control drawn is one Admin's
action accepts; nothing here asks a role's name. Controls are additionally hidden where their action would refuse (no role changes, role
adds, password issue, archive or delete on your own row; no role add/remove on an archived person).

## Found, not fixed / not verified

- **Not driven end to end with a real login:** on 2026-10-27 `/admin/security` redirected the password-only dev-signin admin to
  `/admin/security/verify` ("Set-up isn't open yet"), so the page is NOT reachable at aal1 as `CLAUDE.md` says it was on 2026-10-22. The
  layout, pop-ups, "…" menu and phone width were checked on a temporary page with fake people (removed before committing); the server
  actions are unchanged and were not exercised. The manual check on a real Admin session is left for a person.
- The Security screenshot in the manual (`admin-security.png`) is stale; screenshots are deferred to one full rerun.
- Thai strings for the new labels are first drafts for a Thai speaker to check.
