# Feature test plan

## Header

| | |
|---|---|
| Feature | Migration lint: a new view must revoke its write grants. (The volunteer-refusal audit row was not built; see §1.) |
| Backlog item | `docs/backlog.md` → *Security*: "The next view a migration creates will again be writable by every signed-in login." |
| Branch / worktree | `claude/grants-lint-and-refused-row` @ `C:\Development\Animal_Shelter_grants-lint-and-refused-row` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (not used: no app change) |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `c67de1b2` (the lint change; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `check-migration-grants.mjs` fails a file above 0160 that creates a public view without revoking insert, update, delete, truncate, references and trigger from authenticated and anon; header updated, as the item asked
- [x] Files/areas touched listed — `scripts/check-migration-grants.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-09-view-revoke-lint.md`, this plan
- [x] Roles affected identified — none at runtime; it constrains future migrations only
- [x] Anything explicitly **out of scope** written down — the brief's second half, a volunteer's refused assistant request writing an `assistant_actions` row, was **not built**. The insert policy (0150) asks `assistant.record`, which volunteers lack, and the row is written under the caller's session, so the database would refuse it. Lutan chose (2026-10-09) to leave it open with that finding noted on the backlog branch rather than widen the policy. The *Assistant* item stays unticked

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 174s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-migration-grants.mjs` over every file above 0077: `migration grants: ok (89 file(s) checked)`, exit 0
- [ ] Data persists — n/a: a lint script, nothing is stored
- [ ] Create / edit / delete exercised — n/a: a lint script, no records
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash — synthetic files run one at a time: a plain `create view` with only a select grant, and one revoking only insert/update/delete, are both flagged naming the missing roles; `revoke all on public.foo from anon, authenticated, service_role` passes; revoking from anon alone is flagged "short for authenticated"
- [x] Boundary cases checked — the floor: the same bad view in a file numbered 0150 passes (exempt), at 0170 fails. The replace exemption: `create or replace view immunization_next_due` with no revoke passes (an earlier file created it); the same after `drop view if exists immunization_next_due` fails; a plain `create view` of that name fails. Before the exemption existed, 0166's replace of `immunization_next_due` was flagged on `main` — a false finding, since 0160 revoked it and a replace keeps grants

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | lint script, no app surface | n/a |
| management | n/a | lint script, no app surface | n/a |
| staff | n/a | lint script, no app surface | n/a |
| vet | n/a | lint script, no app surface | n/a |
| volunteer | n/a | lint script, no app surface | n/a |
| signed out | n/a | lint script, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the rule is documented in the script's header
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the script's other checks (grants, RLS, function revokes, anon grants, gated views) still pass on all 89 files; `apply-migrations.mjs` calls the same script on pending files, and the floor is by file number, so it applies there too
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date; gates green after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — *Security* item, citing `c67de1b2`; the *Assistant* item left open by Lutan's decision, its note added on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-view-revoke-lint.md` (floor at 0160, replace exemption)
- [x] `README.md` still accurate — it does not describe the lint's individual rules
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a check on migration files run by developers and CI; nothing in the app changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 89-file pass, the 0166 false finding and every synthetic case above were run; "a replace keeps grants" is Postgres's documented behaviour and agrees with 0164's and 0166's own comments, not re-measured on dev here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing date-related
- [ ] Boundary or banding change covers both edges — n/a: no runtime boundary; the lint's own floor is covered in §4
- [ ] Evidence pasted is the tool's actual output — deferred: production release manager
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: the change runs only in `npm run lint`; reverting the commit is the whole rollback, and nothing deployed depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | First version of the rule flagged 0166's `create or replace` of `immunization_next_due` (already clean since 0160) | fixed: replace of an existing, undropped view is exempt |

## Left for manual verification

Empty: a lint script with no app surface; every check above is a script run.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no app surface; the change is a lint rule verified by running it

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open
- [ ] Checklist pasted into the PR — n/a: linked from the PR body instead
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: production release manager
