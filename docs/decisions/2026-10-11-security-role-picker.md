# Security's role picker reads `roles`, and writes `role` alongside `role_id`

2026-10-11, `security-role-picker` (batch 1 (b) of *Who does what*). Lutan, 2026-10-10: "Why can't I see
all the roles in the dropdown on the security page, I am expecting to see 2IC, Medical Lead, Maintenance
Lead."

## What changed

The create-login form, the users table, the Access requests approve and the server check behind all three
read live roles from `roles` (`src/app/admin/security/role-options.ts`) instead of three hard-coded lists of
the five enum values. The picker's value is the role's **key**; the server looks the key up again
(`givableRole()` in `actions.ts`) and refuses anything that is not a live row with a `legacy_role`. This
closes `VALID_ROLES`, one of the four deferred `*_ROLES` lists; the other three are `perm-role-lists`'.

## Why `role` is still written, and why it is the row's `legacy_role` (for `perm-drop-enum`)

Every `user_roles` row carries both `role_id` (the role) and `role` (the `app_role` enum). The enum is still
what `current_user_role()`, the access gate `private.has_app_access()`, the 11 functions that name roles,
`hasAppAccess` and `hasAdminRole`'s neighbours read. If `role` said `management` for a 2IC, she would have
Management's powers wherever the enum is asked, whatever her cells say, and no screen would show it: that is
the recorded Security finding *A custom role that borrows the management enum…*. If `role` were missing she
would fail closed. So a save writes **`role_id` = the row's id and `role` = that row's `legacy_role`**.

0132's trigger `user_roles_sync_role_id` already enforces this: when `role_id` is given or changed it
**overwrites** `role` from the row's `legacy_role`, and only when `role_id` is not touched does `role` drive
`role_id` (back onto the built-in role for that enum). So writing both cannot fight the trigger; the explicit
`role` is belt and braces and makes the intent readable in the action. What the trigger does **not** save you
from is writing `role` alone, which the old code did: for a 2IC that maps `role_id` back onto plain
Volunteer, silently dropping her role. That is why every write goes through `roleColumns()`.

`perm-drop-enum` removes the `role` half of `roleColumns()` together with the column and the trigger. Until
then, do not "simplify" it to `role_id` only either: it would work (the trigger fills `role`), but the reason
`role` matters would then live only in a trigger in a migration.

## Smaller choices

- **Order:** `docs/roles-and-permissions.md`'s: Admin, Management, 2IC, Head of Maintenance, Head of
  Medical, Volunteer, Doctor, then any role added later (alphabetical), Public viewer last.
- **Names:** a built-in role's from the dictionaries (their rows have no `name_th`); a configured role's own
  `name` / `name_th`. The users table shows the held role's name through `user_roles.role_id`; a row with
  no `role_id` (none on dev since 0132's back-fill) shows its enum's name.
- **Special cases follow the borrowed enum**, as the database does: the Doctor clinic link shows for a role
  whose `legacy_role` is `doctor`, and the Admin 2-step rules (open set-up on grant, the amber "not set up",
  Allow set-up) for `legacy_role` `admin`.
- **Retired roles** (`archived_at` set, today Staff) are never offered; a login still holding one shows it
  disabled, and Restore refuses until another role is chosen (it now asks the role row, not the enum).
- **Public viewer** stays choosable (`opens_app` false is not a reason to hide it).

## Release hazard

A login given a configured role this way depends on that role's row existing on the target database
(`0136`, `0141`, `0143`). The picker lists only rows that exist, so on a database without them the roles
simply are not offered; nothing fails. This change does not depend on `0173` (Staff retired); a database
without `0173` would still list Staff as givable, which is the state production is in until `0173` ships.

Proof: `scripts/check-security-role-picker.mjs`.
