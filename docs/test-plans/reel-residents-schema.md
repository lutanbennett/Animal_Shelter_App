# Feature test plan — reel-residents-schema

## Header

| | |
|---|---|
| Feature | Schema half of #v3h8m: `reel_resident_tags()` tells a reels login how many animals a reel tags, and names them only where names are already readable |
| Backlog item | `docs/backlog.md` → #v3h8m (left open for the app half) |
| Branch / worktree | `claude/reel-residents-schema` @ `C:\Development\Animal_Shelter_reel-residents-schema` |
| Dev server | `http://localhost:3001` (not started: no UI surface) |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-07 |
| Carries a migration? | yes — `0330_reel_resident_tags.sql` |
| Tested at SHA | f3b8cb9c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one invoker function returning the tag count always and names only where `resident_who_and_where` gives them
- [x] Files/areas touched listed — `supabase/migrations/0330_reel_resident_tags.sql`, `supabase/harness/0330_reel_resident_tags_harness.sql`, the decision file, this plan. No `src/`
- [x] Cards affected identified — `social.reels` Read (count), `resident.who_and_where` and the other `works_with_residents()` cards (names); no card added or changed; Admin outside the card system, unchanged; anon refused
- [x] Anything explicitly **out of scope** written down — all of `src/app/reels/` and `queries.ts` (the app half)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 129s
=== gates: lint exited 0 after 211s
=== gates: test exited 0 after 46s
=== gates: build exited 0 after 355s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one (`check-migration-numbers.mjs` ok, highest was 0329)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, idempotent grants)
- [x] Existing rows still read correctly after the change — the 2 existing dev links return through the function
- [x] Permissions exercised in a `begin; … rollback;` harness: exactly `reel_view` gets count 1 with no name or id and still cannot read `residents`; `reel_add` gets the name; a card-less login gets 0 rows; anon is refused. It caught a real leak in a first definer draft
- [x] Down-migration not needed as a file: to undo, `drop function reel_resident_tags(uuid[])`; nothing reads it yet
- [ ] Production apply plan — pending: release manager applies 0330 before the app half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads the function yet
- [ ] Data persists — n/a: read-only function
- [ ] Create / edit / delete all exercised — n/a: read-only function
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: an empty id array returns no rows by construction

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | function | not used by any screen yet | n/a: Admin bypass unchanged |
| exactly `reel_view` | function | count, no name | pass (harness) |
| exactly `reel_add` | function | named | pass (harness) |
| signed out | function | refused | pass (harness, anon) |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (anon refused; a card-less login gets zero rows)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — nothing reads the function, and the `reel_residents` and `residents` policies are untouched
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: #v3h8m stays open for the app half; its tail is on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-07-reel-residents-schema.md`
- [ ] `README.md` still accurate — n/a: nothing user-facing changed
- [ ] **Release notes.** n/a: schema only, no user-visible change yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the definer leak was found by the harness, not argued

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change covered at both edges — n/a: not a boundary change
- [ ] Evidence pasted is the tool's actual output — n/a: the harness result is quoted in the decision file as printed
- [ ] Public pages re-checked — n/a: no public view touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [ ] Migration and reading code in the same PR? — n/a: no code reads it; apply 0330 before the app half deploys
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive function only
- [ ] Apply plan stated — deferred: release manager applies 0330 ahead of the app half

### Rollback

- [ ] Rollback position stated — n/a: `drop function reel_resident_tags(uuid[])`; additive, nothing depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | First draft (security definer) gave `reel_view` names, because `works_with_residents()` is always true inside a definer | fixed before merge: made security invoker |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-07

### Manual verification

Manual verification by: n/a: no UI surface; the screen is the app half's

Result: pass
