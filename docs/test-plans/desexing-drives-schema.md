# Feature test plan — desexing-drives-schema

## Header

| | |
|---|---|
| Feature | Schema half of desexing drives: `desexing_drives`, `desexing_drive_signups` (anon insert only), `public_desexing_drives`, public-view proof |
| Backlog item | `docs/backlog.md` → **Desexing drives under Services** (left open: the page half remains) |
| Branch / worktree | `claude/desexing-drives-schema` @ `C:\Development\Animal_Shelter_desexing-drives-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-20 |
| Carries a migration? | yes — `0233_desexing_drives.sql` |
| Tested at SHA | the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two tables, an anon-insert-only sign-up path with database-side limits, a public drives view, and the check that anon cannot read a sign-up
- [x] Files/areas touched listed — `supabase/migrations/0233_desexing_drives.sql`, `scripts/check-public-views.mjs`, `scripts/check-migration-grants.mjs`, a decision file, this plan
- [x] Roles affected identified — signed-out public gains an insert-only path; website.content holders gain the tables; nothing reads them in the app yet
- [x] Anything explicitly **out of scope** written down — the public page, Services entry, management screen, manual topic and release note are `desexing-drives-page`

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: filled in below once run
- [ ] `node scripts/gates.mjs` — n/a: filled in below once run
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — 0233 above 0232; the only migration stream in the batch
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 233 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — ok; the grants guard first refused the anon insert grant, fixed by a one-table allow-list
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change — only new objects; no existing table altered
- [x] **Constraints and defaults exercised** against the live dev database through the Data API as service role and anon: a capacity-1 open drive took one anon sign-up (201), refused the second with `desexing_drive_full`; the drive appeared in `public_desexing_drives`; the test drive was deleted. `check-public-views.mjs` asserts anon GET/PATCH/DELETE refused, insert reaches the gate, status cannot be set. Not exercised: the per-contact and hourly limits, and the species refusal (read from the code only)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: new objects only; undo steps are in the file header
- [x] Production apply plan stated for the release manager — `0233` on `dbkodyyxxhtygxcxmfcu` with the page half's release, before its deploy

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; database path exercised in §3
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; create and delete of a drive and an anon insert done in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; refusals are the exception names listed in the decision file
- [ ] Boundary cases checked — n/a: no UI surface; capacity boundary exercised in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in the app yet | n/a | n/a: no screen |
| management | nothing in the app yet | n/a | n/a: no screen |
| staff | nothing in the app yet | n/a | n/a: no screen |
| doctor | nothing | n/a | n/a: no screen |
| volunteer | nothing | n/a | n/a: no screen |
| signed out | the view; insert only on sign-ups | read refused, insert gated | checked by `check-public-views.mjs`, all ok on dev |

- [ ] Every role above tested — n/a: no UI; authenticated roles were not exercised, only policies written from the donation_channels pattern (website.content)
- [ ] A role that should not have access is blocked server-side — n/a: the signed-out case is covered by check-public-views; other roles untested

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the topic comes with the page
- [ ] Translatable strings go through the translation path — n/a: no strings yet
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — nothing existing altered; `check-public-views.mjs` full run on dev ends with zero failures
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: see the gates run recorded in the PR

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: left open, the page half remains; backlog edits go on the backlog branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-20-desexing-drives-schema.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: nothing a shelter user can see until the page lands
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — except the per-contact, hourly and species limits, which are stated from the code and said so above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing user-visible yet; the view and gate use shelter_today()
- [ ] **Boundary or banding change** — n/a: no band; capacity boundary exercised once (1 of 1)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no pasted output
- [ ] Public pages re-checked after a cache purge — n/a: no public page reads this yet

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the page half reads it, so 0233 goes to production first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0233` on production before the page half deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert 0233 and does not need to: nothing reads it; undo steps are in the migration header

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | grants guard refused anon INSERT on a non public_ table | fixed — `ANON_INSERT_TABLES` allow-list |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: pass

Release manager acknowledgement: 
