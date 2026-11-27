# Feature test plan

## Header

| | |
|---|---|
| Feature | `shelter_hosts.shelter_id` nullable again (0448) |
| Backlog item | `docs/backlog.md` → `#shnul` |
| Branch / worktree | `claude/shelter-hosts-nullability` @ `C:\Development\Animal_Shelter_shelter-hosts-nullability` |
| Dev server | n/a: schema only, no dev server needed |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | yes |
| Tested at SHA | bf6fbe05d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: drop NOT NULL and the default on `shelter_hosts.shelter_id`, restoring 0382's nullable front-door design that 0390/0397's sweeps removed
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0448_shelter_hosts_shelter_id_nullable.sql`, one decision file, the backlog tick, this plan
- [ ] Cards affected identified — n/a: no card or policy changes; the table is service-role and product-admin only
- [x] Anything explicitly **out of scope** written down: the two cooperjaidee.org rows still stamped Lanna, and the UAT/production reads, are left to the planner (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — every gate 0, output below

```
=== gates: typecheck exited 0 after 67s
=== gates: lint exited 0 after 231s
=== gates: test exited 0 after 48s
=== gates: build exited 0 after 245s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one (`check-migration-numbers.mjs`: ok, highest 0447)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (`dry-run 0448_shelter_hosts_shelter_id_nullable.sql … ok`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`; afterwards `is_nullable=YES`, `column_default=null`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): dropping NOT NULL or a default that is already gone is a no-op
- [x] Existing rows still read correctly after the change (checked against real dev data): all nine hosts unchanged, each still joined to its shelter
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: asserted an insert omitting `shelter_id` stays null (default gone), that `0428`'s `shelter_hosts_primary_has_shelter` now refuses `is_primary` on that row (check_violation), and that it is the only null row; ended `HARNESS_OK`, rolled back
- [x] Down-migration written, or the reason one is not needed is stated: the undo is in the file's header
- [x] Production apply plan stated for the release manager: apply `0448` to UAT and production with the release, after the planner has read both environments' `shelter_hosts` columns; order relative to the deploy does not matter (no code reads it)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: schema only, no UI surface
- [ ] Data persists — n/a: schema only, no UI surface
- [ ] Create / edit / delete all exercised — n/a: schema only, covered by the rollback harness in section 3
- [ ] Empty state renders sensibly — n/a: schema only, no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: schema only, no UI surface
- [ ] Boundary cases checked — n/a: schema only; the null boundary is the harness in section 3

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no access change | n/a |
| signed out | n/a | n/a: no access change | n/a |

- [ ] Every login above tested — n/a: no policy, grant or card changes in this PR
- [ ] A login that should not have access is blocked server-side — n/a: no policy, grant or card changes in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: schema only, no UI surface
- [ ] Manual updated — n/a: schema only, no UI surface
- [ ] Translatable strings — n/a: schema only, no UI surface
- [ ] Mobile viewport — n/a: schema only, no UI surface
- [ ] Browser console clean — n/a: schema only, no UI surface
- [ ] Network clean — n/a: schema only, no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code reads the column's nullability; the Worker's resolver already handles a null id
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (sync was already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-11-27-shelter-hosts-shelter-id-nullable.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: schema only, nobody would notice; no row changes and nothing reads the shape
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The history was read from dev's row timestamps and joins, and from 0390/0397's own loops

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing time-dependent
- [ ] **For a boundary or banding change** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page reads this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: migration only
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: planner reads production's column first, then release manager
- [ ] For a **destructive or rewriting** migration only: a fresh backup — n/a: relaxes a constraint and drops a default, no data rewritten
- [x] Apply plan stated: `0448`, UAT `fsjagxmxjosauwmxwype` and production `dbkodyyxxhtygxcxmfcu`, any time relative to the deploy, after the planner's read

### Rollback

- [x] Rollback position stated: the down statement in `0448`'s header; it fails if a null row has since been written, which is correct

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | cooperjaidee.org and www.cooperjaidee.org still carry Lanna's shelter_id (0390's stamp) | deferred to backlog: for the planner to file after reading production |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: schema only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — pending: at the next release

Result: pass with accepted defects

Release manager acknowledgement: pending: next release
