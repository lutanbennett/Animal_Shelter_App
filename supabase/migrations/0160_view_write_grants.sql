-- consumer: none
--
-- resident-view-grants: no signed-in login may write through an internal view (finding C12,
-- docs/roles-and-permissions.md §3; docs/decisions/2026-10-07-view-write-grants.md).
--
-- The project's default privileges gave `authenticated` every privilege on every view it
-- created: insert, update, delete, truncate, references and trigger beside the select the app
-- uses. 0077 wrote down the select and did not revoke. C12 named resident_list_view; dev
-- (2026-10-07, information_schema.role_table_grants) shows five more views with the same set.
-- Measured per role with each login's own JWT (scripts/check-view-write-grants.mjs --before):
--
--   resident_list_view, immunization_next_due, frequency_round_status,
--   prescription_round_status, resident_diet_round_status
--       INERT. Joins or aggregates, so not auto-updatable, and no INSTEAD OF trigger: every
--       insert, update and delete fails with 55000 and truncate with 42809, for every role,
--       Admin included. Revoking them is tidying, and closes the door before anyone adds a
--       trigger that would open it.
--   project_folder_summary
--       LIVE, but no wider than the table. A single-table select over project_folders, so
--       auto-updatable; security_invoker, so project_folders' own policies decide. Each role's
--       update and delete through it touched exactly the rows the same statement touches on
--       project_folders directly. Nobody could do anything here they could not already do;
--       the app only ever reads it (src/lib/projects/queries.ts, src/app/projects/actions.ts,
--       src/app/admin/website/page.tsx) and writes project_folders.
--
-- Select stays. anon holds nothing on these views (0081 revoked it);
-- the revoke below names it anyway so a rebuild cannot differ. service_role is left as it is:
-- it bypasses RLS on the tables underneath, so a view grant gives it nothing it lacks.
-- No policy is created or changed. Re-runnable: revoke is idempotent.

revoke insert, update, delete, truncate, references, trigger on
  resident_list_view,
  project_folder_summary,
  immunization_next_due,
  frequency_round_status,
  prescription_round_status,
  resident_diet_round_status
from authenticated, anon;
