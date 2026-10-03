# Feature test plan — maintenance-phone-board

## Header

| | |
|---|---|
| Feature | The maintenance board on a phone (§13 of the roles paper): a Move job on tap with a confirmation in words replaces the drag for phone users, and Log maintenance becomes four steps on the shared wizard chrome |
| Backlog item | `docs/backlog.md` → "Roles build: the maintenance board on a phone" (status line added, deliberately not ticked: R3's role is not built) |
| Branch / worktree | `claude/maintenance-phone-board` @ `C:\Development\Animal_Shelter_maintenance-phone-board` |
| Dev server | `next dev` on `http://localhost:3006` (this worktree's `.port`) |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | see the PR's head commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — each phone card on the maintenance board gets a Move job on button (every other status, a confirmation in words, back a column and Completed included), and logging a job is four steps (what, where, who and when, review) with nothing lost on Back
- [x] Files/areas touched listed — `src/app/maintenance/MaintenanceBoard.tsx`, `src/app/maintenance/MaintenanceForm.tsx`, both dictionaries (`maintenance.move`, `maintenance.wizard`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-03-maintenance-board-phone.md`, this plan. It reuses `src/app/residents/new/WizardChrome.tsx` unchanged
- [x] Roles affected identified — admin, management and staff (the roles that can write maintenance today); a volunteer sees no Move job on button (`canWrite`) and is refused by the unchanged server action
- [x] Anything explicitly **out of scope** written down — the Head of Maintenance role, login and home (R3), recurring-task setup (stays Management's), `recurring-jobs-phone`, F-08/F-09 (icons without words, 16 px row actions: `icon-buttons`), and the job page's and My tasks' own status buttons (see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 35s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 54s
=== gates: build — npm run build
=== gates: build exited 0 after 182s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema or query change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

**What was and was not driven.** The dev server started and the board's route
redirected to `/login` as it should. Signing in needs an account, and the
dev-account password is not something this session may read or type, so no
signed-in page was loaded in the browser pane. Everything below that needs a
signed-in page is therefore **not run** and is listed under *Left for manual
verification* with the exact steps, including the 375 px `scrollWidth` readings
the brief asks for. What *was* checked: the type check, the lint (which runs
the acceptance-matrix check), the production build, and by reading the code the
points under *Reasoning, not observation* in section 5.

- [ ] Happy path works end to end — n/a: not run — no signed-in browser session; steps 1–4 under Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: not run — same reason; the status is written by the unchanged `setMaintenanceStatus` and the phone tap calls the same `moveJob` as the drag
- [ ] Create / edit / delete all exercised — n/a: not run — same reason; no server action changed, so the existing create and edit paths are unchanged by construction
- [ ] Empty state renders sensibly (no rows yet) — n/a: no empty state changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not run; the wizard's two step checks (title, location) are in code and the server's validation is unchanged
- [ ] Boundary cases checked — n/a: not run; Thai and long-title cases are in Left for manual verification

### Role access matrix

No permission or route changed. `canWrite` already gated the drag; the new button is inside the same `canWrite` check.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | board, Move job on, Log maintenance | works | not driven live |
| management | same | works | not driven live |
| staff | same | works | not driven live |
| vet | not given maintenance | unchanged | not driven live |
| volunteer | board read-only | no Move job on button; refused if forced | not driven live |
| signed out | `/maintenance` | redirected to `/login` | **observed**: `/maintenance` → `/login?next=%2Fmaintenance` |

- [ ] Every role above tested — n/a: not run — no signed-in session; only signed out was observed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; `setMaintenanceStatus` is untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the two maintenance topics were rewritten for the steps and the tap (the file; `/manual` itself not loaded, see Left for manual verification)
- [x] Translatable strings go through the translation path — every new string is in `en.ts` and `th.ts` (`maintenance.move`, `maintenance.wizard`); the type check proves the two match. The Thai wording is mine and wants a Thai reader (Left for manual verification)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not run — needs a signed-in page; the `scrollWidth <= clientWidth` readings for the board, the Move job on sheet and each wizard step, in both languages, are Left for manual verification #1
- [ ] Browser console clean — n/a: not run, no signed-in page
- [ ] Network clean — n/a: not run, no signed-in page

*Reasoning, not observation* (to be confirmed by item 2 below): every wizard step stays mounted and is only `hidden`, so Back loses nothing; `required` is off in create mode so a hidden required field cannot make the browser refuse silently; Enter in a text input is blocked so a half-filled job cannot save; the desktop columns and `draggable` cards are unchanged and the phone controls sit in the `md:hidden` branch.

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not run — Left for manual verification #3 (job page status buttons, My tasks, edit job form, the enclosure hub's Log maintenance link into the new wizard)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the shared files are `WizardChrome.tsx` (read only, not edited), `manual/en.ts`, `releases.ts`, the dictionaries; none changed a value another page reads. Not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately not ticked (the brief: R3's role is not built); a status line naming this PR and §13's board was added instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-03-maintenance-board-phone.md`: the tap model, the coexistence with the drag, the three phone paths reconciled
- [x] `README.md` still accurate — it does not describe the board's interaction
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line written for the person doing the job: a tap on a phone moves a job on, logging is short steps, the drag still works on a computer
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the decision file's claims are about code that was read; nothing in it states a measured behaviour that was not measured, and the browser behaviour is listed as not yet observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing derives "today" or any instant; the Completed date is stamped by the unchanged trigger
- [ ] **For a boundary or banding change, both edges covered** — n/a: no threshold changed; the `md` breakpoint is the existing one and is checked at 375 px and desktop in Left for manual verification #1 and #2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block is pasted from the run
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — UI only: redeploy the previous build (`./scripts/pi/deploy-pi.sh --ref <sha>`, or `npx wrangler rollback --env production` for the Worker fallback); no schema, data or server action changed, so there is nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | process | The change was never opened in a signed-in browser session, so no behaviour in the UI is observed, only type-checked and built | deferred: Left for manual verification below |
| 2 | low | The job page's status buttons and My tasks' status change do not ask for the confirmation the board's tap does; three paths to one status with two kinds of wording | accepted — see the decision file; revisit when the 2IC is watched |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | At 375 px (mobile preset, reloaded after switching), in **English and Thai**: the board list, a card's Move job on sheet open, and each of the four Log maintenance steps. Read `document.scrollingElement.scrollWidth` against `clientWidth` and put the figures here. Thai strings are longer. | `/maintenance`, `/maintenance/new` |
| 2 | Move a job with the tap: Not started → In progress; → Blocked; → Completed (the wording changes); then from the Completed chip back to In progress. Each asks in words first; Cancel and the dialog's cancel change nothing; the card moves at once and stays after a reload. Then switch to the desktop preset and confirm the **drag still works** and the phone button is not shown. | `/maintenance` |
| 3 | Log a job through the steps: Next with an empty title or no location stops with a message; Back keeps what was typed (title, photo, team ticks, zone and enclosure); Enter in the title does not save; the Review shows every answer and Edit jumps to its step; Save job saves and goes to the job. Edit an existing job: still the single form. Also: job page status buttons, My tasks and the enclosure hub's Log maintenance link still work. | `/maintenance/new`, `/maintenance/<id>`, `/maintenance/<id>/edit`, `/my` |
| 4 | Watch the Head of Maintenance, or the 2IC, or someone like them, do a job on a phone: log one, assign it, move it on, finish it. Say who watched. A Thai reader should read the new strings (`maintenance.move`, `maintenance.wizard`). | the shelter |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–4 wait for a person

Manual verification by: pending: a person to drive items 1–3 signed in at 375 px and desktop, in both languages, and to watch item 4

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; after the PR is opened

Result: pass with accepted defects

Release manager acknowledgement: pending
