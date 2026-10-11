# 2026-10-11 — `perm-functions-schema` (`0178`): the functions that named a role ask a cell or the clinic scope

Batch 1 (c) of *PRIORITY: Settings → Who does what* (`docs/backlog.md`, Next up). Follows
`2026-10-09-perm-convert-vet.md` (§5 is the list this started from). `perm-drop-enum` and `perm-role-lists` read this.

## 1. The count, measured on dev before anything was written

The item said "11 functions" and named 12. Measured by searching every function in `public` and `private` for
`current_user_role()`, a `user_roles.role` / `legacy_role` comparison, or a quoted role name:

- **The 12 named are all real and all still named a role:** `record_stocktake`, `record_stock_correction`,
  `record_recurring_job`, `reassign_recurring_job`, `record_attachment`, `record_deceased_archive`,
  `set_resident_microchip`, `set_standard_diet`, `undo_deceased_placement`, `merge_doctors`, `doctors_guard_login`,
  `clinic_login_may_edit_doctor`. None had been converted by anyone else.
- **Plus 8 more that read the enum or `legacy_role`**, 20 in all: `current_user_clinic_ids()` and
  `current_doctor_resident_ids()` (`role = 'doctor'`; the vet paper's `current_user_vet_ids()`, renamed by `0172`),
  `private.has_app_access()`, `has_shelter_floor()`, `sees_all_residents()`, `sees_all_contacts()`,
  `user_roles_sync_role_id()` and `current_user_role()` itself.
- False positives the text search also hit, and why they are not role checks: `cashflow_forecast` and
  `map_room_kind_name` (`'maintenance'`, `'medical'` are categories), `has_permission`, `is_admin`, `my_permissions`,
  `role_can`, `user_roles_keep_an_admin` (`roles.key = 'admin'`, the fixed Admin row, which is how Admin is defined).

**Taken: the 12, plus the two clinic-scope helpers** (same test as `is_clinic_login()`, no behaviour change, and every
clinic-limited policy reaches them). **Left: 6**, each for a reason in §5.

## 2. The activity chosen per function

The question asked of each was *what does this function actually do*, answered by the cell the app already checks
before calling it, so the database and the screen give the same answer.

| Function | Was | Now asks | Why that activity |
|---|---|---|---|
| `record_stocktake` | admin/management/staff, or `stock.count` | `stock.count` | the stocktake page's cell |
| `record_stock_correction` | admin/management | `stock.correct` **and** `stock.medications` or `stock.diets` (by kind) | the paper's manage-medications / manage-diets need both; the two pages ask the list cell. `stock.correct` alone (the 2IC holds it) does not open the lists, so does not let her in here |
| `set_standard_diet` | admin/management | `reference.types` **and** `stock.diets` | `canEditItemSettings(perms, "diet")`, Settings → Diets, Admin-only since 2026-10-08 |
| `record_recurring_job` | admin/management/staff/doctor, or `recurring.do_own`; admin/management record any job | `recurring.do_own` or `recurring.do_any`; `recurring.do_any` records any job | the paper's split (A6) |
| `reassign_recurring_job` | admin/management; assignees by an enum list naming `staff` | `recurring.manage`; assignees = a live login whose live role has `opens_app` | the recurring-jobs page's cell. "Can still sign in" was the enum minus `public_viewer`, the one role with `opens_app` false |
| `record_attachment` | admin/management/staff/doctor any kind; others a resident photo by `photos.resident_add` | per kind, the cell `attachments_insert_perm` asks: `photos.resident_add`, `medical.blood_tests`, `medical.procedures`, `maintenance.photos`, `projects.photos`; or a clinic login for the three clinical kinds | a definer function should let in no more than a direct insert. The resident photo keeps `sees_all_clinical()` (`0140`), not the policy's `sees_all_residents()`, because the latter is false for a role borrowing volunteer and Head of Medical files photos here |
| `set_resident_microchip` | `resident.microchip`; `role = 'doctor'` limits to own clinic | same cell; `is_clinic_login()` limits | the scope, as `0167` |
| `record_deceased_archive` | admin/management/staff | `placement.death` | the Drive filing is the second half of recording a death; record-death and retry both ask `placement.death` |
| `undo_deceased_placement` | `= 'admin'` | `placement.death_withdraw` | the withdraw page's cell (Admin only today) |
| `merge_doctors` | admin/management/staff/doctor; login merge `= 'admin'` | `clinics.doctors` or `is_clinic_login()`; login merge `is_admin()` | the doctors page's cell; a clinic login keeps its own clinic's (the `doctors` policies decide which rows) |
| `doctors_guard_login` | `is distinct from 'admin'` | `is_admin()`, asked only when `auth.uid()` is set | linking a login is Admin-at-2-step; nested so the service role, which has no uid, is never asked |
| `clinic_login_may_edit_doctor` | `= 'doctor'` | `is_clinic_login()` | scope |
| `current_user_clinic_ids`, `current_doctor_resident_ids` | `user_roles.role = 'doctor'` | `is_clinic_login()` | scope |

`is_admin()` is used where the rule is "Admin, always" (§6 rule 1 of the paper): it reads `roles.key`, the fixed row,
never the enum.

## 3. The 9 views: which pile, and why

The test: a view that decides **who may read at all** is a "who may" decision and is converted where something other
than the enum can say it; a view that decides **what a row looks like** stays.

**Converted (the clinic test only):** `doctor_contacts` (whole gate: `= 'doctor'` → `is_clinic_login()`), and the
`is distinct from 'doctor'` clause in `current_placement`, `immunization_compliance`, `immunization_duplicate_check`,
`resident_current_state`, `translation_queue`. Same columns, same order, grants restated (the grants check requires it;
they match dev: `select` to `authenticated` and `service_role`).

**Left, and why:**

- The `current_user_role() is distinct from 'volunteer'` clause in those five views. It is a "who may" test, but
  nothing outside the enum says "not on the shelter floor": `has_shelter_floor()` is itself `role <> 'volunteer'`, and
  the obvious cell, `resident.record` Read, is held by the volunteer and every configured role, so asking it would
  widen all of them. That is a new scope, a design question for `perm-drop-enum`.
- `resident_who_and_where` (`= 'volunteer'`): the same missing scope, the other way round.
- `private.app_users`: the role decides what a row looks like (the email column masked for doctor and volunteer), and
  `roles.sees_login_emails` is the column it should read when the enum goes.
- `recurring_job_staffing`: a count (`role <> 'public_viewer'`), a row's shape. It could read `roles.opens_app`, as
  `reassign_recurring_job` now does.

## 4. Parity: what moved, and for whom

Two checks, before and after.

**`scripts/check-perm-functions.mjs`** (new). `check-permission-parity` probes tables, so a gate inside a function
moves without it noticing. This calls 27 probes (every converted function, some twice with different arguments, and
every converted view) as **every live login on dev** (45), replays `0178` in the same transaction, calls them again,
and fails on any answer that changed and is not listed as agreed. It always rolls back. Shown red: a mutant asking
`stock.purchasing` for the stocktake reported Head of Medical losing it.

Before the apply, replaying `0178`: 1,215 calls a side, and exactly these changed:

| Role | Function | Before → after | Verdict |
|---|---|---|---|
| Management (15 logins) | `set_standard_diet` | allowed → refused | **the fix.** The page is Admin-only; only the database still let Management in. No screen changes |
| 2IC (2, later 3) | `record_deceased_archive` | refused → allowed | **a gain, agreed by Lutan in chat 2026-10-11.** A 2IC holds `placement.death`, records deaths, and had every Drive filing refused, so the archive stuck half-done and Retry failed too |
| Doctor (6) | `record_recurring_job` | past the gate → refused | **the fix** (the paper's C11). The enum let every doctor in. No doctor has `recurring.do_own`, and the app never shows a doctor My jobs. Two dev doctors are assignees on a job; if a shelter wants doctors to tick jobs, that is the doctor's `recurring.do_own` box, not the role name back |
| 2IC (2), Head of Maintenance (1) | `record_attachment` for a maintenance photo | refused → allowed | **not a new power**: both hold `maintenance.photos`, and `attachments_insert_perm` already lets them insert that row directly. The app never calls this function for a maintenance photo |

Nothing else moved: in particular no one lost or gained a stocktake, a stock correction, a reassignment, a resident
photo, a blood-test or procedure file, a microchip, a withdrawn death, a doctor merge or link, or a row in any view.
(The doctor's maintenance and project files through `record_attachment` were expected to move and did not:
`doctor_can_write_attachment()` already refused them further down.)

After the apply, `--applied`: no answer changed, and exactly the 6 functions in §5 still read the enum.

**`scripts/check-permission-parity.mjs`:** before 1,777 match / 22 known / 21 mismatch / 0 fault; after the apply it
reported **C11 STALE**, the doctor's recurring-job line, because the database now matches the default. C11 was taken
out of `scripts/lib/permission-probes.mjs`; then 1,778 / 21 / 21 / 0, the same 21 doctor mismatches as before (the
recorded decision in `2026-10-09-perm-convert-vet.md` §1). `check-policy-role-names.mjs --final`: still green.

## 5. Left for `perm-drop-enum`

Six functions: `current_user_role()`, `user_roles_sync_role_id()` (both the enum's own plumbing),
`private.has_app_access()` (an enum list that still names `staff`: harmless, nobody can hold it; converting it to
`roles.opens_app` needs a definer helper, because it is deliberately invoker so that `current_user` can tell the
service role apart), `has_shelter_floor()` (the missing scope in §3), and `sees_all_residents()` /
`sees_all_contacts()` (`legacy_role <> 'volunteer'`, which the brief kept for `security-role-picker`). Plus the view
clauses in §3, the `user_roles.role` column and `roles.legacy_role`. `check-perm-functions.mjs --applied` fails if
any other function starts reading the enum.

## 6. Release-time

`0178` changes who may do what in the database on its own, with no app change needed: Management can no longer set
the standard diet by calling the database directly, a doctor can no longer tick a recurring job, and a 2IC's death
filing starts working. None of it needs new code, so applying it before or after the deploy is safe either way; the
app already asks the same cells. **Not measured on production** (this session does not read it): the four changes
follow from each role's cells, so they apply there if production's cells match dev's for Management, the 2IC and the
doctor. The release manager can confirm with `check-perm-functions.mjs`'s probes there, or by reading those roles'
cells for `reference.types`, `placement.death` and `recurring.do_own`. Check `--status --env production` first:
production may be behind on other files.
