# Feature test plan

## Header

| | |
|---|---|
| Feature | `0165`: audit trigger on `facility_maps`; and both policy checkers refuse a scope function (`sees_all_*()`, `has_shelter_floor()`) with no `has_permission()` ANDed beside it |
| Backlog item | `docs/backlog.md` → **Audit trigger on `facility_maps`…** and **Scope functions must sit beside a cell…** (both ticked) |
| Branch / worktree | `claude/permission-guards-0165` @ `C:\Development\Animal_Shelter_permission-guards-0165` |
| Dev server | not started: no UI surface in this PR |
| PR | to follow |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | yes: `0165_audit_facility_maps.sql` |
| Tested at SHA | `bc9aaa78` (after sync with `origin/main` `005e6594`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for. Plan changes now reach `audit_log` through the same `record_audit()` trigger as every other audited table, and a policy that calls a scope function without a `has_permission()` cell ANDed beside each call fails both policy checkers. The item's "(schema/script)" is a script change, as the brief said
- [x] Files/areas touched listed: `supabase/migrations/0165_audit_facility_maps.sql`; `scripts/lib/scope-guard.mjs` (new); `scripts/check-policy-role-names.mjs`; `scripts/check-new-policy-role-names.mjs`; `scripts/fixtures/scope-fn-unguarded.sql` (new, a fixture, not a migration); `docs/backlog.md`; `docs/decisions/2026-10-08-scope-functions-beside-a-cell.md`
- [x] Roles affected identified: none gain or lose access. The trigger records writes that admin (the only `facility.enclosures` Edit holder) already makes. The checkers change nothing at runtime
- [x] Anything explicitly **out of scope** written down. Recent changes lists the new rows with no table name and the *Files can't be undone* reason, as it already does for `roles`, `role_permissions` and `impact_baselines`. That is app work, filed on the `backlog` branch (`04c18e31`) and left out of this schema PR. Nothing in the contact forms or `worker/security-headers.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 186s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0164_contacts_map_url.sql`, `origin/main` `005e6594`; `check-migration-numbers` ok in the pre-commit hook), and this is the batch's only migration-carrying stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `164 applied, 0 pending`, no drift either way
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0165_audit_facility_maps.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0165_audit_facility_maps.sql … ok`, then `--status` `165 applied, 0 pending`. `pg_trigger` on dev now shows `CREATE TRIGGER audit_facility_maps AFTER INSERT OR DELETE OR UPDATE ON public.facility_maps FOR EACH ROW EXECUTE FUNCTION record_audit()` beside the existing `facility_maps_refuse_lifecycle_map`
- [x] File is re-runnable: `drop trigger if exists` then `create trigger`. Proved by running the file's two statements again inside the harness against the applied database
- [x] Existing rows still read correctly after the change: a trigger adds no column, and the harness read and updated a real plan row (width 870) without error
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, run before the apply (creating the trigger inside the transaction) and again after it (on the real trigger). Asserted on dev's first real plan: one `update … set width = width + 1` adds exactly one `audit_log` row for `facility_maps` (`before=0 after=1`), with `op=UPDATE`, `old_row.width=870` and `new_row.width=871`; an update that changes nothing adds no row (`after_noop_update=1`). Rolled back each time, so dev's `audit_log` holds no test rows
- [x] Down-migration written, or the reason one is not needed is stated: not needed. To undo, `drop trigger if exists audit_facility_maps on facility_maps;` is the whole of it, and nothing reads the rows by table
- [x] Production apply plan stated for the release manager: `0165` on production (`dbkodyyxxhtygxcxmfcu`) with the next release, in either order relative to the deploy. No code reads it (`-- consumer: none`). Production needs `0164` first, as the runner applies in order anyway

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the trigger's effect is asserted in §3's harness and the checkers' in the rows below
- [ ] Data persists — n/a: no UI surface; the trigger's audit row asserted in §3
- [x] Create / edit / delete all exercised. Trigger: UPDATE asserted on a real row; INSERT and DELETE are the same `record_audit()` path as the ten tables already audited, and the trigger definition read back from `pg_trigger` covers all three. Checkers: see the next two lines
- [x] **The new check goes red on what it exists to catch.** `node scripts/check-new-policy-role-names.mjs scripts/fixtures/scope-fn-unguarded.sql` exits 1 and lists exactly the four `bad_*` policies: a bare `sees_all_residents()`, `has_permission() or sees_all_contacts()`, a cell in USING only with the scope call in WITH CHECK, and an invented `sees_all_clinics()` (the pattern covers future names). The four `good_*` ones pass, including `placement_history`'s every-branch-has-a-cell shape. Run over all 164 migrations as if new, it flags exactly one statement: `0150`'s `translations_select_perm`, the incident the item describes
- [x] **The new check is green on `main`.** `node scripts/check-policy-role-names.mjs` on dev: `41 policies call a scope function (has_shelter_floor, sees_all_clinical, sees_all_contacts, sees_all_residents); 41 with a cell ANDed beside every call, 0 deliberate, 0 without`, `RESULT: GREEN`. `node scripts/check-new-policy-role-names.mjs` against `origin/main`: ok
- [x] Invalid input is rejected with a readable message, not a crash. The static check's failure names file, policy and function, and gives the two ways out (AND the cell, or the marker). The live check names table, policy, clause and function
- [x] Boundary cases checked: a 17-case unit run of `unguardedScopeCalls()`. It covers a literal containing `has_permission(` (not counted), `NOT` (not counted), `CASE` branches, `x in (1,2)` (not read as a call), a cell inside an OR of cells (counted), and a cell inside an OR with a non-cell branch (not counted). It errs only towards reporting

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `facility_maps` writes | unchanged; now also audited | n/a — no policy or grant changed |
| management | `facility_maps` read | unchanged | n/a — as above |
| staff | `facility_maps` read | unchanged | n/a — as above |
| vet | as before | unchanged | n/a — as above |
| volunteer | as before | unchanged | n/a — as above |
| signed out | nothing | nothing | n/a — `check-app-access-gate.mjs` HARNESS-OK, anon refused all |

- [ ] Every role above tested — n/a: no policy and no grant changed; `check-app-access-gate.mjs` (HARNESS-OK, public_viewer reads 0 of 18 internal objects) and `check-view-write-grants.mjs` (292 statements, 0 failed) both green
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; `audit_log` stays admin-read-only under `0121`'s RLS

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no screen changes; the Recent changes labels are the follow-up's
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work. The trigger is AFTER, so `refuse_lifecycle_map` (BEFORE) still refuses first; both triggers present on dev. `check-policy-role-names.mjs`'s existing role-name half still reports the same `54 policies on 29 tables … perm-convert-vet` as before the change. `check-new-policy-role-names.mjs`'s role half is unchanged in behaviour: `findRolePolicies` is the same walk, now through a shared `findPolicies`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync merged nothing ("Already up to date")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: both items. Then searched open items for `audit_log`, `record_audit`, `facility_maps`, `history file`, `check-policy-role-names`, `public_viewer`, `sees_all`. The upload item (`Facility map plans uploaded…`) stays open for Lutan, with a note that its "who replaced it in `audit_log`" part is now done. `facility_maps writes…` asks a different question (which cell) and is unchanged. Nothing else is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-08-scope-functions-beside-a-cell.md` (what it asserts, why structural, the pattern not the list, the fifth function, the separate escape hatch, the "nothing in the app" correction)
- [x] `README.md` still accurate: it describes neither checker nor the audited table list
- [ ] **Release notes.** — n/a: nobody would notice yet; the checkers are developer tooling, and plan changes reach Recent changes only as nameless rows until the follow-up labels them, which is where the release line belongs
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: "true for `public_viewer`" read from dev's `roles` row; "41 policies", "26 call `sees_all_clinical`", "106 nameless rows" counted on dev; "only `0150` flagged" from running the checker over every file; the trigger's effect from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates and checker output above is quoted from the runs
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No; `-- consumer: none`. Order against the deploy does not matter
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only, one trigger
- [x] Apply plan stated: `0165` on production with the next release, after `0164`, either side of the deploy

### Rollback

- [x] Rollback position stated: a code rollback via the Pi `--ref` does not revert `0165`, and does not need to, because no code reads it. To remove the trigger: `drop trigger if exists audit_facility_maps on facility_maps;` in a new migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The item lists four scope functions; one (`sees_all_translations`) was dropped by `0154`, and it missed `sees_all_clinical()`, true for `public_viewer` and in 26 live policies | fixed: the check matches `sees_all_*` as a pattern |
| 2 | low | The item says "nothing in the app needs to change", but Recent changes shows the new rows with no table name and the file undo reason (as it already does for three tables) | deferred to backlog (`04c18e31`) |
| 3 | info | The brief says `check-policy-role-names.mjs` runs in CI; it does not (needs the Management API token) | addressed: the same rule added to `check-new-policy-role-names.mjs`, which CI runs |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface; a trigger nothing reads yet and two developer scripts

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises what the check asserts
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
