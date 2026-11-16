# CLAUDE.md said the SQL decides Admin by name; 0277 moved it onto roles.is_admin

Stale in four places (lines 28, 62, 70, 129): they named `key = 'admin'` / `0196` and said moving the SQL onto the flag was outstanding.

Evidence: `0277` header line 5 and bodies (`r.is_admin` at lines 40, 65, 84, 107, 180, 239) moved `has_permission()`, `is_admin()`, `my_permissions()`, `holds_app_role()`, `reassign_recurring_job()`. No migration after `0277` uses `key = 'admin'`. `0387` made `roles_one_admin_idx` `(shelter_id) nulls not distinct where is_admin` (one Admin per shelter; `roles.key` unique per shelter).

Only the mechanism was corrected; no rule changed. Cost of staleness: PR #1622's brief was wrong because of it.
