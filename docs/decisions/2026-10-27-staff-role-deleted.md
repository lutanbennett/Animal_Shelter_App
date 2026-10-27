# The archived Staff role is deleted, and the role checks stop reporting archived roles (2026-10-27)

Lutan, 2026-10-26: "Staff is NOT a role", "it should be removed completely from the system", and on deleting
the archived row: "That's fine as the staff login was never used anyway".

## What changed

- **Role checks** (`scripts/lib/readonly-checks.mjs`): every check that listed roles filtered `r.kind <> 'fixed'` and
  said nothing about `roles.archived_at`, so the archived `staff` row read as a seventh live role. `0268` and `0269`
  each reasoned from that ("Manage medical by staff only") and were handed a phantom. All seven filters now add
  `r.archived_at is null`. New named check `archived-role-references` counts what points at an archived role.
- **`0270_delete_staff_role.sql`**: refuses to run if a live login holds Staff; deletes archived `user_roles` rows
  pointing at it (that FK has no cascade); deletes the `roles` row, and `role_cards`, `role_permissions`,
  `role_home_tiles` and `role_groups` cascade.

## Measured, not assumed

Read at 02:18 UTC on 2026-10-27 on production (`dbkodyyxxhtygxcxmfcu`), `archived-role-references`: staff (archived),
0 live logins, **1 archived login**, 13 cards, 31 cells. The count was not zero, so work stopped and Lutan was told;
he approved deleting that one link. `role-cards` on production then listed six roles.

Scope, said narrowly: `audit_log` stores the actor and no role, so no record of who-did-what becomes unreadable.
What goes is the role row, its cards and cells, and one archived login's role link.

## Kept, and why

- `'staff'` in the `app_role` enum: Postgres cannot remove an enum value and ~43 earlier migrations name it. Left; not faked.
- `src/lib/permissions/approvers.ts` keys on the retired flag and says "never the key 'staff'": correct, untouched.
- `src/lib/releases.ts` `RetiredReleaseRole` and `src/lib/release-audience.ts`: they let old release notes tagged
  `staff` still read correctly to a person. Removing them would silently re-tag history.

## Consequence to say plainly

Once `staff` goes, **`medical_records` (Manage medical) and `assistant` are held by no live role**, and **Send to
hospital (`placement.hospital`) is held by no one**: Management and the 2IC lost it in `0269`, nobody gained it. This
was already true; the phantom hid it. It belongs on Lutan's card-assignment rebuild. No card was assigned here.
