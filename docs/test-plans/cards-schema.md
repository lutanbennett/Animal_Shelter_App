# Feature test plan — cards-schema

## Header

| | |
|---|---|
| Feature | Schema half of cards: which cards a role has, the extras it keeps, and `role_permissions` as the union of its cards' bundles (the recompute) |
| Backlog item | `docs/backlog.md` → **Who does what, simplified into cards …** (left open; this is stream 1 of 4) |
| Branch / worktree | `claude/cards-schema` @ `C:\Development\Animal_Shelter_cards-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | yes — `0194_role_cards.sql` |
| Tested at SHA | `400c23e2` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two audited tables (`role_cards`, `role_extras`), three functions, a seed that changes nobody's access, the twenty-one card definitions in `src/lib/permissions/cards.ts`; the item's "schema PR first"
- [x] Files/areas touched listed — `supabase/migrations/0194_role_cards.sql`, `src/lib/permissions/cards.ts` (+ test), `scripts/check-cards-schema.mjs`, `src/lib/audit/recent-changes.ts`, `src/lib/audit/undo.ts`, `src/app/admin/recent-changes/page.tsx` and both dictionaries (card titles; two table labels)
- [x] Roles affected identified — none see a change: `role_permissions` is byte-identical per role before and after (hashes in section 3). Only Admin at 2-step can write the new tables
- [x] Anything explicitly **out of scope** written down — the Who does what page as cards, the home screen as the role's cards, the "tap a card" detail, and the left-hand menu removal (`layout.tsx` untouched). `CURATED_HOME` and `JOBS_OF_ROLE` still drive the home

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit codes read from the script's own output, redirected to a file:

```
gates: typecheck exited 0 after 19s
gates: lint exited 0 after 172s
gates: test exited 0 after 4s
gates: build exited 0 after 276s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0194` against highest `0193`; the brief makes this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 194 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0194_role_cards.sql … ok` (the seed's own proof ran inside it: it raises if one cell would differ). Only the expected "consumer not on origin/main yet" warnings
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0194_role_cards.sql … ok`
- [x] File is re-runnable — tables `if not exists`, functions `or replace`, policies and triggers dropped first, the seed returns when `role_cards` has rows
- [x] Existing rows still read correctly after the change — `role_permissions` hashed per role (md5 of `activity:level` sorted) before and after the apply, diff empty: doctor 2, head_of_maintenance 8, head_of_medical 9, management 57, second_in_command 22, staff 39, volunteer 5 cells, every hash unchanged
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-cards-schema.mjs` (dev only, one rolled-back transaction, real JWTs). Part 1: for every role, cards.ts bundles of its `role_cards` plus its `role_extras` equal its `role_permissions` cell for cell; Admin and public viewer hold nothing. Part 2: View residents gives resident.record Read only; Residents lifts it to Edit and brings photo upload; an extra survives every recompute; swapping Residents for View residents drops the edit and the photos; removing Medical records keeps `medical.visits` at the Read that Book clinic visits still gives; an extra held at Edit beats a card's Read; a recompute that changes nothing writes no audit row, a real change does; a fixed role takes no card; a card given twice is refused; Admin at 2-step may set cards, Admin at 1-step, a volunteer and a login with no role may not. Result: `All checks passed.`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive, and `role_permissions` is correct at every point; revert steps are in the migration header and the decision file
- [x] Production apply plan stated for the release manager — `0194_role_cards.sql` on `dbkodyyxxhtygxcxmfcu` with the next release, any time; **run `--status --env production` first**, since the seed derives from production's own cells and raises (rolling the file back, applying nothing) if its roles differ from dev's in a way a card would widen

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these tables yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in section 3's check
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the writes are exercised in section 3's check
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusals are asserted in section 3
- [ ] Boundary cases checked — n/a: no UI surface; a card removed while another still covers its activity is in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `role_cards`, `role_extras`, the three functions | write at 2-step only | pass — harness: aal2 writes, aal1 refused |
| management | nothing new | unchanged | n/a — cells identical; no policy changed |
| staff | nothing new | unchanged | n/a — retired role; cells identical |
| doctor | nothing new | unchanged | n/a — cells identical |
| volunteer | nothing new | refused | pass — harness: `set_role_cards` refused |
| signed out | nothing | nothing | n/a — no grant to anon on either table |

- [ ] Every role above tested — n/a: no access rule changed; the per-role before/after hashes in section 3 are the evidence, and the write refusals are in the harness
- [ ] A role that should not have access is blocked server-side — n/a: covered by the harness refusals above (volunteer, no role, Admin at 1-step), which hit the function with real JWTs

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the Who does what manual topic is stream 2's
- [ ] Translatable strings go through the translation path — n/a: the only strings are thirteen card titles and two Recent-changes table labels in the dictionaries, in both languages; no page shows the titles yet
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `npm test` 82/82 including `cards.test.mjs`; typecheck and build compile every reader of the audit table list and the dictionaries
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the shared files touched (the two dictionaries, the audit table list) only gained entries, and the Recent changes page has not been loaded because no card change exists to show; pending in the manual table
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, one of four streams; a status note goes on the `backlog` branch. Searched the backlog for `role_permissions`, `has_permission`, `JOBS_OF_ROLE`, `CURATED_HOME`, `jobs.ts` and `cards`: no other open item is closed (the home-tiles item's remaining part is the menu removal)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-13-cards-are-what-a-role-is-given.md`
- [x] `README.md` still accurate — it does not list permission tables
- [ ] **Release notes.** n/a: schema and a recompute, seeded so nobody's access changes — the cards a user will see arrive in a later PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the no-change claim is the before/after hashes and the in-migration proof; the extras come from the dev tables; the Management finding came from the coverage probe against live cells

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — the code that reads the tables is `cards.ts` (pure, not called by any page yet) and the audit labels. Nothing breaks if the deploy comes first; apply `0194` before or with the release
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; the seed writes only the two new tables
- [x] Apply plan stated — `0194` on production with the next release; `--status --env production` first

### Rollback

- [x] Rollback position stated — leave it: the new tables are read by nothing a user reaches, and `role_permissions` is untouched. A code rollback does not revert the migration and does not need to

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The first Residents bundle included `placement.death_withdraw`; Management does not hold it, so the card would have granted it on the day cards landed. Found by the seed check, not by reading | fixed — the card does not include it; it stays a single activity. The expectation was not adjusted |
| 2 | info | Management keeps 43 extras because its seed is the curated four (Recurring jobs, Residents). Most are whole cards it already can use | accepted — recorded in the decision file; adding those cards to Management in the next stream changes no access |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The extras list reads sensibly to the Director — what each role keeps beyond its cards (`select r.key, e.activity, e.level from role_extras e join roles r on r.id = e.role_id`) | dev database |
| 2 | Recent changes still loads and labels its filter after the two table names were added | `/admin/recent-changes` on dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and only the person who looks may tick this; it is recorded as pending on the signature below

Manual verification by: pending: the extras list and the Recent changes page need a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and linked from the PR description; it is not pasted
- [ ] Handed to the production release manager — n/a: handed over when the release is cut, after merge

Result: pass

Release manager acknowledgement: pending
