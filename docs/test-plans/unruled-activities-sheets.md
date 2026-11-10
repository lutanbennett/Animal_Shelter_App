# Test plan — unruled-activities-sheets

| | |
|---|---|
| Feature | unruled-activities-sheets |
| Backlog item | `docs/backlog.md` → #c4vn7 (title rewritten, not ticked) |
| Branch / worktree | `claude/unruled-activities-sheets` @ `C:DevelopmentAnimal_Shelter_unruled-activities-sheets` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` (not started: nothing to run) |
| PR | opened with this plan |
| Tested by / date | Claude / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 38ecc736 |

## 1. Scope and risk

- [x] Change is described in one sentence: fourteen plain-English decision sheets in docs/unruled-activities-walkthrough.md, plus one backlog title rewrite
- [x] Files/areas touched: docs/unruled-activities-walkthrough.md (new), docs/backlog.md (one title), this plan; no src, worker or migrations
- [x] Cards affected: none; nothing changes what any card grants. Admin and the signed-out public are unaffected
- [x] Out of scope: recording the three answered rulings in the allowlist, creating any card, fixing any fault found (listed in the PR for the planner)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` closing lines, as printed by my run:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 78s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 268s
=== gates: test — npm test
=== gates: test exited 0 after 61s
=== gates: build — npm run build
=== gates: build exited 0 after 279s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on main — n/a: no migration in this PR
- [ ] node scripts/apply-migrations.mjs --status reviewed before applying — n/a: no migration in this PR
- [ ] node scripts/apply-migrations.mjs --dry-run reviewed — n/a: no migration in this PR
- [ ] Applied to dev and recorded in schema_migrations — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows in a begin/rollback harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only change, no UI surface and no code path
- [ ] Data persists — n/a: docs-only change, no UI surface and no code path
- [ ] Create / edit / delete all exercised — n/a: docs-only change, no UI surface and no code path
- [ ] Empty state renders sensibly — n/a: docs-only change, no UI surface and no code path
- [ ] Invalid input is rejected with a readable message — n/a: docs-only change, no UI surface and no code path
- [ ] Boundary cases checked — n/a: docs-only change, no UI surface and no code path

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| none | n/a | docs only, no route added | n/a |

- [ ] Every login above tested — n/a: no route or permission changed
- [ ] A login that should not have access is blocked server-side — n/a: no route or permission changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: docs-only change, no UI surface and no code path
- [ ] Manual updated — n/a: docs-only change, no UI surface and no code path
- [ ] Translatable strings go through the translation path — n/a: docs-only change, no UI surface and no code path
- [ ] Mobile viewport (375px) — n/a: docs-only change, no UI surface and no code path
- [ ] Browser console clean — n/a: docs-only change, no UI surface and no code path
- [ ] Network clean — n/a: docs-only change, no UI surface and no code path

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; the only edit to docs/backlog.md is one item title
- [x] Nothing merged from main during sync was broken by this branch (sync was already up to date)

## 7. Documentation

- [x] Backlog item #c4vn7 deliberately NOT ticked (the session with Lutan is what remains); its title was rewritten to say the sheets are ready
- [ ] Non-obvious design choices added as a new file in docs/decisions/ — n/a: no design choice made; the walkthrough file itself is the record and rules nothing
- [x] README.md still accurate (untouched, nothing it describes changed)
- [ ] **Release notes.** n/a: preparation material for a decision session; no shelter user sees it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every claim in the sheets quotes a file and line read in this session; where I only found no caller, the sheet says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (the gates block above)
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] deploy line read and ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] apply-migrations --env production --dry-run — n/a: no migration
- [ ] Destructive or rewriting migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: docs-only; revert the commit, nothing deployed depends on it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan reads the fourteen sheets in his session and rules each one | docs/unruled-activities-walkthrough.md |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's walkthrough session

Manual verification by: pending: Lutan's walkthrough session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: release manager reads it at the next release

Result: pass

Release manager acknowledgement: pending: release manager
