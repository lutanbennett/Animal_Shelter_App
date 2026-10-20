# Feature test plan

## Header

| | |
|---|---|
| Feature | `test-plan` stays advisory — record the decision in `CLAUDE.md`, the template and the handover |
| Backlog item | `docs/backlog.md` → n/a: no backlog item; Lutan gave this decision in chat on 2026-10-20 |
| Branch / worktree | `claude/test-plan-advisory` @ `C:\Development\Animal_Shelter_test-plan-advisory` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (not started; documentation only) |
| Tested by / date | Claude Opus 5, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | `b3b6be02` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — records Lutan's 2026-10-20 decision that `test-plan` stays advisory, in the three places whose wording was generating the question
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `CLAUDE.md`, `docs/test-plan-template.md`, `docs/planner-handover.md`, new `docs/decisions/2026-10-20-test-plan-stays-advisory.md`. No `src/`, no `worker/`, no migrations
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none; no runtime surface changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **branch protection itself is not touched** (the decision is that it stays as it is), `scripts/check-test-plan.mjs` is unchanged, and `ci.yml` is unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Worktree cut from `origin/main` at `c1c5da46` immediately before the change; nothing has merged since
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 123s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only; no code path changes
- [ ] Data persists — reload the page and the change is still there — n/a: documentation only; nothing is stored
- [ ] Create / edit / delete all exercised — n/a: documentation only; no such operations
- [ ] Empty state renders sensibly — n/a: documentation only; no rendered state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: documentation only; no input
- [ ] Boundary cases checked — n/a: documentation only; no values handled

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing this PR changes | unchanged | unchanged — no runtime surface touched |
| management | nothing this PR changes | unchanged | unchanged — no runtime surface touched |
| staff | nothing this PR changes | unchanged | unchanged — role retired by `0173` |
| doctor | nothing this PR changes | unchanged | unchanged — no runtime surface touched |
| volunteer | nothing this PR changes | unchanged | unchanged — no runtime surface touched |
| signed out | nothing this PR changes | unchanged | unchanged — no runtime surface touched |

- [ ] Every role above tested — n/a: documentation only; no role can reach anything this PR changes
- [ ] A role that should not have access is blocked server-side — n/a: documentation only; this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; `src/` untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is a repo process rule
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [ ] Browser console clean — n/a: no rendered surface
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the nearest thing to a page here is the checker: `node scripts/check-test-plan.mjs` was run against this plan, which is a copy of the template this PR edits, and it passes
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file**. The shared file is `docs/test-plan-template.md`. It was exercised by copying it and running the checker over the copy, which is exactly how every future stream consumes it; reading it would only have proved I did not break the prose
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; branch cut from `c1c5da46` and pushed within the hour

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item exists for this; the decision was given in chat and belongs in `CLAUDE.md`, not the backlog
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-20-test-plan-stays-advisory.md`, which records what does *not* change as well as what does
- [x] `README.md` still accurate — checked; it does not describe `test-plan` as a future required check
- [ ] **Release notes.** — n/a: documentation and repo process only; no shelter user can see a change to `CLAUDE.md`, the test-plan template or the planner handover
- [x] Commit messages say why, not just what — the commit explains that the stale staged-rollout wording is what regenerated the question, which is the reason for the change
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Both factual claims were checked rather than asserted: that `CLAUDE.md` carried the staged-rollout wording (read at lines 218–222 before editing) and that the handover listed it under *Blocked, on Lutan* (read at lines 355–358)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date, time or clock-dependent logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no boundary, threshold or banding logic in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only evidence pasted is the `gates:` block in section 2, which is the script's own closing lines copied unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changes; nothing edge-cached is affected by a docs change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit; there is nothing to roll back operationally, as the PR carries no code, schema or configuration. What a revert would *not* undo is the decision itself, which is Lutan's and stands regardless of what this file says. The real risk here is the opposite of a deploy risk: that a future session reads "advisory" as licence to relax the checker. The decision file states plainly that the script's strictness, the unsigned-plan exit 0 and the ban on `continue-on-error` are all unchanged

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found. | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. Three documents and a decision file, with no surface a person needs to look at beyond what the checker and `gates.mjs` already cover. | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-20

### Manual verification

Manual verification by: n/a: documentation only — no runtime surface and no screen to look at, and the one shared artefact (the template) was exercised by copying it into this plan and running the checker over the result.

Result: pass
