# Feature test plan — the planner starts the batch's sessions

## Header

| | |
|---|---|
| Feature | `CLAUDE.md` and `.claude/skills/plan-day/SKILL.md`: `/plan-day` starts each stream's session itself with the model and effort already set, instead of Lutan opening one per worktree and re-dialling it |
| Backlog item | `docs/backlog.md` → none. Lutan asked for this directly on 2026-11-01 (*"I had to change those three streams manually"*, then *"Yes promote this change to Claude.md"*); the cost it removes was recorded in `.plan-day.md`, which is gitignored day-scoped state, not the backlog |
| Branch / worktree | `claude/planner-starts-sessions` @ `C:\Development\Animal_Shelter_planner-starts-sessions` |
| Dev server | not started — `n/a: two markdown documents, no runtime surface` |
| PR | #1167 |
| Tested by / date | Claude (Daily Planner) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `5df8f1e0` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *the planner starts the batch's sessions with the dials set, and both documents say so.* There is no backlog item; the header records what he asked and when
- [x] Files/areas touched listed — `CLAUDE.md` (Workstreams step 1), `.claude/skills/plan-day/SKILL.md` (a new subsection in step 7 and the first paragraph of step 8), and this plan. **No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow**
- [x] Access affected identified — **none.** Neither document grants or denies anything: they instruct Claude sessions. No card, activity, policy, page, tile or control changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **the three fixes that were tried and failed are recorded as findings, deliberately not applied**: `model` in `~/.claude/settings.json` was set and is left in place because it is correct for the terminal CLI, and nothing was built to work around the Remote Control refusal. **No numeric stop threshold, usage gate or dial policy is introduced** — model, effort and which allowance to spend remain Lutan's, and the skill's own rule against blocking paid usage is untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run on this branch before the gates; output in the PR body
- [x] `node scripts/gates.mjs` ends:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — **this one is not `n/a`, and it is the point of the PR: the procedure was executed before being written down.** On 2026-11-01 all three of batch 11's sessions were started by the planner with `model: claude-sonnet-5-5` and `effort: low`, `cwd` on the existing worktree and `use_worktree: false`, and **each was read back with `get_session`**, reporting that model and effort in the right folder. Lutan re-dialled nothing
- [x] Data persists — `n/a` would be wrong: the thing that must persist is the instruction, and both documents were re-read after editing (`sed -n`) to confirm the amended paragraphs read correctly and reflow sensibly
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface; the deliverable is two markdown documents`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [x] Invalid input is rejected with a readable message — **the refusal path was exercised for real, not reasoned.** The first attempt was refused outright with *"the user is working over Remote Control, and for now you can start a session only on a message typed in the desktop app"*, and the fallback ran: folder, port, and Lutan opening the session. **That refusal is why the DESKTOP APP condition is written into both documents**
- [x] Boundary cases checked — the two dials were chosen to sit inside what the tool permits (a cheaper model family than the planner's, an effort at or below it); both were accepted

### Access matrix

**Written by card, not by role** (`CLAUDE.md`: all analysis is by card, because roles are a transient
grouping of cards and every assignment will be rebuilt).

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | `CLAUDE.md` and the plan-day skill are developer documents read by Claude sessions, not app surfaces: no card opens them, no card is read by them, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

- [x] Every card above tested — vacuously: the diff is two markdown documents and this plan
- [ ] A card that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: the manual is for shelter users; this instructs Claude sessions`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` would be wrong: `CLAUDE.md` is read by `scripts/check-docs-only.mjs` and the repo's own checks, so the four gates were run in full rather than skipped as a documentation change
- [x] Any shared file touched checked from a second, unrelated place — **the two documents are the shared files, and before this PR they disagreed.** `CLAUDE.md` step 1 said to open a session on the new folder while the skill's step 8 said to tell him to open one, and the behaviour had already changed under both. They now agree, and the skill's step 8 was amended in the same commit as step 7 for that reason. **Also checked: the skill's own CRLF warning is stale for the main checkout** (both files read LF there) **but true in a fresh worktree**, where git converts on checkout — the first amendment attempt failed on exactly that and the script was fixed to normalise, which is what the warning exists for
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is one commit of markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: there is no backlog item; see the header`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: the reasoning is the content of the change itself, and the commit message records the three failed fixes and why the settings key is left in place. **The one judgement worth naming: the skill was amended in the same PR as `CLAUDE.md` although Lutan named only `CLAUDE.md`**, because a `CLAUDE.md`-only change would leave the skill instructing the planner to do the thing that is no longer true — the stale-copy fault the handover of the same day warns about. **He was told this in the same message, so he can have the skill half reverted**
- [x] `README.md` still accurate — it says nothing about who starts a session
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. This changes how Claude sessions are started during development; it touches no page, no card and no data`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — "it worked on all three" is three `get_session` reads; "refused over Remote Control" is the tool's own refusal text; "the settings key is inert" was established by setting it, reading it back through `get_settings`, and opening a new session that still came up on Opus; "`lastModelUsage` is a cost ledger" is from a script over all 999 project entries finding a record on one folder and none on any worktree

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefacts are two markdown documents`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The first attempt to start a session was refused because Lutan was on Remote Control, not for the reason the planner had guarded against (`cwd` being rejected) | **accepted and documented** — the condition is now written into both documents, with the fallback |
| 2 | low | The first amendment script failed to match its anchor because a fresh worktree's `CLAUDE.md` is CRLF while the main checkout's reads LF | fixed — the script normalises before matching and restores the original endings on write |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the next `/plan-day` actually follows it, and that the desktop-app condition is honoured rather than assumed | The next batch's setup. **Not verifiable in this PR**: it needs a future planning session, and the only true test is whether Lutan re-dials anything |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-11-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — not empty, and **not signed**: item 1 needs a future `/plan-day` run, which no person can check today

Manual verification by: pending: whether the next batch's setup follows the new procedure, and whether Lutan re-dials anything

### Result

- [x] Open defects are either fixed or explicitly accepted above — both are, one fixed and one accepted with its reason
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass

Release manager acknowledgement: n/a: nothing in this PR is deployed
