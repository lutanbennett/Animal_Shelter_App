# Feature test plan — fundraising-events-schema

## Header

| | |
|---|---|
| Feature | Schema and card for fundraising events: `fundraising_events`, `fundraising_event_photos`, activity `events.run`, card `run_fundraising_events` |
| Backlog item | `docs/backlog.md` → **FUNDRAISING EVENTS: SCHEMA AND CARD DONE** (`#2zi2j`, retitled, not ticked) |
| Branch / worktree | `claude/fundraising-events-schema` @ `C:\Development\Animal_Shelter_fundraising-events-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | n/a: not yet — the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | yes — `0312_fundraising_events.sql` |
| Tested at SHA | GATES_SHA |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an event is its own table with a nullable link to an appeal and to a project folder, a gallery whose photos wait for approval, and a new card given to no role
- [x] Files/areas touched listed — `supabase/migrations/0312_fundraising_events.sql`, `src/lib/permissions/{catalogue,cards}.ts`, both dictionaries (card label, card description, activity label), `scripts/check-cards-count.mjs` (45 to 46), `scripts/check-fundraising-events-schema.mjs`, `docs/backlog.md` (retitle), the decision file, this plan
- [x] Cards affected identified — the new `run_fundraising_events` only; held by no role. `attachments_approval_stamp()` is restated for owner type `event` and is otherwise 0309 unchanged, so no other card's behaviour moves. Admin is outside the card system and unaffected. The signed-out public reads nothing new (no public view)
- [x] Anything explicitly **out of scope** written down — screens, public views, `record_attachment` for `event`, Drive folder creation, the approval queue listing event photos, repointing the card's `opens`; all the next stream's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`, run in the background and the file read afterwards:

```
GATES_BLOCK
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0312` after `0311`; the planner's brief names this the batch's only migration; `worktree.mjs sync` printed `migration numbers: ok`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `312 applied, 0 pending` plus `pending: 0312_fundraising_events.sql`; after: `313 applied, 0 pending`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0312_fundraising_events.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`, `add value if not exists`, `on conflict` on every insert)
- [x] Existing rows still read correctly after the change — the one changed function is `attachments_approval_stamp()`, and the harness proves a resident photo from a non-publisher still waits and a non-resident, non-event owner type is still auto-approved by the same condition
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `node scripts/check-fundraising-events-schema.mjs`, 30 assertions, all held and rolled back: anon refused; a login without the card refused on create, read and gallery; the card holder creates, publishes (stamping `published_at`) and adds an image to the gallery; `end_date` before `event_date` refused; cancelled-and-published refused; http and non-https links refused; non-image and wrong-owner attachments refused; an event photo from a non-approver waits and the holder cannot approve it, an approver's is approved; `record_attachment` still refuses `event`; **the card holder cannot create an appeal, change a project folder or write residents**; the card grants exactly `events.run` and nothing else grants it
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive tables, an additive enum value and one function restated; nothing reads them. Dropping the two tables and restoring 0309's function body would undo it, and an enum value cannot be removed
- [x] Production apply plan stated for the release manager — `0312` applies to production with the release that carries it, as a normal pending file (`node scripts/apply-migrations.mjs --env production --status` first); no ordering constraint, since no code reads it yet

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the database path is the harness above
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; create and update are in the harness, delete is the table's ordinary `for all` policy
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; the constraint refusals are in the harness
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface; the date boundary (`end_date` before `event_date`) is in the harness

### Role access matrix

Tested at the database as sessions, not through a page: the card is not on any page yet.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | events and gallery | writes both (outside the card system) | harness: created an event |
| exactly `run_fundraising_events` | events and gallery only | writes both; nothing else | harness: held, and appeals, project folders, residents refused |
| exactly `view_residents` | nothing here | refused, sees zero rows | harness: held |
| signed out | nothing | refused with 42501 | harness: held |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (the harness runs as the `authenticated` and `anon` database roles with real policies on)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page yet
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can open yet
- [x] Translatable strings go through the translation path — the card label, card description and activity label are in both dictionaries (Thai added, to be read by a Thai speaker); the event prose columns are registered in `translatable_fields`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface, no dev server run
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; nearest code is the approval stamp, covered by the harness's 0309-unchanged assertion, and `check-card-grants.mjs` (121 rows, 71 roles) and `check-cards-count.mjs` (46) pass
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second page — none of those touched; `cards.ts`, `catalogue.ts` and the dictionaries are type-checked by the typecheck gate
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged (already up to date)

## 7. Documentation

- [x] Backlog item `#2zi2j` retitled so its title alone says schema and card are done and what remains; **deliberately not ticked**, per the brief; no other open item's outcome is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-04-fundraising-events-schema.md`
- [x] `README.md` still accurate — it does not describe the table list
- [ ] **Release notes.** n/a: nothing a shelter user can see ships in this PR, and `0312` is not on production; the screens that make it visible are the next stream
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 45 to 46 card count, the 121 `card_grants` rows and the 30 harness assertions are read from the runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: `event_date` is a plain date and nothing here derives "today"
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the one boundary, `end_date >= event_date`, has its refusing side in the harness and its equal-or-later side is the default (null) and the accepted insert
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block is pasted unedited; the harness results are summarised, not pasted
- [ ] Public pages re-checked after a cache purge — n/a: no public view or page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** n/a: no code reads the new tables; the card and activity are the only code, and they are inert until a role is given the card
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only — n/a: additive
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: purely additive schema is safe to leave; the one restated function is 0309's body plus an `event` clause, and nothing creates an `event` attachment (`record_attachment` refuses it)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Project photos are auto-approved on save and `public_project_photos` does not filter on `approved_at`, unlike the event photos (found, predates this PR) | deferred to backlog, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty: there is no surface for a person to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet
