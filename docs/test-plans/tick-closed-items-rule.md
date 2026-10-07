# Feature test plan

## Header

| | |
|---|---|
| Feature | Give the "tick what else your work closed" rule in `CLAUDE.md` the PR, decision file and test plan it skipped by reaching `main` through the `backlog` branch (`eb94fdba`) |
| Backlog item | none: the rule came out of the 2026-10-07 backlog staleness sweep, and this PR reviews it after the fact |
| Branch / worktree | `claude/tick-closed-items-rule` @ `C:\Development\Animal_Shelter_tick-closed-items-rule` |
| Dev server | n/a: documentation only; no page is served |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `04fe6fc8` (tip of `origin/main` after sync) plus this branch's docs commit |

## 1. Scope and risk

- [x] Change is described in one sentence: a decision file records why the closed-items rule exists, why it lives in `CLAUDE.md` while its planning checks live in the `/plan-day` skill, and that a refused `gh pr create` must be handed to Lutan rather than routed around
- [x] Files/areas touched listed: `docs/decisions/2026-10-07-tick-the-items-your-work-closed.md` this plan, and `CLAUDE.md`: the 14 lines from `eb94fdba` were checked against the backlog history, found accurate and left word for word; one new paragraph under *Workstreams* step 4 says a refused `gh pr create` is handed to Lutan, added after he approved it in chat on 2026-10-07. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [ ] Roles affected identified — n/a: documentation and process only; no app role sees any of it
- [x] Out of scope: reverting and re-applying `eb94fdba` (Lutan kept it); ticking or filing any backlog item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, pushed, exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them. Run on `04fe6fc8` (synced `origin/main`); every commit on this branch touches only Markdown (`CLAUDE.md`, the decision file, this plan), which no gate reads
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck exited 0 after 55s
=== gates: lint exited 0 after 194s
=== gates: build exited 0 after 329s
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

- [x] Happy path: every factual claim in the 14 `CLAUDE.md` lines and the decision file was checked against git — the sweep commits `68e847f6`, `8c307bf9`, `fe67b035` and `eb173a63`, the security review delivered 2026-09-30 and cited across the Security section, and the two checks quoted from `.claude/skills/plan-day/SKILL.md` step 3
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

- [x] Nearest things still work: `CLAUDE.md` *Finishing a feature* and `.claude/skills/plan-day/SKILL.md` step 3 re-read; the decision file quotes both accurately and neither is edited
- [ ] Shared file loaded from a second page — n/a: no runtime file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: docs only, gates exit 0 on the merged tree

## 7. Documentation

- [ ] Backlog item ticked — n/a: there is no backlog item for this; it came out of the sweep, and the brief says not to tick any
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-07-tick-the-items-your-work-closed.md`)
- [x] `README.md` still accurate: it does not describe the finishing rules
- [ ] **Release notes.** n/a: documentation and process only, nothing a shelter user can see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Commit IDs, dates and the 102 → 93 count come from the sweep commits and the brief written from them; the skill and `CLAUDE.md` text was read, not recalled

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: documentation only; nothing in it is deployed
- [ ] Deployed SHA matches — n/a: not deployed

### On the deployed build

- [ ] Deployed to test — n/a: not part of the Worker bundle
- [ ] Smoke-tested on test.lannacare.org — n/a: not part of the Worker bundle
- [ ] Timezone-sensitive behaviour — n/a: no dates computed
- [ ] Boundary or banding change — n/a: no threshold
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
| 1 | medium | Process: `eb94fdba` reached `main` via the `backlog` branch after `gh pr create` was refused, skipping PR, CI, decision file and test plan | fixed by this PR for the content; the route is recorded in the decision file, and `CLAUDE.md` now carries a rule against it, approved by Lutan in chat |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the decision file and the new `CLAUDE.md` paragraph read clearly to someone non-technical | `docs/decisions/2026-10-07-tick-the-items-your-work-closed.md`; `CLAUDE.md` *Workstreams* step 4 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: Lutan to read the decision file and the new CLAUDE.md paragraph

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: documentation only; nothing to deploy

Result: pass

Release manager acknowledgement: n/a: documentation only; nothing to deploy
