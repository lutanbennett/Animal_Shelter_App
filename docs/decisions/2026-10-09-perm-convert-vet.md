# 2026-10-09 — `perm-convert-vet` (`0167`): the vet's 54 policies ask the clinic scope, not the role, and no policy names a role

Follows `2026-10-07-perm-convert-admin.md` (the run before, and its checker) and `2026-10-04-perm-convert-medical.md` (the
shape). Roles paper §5, §6 rule 1, §15 "Converted in `0167`".

## 1. Why this is not the conversion the brief described

The brief asked for the vet's policies to be translated into `has_permission()` **and** for nobody's access to change.
On dev those two cannot both hold. The vet role's cells are the Director's draft: `resident.microchip` Edit and
`resident.record` Read, nothing else. Asking the cells would have taken visits, prescriptions, procedures, blood tests,
weights, diets, the reference lists and the clinic's own attachments away from all six clinic logins. That is the
narrowing Lutan declined on 2026-10-07 (*"nothing changes for a vet"*; backlog, `perm-convert-vet`, ticked as declined).
The planner picked the item again regardless; this session stopped and asked before writing anything.

**Lutan chose (in chat, 2026-10-09) the third route:** keep every vet's access exactly as it is, and replace the role
test with the scope test that describes it. `current_user_role() = 'vet'` becomes `(select is_clinic_login())`: *the
caller's role has `scope_clinical = 'own_clinic'`* (§5). On dev that is exactly the vet role (six logins); every other
role, `public_viewer` included, is `any`.

What this buys: no policy reads the enum, so `perm-drop-enum` is no longer blocked by the policy layer, and the chain
behind it (`settings-permission-matrix`, `custom-roles`) is waiting on functions and views only. What it does **not**
change: the vet's cells are still cosmetic, so the 21 vet lines on the parity board stay red as a recorded decision.
Do not "fix" them by giving the vet cells. That would widen the vet through every `_perm` policy that asks a cell
without a scope beside it, and no screen would show anything wrong.

## 2. What `0167` does

- `is_clinic_login()`: written like `is_admin()` (`0153`). `security definer`, `search_path = ''`, reads `roles`
  through a live `user_roles` row, never `user_roles.role`. **Not executable by `anon`.** 49 of the 54 policies are
  `TO public`, so this was checked rather than assumed: `anon` holds no grant on any of the 29 tables, so none of these
  policies is ever evaluated for `anon` (a policy whose function the caller cannot run errors; it does not answer no).
- All 54 policies are **altered in place**, keeping the same name, command and roles. The SQL is `pg_policies`' own
  deparse of each policy on dev with the one test substituted, generated and checked so that no `current_user_role` or
  `app_role` is left. Everything after the role test is untouched (the clinic's residents, `vet_owns_visit()`,
  `vet_can_write_attachment()`, `vet_may_edit_doctor()`).
- Re-runnable: `create or replace` and `alter policy` to the same text. A missing policy errors loudly instead of
  being skipped.

**It deliberately asks no cell**, and that is the honest reading of these policies. They never asked one (`0135`,
"Last"). A configured role later given `scope_clinical = 'own_clinic'` would read what a vet reads. That is what §5
says the scope means, no such role exists, and `custom-roles` is still parked. `is_clinic_login()` is not a
`sees_all_*` function, so the scope-guard walk (a scope function TRUE for `public_viewer` must sit beside a cell) does
not apply: it is FALSE for `public_viewer`, and for everyone but a clinic login.

## 3. The count: 54 on 29, as the checker said

`check-policy-role-names.mjs` before: **54 policies on 29 tables, `vet 54, current_user_role() 54`**, all owned by
`perm-convert-vet`. The 71 in the old backlog line was not reproduced (`perm-convert-admin` §2 said the same). After:
`--final` reports **no row**, `RESULT: GREEN (the end state)`, and `OWNERS` is `{}`.

## 4. Parity, and the proof parity cannot give

| | match | known | mismatch | harness fault |
|---|---|---|---|---|
| `check-permission-parity.mjs` **before `0167`** | 1,971 | 23 | 21 | 9 |
| **after** | 1,971 | 23 | 21 | 9 |

`RESULT: RED` both times, on the same 21 vet lines (recorded decision). The two reports are identical apart from a
process id in a Node warning. (The brief's baseline was not quoted; the admin run's 1,926 / 24 / 21 / 5 predates
`0158`–`0166`.)

**Parity probes cells, and these policies ask none**, so on its own "identical" proves nothing here. That is why
`scripts/check-perm-convert-vet.mjs` exists. In one transaction that is always rolled back, it does the following:

1. For every login in `user_roles` (52), it counts the rows that login can select on each of the 29 tables. For the six
   vets and one login of each other role it also counts the rows an `update … set col = col` and a `delete` reach. Each
   probe runs in its own rolled-back sub-block.
2. It runs the migration file.
3. It repeats the probes and requires every answer (a count or the same SQLSTATE) to be identical.
4. It checks that `is_clinic_login()` agrees with `current_user_role() = 'vet'` for every login, and that vets do read
   rows, so "identical" does not mean "identically empty".

**Before the apply, against the old policies: 2,262 probes, 0 differences, vets non-empty on 134 table probes,
52/52 agree.** It was shown red: a mutant whose function answers no for everyone gave **196 differences** and 46/52. It
takes the migration path as an argument for exactly that. Since the apply, the "before" side is already `0167`, so steps
1 to 3 now prove the file re-runs as a no-op, and step 4 still holds the line. Inserts are not probed. Each insert
policy's `with check` is the same substitution as the update policy on that table, and the update's `with check` is
exercised.

## 5. What `perm-drop-enum` still waits on (measured, not copied)

Policies: **none**. Functions that read the enum: **16, not 15.** The 15 found by matching `current_user_role()` or
`app_role` in the body: `private.has_app_access`, `has_shelter_floor`, `merge_vet_doctors`, `reassign_recurring_job`,
`record_attachment`, `record_deceased_archive`, `record_recurring_job`, `record_stock_correction`, `record_stocktake`,
`set_resident_microchip`, `set_standard_diet`, `undo_deceased_placement`, `user_roles_sync_role_id`,
`vet_doctors_guard_login`, `vet_may_edit_doctor`. **Plus `current_user_vet_ids()`**, which compares `user_roles.role` to
the plain literal `'vet'` and so matched neither pattern. Every clinic-limited policy reaches it through
`current_vet_resident_ids()`. Views: **9**: `private.app_users`, `current_placement`, `immunization_compliance`,
`immunization_duplicate_check`, `recurring_job_staffing`, `resident_current_state`, `resident_who_and_where`,
`translation_queue`, `vet_contacts`. Plus the `user_roles.role` column itself, and `current_user_role()`.

## 6. Not done, and for the record

- **Production apply is Lutan's**, from the main checkout, `--status --env production` then `--dry-run` first.
  `-- consumer: none`: no app code calls `is_clinic_login()`, and there is no deploy ordering constraint.
- **`has_permission()` statement-level cache** (backlog): its condition was "once Vet and Admin have converted". That
  blocker is gone with `0167`, but the vet's policies still make no `has_permission()` call, so the measurement is
  unchanged in kind. Not ticked, because the measurement itself is still owed.
- No page was driven in a browser. The change is database-only and the harness counts every row the pages could read.
