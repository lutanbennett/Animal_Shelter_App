# Signed-in logins lose write grants on six internal views; C2 was already closed (`0160`)

2026-10-07, `resident-view-grants-0160`. Findings C12 and C2 of `docs/roles-and-permissions.md` §3.

## C12: the grants were inert on five views and live but harmless on one

The audit said `resident_list_view` grants insert, update, delete and truncate to `authenticated`,
"untested whether they can do anything". It came from the project's default privileges, which give
every new view every privilege; `0077` wrote down the select and deliberately did not revoke. On dev
**five more views carry the same set**: `immunization_next_due`, `project_folder_summary`,
`frequency_round_status`, `prescription_round_status`, `resident_diet_round_status`.

Measured before revoking, with one live login of every role under its own JWT
(`node scripts/check-view-write-grants.mjs --before`, everything rolled back):

| View | What a write did | Verdict |
|---|---|---|
| `resident_list_view` and the four `*_round_status` / `immunization_next_due` | insert, update, delete: `55000` (view not updatable); truncate: `42809`. Every role, Admin included | **inert** |
| `project_folder_summary` | update and delete **ran**: Admin, management and staff updated all 17 folders through it | **live, but no wider than the table** |

`project_folder_summary` is a single-table select over `project_folders`, so Postgres makes it
auto-updatable, and it is `security_invoker`, so `project_folders`' own policies decide. For every
role the write through the view touched exactly the rows the same statement touched on
`project_folders` directly (the script asserts this). Nobody could do anything through it they
could not already do; it was a second door into a room they already had a key to. The app only
reads it.

So the honest statement is: **we revoked five inert grants and one redundant live one.** No hole was
closed. It is still worth doing: a later `instead of` trigger on any of these views would have
silently made its grants real.

`0160` revokes insert, update, delete, truncate, references and trigger from `authenticated` and
`anon` on all six. Select stays. `service_role` is left alone: it bypasses RLS on the tables
underneath, so a view grant gives it nothing new.

**A detail the proof script has to know.** After the revoke, the five inert views still answer
`55000`, not `42501`: Postgres rejects a non-updatable view before it checks privileges. That is the
same reason the grants never did anything. The after-check therefore asserts "no row touched" there,
`42501` on `project_folder_summary`, and that `has_table_privilege` is false for every one.

**Not fixed, and why.** The default privileges still give the next view the same set. Changing
them is project-wide (they cannot tell a view from a table, and tables need DML), so it is a
follow-up on the backlog branch, not part of this PR.

## C2: already closed for management and staff; Admin's delete kept

The brief, from the `policy-cells-0158` status note, read `residents_admin_delete` as "a delete
policy for staff and management". It is not. `0144` (perm-convert-residents, 2026-10-04) dropped
the management and staff delete and closed C2 for both (`docs/decisions/2026-10-04-perm-convert-residents.md`);
`0153` (perm-convert-admin) rewrote Admin's surviving delete onto `is_admin()` and kept it **on
purpose**, "behaviour is unchanged by design". On dev today it is
`for delete to authenticated using ((select public.is_admin()))`. The note mistook the name for the
old rule.

**Not dropped here.** No screen deletes a resident (`grep` of `src/` and `worker/`: none), and
§3's target column says "nobody". But taking Admin's delete away is a change to Admin's rights that
two migrations kept deliberately, and `scripts/lib/permission-probes.mjs` and
`check-perm-convert-admin.mjs` both assert it. That is Lutan's decision, not a tidy-up. If he wants
it gone, it is a one-line `drop policy` plus those two expectations.

## How the 2026-10-05 R-0240 delete got past `0119`

The backlog asked this (item "A reviewable script for resident corrections"). Neither R-0240 nor
R-0220 is on dev, so it happened on production, which a worktree session may not read. What the
schema shows without reading it:

- **`0119` never guarded a delete.** Its triggers fire on `placement_history` UPDATE
  (`enforce_placement_history_immutability`) and INSERT (`check_placement_lifecycle_target`). Only
  `enforce_deceased_lock` fires on DELETE, and only for a deceased resident.
- **No RLS policy was the path.** A session reaches the database through the Management API (as
  `postgres`) or the service key; both bypass RLS. On 2026-10-05 the policy was still the enum
  `admin_all_residents` anyway (`0153` came two days later), and nothing in the app deletes a
  resident.

So one session deleted the seed placement and diet rows and then the resident, with full rights
and nothing in the way; the other declined to. The guard did not fail; it was never asked.
`residents` has been audited since `0121`, so production's `audit_log` should hold the `DELETE` with
the old row, which is the way to confirm it.
