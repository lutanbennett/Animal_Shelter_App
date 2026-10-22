# Feature test plan — planner-tooling-fixes

## Header

| | |
|---|---|
| Feature | Two planner tools: `worktree.mjs list` reports unheld `claude/*` branches and mismatched folder names; test-plan §7 asks who a release note is for, and the checker warns on an untagged admin note |
| Backlog item | `docs/backlog.md` → both items, ticked: **`worktree.mjs list` cannot see a `claude/*` branch that has no worktree** and **The test-plan template's release-notes line asks … never asks who** |
| Branch / worktree | `claude/planner-tooling-fixes` @ `C:\Development\Animal_Shelter_planner-tooling-fixes` |
| Dev server | not started — no UI surface, developer scripts only |
| PR | pending: opened with this plan |
| Tested by / date | Claude / 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | `73de5d61` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — list gains two report-only sections; template §7 and the checker gain the audience question and a warning
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/worktree.mjs`, `scripts/check-test-plan.mjs`, `docs/test-plan-template.md`, `docs/backlog.md`, `docs/decisions/2026-10-22-release-note-audience-question.md`, this plan
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none — no shelter user can see a developer script or the template
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — no deleting from `list`; the warning is never a failure; no change to `apply-migrations`, `scripts/pi/`, `src/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged; one conflict in `docs/backlog.md` (another stream's new item next to my tick), kept both
- [x] `node scripts/gates.mjs` ends with every gate at 0, exit code read from the script, run after the merge of origin/main. Closing lines as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface — developer scripts and a docs template only
- [ ] Data persists — n/a: no UI surface — developer scripts and a docs template only
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface — developer scripts and a docs template only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface — developer scripts and a docs template only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface — developer scripts and a docs template only
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface — developer scripts and a docs template only

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a — no UI surface, nothing role-gated changed |
| management | n/a | n/a | n/a — no UI surface, nothing role-gated changed |
| staff | n/a | n/a | n/a — no UI surface, nothing role-gated changed |
| doctor | n/a | n/a | n/a — no UI surface, nothing role-gated changed |
| volunteer | n/a | n/a | n/a — no UI surface, nothing role-gated changed |
| signed out | n/a | n/a | n/a — no UI surface, nothing role-gated changed |

- [ ] Every role above tested — n/a: no UI surface — developer scripts and a docs template only
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI surface — developer scripts and a docs template only

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI surface — developer scripts and a docs template only
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface — developer scripts and a docs template only
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface — developer scripts and a docs template only
- [ ] Mobile viewport (375px) — n/a: no UI surface — developer scripts and a docs template only
- [ ] Browser console clean — n/a: no UI surface — developer scripts and a docs template only
- [ ] Network clean — n/a: no UI surface — developer scripts and a docs template only

## 6. Regression

- [x] The pages nearest the change still work — the checker change only appends a warning string to its existing output paths and adds no exit path, so no plan that was green can go red; read from the diff and exercised with a temporary untagged note (warns, exit 0, a tagged note is not flagged)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no UI surface — developer scripts and a docs template only
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both items ticked; searched the backlog for `worktree.mjs list`, `check-test-plan` and `roles`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-22-release-note-audience-question.md` (warn, never fail; report-only `list`)
- [x] `README.md` still accurate — it does not describe `worktree list` output or the checker's warnings
- [ ] **Release notes.** — n/a: developer tools only; no shelter user can see a script or the plan template
- [x] Commit messages say why, not just what — see the branch log
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the list output came from a real run with scratch branches (since deleted), the warning from a run against an edited `unreleased` (reverted)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: developer scripts, nothing deployed to production
- [ ] Deployed SHA matches the tested SHA — n/a: developer scripts, nothing deployed to production

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: developer scripts, nothing deployed to production
- [ ] Smoke-tested on `test.lannacare.org` — n/a: developer scripts, nothing deployed to production
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: developer scripts, nothing deployed to production
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: developer scripts, nothing deployed to production
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — n/a: developer scripts, nothing deployed to production
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: developer scripts, nothing deployed to production

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — n/a: developer scripts, nothing deployed to production
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: developer scripts, nothing deployed to production
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: developer scripts, nothing deployed to production

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: developer scripts, nothing deployed to production

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — n/a: no migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — yes
- [x] Nothing is ticked that was not actually executed — yes

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — empty: no UI surface

Manual verification by: n/a: no UI surface, developer scripts only

### Result

- [x] Open defects are either fixed or explicitly accepted above — none open
- [ ] Checklist pasted into the PR — n/a: the PR body links this file
- [ ] Handed to the production release manager — n/a: nothing here deploys; it ships with the next release PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

