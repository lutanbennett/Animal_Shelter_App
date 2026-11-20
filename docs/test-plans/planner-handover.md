# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `767` — a delta against `766` |
| Backlog item | n/a: the handover is a process document, not a backlog item (`/plan-day` step 8) |
| Branch / worktree | `claude/planner-handover` @ `C:\Development\Animal_Shelter_planner-handover` |
| Dev server | n/a: one markdown document, no surface |
| PR | opened from this branch |
| Tested by / date | Claude (planner) / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 25f35d359 |

## 1. Scope and risk

- [x] Change is described in one sentence: replace `docs/planner-handover.md` with edition `767`, a delta against `766` covering the ten streams merged since it
- [x] Files/areas touched listed: `docs/planner-handover.md` and this plan. **Nothing else** — no code, no schema, no scripts
- [x] Cards affected identified: none. A handover is read by one chat and grants nothing; no card, role or permission is read or changed, and neither Admin nor the signed-out public can reach it
- [x] Out of scope written down: `docs/release-handover.md` (the release manager's, current at `0.47.6`), the skill-file edits `767` records as still owed (a `/plan-day` change, its own PR), and every open item it lists

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from `origin/main` after #1768 merged; the finishing sync runs before merge
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all zero:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 44s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 149s
=== gates: test — npm test
=== gates: test exited 0 after 30s
=== gates: build — npm run build
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration; the previous edition is in git history
- [ ] Production apply plan stated — n/a: no migration and nothing to deploy

## 4. Functional checks

- [x] Happy path works end to end: the document is what the next planner reads first. Read back whole after writing, against `/plan-day` step 8 — it is a delta, it names the ten streams it covers, and it says which figures exist
- [x] Every figure in it was read from a `stream-usage:` PR comment, not carried from `.plan-day.md` prose: ten comments read with `gh pr view <n> --json comments`
- [x] The three set-aside figures each say **why** they are not readings (`rescoped=yes`, `compacted=yes`, dials that do not match the band), as the reading rule requires
- [x] Its corrections of `766` are stated as corrections: the migration count (two → five) and what the planner had wrong in three files (the UAT deploy owner)
- [ ] Data persists — n/a: a document; git is the persistence
- [ ] Create / edit / delete exercised — n/a: no surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

- [ ] Every login above tested — n/a: a repository document, reachable by no login
- [ ] A login that should not have access is blocked server-side — n/a: not served by the app

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: not a page
- [ ] Manual updated — n/a: the manual is for shelter users; this is a planner document
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no surface
- [ ] Browser console clean — n/a: no surface
- [ ] Network clean — n/a: no surface

## 6. Regression

- [x] The pages nearest the change still work — n/a in the page sense; the real regression risk for a handover is **losing what the previous edition still needed**, so `766`'s unresolved items were carried forward by name (the floor-row narrowing, the 135k note, the edit-is-not-an-audit lowering, the `+10k` verdict) and the ones it closed are recorded as closed
- [x] Any shared file touched: none. `docs/planner-handover.md` is read by one chat and written by one PR per nine streams
- [x] Nothing merged from `main` during `sync` was broken by this branch — it is a single markdown file

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a handover closes no backlog item. The items it names stand on their own merits, and the two notes it carries were filed on the `backlog` branch earlier today
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choices; the document **is** the record
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a planner document in `docs/`. No shelter user, Admin or product administrator sees anything appear, move or disappear — nothing in the app changes
- [x] Commit messages say why, not just what: the commit records what `767` corrects in `766` and the one new rule it adds
- [x] Claims were measured, not reasoned: every figure came from a PR comment, the migration state from the release manager's status read, the deploy ownership from `docs/release-procedure.md` lines 62-64 read directly, and the floor from eighteen `tokens − messages` subtractions

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — n/a: nothing deploys. A handover reaches `main` and is read from there
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no date handling in code. The document's own date was read from the system clock and compared with the previous edition's, as it instructs its successor to do
- [ ] Boundary or banding assertions cover both edges — n/a: no boundary logic
- [x] Evidence pasted is the tool's actual output, unedited — the gates block in section 2 is this run's own output
- [ ] Public pages re-checked after a cache purge — n/a: no public surface

### Deploy safety

- [ ] `deploy: <env> → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the environment — n/a: none added

### Migration ordering

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the commit; `766` is in git history and nothing reads this file at runtime

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | None found in this change. The faults `767` records are the day's, and each is either fixed, filed, or named as still owed. | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | Nothing for a person to look at. The document's accuracy is checkable from the PR comments, the backlog and `docs/release-procedure.md`, all cited in it, and the next planner reading it is the real test. | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: a planner handover is not part of a release

Result: pass

Release manager acknowledgement: n/a: not a release artifact
