# Eight permission harnesses: two restated, six retired (2026-10-29)

Stream `harness-restate-permission-checks`, from batch 7's triage row "A, probable". Run first, on the
**dev** database (`qxkmhwybjggxvsfxsxbd`), **no dev server up** (these eight are database-only, so that
does not change the count): **7 red, 1 green** (`perm-convert-admin` was already green, 191 checks).

## What was done to each

| harness | outcome | what it guarded | why nothing is lost / what replaces it |
|---|---|---|---|
| `role-write-policies` | **restated** | (1) every write the app offers has a policy; (2) a real-row blood-test write | Part 1 was always role-free and still passes (14 writes). Part 2 asserted `management` writes and `volunteer` is refused; it now logins holding exactly `medical_records`, exactly `view_medical`, and no cards: only the first writes (and files), the second reads, the third reads nothing. Same subject, card-shaped. |
| `perm-convert-admin` | **restated** | Admin keeps every read, write and delete through `is_admin()`; the matrix keeps its aal2 gate | The Admin half is untouched. The non-Admin principals were the live `management` and `volunteer` logins (found by role key) and one expectation followed Management's `website.content` cell; they are now one throwaway login holding **no cards**, so the question is "is a login with no card refused?". The old check 6 (volunteer reads enclosures and zones) asked a role what a card now decides and is dropped. 172 checks, green. **The live audit count:** the "5548 of 5549" in the triage is not in the file; the only counts compared are in-transaction (the Admin count against the same table's total), so nothing drifts. Nothing to fix there. |
| `permission-tables` | **retired** | `0132`'s seed: six roles, 61 activities, 56/39/13/3 cells per role, and `has_permission()`'s "answers no" cases | The seed counts only had meaning while the roles were the grant. Red on `A roles: got 5, wanted 6`. The "answers no" cases (no cell, no role) are now exercised by the restated checks above (a no-cards login refused). |
| `role-can` | **retired** | `role_can(role, activity, level)` equals `has_permission()` for every role x activity | Asks a role to answer; roles are transient groupings of cards. The function itself remains and is read by `check-recurring-job-eligibility`. |
| `permission-parity` | **retired** | Per-role cells against the paper (`docs/roles-and-permissions.md` §11) | The paper's role cells are not the model any more. `scripts/lib/permission-probes.mjs` is **kept**: `check-who-does-what` uses its probes, and that check is red on purpose. |
| `maintenance-role`, `medical-role` | **retired** | A named role's cells equal the union of its jobs in `jobs.ts` | Asked of two named roles; the jobs feed `cards.ts`, and `check-who-does-what` / `check-menu-coverage` carry the per-card questions. |
| `perm-convert-photos` | **retired** | Per-role answers on photo tables (361 checks, 59 failing) | Ten fixture roles built from photo cells; the photo cards now carry this. A per-card photo check is **not** written here. |

## Found, not fixed

- `src/lib/permissions/jobs.ts` (the comment near line 14) still says `check-medical-role.mjs` fails if the rows and file disagree. It is a comment in a retired check's name; out of scope for a scripts-only PR.
- `docs/roles-and-permissions.md` §11 still describes `check-permission-parity.mjs`.
- `check-activity-lists.mjs` allow-lists `scripts/check-permission-parity.mjs`; harmless once the file is gone.
- Retiring rather than restating means **no per-card photo-table check exists**. That is a real gap, not a claim of cover; a card-shaped photo check is a backlog item.

## Not touched

`doctor-*` and `clinics-readonly` (red on purpose), `check-who-does-what`, `check-menu-coverage`, `doctor-cells`, the six diet harnesses, the 18 server-needing rows, `docs/card-access-faults.md`, `src/app/adopt/`. No migration. `check-hard-coded-security.mjs` still prints `no coded security outside the Admin bypass`.
