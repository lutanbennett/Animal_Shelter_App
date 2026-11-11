# Feature test plan

## Header

| | |
|---|---|
| Feature | Clearing a merged batch's worktrees moves after the hand-over list, in `/plan-day` |
| Backlog item | `docs/backlog.md` → none. A process-document change Lutan asked for directly, 2026-11-11, mid-plan |
| Branch / worktree | `claude/plan-day-remove-after-setup` @ `C:\Development\Animal_Shelter_plan-day-remove-after-setup` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not used: no app surface) |
| PR | #1494 |
| Tested by / date | Claude Opus 5 / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | `e55cc8bb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: two skill documents under `.claude/skills/plan-day/`, read by one chat. No card, no activity, no app code, and nothing the public or admin can reach
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

**The change, in one sentence:** clearing the finished worktrees of a batch that has merged moves from
before the first `worktree.mjs new` to step (e), after the hand-over list has gone to Lutan.

**Files touched:** `.claude/skills/plan-day/SKILL.md` (three places: step (e) of the hard sequence, the
allowed-reads note, and step 2's opening) and `.claude/skills/plan-day/reference.md` (section 1, the
incident).

**Out of scope, deliberately:** the three larger fixes for the same recurring fault — the tool printing
the list itself, moving every record out of the planning turn, and a hook that refuses tidy-up commands
mid-plan. Those were put to Lutan on 2026-11-11 and he has **not** chosen between them, so none is built
here. This PR does only what he asked for in words.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 61s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 300s
=== gates: test — npm test
=== gates: test exited 0 after 54s
=== gates: build — npm run build
=== gates: build exited 0 after 333s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a skill document has no runtime. Its only real test is the next `/plan-day` run, which is listed under **Left for manual verification** rather than claimed here
- [ ] Data persists — reload the page and the change is still there — n/a: no app surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no app surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no app surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no app surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no app surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | nothing | n/a: no app surface — these files are read by a Claude chat, never served |

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no nav surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is a planner's working document
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no app surface
- [ ] Browser console clean — no errors or React warnings — n/a: no app surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no app surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the full `next build` in section 2 compiled every route in the app, and nothing in `src/` or `worker/` reads these two files
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item exists; Lutan asked for this directly in chat
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: `reference.md` section 1 carries the incident, which is where `SKILL.md`'s own rule says incidents belong. A decision file would be a third copy of the same paragraph, and the skill forbids exactly that
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a planner's own working instructions. No shelter user can reach it and nothing about the app changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The commit claims one `worktree.mjs done` blocked the next `worktree.mjs new`; that is what was observed — the delete was moved to the background when it passed its timeout, and the next `new` was held back until it exited

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing here is deployed. `.claude/` is not part of the built app
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date or time logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, rounding rule or cutoff in this change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The nine gate lines in section 2 were `grep`ped out of the run's own output file, per-gate timings included
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing deployed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: nothing deployed
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: nothing deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Reverting the commit restores the previous wording and nothing else is affected: no build artefact, no deployed code, no schema. **What it does not cover:** a `/plan-day` run already in progress has already loaded the old text, so the ordering it follows is whatever it read when it started

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the next `/plan-day` run really does create the worktrees and send the list before clearing anything. **This is the only real test of the change and no script can stand in for it.** It is a hypothesis, exactly as `SKILL.md` says a mitigation is, and the next planner is asked to write down which way it went | the next `/plan-day` run |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the next `/plan-day` run has not happened yet

Manual verification by: pending: only the next `/plan-day` run can show whether the new ordering holds

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: nothing to release — `.claude/` is not part of the built app
