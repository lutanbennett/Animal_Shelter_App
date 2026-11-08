# Feature test plan — suppliers-schema

## Header

| | |
|---|---|
| Feature | Schema half of #xkfsv: a `suppliers` table (0335), a Shelter Friend may be a supplier (0336), delivery and bill history re-keyed additively (0337) |
| Backlog item | `docs/backlog.md` → **SPLIT SUPPLIERS OUT OF CONTACTS INTO THEIR OWN THING** (left open, title rewritten to say only the app half is left) |
| Branch / worktree | `claude/suppliers-schema` @ `C:\Development\Animal_Shelter_suppliers-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-08 |
| Carries a migration? | yes — `0335_suppliers.sql`, `0336_shelter_friends_supplier_subject.sql`, `0337_supplier_history_rekey.sql` |
| Tested at SHA | `1ddd3814` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema half only: suppliers become their own table, a Shelter Friend can be a supplier, the two history columns gain a reference to it; no code under `src/` changed
- [x] Files/areas touched listed — `supabase/migrations/0335`–`0337`, `supabase/harness/0335_suppliers_harness.sql`, `docs/hard-coded-security-registry.json` (one declared anon grant), `docs/backlog.md` (title), `docs/decisions/2026-11-08-suppliers-schema.md`, this plan
- [x] Cards affected identified — none gain or change behaviour: no card or activity was added, the policies ask existing activities (`stock.delivery`, `stock.purchasing`, `bills.*`, `maintenance.bills`, `friends.manage`, `friends.view`, `contacts.add`, `contacts.directory`). Admin sits outside the card system. The signed-out public sees the same Friends: `public_shelter_friends` keeps its columns and rows
- [x] Anything explicitly **out of scope** written down — every reader under `src/`, the supplier screen and its card, the "No suppliers — add one as a Vendor in Contacts" string, dropping the old columns and `Vendor` from the enum: all the app half's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `a7f1ad84` merged in; already up to date
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`:

```
=== gates: typecheck exited 0 after 226s
=== gates: lint exited 0 after 453s
=== gates: test exited 0 after 34s
=== gates: build exited 0 after 230s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0335` against highest `0334`; the commit hook printed `migration numbers: ok`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev: 336 applied, 3 pending (the three files)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0335` ok; `0336` and `0337` reported FAILED with `relation "suppliers" does not exist`, which is the documented dry-run limit (each file is rolled back before the next), not a fault in the files
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0335_suppliers.sql … ok`, `0336 … ok`, `0337 … ok`
- [x] File is re-runnable — every statement is `if not exists` / `or replace` / `drop … if exists` / `on conflict do nothing`; the harness runs the back-fill insert twice and asserts the second adds no rows
- [x] Existing rows still read correctly after the change — dev holds one Shelter Friend (a contact) and it still reaches `public_shelter_friends`; the harness asserts the Friend count rises by exactly the two it adds and that a contact Friend's phone is unchanged
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`supabase/harness/0335_suppliers_harness.sql`). Asserted: back-fill repeats with no new rows; admin inserts; a login given only `stock.delivery` reads suppliers and cannot insert, update or delete; a login with none of the supplier cells reads zero rows and cannot write; anon is refused; a Friend from a contact and one from a supplier both reach the website with their phone shown; both-subjects, no-subject and a second Friend for one supplier are refused; an archived supplier drops off the website; an old-style delivery write (contact only) gets `supplier_id` and keeps `supplier_contact_id`. Result: `HARNESS-OK` (rolled back)
- [x] Down-migration written, or the reason one is not needed is stated — each file's header states how to undo it; all three are additive, old code ignores the new table and columns, and `contact_id` was only made nullable
- [x] Production apply plan stated for the release manager — `0335`, `0336`, `0337` in order on `dbkodyyxxhtygxcxmfcu` with the next release, run bare as `node scripts/apply-migrations.mjs --env production`. Production Vendors are copied on apply; its history is back-filled in `0337`. Production has not been read from this worktree

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these tables yet
- [ ] Data persists — n/a: no UI surface; persistence asserted by the harness in §3
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes and refusals exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the subject check's three boundaries (both, neither, duplicate) are in §3

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `suppliers` | reads and writes (outside the card system) | harness B1 pass |
| holding exactly `stock.delivery` | `suppliers` | reads; insert, update and delete refused | harness B2, B5, B6, B7 pass |
| holding no supplier cell | `suppliers` | reads nothing; cannot write | harness B3, B4 pass |
| signed out | `suppliers`, `public_shelter_friends` | table refused; the view unchanged | harness B8, C4–C7 pass |

- [x] Every login above tested — in the harness, by setting the request's claims and `set local role`
- [x] A login that should not have access is blocked server-side — the harness refuses at the database, not in a page

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the app half writes the supplier topic
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `node scripts/check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`; `check-public-views.mjs` ran against dev with the three files applied; the build gate compiles every reader of `stock_receipts` and `shelter_friends`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — deliberately NOT ticked: the title now says only the app half is left and the schema half is struck through
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-08-suppliers-schema.md`
- [x] `README.md` still accurate — it lists no supplier or Friend columns
- [ ] **Release notes.** — n/a: schema only, no user-visible surface until the app half lands
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the two-column count came from a grep of the migrations, the cost-only trigger's effect from its source in 0235, and the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager, once `0336` is on production, because `public_shelter_friends` was replaced

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; all three are `-- consumer: none` and nothing under `src/` changed
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; `0337` updates two columns it just added
- [x] Apply plan stated — see §3

### Rollback

- [x] Rollback position stated — code rollback does not revert migrations and does not need to: old code ignores the table and columns, and `public_shelter_friends` returns the same rows. Not covered: once a supplier-subject Friend exists, restoring the 0164 view would drop it from the website

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-hard-coded-security` failed on `0336`'s restated `grant … to anon` until it was declared in the registry | fixed — declared with a reason |
| 2 | info | `stock_receipts_cost_only` will refuse the foreign key's set-null if a supplier with receipts is deleted | accepted — suppliers are archived, matches contacts today; recorded in the decision file for the app half |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these tables yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
