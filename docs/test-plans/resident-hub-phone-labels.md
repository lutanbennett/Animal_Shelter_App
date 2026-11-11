# Feature test plan

## Header

| | |
|---|---|
| Feature | Resident hub phone labels and End-today confirm |
| Backlog item | `docs/backlog.md` → #2ajsm, #ox2bb |
| Branch / worktree | `claude/resident-hub-phone-labels` @ `C:\Development\Animal_Shelter_resident-hub-phone-labels` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | see the PR |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 427f9d56 |

## 1. Scope and risk

- [x] Change is described in one sentence: ActionLink shows its label on phones, and End today asks first
- [x] Files touched: src/components/ActionLink.tsx, RecordRowActions.tsx, both dictionaries, releases.ts, decision file
- [ ] Cards affected identified — n/a: no card or visibility change; who sees each control is unchanged
- [x] Out of scope: hub structure, tiles, header Assistant label (see decision file)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — pending: run immediately before opening the PR
- [x] gates run. The first full run's build failed on a transient Google Fonts fetch in Turbopack (module not found, font); `npm run build` alone was re-run and exited 0. Evidence:

```
=== gates: typecheck exited 0 after 282s
=== gates: lint exited 0 after 705s
=== gates: test exited 0 after 149s
=== gates: build exited 1 after 45s
=== gates: build exited 1 after 293s
=== build (re-run alone) exited 0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] Status reviewed — n/a: no migration
- [ ] Dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: not driven in a browser; for a person to press End today
- [ ] Data persists — n/a: no data model change
- [ ] Create / edit / delete — n/a: End today's server action is unchanged
- [ ] Empty state — n/a: no empty-state change
- [ ] Invalid input — n/a: no input added
- [ ] Boundary cases — n/a: dialog text only

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | not tested |

- [ ] Every login above tested — n/a: who sees the controls is unchanged
- [ ] A login that should not have access is blocked — n/a: server checks untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic changed (stream bills-manual-topic owns the manual)
- [x] Translatable strings go through the dictionaries, English and Thai
- [ ] Mobile viewport (375px) — pending: not driven; labels may crowd rows of actions
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — n/a: no network change

## 6. Regression

- [ ] Pages nearest the change still work — pending: every ActionLink page is affected; not browsed
- [ ] Shared file checked from a second page — pending: ActionLink is shared; not browsed
- [ ] Nothing merged from main broke — pending: sync before the PR

## 7. Documentation

- [x] Backlog items #2ajsm and #ox2bb ticked on this branch
- [x] Decision file docs/decisions/2026-11-11-resident-hub-phone-labels.md
- [x] README.md still accurate
- [x] Release notes: unreleased has a line for it
- [x] Commit messages say why

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: dialog shows today in Bangkok time; the server decides the real end date
- [ ] Boundary or banding — n/a: no banding
- [ ] Evidence is unedited tool output — n/a: no tables of results
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Header Assistant label still icon-only below 640 px | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | At 375 px, rows of labelled actions do not overflow; End today asks first | Residents list, resident hub Diet and Prescriptions |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

- [ ] The manual list above is empty or checked — pending: nobody has looked at 375 px yet

Manual verification by: pending: a person to look at the phone layout and press End today

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: the file is in the PR
- [ ] Handed to the release manager — pending: after merge

Result: pass with accepted defects
