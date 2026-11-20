# Feature test plan — shelter-enquiry-schema

## Header

| | |
|---|---|
| Feature | Schema half of #shsup: `shelter_enquiries`, a stranger's enquiry to join, written by the service role and read by a product administrator |
| Backlog item | `docs/backlog.md` → #shsup (left open; the form is the next stream's) |
| Branch / worktree | `claude/shelter-enquiry-schema` @ `C:\Development\Animal_Shelter_shelter-enquiry-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | yes — `0427_shelter_enquiries.sql` |
| Tested at SHA | `41ff3650a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one table recording an enquiry (who, how to reach, what said, when, state); nothing is created by one
- [x] Files/areas touched listed — `supabase/migrations/0427_shelter_enquiries.sql`, `docs/hard-coded-security-registry.json` (four declared policies), `docs/tenancy-shared-tables-registry.json`, decision file, this plan
- [x] Roles affected identified — none: no screen or code reads the table; the only readers are product administrators, by `is_product_admin()`
- [x] Anything explicitly **out of scope** written down — the public form, the email and the console screen are separate streams; `src/` untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0427` against highest `0426`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 428 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0427_shelter_enquiries.sql … ok`; `--status` lists it
- [x] File is re-runnable — `if not exists`, `drop policy if exists`, guarded `rls_definer` block
- [x] Existing rows still read correctly after the change — a new table only; no existing object is altered
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev, ending `PROOF PASSED (rolled back)`: service role inserts; a case-differing duplicate open address is refused (23505) and absorbed by `on conflict do nothing`; ids are distinct; a bad address is refused (23514); anon cannot insert or read; a signed-in non-administrator reads 0 rows and cannot insert; a product administrator reads both; an aal1 update changes 0 rows and an aal2 update 1, with the other row still `new`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive, a new table; undo is `drop table public.shelter_enquiries`
- [x] Production apply plan stated for the release manager — `0427` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none yet`, so any time before the form deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and status update exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; duplicate and malformed address are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| signed out (anon) | nothing | no insert, no read | pass — refused with insufficient_privilege in the §3 harness |
| any signed-in login that is not a product administrator | nothing | reads 0 rows, no insert | pass — §3 harness |
| product administrator | read; update at aal2 only | reads all, aal1 update changes 0 rows | pass — §3 harness |
| service role | insert, read, update | the app half's only writer | pass — §3 harness |

- [ ] Every role above tested — n/a: the matrix is by access class rather than app role, and every row was exercised in the §3 harness; no app role is touched because no card or grant changed
- [x] A role that should not have access is blocked server-side — anon and a non-administrator login both blocked in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: a new table nothing reads; the build gate compiles all code
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, its form half remains; a status note on the item says the schema half shipped
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-shelter-enquiry-schema.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: nothing a shelter user opens changes, and the form does not exist yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the check output and the harness result were read, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates line above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none yet`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0427` on production with the next release, any time before the form deploys

### Rollback

- [x] Rollback position stated — nothing reads the table, so code rollback needs nothing; `drop table public.shelter_enquiries` undoes the schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | First `check-hard-coded-security` run named the four new policies (they use `is_product_admin()`, not a card) | fixed — declared under `database.declared`, recorded under `outsideTheCardSystem.productAdmin` as 0425 did; check not edited |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
