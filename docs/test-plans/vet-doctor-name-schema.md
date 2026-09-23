# Feature test plan

## Header

| | |
|---|---|
| Feature | `vet_appointments.doctor_name` — optional free-text doctor on a vet appointment, schema half only |
| Backlog item | `docs/backlog.md` → Medical records → **Optional doctor name on a vet appointment** (ticked on the feature PR, not this one) |
| Branch / worktree | `claude/vet-doctor-name-schema` @ `C:\Development\Animal_Shelter_vet-doctor-name-schema` |
| Dev server | not started — this change ships no runtime code |
| PR | #76 |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes — `0074_vet_doctor_name.sql` |
| Tested at SHA | branch on `main` @ `06e208c` (#73); the migration, harness, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one additive migration puts a nullable `doctor_name text` on `vet_appointments`, trimmed and blank-as-null by trigger, so the feature PR has somewhere to store who saw the resident
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0074_vet_doctor_name.sql`; `scripts/check-vet-doctor-name.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — none yet; no code reads or writes the column. The existing row policies on `vet_appointments` apply to it unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the UI (booking form, edit page, resident tab, vet hub) is the `claude/vet-doctor-name` stream; no lookup table (Lutan's call 2026-09-24, cost recorded in `decisions.md`); inner spacing and case are not normalised; the backlog tick belongs to the feature PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — "Already up to date", exit 0
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0)
- [x] CI green on the PR (runs the same three) — `check` and `test-plan` both pass on #76 (run 35904966047)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0073_shelter_today.sql`; no open PRs, and this is the only `*-schema` branch on `origin`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `75 applied, 1 pending. pending: 0074_vet_doctor_name.sql` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0074_vet_doctor_name.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0074_vet_doctor_name.sql … ok`; `--status` afterwards `76 applied, 0 pending`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — the harness executes the whole file twice in one transaction, and was run again after the real apply; both exit 0
- [x] Existing rows still read correctly after the change (checked against real dev data) — harness step A: all 73 dev appointments present, 0 back-filled
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-vet-doctor-name.mjs`, against a real living dev resident and vet. Asserted: (A) no existing row back-filled; (B) insert stores `'  Dr Somchai  '` as `Dr Somchai`, a tab/newline-wrapped `Dr  Nok` as `Dr  Nok` (inner double space kept), `''`, whitespace-only and an omitted value all as `NULL`, and 500 Thai characters round-trip unchanged; (C) update trims, clearing to blanks gives `NULL`, and editing another column (`notes`) leaves the name alone; (D) with the trigger disabled, the check constraint alone rejects an untrimmed name and an empty string. Output, unedited (run after the apply):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK existing rows=73 back-filled=0 | insert trim, tab/newline, blank->null, whitespace->null, omitted->null, 500 Thai chars | update trim, other-column edit, clear->null | constraint rejects untrimmed and empty with trigger disabled | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 66 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive; undoing it is `drop trigger`, `drop function`, `drop constraint`, `drop column`, and nothing in data depends on it until the feature PR ships
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0074_vet_doctor_name.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan, `node scripts/apply-migrations.mjs --env production --dry-run` then without, from the main checkout, **before** the `vet-doctor-name` feature is deployed (that code will select the column)

## 4. Functional checks

- [x] Happy path works end to end — harness steps B and C are the insert and update paths the feature will use
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads this column yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert and update exercised in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash — at the schema level there is no invalid name, only untidy ones, which the trigger tidies; the constraint's rejection with the trigger off is step D
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — empty, whitespace-only, omitted, tab/newline, 500 Thai characters

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | — | — |
| management | n/a: no route or policy changed | — | — |
| staff | n/a: no route or policy changed | — | — |
| vet | n/a: no route or policy changed | — | — |
| volunteer | n/a: no route or policy changed | — | — |
| signed out | n/a: no route or policy changed | — | — |

- [ ] Every role above tested — n/a: no route, grant or RLS policy changed; the column rides on the existing row policies
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature PR documents the field
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded: nothing in `src/` selects `doctor_name`, and the harness proved every existing `vet_appointments` row is still present and unchanged, and that an insert without the column still works (step B, "omitted")
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing; build green on the tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the brief puts the tick on the feature PR, which is when the item is actually done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — free text over a lookup and its counting cost; trigger rather than app rule; `\s` not `btrim()`; inner spacing left alone
- [x] `README.md` still accurate — it does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: a column no screen reads yet; the feature PR adds the line when staff can see and fill it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — trimming of tabs/newlines, inner spacing kept, constraint holding alone, and no back-fill all come from the harness run above

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
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or page reads `vet_appointments`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; but the follow-on `vet-doctor-name` feature will, so production must have 0074 **before** that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive nullable column; no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. The column is additive and safe to leave in place; to remove it, drop the trigger, function, constraint and column. Once the feature ships, dropping the column loses any doctor names recorded

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty — nothing in this change has a surface a person needs to look at that the harness did not already cover.

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
- [x] Handed to the production release manager — the PR states the production apply as Lutan's, before the feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
