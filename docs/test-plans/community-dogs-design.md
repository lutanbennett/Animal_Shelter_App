# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Community and temple dogs helped: options paper for the Director (design half only) |
| Backlog item | `docs/backlog.md` → Record community and temple dogs helped (design, then schema) — stays open; the schema half follows her answer |
| Branch / worktree | `claude/community-dogs-design` @ `C:\Development\Animal_Shelter_community-dogs-design` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | tip of `claude/community-dogs-design` when the PR opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one document, `docs/design/community-dogs.md`, setting out three options with a recommendation for the Director, and nothing built
- [x] Files/areas touched listed: `docs/design/community-dogs.md` (new), this plan. A copy of the paper on the Desktop is outside the repo. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: no code or screen changes for any role; the only reader is the Director
- [x] Out of scope written down: no table, column, page or count; no unit decided; the website band is not promised; temple and community dogs kept as an open "one count or two" question

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; no number reserved
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised against real rows — n/a: no schema change
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no feature
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no code

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a |
| management | nothing new | no change | n/a |
| staff | nothing new | no change | n/a |
| vet | nothing new | no change | n/a |
| volunteer | nothing new | no change | n/a |
| signed out | nothing new | no change | n/a |

- [ ] Every role above tested — n/a: nothing was added for any role
- [ ] A role that should not have access is blocked server-side — n/a: no route or data added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a shelter user can see
- [ ] Translatable strings go through the translation path — n/a: the Thai wording is a proposal inside the paper; no dictionary changed, and it is for the Director to correct before any is added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing under `src/` changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates ran after sync with all three at 0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately not ticked, it is "design, then schema" and this is the first half; the status note goes on the `backlog` branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing is decided; the paper asks for the Director's answer, and that answer becomes the decision file
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a design paper, nothing a shelter user can see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The paper's claims about the existing mechanism were read from `0156_impact_baselines.sql` (baseline strictly before the live count; computed, never stored) and `docs/backlog.md`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no code
- [ ] Boundary or banding change assertions — n/a: no code
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: the only evidence is the `gates:` line above, pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: neither
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a document only; reverting the commit removes it, and nothing else depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | None found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a document only, no screen or behaviour to look at. The Director's reading of the paper is the next step and is her answer, not a sign-off

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a (design paper only)  Date: 2026-10-07
