# Feature test plan

## Header

| | |
|---|---|
| Feature | `/plan-day` shows an estimated token cost beside each stream when a batch is approved, and records the actual from the stream's live session afterwards |
| Backlog item | none: Lutan asked for it in chat on 2026-10-08; the brief for batch 72 carries his words |
| Branch / worktree | `claude/plan-day-token-estimates` @ `C:\Development\Animal_Shelter_plan-day-token-estimates` |
| Dev server | n/a: documentation only; no page is served |
| PR | #455 |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `c3ec50e4` (this branch after `sync` merged `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence: `/plan-day` step 5 shows an estimated token figure per stream with a one-line caveat that it is scale, not a bill; step 2 captures actuals from merged streams' still-running sessions; step 6 keeps an `estimated | actual` table; step 4 says to fold small items into one stream because of the ~110k per-stream floor. It matches the ask
- [x] Files/areas touched listed: `.claude/skills/plan-day/SKILL.md` (+37 / −1), `docs/decisions/2026-10-08-plan-day-token-estimates.md`, this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [ ] Roles affected identified — n/a: developer process only; no app role sees any of it
- [x] Out of scope: changing how `/plan-day` composes batches beyond the folding rule the brief asked for; filing a backlog item (the PR is the whole of the work)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, pushed, exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them. Run twice on `c3ec50e4`; the first run's closing line and the second run's per-gate lines are below. Every commit on this branch touches only Markdown, which no gate reads
- [x] CI green on the PR: #455, all 7 checks passed on `3ddfa41a`

```
=== gates: typecheck exited 0 after 17s
=== gates: lint exited 0 after 116s
=== gates: build exited 0 after 60s
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: the tool names and fields the skill now tells a session to use were checked against the live tool, not the brief — `mcp__ccd_session_mgmt__get_usage` takes `session_id` (the brief said `sessionId`) and returns `context.tokensUsed`, `contextWindow: 1000000` and `autoCompactsAtPercent: 97`; its description says an idle, starting or archived session reports `unavailable`, which is why the skill says to write `unmeasured` then
- [ ] Data persists — n/a: documentation only, no data
- [ ] Create / edit / delete — n/a: documentation only, no records
- [ ] Empty state — n/a: documentation only, no UI
- [ ] Invalid input — n/a: documentation only, no input
- [ ] Boundary cases — n/a: documentation only, no code

### Role access matrix

n/a: no app surface.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] Server-side block — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: developer process, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest things still work: the rest of `SKILL.md` re-read around each insertion; steps keep their numbers, and rule 8 in step 4 cross-refers to the *Token estimates* subsection under step 6, which exists
- [ ] Shared file loaded from a second page — n/a: no runtime file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: docs only, gates exit 0 on the merged tree

## 7. Documentation

- [ ] Backlog item ticked — n/a: there is no backlog item for this; it came from Lutan in chat
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-08-plan-day-token-estimates.md`)
- [x] `README.md` still accurate: it does not describe `/plan-day`'s output
- [ ] **Release notes.** n/a: a change to how planning is reported, nothing a shelter user can see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The floor breakdown and the three batch-72 actuals were measured with `get_usage` by the session that wrote the brief; the tool's parameter and field names were checked here against the live tool

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: documentation only; nothing in it is deployed
- [ ] Deployed SHA matches — n/a: not deployed

### On the deployed build

- [ ] Deployed to test — n/a: not part of the Worker bundle
- [ ] Smoke-tested on test.lannacare.org — n/a: not part of the Worker bundle
- [ ] Timezone-sensitive behaviour — n/a: no dates computed
- [ ] Boundary or banding change — n/a: the token bands are guidance read by a planning session, not a threshold any code applies
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked — n/a: nothing public changed

### Deploy safety

- [ ] Production Supabase ref — n/a: no deploy
- [ ] `strip-baked-env` — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. Documentation only; no schema, no Worker

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The brief named the `get_usage` argument `sessionId`; the tool takes `session_id` | fixed: the skill uses `session_id` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none: documentation only; the next `/plan-day` approval is where the column is seen, and it is not a check on this PR | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only — a process file with no app surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in this PR's diff at `docs/test-plans/plan-day-token-estimates.md`; documentation only, nothing for the release manager to deploy
- [ ] Handed to the production release manager — n/a: documentation only; nothing to deploy

Result: pass

Release manager acknowledgement: n/a: documentation only; nothing to deploy
