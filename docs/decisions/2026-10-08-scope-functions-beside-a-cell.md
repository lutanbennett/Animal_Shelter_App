# Scope functions must sit beside a cell, and `facility_maps` is audited

2026-10-08, `claude/permission-guards-0165`. Two backlog items, one PR: the `0165` trigger and a checker rule.

## The checker: what it asserts

**Every `create`/`alter policy` that calls a scope function (`sees_all_*()` or `has_shelter_floor()`) has a
`has_permission()` call ANDed with each such call, in USING and in WITH CHECK separately.**

Scope functions say *how much* you may see, not *whether* you may. Each is true for `public_viewer` (its `roles` row
is `all`/`full`/`any` and its `legacy_role` is not `volunteer`), so a policy relying on one alone lets the public
login in. `0150`'s first draft did that with translations, and `check-app-access-gate` caught 76 rows after the
migration was written.

### Where it runs

- `check-new-policy-role-names.mjs` reads the migration files the branch adds. **This half runs in CI** (the
  `new-policy-role-names` job), so the mistake is caught at the migration.
- `check-policy-role-names.mjs` asks the same question of every live policy on dev. It needs the Management API
  token, so it runs locally, not in CI. The brief assumed the live script ran in CI. It does not: see
  `2026-10-07-policy-enum-guard.md`. That is why the static half was added.

Both use one walk, `scripts/lib/scope-guard.mjs`, so they cannot disagree about what "beside" means.

### Why structural, not "the text mentions `has_permission`"

`has_permission('x') or sees_all_residents()` mentions both and lets `public_viewer` in. A substring test would pass
it. That is the trap this repo has hit before: `check-policy-role-names` once said "0 policies name a role" while 44
did. The walk starts at the scope function's call and looks at the stretch of its own bracket that holds it,
bounded by OR, NOT, CASE/WHEN/THEN/ELSE/END, USING and CHECK. If nothing in that stretch implies a cell, it steps
out one bracket and looks again. Something implies a cell if it is a `has_permission()` call, or a bracket whose
every OR-branch implies one. That second case is `placement_history`'s insert policy, which is safe and passes.

It errs one way only. A cell under NOT or inside a CASE is never counted, so a safe policy written that way is
reported. Nothing unguarded is reported as guarded.

### The set of functions is a pattern, not a list

The item named four functions. One of them, `sees_all_translations()`, was dropped by `0154`. It missed a fifth,
`sees_all_clinical()`: `scope_clinical = 'any'` for `public_viewer`, and 26 live policies call it. Matching
`sees_all_[a-z_]+` covers that function and the next one without anyone remembering to edit the checker.

### Escape hatch: yes, its own

A check that cannot say "this one is intentional" gets deleted the first time it is right but inconvenient. Two
ways a correct policy can fail the walk: a shape it misreads (above), and a scope function that someone has
deliberately made false for `public_viewer`. `0150`'s `sees_all_translations()` was exactly that, and it is the
**only** statement in all 164 migrations the static check flags. So:

- static: `-- scope-fn: deliberate — <why>` above or inside the statement. The marker is separate from
  `policy-role: deliberate`, so a reason given for one question never silently covers the other.
- live: `SCOPE_DELIBERATE` in `check-policy-role-names.mjs`, `"table.policy" → why`. A stale entry fails.

Marked policies pass but are printed with their reason every run, so a reviewer sees each one.

### Proved both ways

- Red: `node scripts/check-new-policy-role-names.mjs scripts/fixtures/scope-fn-unguarded.sql` lists exactly the
  four `bad_*` policies (bare, OR, cell in USING only, a made-up `sees_all_clinics()`) and exits 1. The four
  `good_*` policies, one of them marked, pass. Run over every migration, it flags only `0150`'s first draft.
- Green: dev's 41 live policies that call a scope function all pass; `main` adds no new migration.

## The trigger: `0165_audit_facility_maps.sql`

The trigger is `record_audit()` (`0121`), unchanged. It fits as it is: `facility_maps.id` is the uuid it needs, and
the plan screen writes with the signed-in admin's own client, so the actor is recorded. It runs AFTER the write, so
a write that `refuse_lifecycle_map` refuses leaves no audit row. The table has no sensitive columns, so none are
left out. The plan's history file in storage stays, because the page's Undo reads it. `audit_log` is now a second
record of the same changes.

**The item said "nothing in the app needs to change", and that is only half true.** The audit rows land and
Recent changes lists them. But its `AUDITED_TABLES` and labels know seven tables, so a plan change shows with no
table name and with the *Files can't be undone here* reason. Changes to `roles`, `role_permissions` and
`impact_baselines` already show the same way: 106 such rows on dev today. Fixing that is app work in Recent
changes, not schema, so it is a follow-up on the `backlog` branch and not part of this PR. For the same reason
there is no release-notes line yet: an Admin would see a nameless row, and that is not something to announce.
