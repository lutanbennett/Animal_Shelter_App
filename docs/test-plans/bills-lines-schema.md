# Feature test plan — bills-lines-schema

## Header

| | |
|---|---|
| Feature | Schema half of one invoice with several items: `stock_deliveries` header, `stock_receipts.delivery_id`, described lines, promotion link columns, `stock_delivery_totals`, owner type `stock_delivery` |
| Backlog item | `docs/backlog.md` → **BILLS: SCHEMA HALF SHIPPED 2026-11-03 (`0308`)…** (left open and retitled; the app half is still to build) |
| Branch / worktree | `claude/bills-lines-schema` @ `C:\Development\Animal_Shelter_bills-lines-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | yes — `0308_bills_delivery_lines.sql` |
| Tested at SHA | `ec864d89` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema half: an invoice header with lines, the one-item constraint replaced, described lines, a nullable link to a promoted stock item; no screens
- [x] Files/areas touched listed — `supabase/migrations/0308_bills_delivery_lines.sql`, `scripts/check-bills-delivery-lines.mjs`, `docs/decisions/2026-11-03-bills-lines-schema.md`, `docs/backlog.md` (retitle), this plan. Nothing under `src/`
- [x] Cards affected identified — `stock.delivery` (the activity the delivery form already asks) now also writes the header and owns the invoice photos. No card created, no grant to a role. Admin unaffected (outside the card system). Signed-out public: no grant to `anon`
- [x] Anything explicitly **out of scope** written down — every screen, the `/api/bills` photo route, the bulk promote step, Cashflow (reported only), the manual and dictionaries (all the app half)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all `0`:

```
=== gates: typecheck exited 0 after 104s
=== gates: lint exited 0 after 192s
=== gates: test exited 0 after 17s
=== gates: build exited 0 after 164s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs` ok: `0308` against highest `0307`; this stream holds the batch's only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 308 applied, 1 pending (`0308`)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0308` ok (after adding the grant the grants check asked for on the redefined `item_latest_delivery_cost`); it depends on no other pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable — `if not exists` / `or replace` / `drop … if exists` throughout
- [x] Existing rows still read correctly after the change — all new columns nullable, every old row satisfies `stock_receipts_one_shape` (the constraint was added over the live dev table without error); a headerless single-item delivery still records (harness I)
- [x] **Constraints and defaults exercised against real rows** in a `begin … rollback` harness with the SQL role switched to `authenticated` (`scripts/check-bills-delivery-lines.mjs`, printed `HARNESS-OK`): one bill holds a medication, a diet and a described line; lines take the header's instant and a described line keeps its typed unit; a described line is in no price view, names no item and has no stocktake interval; the bill amount against the lines gives a difference of 10 then 0 and never blocks a save; a described line is linked afterwards and a second line with the same words stays unlinked; eight malformed lines are refused (two items, blank description, no unit, a description on a stocked line, a described line naming an item, linked to both, unknown kind, no description); quantity, description, link on a stocked line and moving off the bill are refused while cost is editable; the header instant is fixed and a `stock.delivery` login cannot delete; the bill photo is stored on the header; `stock.purchasing` reads but cannot write or attach; a login with no stock card sees and attaches nothing; a header with lines cannot be deleted
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the undo recipe is in the 0308 header (the enum value cannot be dropped)
- [x] Production apply plan stated for the release manager — `0308` on `dbkodyyxxhtygxcxmfcu` with the next release, before any deploy of the app half

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; inserts, updates and the delete refusal exercised in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; database refusals asserted in §3
- [ ] Boundary cases checked — n/a: no UI; blank and whitespace description, missing unit and zero difference are in §3

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | all new objects | read and write, outside the card system | n/a: Admin short-circuit unchanged, not exercised |
| exactly `stock.delivery` activity | header and lines write, invoice photo | allowed, no delete | pass — harness |
| exactly `stock.purchasing` activity | header and lines read | no write, no attach | pass — harness |
| a login with no stock card | nothing | all refused | pass — harness |
| signed out | nothing | no grant to `anon` | n/a: grants revoked from `anon`; no page |

- [ ] Every login above tested — n/a: no page; each row exercised in the §3 harness through RLS
- [ ] A login that should not have access is blocked server-side — n/a: no page; the harness shows the database refusing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every bills and deliveries page, which do not use the new columns; `check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`; `item_latest_delivery_cost` keeps every row it had (its only change is excluding the new described kind)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no page or shared file changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — only the planner handover came in

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open, retitled to say the schema half shipped and the app half is open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-03-bills-lines-schema.md`
- [x] `README.md` still accurate — it does not list bill tables
- [ ] **Release notes.** n/a: nothing a shelter user can see changes, there is no screen yet and the note must come with the app half
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the Cashflow finding was read from `page.tsx` and `0072`, the rest from the harness run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a day
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates block above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: schema only, nothing under `src/`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; the new check constraint only validates existing rows
- [x] Apply plan stated — `0308` on production before the app half deploys

### Rollback

- [x] Rollback position stated — purely additive, safe to leave; older code ignores the new table and columns

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | first dry-run: `item_latest_delivery_cost` was redefined without its grant, so the grants check would refuse the file | fixed before apply |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links this file
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
