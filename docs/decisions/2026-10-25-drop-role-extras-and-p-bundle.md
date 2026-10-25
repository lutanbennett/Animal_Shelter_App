# 2026-10-25 — Drop `role_extras` and `set_role_cards`'s `p_bundle`, together (0261)

**Decided by:** the planner's brief for `role-extras-drop`; follows `2026-10-25-remove-hard-coded-security.md`.

## What changed
- `role_extras` is dropped. Since 0257 a role's `role_permissions` is exactly the union of its cards' `card_grants`;
  nothing read the table for access.
- `set_role_cards(p_role, p_cards, p_bundle)` becomes `set_role_cards(p_role, p_cards)`, and `apply()` in
  `src/app/admin/who-does-what/actions.ts` stops sending `p_bundle: null`. Body is 0257's, otherwise unchanged.
- Audit lists no longer name `role_extras` (`recent-changes.ts`, `undo.ts`, the Recent changes page). Old
  `audit_log` rows for the table stay in the database but no longer show in Recent changes.
- `scripts/dev-signin.mjs`, `check-card-grants.mjs`, `check-2ic-role.mjs`, `facility-map-holders.mjs` and
  `readonly-checks.mjs` stopped using the table and the third input.

## Why the two removals are one PR
Removing either alone reproduces the 0.40.2 outage (PostgREST `PGRST202`, every card add/remove/reorder fails),
in one direction or the other. **Deploy order:** the migration and the app go out together. #927's `p_bundle: null`
was a stopgap and this is the end of it.

## Production note
`readonly-checks.mjs`' "role-cells" check no longer reads `role_extras`, so it works before and after 0261 reaches
production.
