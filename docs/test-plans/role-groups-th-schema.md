# Feature test plan — role-groups-th-schema

## Header

| | |
|---|---|
| Feature | Schema half of the Add group fix: `role_groups.name_th` becomes nullable |
| Backlog item | `docs/backlog.md` → **BUG: Add group on Who does what appears to do nothing** (left open; app half is `who-does-what-add-group`) |
| Branch / worktree | `claude/role-groups-th-schema` @ `C:\Development\Animal_Shelter_role-groups-th-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-22 |
| Carries a migration? | yes — `0246_role_groups_name_th_optional.sql` |
| Tested at SHA | `57bd3205` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — drops `not null` on `role_groups.name_th` so a group can have an English name only
- [x] Files/areas touched listed — `supabase/migrations/0246_role_groups_name_th_optional.sql`, a decision file, this plan
- [x] Roles affected identified — none see a change; nothing writes NULL until the app half ships
- [x] Anything explicitly **out of scope** written down — all of `src/` (the English fallback in Thai, the form, messages) is the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran, branch pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — 0246 after 0245, as the brief assigned
- [x] `--status` reviewed — dev 246 applied, 0 pending before
- [x] `--dry-run` reviewed — `0246 … ok`
- [x] Applied to **dev** and recorded — `applying 0246_role_groups_name_th_optional.sql … ok`
- [x] File is re-runnable — `drop not null` on an already nullable column is a no-op
- [ ] Existing rows still read correctly — n/a: constraint relaxed only; every existing row keeps its Thai name
- [ ] Constraints and defaults exercised against real rows — n/a: not exercised with a rollback harness; the change only removes a restriction, and the blank-string check is untouched
- [x] Down-migration not needed — relaxing a constraint; old code never sees a NULL until the app half writes one
- [x] Production apply plan stated — `0246` with the release that carries the app half; consumer headers list the readers

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface in this PR; the app half reads it
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | role_groups | unchanged | n/a — no policy or grant changed |

- [ ] Every role above tested — n/a: no policy or grant changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — build gate compiles every reader; no row changes
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; the bug is not fixed until the app half ships
- [x] Non-obvious design choices added in `docs/decisions/` — `2026-10-22-role-groups-name-th-optional.md`
- [x] `README.md` still accurate — it does not mention this column
- [ ] **Release notes.** — n/a: nothing a shelter user can see changes until the app half ships
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — constraint text read from 0241; dry-run and apply output seen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is the tool's actual output** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: public site does not read role_groups

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? — no code change; existing readers type the column as a string but no row is NULL yet
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for destructive migration — n/a: not destructive
- [x] Apply plan stated — with the release carrying the app half

### Rollback

- [x] Rollback position stated — code rollback needs nothing; the column staying nullable is harmless to old code until NULLs exist

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

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface; the app half reads it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
