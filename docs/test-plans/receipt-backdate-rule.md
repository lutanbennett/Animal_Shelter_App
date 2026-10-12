# Feature test plan — receipt-backdate-rule

## Header

| | |
|---|---|
| Feature | `issue_donation_receipt` validates the receipt date: `received_on <= issued_on <= shelter_today()` |
| Backlog item | `docs/backlog.md` → **`issue_donation_receipt` still takes the receipt date (`p_issued_on`) from the caller** (ticked) |
| Branch / worktree | `claude/receipt-backdate-rule` @ `C:\Development\Animal_Shelter_receipt-backdate-rule` |
| Dev server | not started — no UI surface in this PR |
| PR | PENDING |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | yes — `0186_receipt_date_rule.sql` |
| Tested at SHA | PENDING |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the RPC refuses a date before the donation or after the shelter's today, and accepts anything between
- [x] Files/areas touched listed — `supabase/migrations/0186_receipt_date_rule.sql`, `scripts/check-donation-receipts-schema.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-12-receipt-date-rule.md`, this plan
- [x] Roles affected identified — Admin and Management (`donation.receipt`) can no longer issue an out-of-range date by calling the API; the screen already sends today
- [x] Anything explicitly **out of scope** written down — gapless numbering, voiding, Drive/send; not narrowed to today-only

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — PENDING
- [ ] `node scripts/gates.mjs` — PENDING
- [ ] CI green on the PR — PENDING

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `0186` over `0185`; the brief names this the batch's only migration
- [x] `--status` reviewed before applying — 185 applied, 1 pending
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to **dev** — `applying 0186_receipt_date_rule.sql … ok`
- [x] File is re-runnable — `create or replace` only
- [x] Existing rows still read correctly — no table changed. Measured on dev: 4 receipts, 0 outside the new rule
- [x] **Constraints exercised against real rows** — `check-donation-receipts-schema.mjs` (rolled back): before donation gives 22023, future gives 22023, null gives 22023, counter unmoved by the refusals, a receipt backdated 3 days accepted. 69 held, 0 failed
- [x] Down-migration not needed — signature unchanged, only a stricter check; reverting is re-applying `0177`'s function body
- [x] Production apply plan stated — apply `0186` with the next release; production receipts were not read from this stream, so first count any receipt outside the rule (`select count(*) from donation_receipts r join donations d on d.id = r.donation_id where r.issued_on < d.received_on or r.issued_on > shelter_today()`); the migration does not touch existing rows either way

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the app still sends `todayIso()`, which satisfies the rule, and the harness issues receipts dated today
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI; before, future and null asserted in §3. Known gap: the exact Thai-evening boundary (UTC date one behind Bangkok) was not driven, as it depends on the wall clock

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | issue receipt | unchanged | n/a — no grant or permission changed |
| management | issue receipt | in-range dates only | pass — harness runs as a real management login |
| staff / 2IC | issue receipt | refused | pass — existing `2IC issue refused` check still holds |
| signed out | nothing | nothing | n/a — grants unchanged |

- [ ] Every role above tested — n/a: permission check untouched; management and 2IC exercised by the harness
- [ ] A role that should not have access is blocked server-side — n/a: unchanged, covered by the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no screen changes
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the harness issues, voids and re-issues receipts as before; all prior checks held
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — PENDING

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`. Searched `issued_on` and `backdate`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-12-receipt-date-rule.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no screen ever sent a different date, so no shelter user's experience changes; this closes a hole only reachable by calling the API directly
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the 0-outside count and the harness results are from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager; the rule uses `shelter_today()` (Asia/Bangkok), but the evening boundary was not driven on dev
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no code changed; signature unchanged, so either deploy order works. Production should get `0186` with or before the release
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no data rewritten
- [x] Apply plan stated — `0186` with the next release, after the count query in §3

### Rollback

- [x] Rollback position stated — re-apply `0177`'s function body; older code is unaffected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no screen changes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
