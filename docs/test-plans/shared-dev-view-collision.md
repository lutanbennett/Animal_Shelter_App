# Feature test plan — shared-dev-view-collision

## Header

| | |
|---|---|
| Feature | A decision record explaining why a new public view turns every other live stream's `public-views` check red, and what to do in each of the two windows |
| Backlog item | `docs/backlog.md` → none. The structural fix is already filed from the `0.33.0` release (commit `ed394e48`); this PR is the account of what happened, not the work |
| Branch / worktree | `claude/shared-dev-view-collision` @ `C:\Development\Animal_Shelter_shared-dev-view-collision` |
| Dev server | not started — no code changed |
| PR | this one |
| Tested by / date | Claude (planner session) / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `cc48f85c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one new file in `docs/decisions/`, written at Lutan's request in chat on 2026-10-16
- [x] Files/areas touched listed — exactly one: `docs/decisions/2026-10-16-shared-dev-view-collision.md`. No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified: none. A documentation file is not served to any role
- [x] Anything explicitly **out of scope** written down — the record says so itself: no change to `check-public-views.mjs`, `ci.yml` or branch protection, and no second backlog item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the worktree was cut from `main` at `6fd9cb35`, after #665 merged, so the merge was already current)
- [x] `node scripts/gates.mjs` ends clean — output pasted below exactly as printed. Note it reports four gates, not the three the template names: `test=0` as well
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no row is read by this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only, there is no path to walk
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a — docs only |
| management | nothing changed | unchanged | n/a — docs only |
| staff | retired role (`0173`) | n/a | n/a — docs only |
| doctor | nothing changed | unchanged | n/a — docs only |
| volunteer | nothing changed | unchanged | n/a — docs only |
| signed out | nothing changed | unchanged | n/a — docs only |

- [ ] Every role above tested — n/a: a file in `docs/` is not served to any role
- [ ] A role that should not have access is blocked server-side — n/a: no new route or RPC

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: this is a developer record, not a shelter-user topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no page loaded
- [ ] Network clean — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work — n/a by surface, but the claim the record rests on **was** re-verified: `node scripts/check-public-views.mjs` passes on this branch, with `public_appeals` and `public_appeal_photos` both reported ok
- [x] Any shared file touched checked from a second, unrelated page — no shared file was touched; `git show --stat` confirms the commit contains one file
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch adds a file that nothing imports

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item for this, and the structural fix is already filed from the release (`ed394e48`). Filing a second would duplicate it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — this PR *is* that file
- [x] `README.md` still accurate — unchanged and unaffected
- [ ] **Release notes.** n/a: a developer decision record — no shelter user would notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every factual claim in the record was read from the repo or from GitHub, not inferred: the FAIL lines are quoted from `gh run view 38883674951 --log-failed`; `git grep public_appeals origin/claude/script-fixes-fold -- scripts/check-public-views.mjs` is empty, which is what shows that branch never carried the declarations; `check-public-views.mjs` passes on a `main` that has both; and the "no fix on the branch while the schema PR is unmerged" window comes from the independent account filed by the `0.33.0` release, which hit it on #668. One earlier draft stated the sync remedy without that distinction and was corrected before this commit

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as `cc48f85c`; nothing here reaches a deployed build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no logic, no dates, no clock
- [ ] Boundary or banding assertions cover both edges — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line above is as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this commit removes one file in `docs/`. It does not cover, and does not need to cover, anything running: no schema, no Worker code, no served page is touched

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first draft of the record gave "sync" as the remedy without distinguishing the window in which the schema PR has not merged yet — where syncing brings nothing and there is no fix on the branch. It would have sent a reader to a remedy that cannot work | fixed before the commit, after reading the independent account filed from the `0.33.0` release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the record reads usefully to someone meeting a red `public-views` for the first time — it is written for that person, and only a person can judge it | `docs/decisions/2026-10-16-shared-dev-view-collision.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-10-16

### Manual verification

Manual verification by: pending: whether the record reads usefully to someone meeting this red for the first time

Result: pass
