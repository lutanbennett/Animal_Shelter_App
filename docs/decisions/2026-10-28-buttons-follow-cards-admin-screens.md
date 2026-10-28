# Buttons follow cards, sixth and last slice: /admin/security and /admin/who-does-what (2026-10-28)

Same rule as slices 1-5. No code changed, no migration, server and database checks untouched.

## Result: no gap found

Both screens are **Admin-only by `perms.isAdmin`**, which sits outside the card system (CLAUDE.md, settled). Neither asks a card, so there is no card-derived activity for a control to follow, and no gate here depends on Admin holding a card. Admin holds no cards on production, so a card gate on either screen would have locked the only administrator out; none exists, and none was added.

The action guards and the controls agree: each control is drawn only when the same test its action runs passes.

| Screen / control | What its action asks | What draws the control | Proof |
|---|---|---|---|
| `/admin/security` page | `requireAdminUser()` (`perms.isAdmin`), then `hasTwoStep()` else redirect to verify | the page itself | inspection; redirects at aal1 |
| Security: create user, rename, approve/dismiss request, change role, add/remove extra role, link/create/unlink doctor, temporary password, archive, restore, delete, reset two-step, allow two-step setup (`security/actions.ts`) | every action starts `refuseUnlessAdmin`: `hasAdminRole()` then `hasTwoStep()` | all sit inside the Admin-only, two-step-only page | inspection (aal2 required, no authenticator) |
| `/admin/who-does-what` page | readable by any login that opens it; shows `readOnly` note when not Admin | n/a | inspection |
| Who does what: add/remove/move card, groups, set card group, show-menu toggle (`actions.ts`) | `guard()`: `hasAdminRole()` then `hasTwoStep()` | `canEdit = isAdmin && hasTwoStep()`; locked disabled buttons for Admin without two-step; nothing for non-Admin | inspection |
| Delete role (`deleteRole`) | `hasAdminRole()` then `hasTwoStep()` | drawn only `canEdit` | inspection (needs authenticator code) |
| Who does what, Features: add, rename, move, remove, set card feature | `featureGuard()`: `hasAdminRole()` then `hasTwoStep()` | `canEdit = isAdmin && hasTwoStep()` | inspection |
| Who does what, details | read-only; links only | n/a | inspection |

All shown by reading both sides and showing they match; none driven, because every action needs the authenticator code.

## Found, not fixed

Nothing. The matrix is the same test on both sides for every control.

## Release note

`n/a: Admin sees all of both screens, so no login's view changes`.
