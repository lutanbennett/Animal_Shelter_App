# 2026-10-07 — `perm-convert-admin` (`0153`): 43 + 2 policies off the enum, an enum-free `is_admin()`, and a checker that cannot say "done" early again

Follows `2026-10-07-admin-role.md` §2 and §4 (which measured the gap) and `2026-10-05-perm-convert-orphans.md` (which built the checker).
Roles paper §6 rule 1, §12 R6, §15 "Converted in `0153`".

## 1. What changed, in one paragraph

`0153` adds `is_admin()` (a live `user_roles` row whose unarchived `roles` row has `key = 'admin'`: the first branch of `has_permission()`, taken alone,
and it reads `roles.key`, never the `app_role` column) and takes all 45 policies off the enum. After it, **every policy still naming a role is the
vet's: 54 policies on 29 tables**, and `check-policy-role-names.mjs` says so by owner. `perm-drop-enum` now waits on `perm-convert-vet`, the 15
functions and the 9 views, and nothing else in the policy layer.

## 2. The count was 43, not 42, and the vet's is 54, not 71

The backlog item (copied from `admin-role` §2) said 42 `admin_*` policies and 71 `vet_*` ones. On dev today, from `pg_policies` text: **43 policies call
`current_user_role() = 'admin'`** and **54 name `'vet'::app_role`** (the 54 are exactly the `vet_*`-named ones). I could not reproduce 71 and did not chase
it: 71 appears to have counted something the text match does not (an earlier state, or both words in one policy). The corrected numbers are in
the checker's output, which is the authority.

## 3. Group 1 was not mechanical: "drop `admin_all_*`" is wrong for 11 tables

The brief said to check per table rather than assume. Checked per table **and per command**. Twenty tables drop cleanly (every command has a `_perm`
policy, Admin passes it). **Eleven did not**, and dropping `admin_all_*` outright would have narrowed Admin silently:

| Shape | Tables | What `0153` does |
|---|---|---|
| **No policy grants DELETE to anyone but Admin** | `blood_tests`, `immunization_records`, `placement_history`, `prescriptions`, `procedures`, `resident_diets`, `residents`, `weight` | `<table>_admin_delete` on `is_admin()`. `0144` and `0147` converted these to insert / select / update cells and never gave delete an activity (delete has none; `role-gaps-sweep` owns that) |
| **The `_perm` side is narrower than Admin was** | `assistant_actions` (own rows only: Admin read and edited everyone's, which `0150` recorded as a known tightening for management only), `group_origins` (select only; writes were Admin's, `0145` says so), `rounds` (`using true` select only) | `is_admin()` policies for exactly the commands the `_perm` side does not give |

The first shape matters most. **Dropping `admin_all_residents` would have made it impossible for anyone to delete a resident**, and nothing in parity
probes a delete: the parity board came back identical either way. That is why `scripts/check-perm-convert-admin.mjs` exists (below). I did not give delete
an activity: that is a design question (a vet or the 2IC deleting a record), already filed, and this PR's rule is parity.

`volunteer_read_enclosures` / `volunteer_read_zones` are dropped: the volunteer holds `facility.enclosures` Read, which `enclosures_select_perm` and
`zones_select_perm` already ask, and the harness confirms the volunteer still reads all 69 enclosures and 16 zones.

## 4. Group 2: the enum-free admin rule, and what it keeps

`audit_log`, `permission_activities`, `role_permissions`, `roles`, `user_roles`, `site_content`, `site_content_photos`, `site_pages`,
`translatable_fields` are rewritten **in place** with `alter policy` (same name, command, roles) on `(select public.is_admin())`. `user_roles` keeps its
fixed rule and is **not** given an activity (§12 R6). Three vet tables (`vet_appointments`, `vet_doctors`, `vet_doctor_clinics`) have an Admin-only
policy and no cell; theirs are rewritten the same way and their `vet_*` policies are the vet stream's.

**The aal2 gate is untouched and tested.** `*_requires_aal2` are RESTRICTIVE policies, AND-ed on top; `0153` does not touch them, and the `audit_log`
trigger on `role_permissions` is not touched. The harness asserts: an admin at **aal1** writes **0** rows of `role_permissions`, `roles` and `user_roles`;
at **aal2** writes 1; a **management** login at aal2 writes 0. An `is_admin()` that forgot aal2 would have been the quiet way to widen who edits the
matrix, which is the one place it matters most.

`is_admin()` is `security definer`, `search_path = ''`, executable by `anon` as well as `authenticated`/`service_role`, the same grant as
`current_user_role()`. **`anon` matters:** several of these are `to public` ALL policies on tables the signed-out site reads, and a policy whose
function the caller may not run **errors instead of evaluating to false**.

## 5. What the extended checker covers that it did not (this is the point)

`check-policy-role-names.mjs` looked for `'management'::app_role` and `'staff'::app_role` only. So `0152` truthfully reported 0 policies on 0 tables, and "R6
looked finished" while 99 policies on 48 tables read the enum. It now matches the policy **text** for any of the five role values, **and** for bare
`current_user_role()` (how every `admin_*` policy is written, and how the next one would be), and prints the count by token. One `OWNERS` entry per table.

| | Before (the old script on dev) | Before (the new script on dev, before `0153`) | After (the new script on dev) |
|---|---|---|---|
| Result | `ok no policy names 'management' or 'staff'` / GREEN | **RED**: 19 tables no one owns, 10 owned-but-not-in-§15 | GREEN, every remaining policy owned |
| Policies / tables | 0 on 0 | **99 on 48** (`vet 54, admin 43, volunteer 2`; the 99 all call `current_user_role()`) | **54 on 29**, all `perm-convert-vet` |

Because the same query backs `--final`, `perm-convert-vet`'s PR ends on it, and `perm-drop-enum` cannot start while any row remains. `§15` now names every
remaining table, and the checker fails if one is listed there and not owned, or owned and not listed. **What it still does not see:** functions and views that
read the role (15 and 9: `perm-drop-enum`'s), policies outside `public` (none today: queried), and a policy that reaches the enum through a function
(`private.has_app_access()` does; it is in `translatable_fields`' read policy and is a function, so `perm-drop-enum`'s).

## 6. Parity and the proofs

| | match | known | mismatch | harness fault |
|---|---|---|---|---|
| `check-permission-parity.mjs` **before `0153`** | 1,926 | 24 | 21 | 5 |
| **after** | 1,926 | 24 | 21 | 5 |

**The whole report is identical (`diff` empty), not only the count.** The 21 are the vet's lines and stay red on purpose; `check-permission-tables`
ends `HARNESS-KNOWN-RED` on the same disagreements. (The brief's baseline was 1,913 / 26 / 21; dev measured 1,926 / 24 / 21 when this started, which is
what `admin-role` §1 also reported, so I took the measured numbers.)

Because parity probes neither Admin's deletes nor the Admin-only pages, `scripts/check-perm-convert-admin.mjs` (new, 122 checks) asserts under each
login's own JWT, rolled back: `is_admin()` agrees with the enum for all 39 logins; Admin reads every row of the six Admin-only tables and writes the site
tables; Admin's delete on all ten reaches a row or the row's own foreign key (never a policy refusal); staff, management and volunteer see none of those
tables and delete or write nothing; the aal2 gate above; the volunteer's enclosure and zone reads. **Not shown red against the unconverted policies**: it was
written after the apply, so it proves the end state, not that it would have caught a bad migration. I checked the one claim it exists for another way: the
policy listing in §3 is what showed the eleven tables, and it is in this file.

## 7. Not done, and for the record

- **`vet_*` policies, the 15 functions, the 9 views, the 3 columns:** not mine. The vet's decision (do vets keep the paper's 13 reference-data cells while on
  hold?) is Lutan's and was not answered here.
- **`private.has_app_access()`** reads `current_user_role()` and sits in `translatable_fields`' read policy: a function, left for `perm-drop-enum`.
- **`/admin/recent-changes` scrolls sideways at 375 px** (a filter `<select>` 610 px wide): found by driving Admin's pages, nothing to do with policies.
  Filed on the `backlog` branch, not here.
- **Production apply is Lutan's**, from the main checkout, `--dry-run` first. `-- consumer: none`: no code reads `is_admin()` yet, and no deploy ordering
  constraint. Dev's `0153` is applied.
