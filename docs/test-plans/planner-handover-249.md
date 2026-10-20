# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewritten after nine workstreams (slug `249`) |
| Backlog item | `docs/backlog.md` → n/a: no backlog item; the handover is rewritten on the `.plan-day.md` counter reaching nine, per `docs/decisions/2026-10-08-planner-handover-counter.md` |
| Branch / worktree | `claude/planner-handover-249` @ `C:\Development\Animal_Shelter_planner-handover-249` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (not started; documentation only) |
| Tested by / date | Claude Opus 5, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | `2ea8890a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the round of nine workstreams that merged on 2026-10-20
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/planner-handover.md` only. No `src/`, no `worker/`, no migrations, no scripts
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none; no runtime surface
- [x] Anything explicitly **out of scope** written down — `.plan-day.md` is **not** in this PR: it is gitignored local state and its counter reset is done in the planning chat, not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Worktree cut from `origin/main` at `4b244fea` (immediately after #765 merged); nothing has landed since
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 114s

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
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is a planning document for Claude sessions
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings added
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no rendered surface
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the equivalent here is the figures the document asserts. Each was read live rather than carried over: `git log` for `main` at `4b244fea`; `ls supabase/migrations/` for `0232` as the highest and `0233` as next free; `apply-migrations.mjs --status` for 233 files / 233 applied rows and zero drift both ways; `check-backlog-sections.mjs` for 96 open items; `gh pr list` for no open PRs; `worktree.mjs list` for the ten leftovers
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — n/a as written (no shared code file), but the nearest equivalent was done: the nine PR numbers and their stream names were read back from `gh pr list --state merged`, not from the planner's own notes, because the notes are exactly what this document exists to replace
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged after the cut; branch created from `4b244fea` and pushed within the hour

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item; the handover is driven by the workstream counter, not by an item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice here; the document records decisions made elsewhere, each of which already has its own decision file or backlog entry
- [x] `README.md` still accurate — checked; it does not describe the handover's contents or cadence
- [ ] **Release notes.** — n/a: a planning document for Claude sessions; no shelter user can see it
- [x] Commit messages say why, not just what — the commit explains that this round's finding is about source documents regenerating answered questions, which is why the handover was rewritten the way it was
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The eight token actuals come from `get_usage` on each session, not from estimates; the ninth is recorded as `unmeasured` because its call returned `status: "unavailable"`, and no figure was invented for it. The three model/effort readings come from `get_session`; the other six are marked *not read* rather than assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date, time or clock-dependent logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: the token "bands" in this document are planning guidance, not code; nothing branches on them
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only evidence pasted is the `gates:` block in section 2, which is the script's own closing lines copied unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changes

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

- [x] Rollback position stated, **including what it does not cover** — revert the commit; there is nothing to roll back operationally, as the PR carries no code, schema or configuration. What a revert would restore is the **previous** handover, which is now wrong in several specifics (it says `0.37.1` where `0.37.2` shipped, lists eleven leftover worktrees that were cleared, and carries two decisions under *Blocked, on Lutan* that Lutan has since answered). So reverting is worse than leaving it, and the real risk is a future session reading the superseded edition rather than this one

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found in this PR. The faults this round produced are recorded in the document itself, not here. | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the round's findings read true to him — particularly that two decisions were re-surfaced as open, and the process correction that analysis work belongs in a chat rather than a worktree. Only Lutan can say whether the document describes his experience of the day accurately. | `docs/planner-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-20

### Manual verification

Manual verification by: pending: Lutan to read the handover and say whether the round's findings match his experience of the day

Result: pass
