# Feature test plan — prescription-frequency-drop

## Header

| | |
|---|---|
| Feature | Drop frequency_id, frequency_rounds, the round-status views and /admin/frequencies (stream 4 of 4) |
| Backlog item | `docs/backlog.md` → **PRESCRIPTIONS BECOME A RECURRING SCHEDULE** (ticked) |
| Branch / worktree | `claude/prescription-frequency-drop` @ `C:\Development\Animal_Shelter_prescription-frequency-drop` |
| Dev server | not started: nothing in the change renders (a page was deleted) |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes |
| Tested at SHA | `3115485c` |

## 1. Scope and risk

- [x] Change is described in one sentence — the frequency column, table, views, triggers, functions and admin page are removed because the schedule columns replaced them
- [x] Files/areas touched listed — `supabase/migrations/0288`, `src/app/admin/frequencies/` (deleted), admin landing, route registry, labels, manual, `prescriptions/actions.ts`, ten scripts, `scripts/lib/acceptance-matrix-entries.mjs` (one entry)
- [x] Roles affected identified — none; no card, grant or policy changed. Anyone holding `reference.types` loses a Settings tile for a read-only page
- [x] Out of scope written down — the `frequency` table itself, dead i18n strings, production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged, already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — 0288 after 0287
- [x] `--status` reviewed before applying — 288 applied, 1 pending
- [x] `--dry-run` reviewed — ok
- [x] Applied to **dev** and recorded — 2026-10-30 11:12 UTC, in the PR body
- [x] File is re-runnable — every statement is `drop … if exists`
- [x] Existing rows still read correctly — md5 of per-prescription doses (74 rows, two windows), all 113 round ticks and the forecast identical before and after
- [ ] Down-migration needed or explicitly not — n/a: not written; the dropped column held only nulls from new saves and the older values are in the 0043 to 0044 history
- [x] Production apply plan — with the app code, migrations first, in the release that carries 0282 to 0288 (decision file)

## 4. Functional checks

- [ ] Happy path — n/a: no screen gained behaviour; the medication list is unchanged (hashes above)
- [ ] Data persists — n/a: no write path changed beyond no longer sending a null
- [ ] Create / edit / delete — n/a: check-audit-undo, check-medical-archive-card and check-medical-soft-delete create, archive and restore prescriptions and print HARNESS-OK
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: check-shelter-dates now covers the 21:59 and 22:00 Night edges and passes

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `reference.types` | /admin/frequencies | gone | n/a — route deleted, no link remains (grep) |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] Blocked server-side — n/a: unchanged

## 5. Cross-cutting

- [x] Nav entry correct — the Settings tile and route entry removed together
- [x] Manual updated — Frequencies topic and its acceptance-matrix entry removed
- [ ] Translatable strings — n/a: only removals; dead strings left in both dictionaries on purpose
- [ ] Mobile viewport — n/a: no UI added
- [ ] Browser console clean — n/a: no page driven
- [ ] Network clean — n/a: no page driven

## 6. Regression

- [x] Nearest checks still work — the five edited harnesses and check-view-write-grants pass; check-security-schema-fold passes (HARNESS-OK)
- [x] Shared file touched checked from an unrelated page — n/a in effect: admin landing and route registry covered by typecheck, build and the unit tests
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked
- [x] Decision recorded — `2026-10-30-prescription-frequency-drop.md`
- [x] `README.md` still accurate — it does not mention frequencies
- [ ] **Release notes.** — n/a: 0283–0288 are not on production yet
- [x] Commit messages say why
- [x] Claims were measured — hashes and check outputs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: check-shelter-dates passes under four process zones
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering

- [x] Migration and reading code in one PR? — yes; the code stops reading the columns and 0288 drops them, so both must ship together
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — deferred: release manager
- [x] Apply plan stated — migrations first, with the app code, in the release applying 0282 to 0288

### Rollback

- [x] Rollback position — a dropped column cannot be restored by reverting the PR; restore from backup. Treat the release as one-way

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | check-phone-width edited by reading only; it takes hours and was not run | accepted |
| 2 | low | measure-permission-baseline edited but not run | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings no longer shows a Frequencies tile | Settings landing page |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty or each item has a named human signature — n/a: one item is listed and nobody has looked yet; see the signature line below

Manual verification by: pending: a person to glance at the Settings landing page

### Result

- [x] Open defects are either fixed or explicitly accepted above

Result: pass with accepted defects
