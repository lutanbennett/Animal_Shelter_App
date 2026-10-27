# Delete this role button (Settings → Who does what)

**App half of the item whose schema half was #988 (`0272`, role archiving removed).** Lutan, 2026-10-27: *"Yes, add the delete role button to the backlog."*

## What it does
`deleteRole(roleKey)` in `src/app/admin/who-does-what/actions.ts`, drawn by `DeleteRoleButton` in `CardControls.tsx`, under the role's cards on `page.tsx`.

1. Same guard as every other action on the screen: Admin, with the authenticator app, on an editable role (not `fixed`, not `roles.is_admin`).
2. **Refuses while any live login holds the role** (`user_roles` where `archived_at is null`, the test `0270` makes, so main and extra roles both count). The message names the logins by email and says to move them on Settings → Security first.
3. Deletes the ended `user_roles` links (no cascade on `user_roles.role_id`), then the role; `role_cards`, `role_permissions`, `role_groups` and `role_home_tiles` cascade. If a login is given the role between the check and the delete, the foreign key refuses the delete and the message says so: nobody is locked out.
4. Audited by the tables' own triggers: the `roles` DELETE is in `audit_log` with its full old row.
5. The confirm says the role's name, its N cards, its N groups and the N ended links cleared. Both dictionaries carry every string.

## Decision: no new migration, no `delete_role()` function
The brief for this stream said to add no migration. The backlog text sketched a `security definer` `delete_role()`. It is **not built**: the Admin-only, authenticator-step policies on `roles` and `user_roles` already enforce who may delete, the guard is the one the sibling actions use, and the foreign key is the atomic backstop. If a card is ever to grant deleting roles, that is when a function and an activity are added.

## Gated by Admin, not a card
Deleting a role is Admin's (`hasAdminRole()` + `hasTwoStep()`), which sits outside the card system; the button is drawn only when `canEdit` (the same condition as Add/Remove card), so a read-only holder of `who_does_what` never sees it. No role key is read.

## Verification and its limit
Dev sign-in is aal1, and the page then shows "verify with your authenticator app" and hides every edit control, this one included, so **the press itself was not driven**. Created and removed on dev: roles `zz_throwaway_free` and `zz_throwaway_held`, and one extra `user_roles` link of `dev-signin-admin` to the latter; all removed again.
