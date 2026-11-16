# Feature test plan — edonation-format-establish

## Header

| | |
|---|---|
| Feature | Research record: the e-Donation submission format was looked for and NOT established |
| Backlog item | `docs/backlog.md` → #k2vd9 (left open) |
| Branch / worktree | `claude/edonation-format-establish` @ `C:\Development\Animal_Shelter_edonation-format-establish` |
| Dev server | not started — no code changed |
| PR | pending |
| Tested by / date | Claude / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | `97fd64be1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a decision file recording what was searched and what is and is not established about the e-Donation format
- [x] Files/areas touched listed — `docs/decisions/2026-11-16-edonation-format-establish.md` and this plan only
- [ ] Cards affected identified — n/a: no code changed, so no card, admin or public behaviour changes
- [x] Anything explicitly out of scope written down — the CSV, its label, any submission button or URL, and the tax-ID data and retention job are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line:

```
=== gates: typecheck exited 0 after 105s
=== gates: lint exited 0 after 294s
=== gates: test exited 0 after 56s
=== gates: build exited 0 after 268s

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
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code changed
- [ ] Data persists — n/a: no code changed
- [ ] Create / edit / delete — n/a: no code changed
- [ ] Empty state renders sensibly — n/a: no code changed
- [ ] Invalid input is rejected — n/a: no code changed
- [ ] Boundary cases checked — n/a: no code changed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing new | unchanged | n/a: no code changed |

- [ ] Every login above tested — n/a: no code changed
- [ ] A login that should not have access is blocked server-side — n/a: no code changed, the export route still asks `donation.receipt`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no code changed
- [ ] Manual updated — n/a: no code changed
- [ ] Translatable strings — n/a: no code changed
- [ ] Mobile viewport — n/a: no code changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no code changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open, because neither "done" branch is met; retitle is for the planner to file. Searched the backlog for the e-Donation names: nothing else closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-16-edonation-format-establish.md`
- [x] `README.md` still accurate — it does not mention the format
- [ ] **Release notes.** n/a: the format is still unestablished and the accountant has not confirmed anything, so no note may promise an export
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the decision file marks the Thai-manual facts as an unverified search summary

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no code changed
- [ ] Boundary or banding change — n/a: no code changed
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: no code changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — docs only; nothing to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Accountant says what she uploads today; a Thai speaker reads the manual's upload-file section | outside the app |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the accountant's answer and a Thai reading

Manual verification by: pending: the accountant's answer and a Thai reading of the manual

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: PR not yet open
- [ ] Handed to the production release manager — pending: nothing ships from this PR

Result: pass

Release manager acknowledgement: pending: release manager
