# Feature test plan — pi-failover-paper-key

Filled from `docs/test-plan-template.md`. A follow-up to #310: it records, in the
paper and in the backlog item's status line, that the `server-actions-encryption-key`
stream checked the Worker's own build for the shared form key. A document, no
code changed. **The key result is another session's report and was not re-run
here.**

---

## Header

| | |
|---|---|
| Feature | Fold the Worker-build confirmation of the shared form key into `docs/pi-failover.md` and the item's status line |
| Backlog item | `docs/backlog.md` → Rethink Pi failover: today a power cut still refuses writes |
| Branch / worktree | `claude/pi-failover-paper-key` @ `C:\Development\Animal_Shelter_pi-failover-paper-key` |
| Dev server | not used: a document |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: three passages in the paper and one in the backlog status line now say the Worker's OpenNext build was checked and the key is not live until #312 merges and both builds redeploy
- [x] Files touched: `docs/pi-failover.md`, `docs/backlog.md` (the one status line), this plan
- [ ] Roles affected identified — n/a: no app code
- [x] Out of scope, written down: the decision file (still not agreed), any drill, and #312 itself, which this PR neither reviews nor depends on

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` at `8743055` minutes earlier; nothing to merge
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] The new wording matches what was reported: the other stream's message says the Worker's OpenNext build records the same key and the same 164 action ids as the plain build the Pi runs, that the fix is PR #312 with its evidence in `docs/decisions/2026-10-03-server-actions-encryption-key.md`, and that the key must be in both machines' values files and both builds deployed. `gh pr view 312` showed it **open** and clean when this was written, so the paper says "not yet deployed" and cites the decision file as arriving with #312, because it is not on `main`
- [ ] Data persists — n/a: no records
- [ ] Create / edit / delete exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no code

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every role above tested — n/a: no app code
- [ ] A role that should not have access is blocked server-side — n/a: no endpoint

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: a design paper, not a feature a user operates
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: only documents changed
- [ ] Shared file checked from a second page — n/a: no shared app file touched; `docs/backlog.md` changed in the one status line
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged, and the build exited 0

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately open; the item ends "then build". Its status line was updated instead
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: nothing is decided; the recommendation is still not agreed
- [x] `README.md` still accurate — it does not describe failover behaviour
- [ ] **Release notes.** n/a: a document only, nothing ships to a shelter user
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned **where stated as facts**: the only new fact is the other stream's result, and the paper credits it as theirs and "not re-run here"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at the next `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: no code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code changed
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no thresholds changed
- [ ] Evidence pasted is unedited tool output — n/a: the only pasted output is the gate line, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. It changes wording in two documents; nothing reads them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first edit cited `docs/decisions/2026-10-03-server-actions-encryption-key.md` as if it were on `main`; it is only in #312 | fixed: the paper now says it arrives with #312 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After #312 merges and both builds are redeployed, the paper's "not yet deployed" wording is out of date and should be reworded | the next session on the paper |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the single item is a reminder for later wording, not something a person has to look at now; see `n/a:` below

Manual verification by: n/a: nothing to look at; the paper's own open questions are tracked in #310's plan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises the plan and names its file rather than pasting it, since every line but the gate output is `n/a`
- [ ] Handed to the production release manager — n/a: nothing here ships

Result: pass

Release manager acknowledgement: pending
