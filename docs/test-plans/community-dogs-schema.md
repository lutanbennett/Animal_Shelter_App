# Feature test plan — community-dogs-schema

## Header

| | |
|---|---|
| Feature | Two schema halves in one PR (Lutan's choice, 2026-10-09, because only one branch may carry a migration): `0169_community_dogs.sql`, outreach notes for temple and community dogs (places, outings, photos, the `community.outings` cell, an empty `community_dogs` baseline and two live counts in `public_impact_figures`); and `0168_donation_receipts.sql`, the donation-receipts tables (from the donation-receipts stream, facts below are theirs) |
| Backlog item | `docs/backlog.md` → **Record community and temple dogs helped** (left open, status note added) and **Impact band** (left open, update note added). The donation-receipts item is left alone: its feature PR ticks it |
| Branch / worktree | `claude/community-dogs-schema` @ `C:\Development\Animal_Shelter_community-dogs-schema` |
| Dev server | not started — no screen reads these tables until batch 81 (`community-dogs`) and `claude/donation-receipts` |
| PR | see the PR this plan is in |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | yes — `0168_donation_receipts.sql` and `0169_community_dogs.sql` |
| Tested at SHA | `d4a81ec6` (after `worktree.mjs sync` merged `origin/main` `1cb8e9ba`, #481) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Director's option 2 (one note per outing) as tables, with who-may-write as a Settings cell (her q5) and the baseline in `impact_baselines` (her q7), per the brief and the paper's developer notes
- [x] Files/areas touched listed — `supabase/migrations/0169_community_dogs.sql`, `supabase/migrations/0168_donation_receipts.sql`; `src/lib/permissions/catalogue.ts` (two rows); `scripts/lib/permission-probes.mjs` (two probes); `scripts/check-permission-tables.mjs` and `scripts/check-permission-parity.mjs` (activity counts); new `scripts/check-community-dogs-schema.mjs`; `docs/roles-and-permissions.md` §4 (two rows); `docs/backlog.md` (two status notes); `docs/decisions/2026-10-09-community-dogs-unit.md` and `2026-10-09-donation-receipts.md`; this plan
- [x] Roles affected identified — Management gains `community.outings` Edit (nothing reads it yet); every other role None; Admin implicit. `donation.receipt`: Admin and Management (one cell, Lutan 2026-10-09, `672c105a`). Signed-out: `public_impact_figures` keeps its columns; the new `community_dogs` row is not public until a baseline is entered
- [x] Anything explicitly **out of scope** written down — the phone form, the Settings control for the cell, the public tile(s), public outing photos (a view plus `is_public_drive_file()`), the Director's baseline number, and the whole donation-receipts feature half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` `1cb8e9ba` (#481, google-stocktake), clean, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly (`exit 0`), output redirected to a file:

```
=== gates: build exited 0 after 198s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `migration numbers: ok — 0168_donation_receipts.sql, 0169_community_dogs.sql (against origin/main 1cb8e9ba, highest 0167_perm_convert_vet.sql)`; no other open PR (`gh pr list`)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `167 file(s), 167 applied row(s)`, pending `0168` and `0169`, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0168_donation_receipts.sql … ok`, `dry-run 0169_community_dogs.sql … ok`. Three `consumer` warnings for `0169` (the batch-81 readers are not on `main` yet), expected
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied after #482 merged (`75b98c10`), on Lutan’s "merge it", 2026-10-09: `applying 0168_donation_receipts.sql … ok`, `applying 0169_community_dogs.sql … ok`; `--status` then `169 file(s), 169 applied row(s)`. After the apply: `check-community-dogs-schema.mjs` `all 31 held`; `check-view-write-grants.mjs` GREEN; `check-permission-tables.mjs` reaches `HARNESS-KNOWN-RED` (every check held but the recorded vet-versus-draft disagreement) once its H and G counts were measured (defect 2); `check-permission-parity.mjs` 21 mismatches and 9 harness faults, the same vet and fixture lines as before, and neither new probe among them
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `on conflict` for the activity, cell and baseline row; `create table / index if not exists`; `create or replace` for functions and the view; `drop … if exists` before every trigger and policy
- [x] Existing rows still read correctly after the change — `public_impact_figures` keeps its columns and its `animals_rehomed` branch verbatim; `impact_baselines` gains one row
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev under real management, staff and anon sessions: `scripts/check-community-dogs-schema.mjs` (applies `0169` inside the transaction, then rolls back). Its first run found a real defect (#1 below); after the fix:

```
all 31 held (rolled back, nothing kept)
```

  Covered: Management adds a place and an outing, staff and anon refused; duplicate live place name and a bad kind refused; stamps come from the session, not the request; `outing_on` defaults to the shelter day; no tick, sterilised without a count, sterilised count above the dog count, count without the tick, zero dogs and no place all refused; staff read 0 outings, anon gets 42501 on outings and photos; no place delete; a photo is private by default; **staff given the one cell can write** (the setting works without a migration); the empty baseline row is not public; `community_dogs` 100 + 5 = 105 with a 7-dog note on the baseline day excluded; `villages_sterilised` 10 + 2 = 12; anon and authenticated hold no write grant on the view
- [x] `check-migration-grants.mjs`: `migration grants: ok (92 file(s) checked)`; `check-policy-role-names.mjs --final`: `RESULT: GREEN (the end state; every scope function has a cell beside it)`; `check-permission-catalogue.mjs`: all ok. `0168` (donation-receipts stream): dry-run ok, grants ok, catalogue ok
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive (three new tables, functions, one activity, one cell, one baseline row, and the view gains two `when` branches). The `0169` header gives the undo
- [x] Production apply plan stated for the release manager — `0168` and `0169` on `dbkodyyxxhtygxcxmfcu` with the next release, before either feature half deploys. Nothing reads them yet, so the order against this PR's deploy does not matter

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these tables yet; the database path is exercised in §3
- [ ] Data persists — n/a: no UI surface; persistence asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, refused delete, and staff's delete seeing 0 rows are in §3
- [ ] Empty state renders sensibly — n/a: no UI surface; the empty baseline row is asserted not public in §3
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the six constraint refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the boundaries are database ones, in §3 (baseline day excluded, sterilised count 0 / null / above dog count)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | implicit yes | n/a — Admin is yes before any cell is read (`has_permission()`); not run separately |
| management | outings, places, photos | read and write | pass — §3 harness |
| staff | nothing new, unless given the cell | refused; writes once given the cell | pass — refused, then allowed with the cell |
| vet | nothing new | refused | n/a — holds no `community.outings` cell, and no vet policy touches these tables |
| volunteer | nothing new | refused | n/a — holds no `community.outings` cell |
| signed out | `public_impact_figures` only | no table access | pass — 42501 on outings and photos, empty row not shown |

- [ ] Every role above tested — n/a: Admin, vet and volunteer not run separately; every policy asks `has_permission('community.outings')`, and none of them holds the cell
- [x] A role that should not have access is blocked server-side — staff and anon refused in §3 under their own sessions

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing to use yet; the outreach topic is batch 81's
- [ ] Translatable strings go through the translation path — n/a: no UI string; the baseline row's `label_th` is the paper's Thai, which the Director asked to have checked by a Thai reader (batch 81)
- [ ] Mobile viewport (375px) — n/a: no new UI
- [ ] Browser console clean — n/a: no new UI
- [ ] Network clean — n/a: no new UI

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles the home page and `/admin/website`, which read `public_impact_figures` and `impact_baselines`; the view's columns are unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `catalogue.ts` gained two rows and `check-permission-catalogue.mjs` passes; no page changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — #481 is docs and a script; gates ran after the merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, as the brief says; status notes added to it and to *Impact band*. Searched the backlog for `sterilis`, `impact_baselines`, `public_impact_figures`, `temple`, `outreach`: only those two are touched, neither is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-community-dogs-unit.md` (her eight answers, the cell as the setting, the sterilised count, kind on the place, photos table) and `2026-10-09-donation-receipts.md` (donation-receipts stream)
- [x] `README.md` still accurate — it does not list these tables
- [ ] **Release notes.** — n/a: schema only, nobody at the shelter would notice; no screen reads the tables and the new public figure stays hidden until a baseline is entered
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the totals and refusals are the harness's output on dev; the NULL-passes defect was found by it, not argued

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: `outing_on` defaults to `shelter_date(now())` and the harness asserted it equals the shelter day, but nothing compares a timestamp; the baseline comparison is date to date
- [x] **Boundary or banding change** — the baseline day itself (excluded) and the day after (counted) are both in the harness; sterilised count at null, above the dog count and absent-with-tick all refused
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates and harness output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes until a baseline is entered and the tile is built

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: only catalogue rows, which name the activities and read nothing. Both feature halves will read the tables, so `0168` and `0169` must be on production before either deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — see §3

### Rollback

- [x] Rollback position stated — a code rollback does not revert either migration and does not need to: older code ignores the new tables, the two catalogue rows and the view's two new branches. Reverting the schema is the `0169` header's undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The sterilised-count check let a ticked note with no count through (a check that evaluates to NULL passes), so the sterilisations figure would have silently missed those notes | fixed — `sterilised_count is not null` added (`6cead6dc`), asserted in §3 |
| 2 | low | `check-permission-tables.mjs` was already red on `main` (Management 53 cells, it expected 52; `0163` added `website.content` without updating the count). After the apply, H expected cells measured 112 (not the reasoned 111) and the seed replay 131 cells (not 128: the three Management cells added since the seed survive it) | fixed — counts corrected in the follow-up PR after the apply; the harness now ends `HARNESS-KNOWN-RED`, its intended state |
| 3 | low | The parity probes for `community.outings` and `donation.receipt` could not run until the files were applied to dev | fixed — applied; both probes agree with the paper |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no screen reads these tables | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: no UI surface, nothing to look at

Manual verification by: n/a: schema only, no UI surface, no code reads these tables yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
