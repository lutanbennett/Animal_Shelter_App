# Feature test plan

## Header

| | |
|---|---|
| Feature | `public_enclosures`: an anon-readable view of each physical enclosure and its current residents, for the page behind an enclosure's QR code. Schema half only |
| Backlog item | `docs/backlog.md` → Facility → **A public view behind enclosure QR codes** (ticked on the feature PR, not this one) |
| Branch / worktree | `claude/enclosure-public-view-schema` @ `C:\Development\Animal_Shelter_enclosure-public-view-schema` |
| Dev server | not started. This change ships no runtime code |
| PR | #101 |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes: `0079_public_enclosures.sql` |
| Tested at SHA | branch on `main` @ `66d5550` (#100). The migration, harness, `check-public-views.mjs` entry, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration creates `public_enclosures`, which anon can read. Each row is a non-Lifecycle enclosure's name and Thai name, its zone's name and Thai name, and a `residents` array of the current residents' `public_resident_cards` rows. That is the schema the `/e/<id>` visitor page needs
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0079_public_enclosures.sql`; `scripts/check-public-enclosures.mjs` (dev-only rollback harness); `scripts/check-public-views.mjs` (one view added to its list); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Signed-out public can now `SELECT` the view. No code reads it yet. No existing table, grant or policy changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the `/e/` page, `src/lib/public-paths.ts` and the manual topic all belong to the `claude/enclosure-public-view` stream. The backlog tick belongs to that feature PR. The view is named `public_enclosures` (one row per enclosure), not the backlog's suggested `public_enclosure_residents`; the reason is in `decisions.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Nothing to merge: the branch was already at `origin/main` (`66d5550`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: build exited 0 after 291s

  gates: typecheck=0 lint=0 build=0
  ```
- [x] CI green on the PR (runs the same three) — `check` and `test-plan` both pass on #101 (run 36011795485)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one. `origin/main` tops out at `0078_prescriptions_diets_updated_at.sql`, there are no open PRs, and the only other `*-schema` worktree (`data-api-grants-schema`) has nothing beyond `main`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `80 applied, 1 pending. pending: 0079_public_enclosures.sql` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0079_public_enclosures.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0079_public_enclosures.sql … ok`, and `--status` afterwards reported `81 applied, 0 pending`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`). The harness runs the whole file twice in one transaction, and it was run again after the real apply. Both runs exit 0
- [x] Existing rows still read correctly after the change (checked against real dev data). Harness step F compares real dev rows: all 67 physical enclosures have a row, and all 48 residents currently in one are listed exactly once, each with status Resident or Outreach
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-public-enclosures.mjs`. The view is read with `set local role anon`. Asserted: (A) the view has exactly the six columns `id, name, name_th, zone_name, zone_name_th, residents`; (B) an enclosure with capacity 7 and a staff note shows its names and zone, lists only its one current resident, and has no capacity, notes or note text anywhere in the row; (C) the embedded resident equals that resident's `public_resident_cards` row as anon reads it, so the fields are the same with none added; (D) a resident who moved enclosures appears only on the new one, and an empty enclosure is a row with `[]`; (E) no Lifecycle enclosure is visible, and residents who died, went to hospital or were adopted from the test kennel appear on no page; (F) the real-row consistency above; (G) anon `update` and `delete` through the view are refused. Output, unedited (run after the apply):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK exactly 6 columns | anon: names + zone, only the current resident, no capacity/notes | embedded card = public_resident_cards row | mover on new enclosure only, empty enclosure listed with [] | no Lifecycle enclosure; deceased/hospital/adopted on no page | real rows: 67 physical enclosures, 48 residents each listed once, all Resident/Outreach | anon update/delete refused | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 107 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit, and the script exits 0 only on `HARNESS-OK`.) To check the harness can fail, I ran it against two broken copies of the migration. With the Lifecycle filter removed it failed at step E. With `capacity` added as a column it failed at step A. The file was then restored

  `node scripts/check-public-views.mjs` against dev after the apply exits 0. The new lines, as printed:

  ```
  ok    public_enclosures: anon can SELECT — HTTP 200
  ok    public_enclosures: anon PATCH is refused — HTTP 500
  ok    public_enclosures: anon DELETE is refused — HTTP 500
  ```
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive, one new view that nothing reads yet; undoing it is `drop view if exists public_enclosures`
- [x] Production apply plan stated for the release manager (which file, which project, when): Lutan applies `0079_public_enclosures.sql` to production `dbkodyyxxhtygxcxmfcu` from the main checkout, running `node scripts/apply-migrations.mjs --env production --dry-run` and then without the flag. This must happen **before** the `enclosure-public-view` feature deploys, because that code will select from the view. Then run `node scripts/check-public-views.mjs --env production`

## 4. Functional checks

- [x] Happy path works end to end: harness steps B and D are the reads the `/e/` page will make, run as `anon`
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads this view yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only view; anon writes are refused (step G)
- [x] Empty state renders sensibly (no rows yet): at the schema level an empty enclosure is a row with `residents = []`, not a missing row (step D)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a read-only view
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): an empty enclosure, an enclosure without a Thai name (`Harness 0079 Run`), a resident who moved out, and residents who died, went to hospital or were adopted

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route; view granted to `authenticated` like the other public views | — | — |
| management | n/a: as admin | — | — |
| staff | n/a: as admin | — | — |
| vet | n/a: as admin | — | — |
| volunteer | n/a: as admin | — | — |
| signed out | `public_enclosures` via the anon key | SELECT only | SELECT 200; PATCH/DELETE refused (`check-public-views.mjs`, harness step G) |

- [ ] Every role above tested — n/a: no route or RLS policy changed; the only new access is anon SELECT on the view, which was tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): anon writes through the view are refused over REST and in SQL

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature PR documents what a visitor sees
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings; embedded cards carry the approved translations 0068 already exposes
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked). No page was loaded, because nothing in `src/` reads the new view. `check-public-views.mjs` still passes for every existing public view, and `public_resident_cards` is unchanged
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch. Sync brought nothing in, and the build is green on this tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: only the schema half is done; the feature PR ticks it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated. Recorded: residents rather than the enclosure alone (Lutan, 2026-09-24); one row per enclosure with whole cards embedded; what is left out on purpose; Lifecycle excluded by zone name; the deliberate reversal of 0068's location stance; outreach zones included
- [x] `README.md` still accurate. It does not list views
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: a view no page reads yet; the feature PR adds the line when visitors can see the page
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every exclusion claimed is asserted by the harness. The claim that one filter also keeps deceased, hospitalised and adopted residents off the page was tested (step E) and checked against real rows (step F)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy — SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no existing public page reads the new view, and no existing view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, but the follow-on `enclosure-public-view` feature will, so production must have 0079 **before** that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: one new view; no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy. See §3

### Rollback

- [x] Rollback position stated, **including what it does not cover**. There is no Worker change, so `wrangler rollback` does not apply. The view is additive and safe to leave in place; `drop view if exists public_enclosures` removes it. Once the feature ships, dropping the view breaks `/e/` for visitors

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty. Nothing in this change has a surface for a person to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager: the PR states that the production apply is Lutan's and must happen before the feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
