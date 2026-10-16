# Feature test plan — appeals-schema

## Header

| | |
|---|---|
| Feature | Schema half of sponsorship drives for sick residents: appeals, appeal photos, public views, the appeal.run activity |
| Backlog item | `docs/backlog.md` → **Sponsorship drives for sick residents** (left open on purpose; the public and staff halves tick it) |
| Branch / worktree | `claude/appeals-schema` @ `C:\Development\Animal_Shelter_appeals-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan is committed |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | yes — `0210_appeals.sql` |
| Tested at SHA | `f3100da7` (`origin/main` `83ff5a86` already merged, nothing to merge) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema PR the item names first: `appeals` with status, target, outcome, display style and social links, photos chosen from non-Medical ones, a `public_appeals` view with the raised sum, and a delegable activity
- [x] Files/areas touched listed — `supabase/migrations/0210_appeals.sql`, `scripts/check-appeals-schema.mjs`, `scripts/check-public-views.mjs`, `scripts/check-permission-tables.mjs`, `scripts/check-permission-parity.mjs`, `scripts/lib/permission-probes.mjs`, `src/lib/permissions/catalogue.ts`, both i18n dictionaries (one label), `docs/roles-and-permissions.md`, `docs/decisions/2026-10-16-appeals-schema.md`, this plan
- [x] Roles affected identified — Admin only holds `appeal.run`; signed-out visitors gain two read-only views that return nothing until an appeal is published, and nothing can publish one yet
- [x] Anything explicitly **out of scope** written down — the public pages, the staff forms, the donation form's appeal choice, the manual topic, the release note and ticking the backlog item are the next two streams

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main` `83ff5a86`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 105s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs`: ok, `0210` against highest `0209`; no other open PR (`gh pr list` empty)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 210 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run flagged `appeal_links_ok()` for lacking a revoke from public/anon; fixed, second run `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0210_appeals.sql … ok`. Afterwards I edited the file once (dropped the Management grant, see the decision file) and deleted that one `role_permissions` row on dev with a single API call; dev matches the file
- [x] File is re-runnable — `check-appeals-schema.mjs` applies the whole file again inside its transaction before asserting
- [x] Existing rows still read correctly after the change — additive only: one nullable column on `donations`, new tables and views, `is_public_drive_file` re-created from 0206's body plus one branch; `check-public-views.mjs` run against dev
- [x] **Constraints and defaults exercised against real rows** — `node scripts/check-appeals-schema.mjs`: 47 assertions, rolled back. Admin creates; Management and anon refused; a draft is invisible to anon and cannot be marked published; zero target, an http link and a javascript link refused; closing needs an outcome; a Medical photo, a non-image and another resident's photo are refused; a second cover is refused; a published appeal is visible and its cover is served by the proxy; a gift designated to the appeal moves the sum while a resident-designated gift does not and an in-kind line adds nothing; the view has no `donor_name`; anon cannot read `donations`; raised may exceed the target; an appeal with gifts cannot be deleted; a photo refiled to Medical leaves the view and the proxy; a non-public resident hides the appeal; the prose is queued for Thai
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the undo is described in the migration header
- [x] Production apply plan stated — `0210_appeals.sql` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none`, so it can go before or after any deploy; the public half will read it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these objects yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes and refusals exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface; the views are empty until an appeal is published
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; target 0, ten-link limit's neighbours, over-raising and in-kind lines are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | appeals, appeal_photos | read and write | pass — created, edited, closed in the harness |
| management | appeals, appeal_photos | refused until delegated | pass — insert refused (42501) |
| staff | n/a | retired role | n/a |
| doctor | appeals | refused | n/a — no cell, same policy as Management; `check-permission-parity` probe covers every role |
| volunteer | appeals | refused | n/a — as above |
| signed out | public_appeals, public_appeal_photos | published rows only | pass — draft invisible, published visible, tables refused |

- [x] Every role above tested — Admin, Management and anon by the harness; the other roles by the new `appeal.run` probe in `check-permission-parity.mjs` (no mismatch reported for it)
- [x] A role that should not have access is blocked server-side — anon and Management got 42501 on the table and on photos; `check-public-views.mjs` shows anon refused on `appeals`, `appeal_photos` and `appeal_links_ok()`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the "Running an appeal" topic is the staff half's
- [ ] Translatable strings go through the translation path — n/a: the five prose columns are queued by trigger (asserted in §3); the one new activity label is in both dictionaries
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — no page changed; `check-public-views.mjs` shows every other public view still readable by anon and unwritable; `check-cards-schema.mjs` passes; `check-permission-tables.mjs` reports only the known doctor-on-hold disagreements; `check-permission-parity.mjs` is red as before for the doctor column and `maintenance.bills` (not probed, not mine) and adds nothing for `appeal.run`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `catalogue.ts` and the dictionaries gained one entry each; `gates.mjs` typecheck and build load every page's imports
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged, already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item is not done; the public and staff halves tick it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-appeals-schema.md`
- [x] `README.md` still accurate — no behaviour a reader could use changed
- [ ] **Release notes.** — n/a: nothing a shelter user can see ships; no page reads the new tables, and the public half writes the note when the pages exist
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The behavioural claims (Medical refusal, sum, over-raise, refile) are each an assertion in `check-appeals-schema.mjs`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; `deadline` is a plain date nothing computes with yet
- [ ] **Boundary or banding change** — n/a: no threshold or band; the only limits are target > 0 and at most ten links, both asserted
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates lines above are as printed
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: the migration is read by nothing in `src/`, so the production apply order does not matter
- [ ] `--env production --dry-run` run and clean — deferred: production release manager
- [ ] Destructive or rewriting migration backup — n/a: additive only
- [x] Apply plan stated: `0210_appeals.sql` on `dbkodyyxxhtygxcxmfcu`, any time before the public half deploys

### Rollback

- [x] Rollback position stated: purely additive schema is safe to leave; a rollback of the code changes nothing here because no code reads it; the undo is listed in the migration header

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-permission-parity.mjs` reports `maintenance.bills` as neither probed nor explained and the doctor column as red, both before this change | deferred to backlog: not this PR's to fix |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty: there is no UI surface to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the plan file itself
- [ ] Handed to the production release manager — n/a: handover happens at release time

Result: pass

Release manager acknowledgement: pending: production release manager at release time