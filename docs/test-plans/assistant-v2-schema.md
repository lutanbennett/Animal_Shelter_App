# Feature test plan — assistant-v2-schema

## Header

| | |
|---|---|
| Feature | Schema half of assistant v2: `assistant_actions.model` and `.exchange`, written by `audit.ts` |
| Backlog item | `docs/backlog.md` → **Assistant v2 stream 1, schema** (ticked; parent left open) |
| Branch / worktree | `claude/assistant-v2-schema` @ `C:\Development\Animal_Shelter_assistant-v2-schema` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — `0289_assistant_actions_model_exchange.sql` |
| Tested at SHA | `20b54f6e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two nullable columns on `assistant_actions`, written by `audit.ts`
- [x] Files/areas touched listed — `supabase/migrations/0289_*.sql`, `src/lib/assistant/audit.ts`, `docs/decisions/2026-10-30-assistant-v2-schema.md`, `docs/backlog.md`, this plan
- [x] Roles affected identified — none: no policy or grant changed and no caller passes the new fields
- [x] Anything explicitly **out of scope** written down — the model call, `exchange` shape (stream 3), the adapter (stream 2)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current `origin/main` today; no drift
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — see PR for the unedited output
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0289` over `0288`; the only migration stream in the batch
- [x] `--status` reviewed — dev 289 applied, 1 pending before apply
- [x] `--dry-run` reviewed — `0289 … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0289_assistant_actions_model_exchange.sql … ok`
- [x] File is re-runnable — `add column if not exists`, `comment on` is idempotent
- [x] Existing rows still read correctly — both columns nullable, no default, no rewrite
- [ ] Constraints and defaults exercised against real rows — n/a: no constraint or default; columns are bare nullable
- [x] Down-migration not needed — additive, nullable columns that old code ignores
- [x] Production apply plan stated — `0289` with the release, before or with this code (decision file: `audit.ts` sends both keys, so an insert on the old schema fails and is only logged)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; no caller passes `model`/`exchange`, so both stay null
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | `assistant_actions` | unchanged | n/a — row-level policies from 0070 untouched |

- [ ] Every role above tested — n/a: no policy or grant changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — typecheck and build compile both callers of `logAssistantAction`, whose input type only gained optional fields
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` broken by this branch — branched from current main

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — stream 1 ticked; parent left open (six streams remain). Searched `assistant_actions`/`audit.ts`: no other open item closes
- [x] Non-obvious design choices in `docs/decisions/` — `2026-10-30-assistant-v2-schema.md`
- [x] `README.md` still accurate — does not list audit columns
- [ ] **Release notes.** — n/a: nothing a shelter user can see changes, and `0289` is not on production
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — apply output read directly

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence pasted is the tool's actual output** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — yes, `audit.ts` writes the columns; `0289` must reach production before or with this code
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive only
- [x] Apply plan stated — with the release, migrations first

### Rollback

- [x] Rollback position stated — code rollback leaves the nullable columns in place, which old code ignores

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface, no caller populates the columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
