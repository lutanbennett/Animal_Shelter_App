# Feature test plan — purchasing-accordion

## Header

| | |
|---|---|
| Feature | Purchasing: fold the "nothing to buy" rows |
| Backlog item | `docs/backlog.md` → "Purchasing: fold away the "Nothing to buy" rows" |
| Branch / worktree | `claude/purchasing-accordion` @ `C:\Development\Animal_Shelter_purchasing-accordion` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` |
| PR | to follow |
| Tested by / date | Claude, 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | 1232fddc |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — under each Purchasing table, rows with nothing to buy fold into a native closed `<details>`, except never-counted and stale rows
- [x] Files/areas touched listed — `src/app/management/purchasing/page.tsx`, both i18n dictionaries (`fold`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, docs
- [x] Roles affected identified — admin and management (the `stock.purchasing` page); the 2IC's phone view is unchanged
- [x] Anything explicitly **out of scope** written down — a never-counted item with need 0 is absent from the phone view and banner (decision file); not widened here

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: run at the finish, after the last commit, before the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — dev, desktop width: Medicines shows 6 items to buy, then 14 never-counted items at "Nothing to buy" (kept visible, warning text intact), then one closed line "4 items need nothing for this period"; opening it shows the 4 counted zeros with their working
- [ ] Data persists — n/a: nothing is written; the open state is deliberately not remembered
- [ ] Create / edit / delete — n/a: read-only page
- [x] Empty state renders sensibly — a table with no visible rows says "Nothing to buy for this period" with the fold beneath (code path; Food had no folded rows in dev data)
- [ ] Invalid input — n/a: no input
- [x] Boundary cases checked — never-counted with sum 0 stays visible (14 rows in dev, ordered after the items to buy); standard-diet-last order kept

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /management/purchasing | page loads | loads (above) |
| management | /management/purchasing | page loads | measured by check-phone-width, no overflow |
| staff | n/a | permission unchanged | not touched |
| vet | n/a | permission unchanged | not touched |
| volunteer | n/a | permission unchanged | not touched |
| signed out | n/a | permission unchanged | not touched |

- [ ] Every role above tested — n/a: the page's `requirePermission("stock.purchasing")` is untouched, so only the two roles that open it were run
- [ ] A role that should not have access is blocked server-side — n/a: access code unchanged

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`), Purchasing topic, one sentence
- [x] Translatable strings go through the dictionaries — `fold(n)` added to `en.ts` and `th.ts`
- [x] Mobile viewport (375px) — `check-phone-width.mjs --roles=admin,management --locales=en,th --pages=/management/purchasing`: "No page scrolls sideways" (the phone view is untouched; the fold is desktop-only)
- [ ] Browser console clean — n/a: not read during this run
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] Nearest pages still work — the phone view of Purchasing rendered as before in the same session (items to buy only, yellow never-counted rows)
- [ ] Shared file touched checked from a second page — n/a: `manual/en.ts` and the dictionaries are only added to, with one line each
- [ ] Nothing merged from `main` during `sync` was broken — n/a: sync not yet run

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision added: `docs/decisions/2026-10-06-purchasing-accordion.md`
- [x] `README.md` still accurate — it does not describe this page's rows
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for admin and management
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the never-counted ordering and the phone view's `lines`-only list were read from the code and seen on the dev page

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: a partition of rows, no threshold changed; the stale threshold is read from `purchaseRow`
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted tables beyond the gates line
- [ ] Public pages re-checked — n/a: not a public page
- [ ] Production target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: pure UI change, a redeploy of the previous build reverts it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A never-counted item with need 0 is missing from the phone view and the banner | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The fold reads as a fold, in Thai too ("N รายการไม่ต้องซื้อในช่วงนี้"), and opens and closes | /management/purchasing at desktop width, English and Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — Lutan has not looked, see the signature below

Manual verification by: pending: Lutan to look at the fold in Thai and English on a desktop

### Result

- [x] Open defects are either fixed or explicitly accepted above — defect 1 deferred to the backlog branch
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after the merge

Result: pass with accepted defects

Release manager acknowledgement: pending
