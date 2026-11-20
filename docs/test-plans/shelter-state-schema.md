# Feature test plan — shelter-state-schema

## Header

| | |
|---|---|
| Feature | Schema half of #pacon: account holder, *the* website and an archive state on shelters, the enquiry→shelter carry, and the one-place door that closes an archived shelter |
| Backlog item | `docs/backlog.md` → #pacon (left open; the console redesign is the app half) |
| Branch / worktree | `claude/shelter-state-schema` @ `C:\Development\Animal_Shelter_shelter-state-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | yes — `0428_shelter_state.sql` |
| Tested at SHA | `8b948629a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — columns and four writes for the account holder, the primary website and archive, with archived shelters refused at `resolve_shelter_site()`
- [x] Files/areas touched listed — `supabase/migrations/0428_shelter_state.sql`, `supabase/harness/shelter_state.sql`, `docs/hard-coded-security-registry.json` (five declared definer functions), decision file, this plan
- [x] Roles affected identified — none by role: no screen or code reads these columns yet; only product administrators call the writes; an archived shelter's staff and public lose access (by design, once something is archived, which nothing does yet)
- [x] Anything explicitly **out of scope** written down — the console screens, `src/app/platform/` and the Worker are untouched; scheduled jobs on archived shelters are reported, not changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates ("Already up to date")
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0428` against highest `0427`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 429 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok` (consumer-header warnings only: the app half is not on `main` yet)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0428_shelter_state.sql … ok`
- [x] File is re-runnable — `if not exists`, `create or replace`, `drop … if exists`, guarded constraint and `rls_definer` blocks
- [x] Existing rows still read correctly after the change — new nullable columns; the backfill marks only a shelter with exactly one address; `resolve_shelter_site` is unchanged for an open shelter
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`supabase/harness/shelter_state.sql`), ending `HARNESS OK pacon schema`: first address becomes primary; a second primary is refused (unique_violation); `product_admin_set_primary_host` moves it; the door returns the shelter id when open, `id`/`site` null with `archived: true` when archived, and the id again after unarchive; archive leaves `public_site` and hosts untouched; an unknown host returns no row; aal1 cannot archive; the enquiry carry fills only empty columns, never overwrites a typed name, is idempotent and marks the enquiry `created`
- [x] Down-migration written, or the reason one is not needed is stated — in the file's header (re-apply 0426 and 0424 functions, drop the new functions, trigger and columns)
- [x] Production apply plan stated for the release manager — `0428` on `dbkodyyxxhtygxcxmfcu` with the next release; additive; `resolve_shelter_site` keeps its signature and grants

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the writes are exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; errors are worded in the functions
- [ ] Boundary cases checked — n/a: no UI surface; second-primary and unknown-host cases are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| signed out (anon) | nothing new | no grant to the new functions | pass — `check-migration-grants` ok |
| any signed-in login that is not a product administrator | nothing | writes raise `product admin only`; the read returns no rows | pass by construction (`is_product_admin()` is the first line of each); only the aal1 refusal was driven in the harness |
| product administrator | read at aal1; writes at aal2 only | as stated | pass — §3 harness |

- [ ] Every role above tested — n/a: access classes, not app roles; no card or grant changed (`check-card-grants` ok)
- [x] A role that should not have access is blocked server-side — aal1 archive refused in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing in `src/` reads the new columns; the build gate compiles all code
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: #pacon stays open by brief; the redesign has not started
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-shelter-state-schema.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: nothing a shelter user would notice; only one person reaches the console and nothing reads these columns yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the harness result and check output were read; the Worker was not run end to end against an archived host (said so in the decision file)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output; the gates line above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no shelter is archived, so no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the app half follows
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; the one backfill sets a flag on single-address shelters
- [x] Apply plan stated — `0428` on production with the next release, any time before the console redesign deploys

### Rollback

- [x] Rollback position stated — nothing reads the new columns; the file header lists the undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `check-hard-coded-security` named the five new definer functions (gated by `is_product_admin()`, not a card) | fixed — declared under `database.declared` with 0424's wording; check not edited |
| 2 | info | Dry-run warned the consumer header parsed oddly (parentheses and a semicolon) | fixed — header rewritten to plain paths before applying |

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
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
