# Feature test plan

## Header

| | |
|---|---|
| Feature | `stock_receipts` + `stock_count_intervals` (0096) and `adoption_updates` + `attachments.adoption_update_id` (0097) — schema halves only |
| Backlog item | `docs/backlog.md` → **Record stock deliveries, so Stock between counts can state usage** and **Record updates from adopters on an adopted resident** (both ticked on their feature PRs, not this one) |
| Branch / worktree | `claude/schema-deliveries-adopter-updates` @ `C:\Development\Animal_Shelter_schema-deliveries-adopter-updates` |
| Dev server | not started — this change ships no runtime code |
| PR | opened from this commit |
| Tested by / date | Claude (automated) / 2026-09-26 |
| Carries a migration? | yes — `0096_stock_receipts.sql`, `0097_adoption_updates.sql` |
| Tested at SHA | branch on `main` @ `6fe5265`; the two migrations, two harnesses, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two additive migrations: a deliveries table with a view that states `used = previous count + received − new count` per pair of stocktakes, and an adoption-updates table whose photos carry a link back to the update on the attachment row itself
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0096_stock_receipts.sql`, `supabase/migrations/0097_adoption_updates.sql`; `scripts/check-stock-receipts.mjs`, `scripts/check-adoption-updates.mjs` (dev-only rollback harnesses); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — new tables only, exercised per role in the harnesses (matrix below). One existing surface changes: `record_attachment()` is re-created with a seventh, defaulted argument, and the live photo, blood-test and procedure upload routes call it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — all UI ("Record a delivery", the usage page reading `stock_count_intervals`, the Adoption updates section and its Drive folder) is batch 2; receipts do not change `stock_on_hand`; a public "Happy endings" feed is a follow-on needing the adopter's permission and grants nothing to anon here; neither backlog item is ticked

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — already at `origin/main` `6fe5265`, branch pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

  ```
  === gates: build exited 0 after 544s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0095_recurring_jobs.sql`; `gh pr list --state open` is empty; this is the only in-flight `*-schema` branch. `check-migration-numbers.mjs` runs in the pre-commit hook and CI
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `95 applied, 2 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0096_stock_receipts.sql … ok`, `dry-run 0097_adoption_updates.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0096_stock_receipts.sql … ok`, `applying 0097_adoption_updates.sql … ok`; `--status` afterwards lists both as applied here and not yet on `origin/main`, as expected before merge
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — each harness executes its file twice in one transaction on top of the real apply, so that is three runs of each
- [x] Existing rows still read correctly after the change (checked against real dev data) — 0097 harness A0: no existing attachment came out tagged, and exactly one `record_attachment` exists (the old overload is gone, not shadowing)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — two harnesses, run after the real apply. Output, unedited:

  `node scripts/check-stock-receipts.mjs` — S1 is the reason 0096 exists: counts 100 → 60 → 150 with deliveries of 7 (at the first count's instant: excluded), 30 and 20 (the latter at the second count's instant: included) and 100, giving used 90 then 10, and the two intervals add to the span's usage. S2 the unit snapshot and the refusal to sum across a unit change, for a count or a receipt. S3 checks. S4 roles. S5 cascade.

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0096 twice | S1 A->B received 50 (count-instant delivery in, first-count-instant out) used 90; B->C used 10; intervals add up; items and kinds separate | S2 unit stamped from the item not the caller, kept on edit, re-stamped on move; no sum across a count or receipt unit change | S3 zero, negative, negative cost, wrong kind, both items, no item, unknown kind refused | S4 staff records (recorded_by forced to caller), management edits, volunteer reads but cannot record, vet sees nothing, anon refused by the grant | S5 deleting an item deletes its receipts
  CONTEXT:  PL/pgSQL function inline_code_block line 162 at RAISE
  ```

  `node scripts/check-adoption-updates.mjs`:

  ```
  HARNESS-OK 0097 twice | A0 no existing photo tagged, one record_attachment | A1 staff writes, created_by forced to caller, channel sms / LINE / empty refused | A2 volunteer reads, cannot write an update, tags a photo; photo reaches sender, date, channel in one join; first photo still becomes profile | A3 six named arguments still resolve, untagged | A4 function refuses another resident's update and a non-resident owner | A5 composite FK and check hold for direct writes | A6 delete refused while photos point at it, allowed once untagged; management edits | A7 vet reads but cannot edit, anon refused on table and function
  ```

  (`status 400` is by design: each harness ends in a `raise` so it cannot commit, and exits 0 only on `HARNESS-OK`. The second was filtered to its result line when re-run after tightening A7.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive; undo is in each file's header (drop the view, table and trigger function for 0096; re-create 0082's `record_attachment`, drop the column, constraints and table for 0097), and no data depends on either until batch 2 ships
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0096` then `0097` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--env production --dry-run` then without, **before** either batch-2 feature deploys. 0097 is safe ahead of this release's code: the deployed routes call `record_attachment` with six named arguments, which resolve to the new function (harness A3)

## 4. Functional checks

- [x] Happy path works end to end — S1 (record deliveries, read usage) and A2 (record an update, tag a photo through the real upload function, read its provenance) are the paths batch 2 will use
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; create, edit and delete exercised in the harnesses (S2, S4, S5, A1, A6)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash — `record_attachment` refuses a mismatched update with "That adoption update is not about this resident." (A4); table checks reject the rest (S3, A1, A5)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — zero and negative quantity, negative cost, a delivery at exactly a count's instant on both ends of an interval, optional supplier, cost, sender and note omitted

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: not driven — same `in (…)` lists as management | read + write both tables | covered by the policy text; not separately run |
| management | `stock_receipts`, `adoption_updates` | read + write | edits both (S4, A6) |
| staff | `stock_receipts`, `adoption_updates`, `record_attachment` | read + write | records both, stamps forced (S4, A1) |
| vet | `adoption_updates`; not stock | read updates only; no stock | reads updates, cannot edit (A7); sees 0 stock rows (S4) |
| volunteer | reads both; `record_attachment` | read, no write; may tag a photo | refused on insert, reads, tags a photo (S4, A2) |
| signed out | nothing | refused | refused by grant on tables, view and function (S4, A7) |

- [x] Every role above tested — admin by the policy lists shared with management rather than a separate login; every other row driven in the harnesses
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — no URL yet; refused at the database, which is where the harnesses call

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; batch 2 documents both
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings; channel codes are labelled by the dictionaries in batch 2
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded. The one live dependency is `record_attachment`, called by `src/app/api/residents/[id]/photos/route.ts`, `blood-tests/[id]/attachments` and `procedures/[id]/attachments` with six named arguments; A3 calls it exactly that way on dev and gets an untagged attachment. A real upload through the page is listed for manual verification below
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing; gates green on the tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the brief puts both ticks on the batch-2 feature PRs, when the items are actually done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — unit at receipt, `received_at` over `received_on` and the interval rule, receipts not touching stock on hand, photo provenance on the attachment row with a composite key, no-action delete, channel CHECK over enum, sender stored rather than read through the placement
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: two tables and a view no screen reads yet, and the upload routes behave as before; the batch-2 PRs add the lines when staff can record deliveries and adopter news
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the interval boundaries, telescoping, unit stamping, the composite key, the refused delete and the six-argument call all come from the harness runs above. The PostgREST ambiguity with two overloads is reasoned, not measured, and the decision says only that the old one is dropped

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy — SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives a shelter date; intervals compare instants, and `received_on` is a stored date with no "today" logic
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — the interval is half-open: a delivery at exactly the earlier count's instant is excluded (7) and one at exactly the later count's instant is included (20), and one a second after the later count lands in the next interval (100)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing public reads these tables, and anon is granted nothing

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; the batch-2 features will, so production needs 0096 and 0097 **before** they deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive — new tables, a view, a nullable column; `record_attachment` re-created with its body unchanged plus the optional tag
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. Both files are additive and safe to leave. Removing 0097 means re-creating 0082's six-argument `record_attachment` first; once batch 2 ships, dropping either table loses recorded deliveries or adopter news

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Harness A7 overwrote the vet's read count before asserting it, so "vet reads" was not actually checked | fixed — asserted separately, re-run green |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a photo to any resident and confirm it saves and shows as before — the live route now calls the re-created `record_attachment` | resident hub → Photos, on dev (`test.lannacare.org` or a local dev server) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — one item awaits Lutan

Manual verification by: pending: Lutan — one resident photo upload on dev after 0097

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness results rather than duplicating it
- [x] Handed to the production release manager — the PR states the production apply as Lutan's, before either batch-2 feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
