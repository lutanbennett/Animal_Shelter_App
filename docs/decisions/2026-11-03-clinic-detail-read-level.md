# Clinic visit detail page asks `read`, not the helper's default `edit` (2026-11-03)

Found by `control-listing-sweep-6` (#1234) by driving two one-card logins. Not a security fault: the page was
harder to reach than intended, never easier. Nothing in the database or any policy/RPC changed.

## 1. What the detail page needs (read from the code, not its comment)

`src/app/clinic-visits/[id]/page.tsx` called `requirePermission("medical.visits")`, and
`requirePermission(activity, level = "edit")` (`src/lib/permissions/require.ts:25`) made that `edit`.
The page only does a `select` on `clinic_visits` (no insert, update or rpc, and no `<form>`). Every write path
is a link, each already gated: `canEdit = can(perms, "medical.visits", "edit")` (line 74) for the Edit link, and
`canBlood`, `canRx`, `canWeight`, `canProc` for the four "log" links. So the page needs `read`; the controls were
already right, and the fix is the page's guard only: `requirePermission("medical.visits", "read")`.
The edit page keeps the default `edit`.

Pages `upcoming-visits` links to: `/clinic-visits/<id>` (fixed), `/clinic-visits/<id>/edit` (asks `edit`,
correct, and its link is drawn only when the login can edit) and `/clinic-visits/new` (asks `visit.book`, a
yes/no activity, correct).

Proved by driving: a login holding exactly `view_medical` opened the detail page by clicking View on Upcoming
visits and was sent to /no-access on the edit URL; a login holding exactly `medical_records` opened both.

## 5. REPORT, for the planner to file (not done here)

`requirePermission`'s default is `edit`. 64 `page.tsx` files call it with no level; 25 files under `src/app`
pass a level explicitly and all 25 pass `"read"`. Nobody has ever classified which of the 64 are view pages
(most are genuinely edit pages). Each view page among them is the same fault as this one.

## 6. DECISION NOBODY HAS TAKEN: flipping the default to `read`

Flipping the default would invert the silent failure: a page that forgets its level would be too OPEN instead
of too closed. That is the worse direction, so it is a real decision and not a tidy-up. Not flipped.
