# Feature test plan

## Header

| | |
|---|---|
| Feature | A deceased resident's intake date can be corrected under the existing `correct_intake_date` card (migration 0307) |
| Backlog item | `docs/backlog.md` → **PART (1) DONE: A DECEASED RESIDENT'S INTAKE DATE IS NOW CORRECTABLE** (Management) |
| Branch / worktree | `claude/intake-date-deceased` @ `C:\Development\Animal_Shelter_intake-date-deceased` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-03 |
| Carries a migration? | yes, `0307_intake_date_deceased.sql` |
| Tested at SHA | 6ea6f1e8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the closed-record lock gets one flag-scoped, update-only opening for the five columns `correct_intake_date()` writes
- [x] Files/areas touched listed — `supabase/migrations/0307_*`, `scripts/check-intake-date-deceased.mjs`, a comment in `src/app/admin/intake-date/actions.ts`, `src/lib/releases.ts`, `docs/backlog.md`, a decision file
- [x] Roles affected identified — analysis by card: only `correct_intake_date` gains anything, for deceased residents; no other card's reach changes
- [x] Anything explicitly **out of scope** written down — R-0323, the general deceased-records widening, any new card, any other write on a closed record; the production apply is Lutan's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — pending until the final sync before the PR (see Evidence)
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0306`), and no other in-flight branch carries one
- [x] `--status` reviewed before applying: 307 applied, 1 pending
- [x] `--dry-run` reviewed: `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace` only)
- [x] Existing rows still read correctly after the change — no table or column touched
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-intake-date-deceased.mjs`, `begin … rollback` on the live functions: 28 other writes on a deceased record refused (16 flag off, 12 flag on); a card login corrects a deceased resident's intake date, placement, diet and weight; a login without the card gets 42501; the lock is shut again afterwards; a living resident still works
- [ ] Down-migration written — n/a: the opening is inert unless `correct_intake_date()` raises the flag; the previous function bodies are in 0052 and 0302
- [x] Production apply plan stated: `node scripts/apply-migrations.mjs --env production`, Lutan's step (production is also one behind on 0306)

## 4. Functional checks

Driven on dev, port 3003, with `dev-signin.mjs --cards correct_intake_date` and `--cards view_residents`, reached by clicking Settings, then the tile.

- [x] Happy path works end to end — deceased R-0395, 2026-09-01 saved as 2026-08-31, the page confirmed it and listed the moved records
- [x] Data persists — the page after save shows the new date everywhere
- [ ] Create / edit / delete all exercised — n/a: a single edit action exists
- [ ] Empty state renders sensibly — n/a: unchanged from 0302
- [ ] Invalid input is rejected with a readable message — n/a: validation unchanged from 0302 (harness D4 covers the no-card refusal)
- [ ] Boundary cases checked — n/a: date boundaries unchanged from 0302; the new boundary (which writes the lock still refuses) is the harness

### Role access matrix

Analysis by card, not by role (`CLAUDE.md`).

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `correct_intake_date` alone | the page, a deceased resident | Save drawn and works | confirmed on dev |
| `view_residents` alone | the same address | "You don't have access to this page", no control | confirmed on dev |
| Admin | same | through the existing `perms.isAdmin` short-circuit | n/a: `can.ts` untouched, not re-driven |

- [x] Every card above tested, except where marked n/a with a reason
- [x] A login without the card is blocked server-side — page refused, and the function returns 42501 (harness D4)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the topic describes correcting an intake date and says nothing about deceased residents
- [ ] Translatable strings go through the dictionaries — n/a: no new string
- [ ] Mobile viewport (375px) — n/a: larger-screen Settings page, unchanged
- [x] Browser console clean — no errors during the driven flow
- [x] Network clean — no unexpected 4xx/5xx

## 6. Regression

- [x] The pages nearest the change still work — the page for a living resident is covered by harness D5; the page opens for a one-card login
- [x] Shared files touched are covered by `check-hard-coded-security` (no coded security outside the Admin bypass) and `check-card-grants` (all passed)
- [x] Nothing merged from `main` during `sync` was broken by this branch — to be re-confirmed by the final gates

## 7. Documentation

- [x] Backlog item retitled and part (1) marked done in `docs/backlog.md` **on this branch**; part (2) left open
- [x] Non-obvious design choices added as `docs/decisions/2026-11-03-intake-date-deceased.md`
- [ ] `README.md` still accurate — n/a: no README text covers this
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a card-tagged line (`correct_intake_date`), written for a shelter user. The production apply is part of the release cut that publishes it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the live function body and trigger list were read from dev; the harness was run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change covered at both edges — n/a: no banding
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: gate output pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? yes: the production apply must happen before the deploy — deferred: release manager
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive or rewriting migration backup — n/a: only `create or replace` on two functions
- [ ] Apply plan stated — deferred: Lutan, before the deploy of the release carrying `0307`

### Rollback

- [ ] Rollback position stated — n/a: the change is two function bodies; re-applying 0052 and 0302's function restores the old behaviour; the Pi rollback does not revert migrations

## Evidence

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 30s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 175s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 56s
gates: typecheck=0 lint=0 test=0 build=0
```

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | None beyond the driven flow; no new wording | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: nothing is left for a person to look at

Manual verification by: n/a: no new wording or layout; the driven flow was run by Claude

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan file is part of the PR
- [ ] Handed to the production release manager — n/a: handed over at the release cut

Result: pass

Release manager acknowledgement: n/a
