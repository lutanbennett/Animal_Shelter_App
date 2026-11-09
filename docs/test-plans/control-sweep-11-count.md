# Feature test plan

---

## Header

| | |
|---|---|
| Feature | control-sweep-11-count: count the pages no control sweep has driven, drive three to cost the rest |
| Backlog item | `docs/backlog.md` → `#79sqf` (not ticked: a count does not close it) |
| Branch / worktree | `claude/control-sweep-11-count` @ `C:\Development\Animal_Shelter_control-sweep-11-count` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | cb298c4f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a decision file counting the 167 pages, the 13 driven, the 93 not, the 44 worth driving, with three calibration drives and a costing
- [x] Files/areas touched listed: `docs/decisions/2026-11-08-control-sweep-11-count.md` and this plan only; no application source, no script, no migration
- [x] Cards affected identified: none change behaviour; drives used exactly `dashboard`, `do_maintenance`, `view_residents`, `food_forecast`; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down: the walk of the 44 pages, fixing the two findings (another area's file), `check-menu-coverage.mjs`/`check-production.mjs` (`#av8rq`), `/admin/diets` (`diets-one-card`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with four gates, each exit code 0, run after the sync:

```
=== gates: typecheck exited 0 after 88s
=== gates: lint exited 0 after 251s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 232s
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
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: the three drives in decision §5 reached each page by clicking from `/my` and listed every control drawn
- [ ] Data persists — n/a: nothing in this change writes; the one job created (M-6932) was set-up data for drive 1 and was seen on reload by a second login
- [ ] Create / edit / delete all exercised — n/a: the change adds no create, edit or delete
- [ ] Empty state renders sensibly — n/a: no UI changed (the maintenance board's empty state was seen and is noted in §5 of the decision)
- [ ] Invalid input is rejected — n/a: no input added
- [ ] Boundary cases checked — n/a: no logic added; the count's arithmetic was rechecked by hand against the classifier output

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | not driven | n/a: Admin is outside the card system and is not this count's subject | n/a |
| exactly `dashboard` | `/maintenance`, a job | read only, no write controls | no write control; enclosure link sends to `/no-access` (F1), notice promises photos (F2) |
| exactly `do_maintenance` | `/maintenance`, new job | Log maintenance drawn, job saves | as expected (set-up for drive 1) |
| exactly `view_residents` | `/residents`, hub, Housing, Photos | read only | as expected, nothing found |
| exactly `food_forecast` | `/management/diets` | read only, no edit | as expected, nothing found |
| signed out | not driven | n/a: no page changed | n/a |

- [x] Every login above tested (admin and signed out: n/a with reason in the table)
- [x] A login that should not have access is blocked server-side: the `dashboard` login pressing the enclosure link was refused by `/enclosures/[id]`'s guard (`/no-access`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no UI changed
- [ ] Browser console clean — n/a: no UI changed
- [ ] Network clean — n/a: no UI changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the branch adds two docs files only, and the gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: the brief forbids ticking `#79sqf`; a count does not close it, and no other open item was closed outright
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-08-control-sweep-11-count.md`
- [x] `README.md` still accurate (nothing it describes changed)
- [ ] **Release notes.** — n/a: nothing a shelter user would notice; docs only
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: page and card counts from a script run on 2026-11-09, `check-ungranted-activities.mjs` output, and three driven pages; the per-page context figure is labelled an estimate in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: docs only, nothing deploys
- [ ] Deployed SHA matches — n/a: docs only, nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: docs only, nothing deploys
- [ ] Smoke-tested on test — n/a: docs only, nothing deploys
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block in §2 is pasted unedited; nothing else is pasted
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] Production ref line read — n/a: docs only, nothing deploys
- [ ] strip-baked-env seen — n/a: docs only, nothing deploys
- [ ] New secret exists — n/a: no secret added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Fresh backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: docs only; reverting the commit is the whole rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| F1 | low | `MaintenanceJobView.tsx:177-184` links a job's enclosure without asking `facility.enclosures` read; `dashboard` and `bills` logins are sent to `/no-access` | deferred to backlog (for the planner to file; another area's file) |
| F2 | low | the maintenance job read-only notice says "and add photos" to logins without `maintenance.photos` | deferred to backlog (for the planner to file) |

## Left for manual verification

Empty: the deliverable is a document, and the three drives were driven by Claude with screenshots taken in session.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing for a person to look at; docs-only count

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file rather than pasting it
- [ ] Handed to the production release manager — n/a: docs only, nothing ships to production

Result: pass with accepted defects

Release manager acknowledgement: n/a: docs only, nothing to release
