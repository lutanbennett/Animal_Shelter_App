# Feature test plan — cashflow-income

## Header

| | |
|---|---|
| Feature | An income side on Management → Cashflow: recorded gifts for the last six complete months, their average, and a labelled reference line, shown only to a login holding `donation.receipt` |
| Backlog item | `docs/backlog.md` → `#nwhpn` (ticked) |
| Branch / worktree | `claude/cashflow-income` @ `C:\Development\Animal_Shelter_cashflow-income` |
| Dev server | `http://localhost:3003` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | `eed964727` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the forecast now has a labelled, past-only income side, gated on the donations activity
- [x] Files/areas touched listed — `src/lib/management/cashflow-income.ts` (+ test), `src/app/management/cashflow/{page,CashflowView,CashflowChart}.tsx`, the cashflow block of both dictionaries, `src/lib/releases.ts`, the decision file, `docs/backlog.md`
- [x] Cards affected identified — `donation.receipt` (held by `donations_receipts` and the appeals card) now also shows the income side; `reports.cashflow` (`view_cashflow`) alone shows nothing new; Admin sees it through the Admin bypass; signed out is redirected as before
- [x] Anything explicitly **out of scope** written down — no forecast of future gifts, nothing receipt- or tax-shaped, no change to `donation.receipt`, no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body; run before the PR was opened
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: typecheck exited 0 after 93s
=== gates: lint exited 0 after 318s
=== gates: test exited 0 after 113s
=== gates: build exited 0 after 258s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the page only reads `donations` and `donation_lines` as they have been since 0168
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a login holding `view_cashflow` and `donations_receipts` reached Cashflow by clicking through from Management and saw "Gifts received (recorded, not a forecast)", the average, average-minus-outgoings and the six past months
- [ ] Data persists — n/a: the page only reads; nothing is written
- [ ] Create / edit / delete all exercised — n/a: read-only change
- [x] Empty state renders sensibly — dev has no gifts in those months, so six months of ฿0 and an average of ฿0 showed, not a blank or an error
- [ ] Invalid input is rejected with a readable message — n/a: the change takes no input
- [x] Boundary cases checked — unit test: several lines on one gift count once, an in-kind gift is counted not summed, the current month is excluded, satang sums do not drift

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `view_cashflow` + `donations_receipts` | `/management/cashflow` | forecast and the income side | income side shown |
| exactly `view_cashflow` | `/management/cashflow` | forecast, no income side, no heading | no income text on the page |
| admin | `/management/cashflow` | everything, via the Admin bypass | n/a: not driven; the page asks `can(perms, "donation.receipt")`, which Admin passes |
| signed out | `/management/cashflow` | redirected, unchanged | n/a: untouched by this change |

- [x] Every login above tested — the two card logins were driven; Admin and signed-out are untouched code paths, reasoned above
- [x] A login that should not have access is blocked server-side — the donations query is not made at all without `donation.receipt`, and the database policy asks the same activity

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: the existing Cashflow manual topic describes outgoings; the on-page labels state the new section's meaning
- [x] Translatable strings go through the translation path — English and Thai added in the cashflow dictionary block
- [ ] Mobile viewport (375px) — pending: not driven; the section uses the same stat grid and a scrolling table as the existing ones, and the chart line sits in the chart that is already hidden on phones
- [x] Browser console clean — the only error seen was an earlier crash from wording placed in the wrong dictionary block, fixed before the second check
- [ ] Network clean — n/a: not separately inspected; the pages loaded with no error banner

## 6. Regression

- [x] The pages nearest the change still work — the forecast, its table and the window picker rendered unchanged for the cashflow-only login
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the shared files are the dictionaries and `releases.ts`; Management and the signed-in home loaded afterwards
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-cashflow-income-side.md`
- [ ] `README.md` still accurate — n/a: the README does not describe the cashflow page
- [x] **Release notes.** `unreleased` gained a line, tagged to the `donations_receipts` card because only those who can see donations see the new section
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured — the gate activity was read from the 0168 policies and the donations page, not taken from the brief

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: month boundaries use the stored `received_on` date and the shelter's own today, never a clock-derived time of day
- [ ] For a boundary or banding change, both edges asserted — n/a: not a band; the six-month window edges are asserted in the unit test
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block above is the run's own output
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; purely additive code, `./scripts/pi/deploy-pi.sh --ref <sha>` reverts it, no schema involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Wording first landed in the wrong dictionary block and crashed the page | fixed before the second browser check |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the new income section | `/management/cashflow` in Thai, as a login holding `donations_receipts` |
| 2 | The dashed average line and its label on the chart once real gifts are recorded (dev has none) | `/management/cashflow`, desktop width |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

Manual verification by: pending: the Thai wording and the chart's average line with real gifts, listed above

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: items 1 and 2 above need a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
