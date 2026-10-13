# Feature test plan

## Header

| | |
|---|---|
| Feature | Stop the finished backup-key custody job being reported as outstanding |
| Backlog item | none: the backlog item *Backup key custody is not finished* was already ticked (`59f8e1a2`); this corrects the two records that still listed it |
| Branch / worktree | `claude/backup-custody-record` @ `C:\Development\Animal_Shelter_backup-custody-record` |
| Dev server | n/a: documentation only |
| PR | |
| Tested by / date | Claude, 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — the backup-encryption test plan's "Manual verification by: pending" line is narrowed from all eight items to the two still open (4 and 8), with a dated status note recording Lutan's 2026-10-13 confirmation of where the key is held, and the 2026-10-03 manual-verification-queue snapshot marks the key-pair row done
- [x] Files/areas touched listed: `docs/test-plans/backup-encryption.md`, `docs/manual-verification-queue.md`, this plan
- [x] Roles affected identified: none; no code
- [x] Out of scope: signing the backup-encryption plan (the narrowed line stays `pending`, it is not a signature), the open items 4 and 8 (each is its own backlog item), any code or schema

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: documentation only, branched from `origin/main` minutes before the PR
- [ ] `node scripts/gates.mjs` — n/a: no code changed; typecheck, lint and build read nothing in these files
- [x] `node scripts/check-test-plan.mjs` run on this branch — see PR
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the backup-encryption plan's pending line now names only items 4 and 8, and its status note cites the 2026-10-02 progress note, the 2026-10-13 restore rehearsal (`docs/decisions/2026-10-13-restore-rehearsal-local.md`) and the tick `59f8e1a2`, each checked to exist
- [ ] Data persists — n/a: documentation only
- [ ] Create / edit / delete all exercised — n/a: documentation only
- [ ] Empty state renders sensibly — n/a: documentation only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: documentation only
- [ ] Boundary cases checked — n/a: documentation only

### Role access matrix

- [ ] n/a: no access change; documentation only

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | unchanged | unchanged |

- [ ] Every role above tested — n/a: no access change
- [ ] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no behaviour changed
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no pages changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: documentation only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item was already ticked by `59f8e1a2`; nothing else in the backlog describes this record
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; a stale record corrected
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** — n/a: no shelter user would notice; internal records only
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were checked, not reasoned — the file names, the commit and the decision file were each looked up on this branch

## 8. Pre-production gate

- [ ] deferred: release manager — nothing to deploy; documentation only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

None found.

## Left for manual verification

| # | What to check | Where |
|---|---|---|

None: there is nothing to look at.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty; documentation only

Manual verification by: n/a: documentation only, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: pending  Date: —
