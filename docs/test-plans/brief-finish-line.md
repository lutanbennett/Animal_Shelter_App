# Feature test plan

## Header

| | |
|---|---|
| Feature | Every `/plan-day` brief opens with a "where your finish line is" block: a stream is finished when the PR is open, not when the code works |
| Backlog item | `docs/backlog.md` → n/a: no backlog item. A process fix raised in chat by Lutan on 2026-10-13, asking whether the two handoff misses justified raising model or effort; the reasoning is in `docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md` |
| Branch / worktree | `claude/brief-finish-line` @ `C:\Development\Animal_Shelter_brief-finish-line` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` — not started; this PR has no runtime surface |
| PR | recorded in the follow-up commit, once it exists |
| Tested by / date | Claude (Daily Planner session) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `9d9231a4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `.claude/skills/plan-day/SKILL.md` gains a block that every `.brief.md` must open with, plus the planner's `ahead`-column check; it matches what Lutan approved in chat
- [x] Files/areas touched listed — exactly two files: `.claude/skills/plan-day/SKILL.md` (one new subsection) and a new `docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`. **No `src/`, no `worker/`, no `supabase/migrations/`, no scripts**
- [x] Roles affected identified: **none.** This changes instructions a Claude session reads when planning; it is invisible to admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer and signed-out alike
- [x] Anything explicitly **out of scope** written down — no model or effort change on any stream (argued in the decision file); no change to `check-test-plan.mjs` or any other checker; the duplicate `0191` is not revisited

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Actual closing lines, as printed:

```
=== gates: build exited 0 after 168s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no table
- [ ] Constraints and defaults exercised against real rows — n/a: no migration, no constraints added
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the happy path here is that a planning session writing a brief finds the block and copies it. Verified by reading the edited section in place: it sits inside §7 "Set up — the current batch only", immediately after the pre-push test-plan block and before "Do not create all nine worktrees", so a planner following §7 top to bottom meets it while writing briefs. **Also already exercised for real:** the same text was written into the three live batch-2 briefs (`donate-buttons`, `maintenance-bills`, `resident-picker-floor`) before this PR, which is where the wording comes from
- [x] Data persists — n/a as stated, but ticked honestly: the change is committed text in the repo, re-read from disk at `9d9231a4` after committing
- [ ] Create / edit / delete all exercised — n/a: a Markdown instruction file; there is nothing to create, edit or delete at runtime
- [ ] Empty state renders sensibly — n/a: no rows, no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input path; nothing parses this file
- [ ] Boundary cases checked — n/a: no values, no dates, no arithmetic

### Role access matrix

n/a for every row: this PR touches no route, no component, no policy and no query. Nothing a signed-in or signed-out person can reach changes. The table is left unfilled deliberately rather than filled with invented results.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no runtime surface |
| management | nothing new | no change | n/a: no runtime surface |
| staff | — | — | n/a: role retired by `0173` |
| doctor | nothing new | no change | n/a: no runtime surface |
| volunteer | nothing new | no change | n/a: no runtime surface |
| signed out | nothing new | no change | n/a: no runtime surface |

- [ ] Every role above tested — n/a: no role can reach anything this PR changes; a planning skill is read by Claude, not served
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served from the changed files

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: untouched, no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: untouched. The manual is for shelter staff; this is an instruction to a planning session and no shelter user has a question it answers
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings; the file is English instructions to Claude
- [ ] Mobile viewport (375px) — n/a: no page renders this
- [ ] Browser console clean — n/a: no page renders this
- [ ] Network clean — n/a: no requests involved

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is the skill itself. `node scripts/gates.mjs` passed all four gates on the branch, which is what proves the repo is unharmed; nothing imports or parses `SKILL.md`
- [x] Any shared file touched checked from a second, unrelated page — **`SKILL.md` is a shared file in the sense that matters: two other skills reference the planning loop.** Checked by grepping for references to the pre-push block and to §7 from `.claude/skills/clean-streams/` and from `CLAUDE.md`, and the new subsection is additive — no existing heading was renamed or removed, so nothing that points at this file points at something that moved
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged in; the branch is one commit on top of `main` at `67c05093`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item. It came from a question in chat, not the backlog. Searched `docs/backlog.md` for *brief*, *finish line*, *PR*, *handoff* and *effort* and found no open item describing it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-13-the-finish-line-is-an-open-pr.md`, which records the **rejected** option as well as the chosen one: why raising model or effort does not address a handoff miss, miss by miss, and why no tooling change can catch it
- [x] `README.md` still accurate — checked: it does not describe brief contents or the planning skill's sections, so nothing in it is now wrong
- [ ] **Release notes.** — n/a: no shelter user could notice this. It changes instructions that a Claude planning session reads when it writes a brief; no page, component, dictionary, manual topic or Worker code is touched, and the shelter sees no difference in the app
- [x] Commit messages say why, not just what — the commit explains the two misses, names the rejected alternative (raising model/effort) and the precedent it relies on (the pre-push block: six format commits before it, zero after)
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the load-bearing numbers were read, not recalled: the eight commits, 31 files and 1,414 lines from `git log` and `git diff --stat origin/main...origin/claude/bills-inbox`; the "zero format fixups after the pre-push block" from `git log` on `claude/release-tooling-fixes`, which shows one test-plan commit plus the one legitimate *CI seen green* follow-up; the token figures (127,677 · 129,178 · 136,307) from `get_usage` on the three live sessions; the 78% weekly window from the same call. **The one claim deliberately stated as a limit rather than a measurement** is that Sonnet/low is adequate: 31 streams under band is consistent with that, but the briefs improved over the same period, so the model cannot be credited and the decision file says so

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `9d9231a4` recorded; it is the branch tip. **Not yet the tip of `main`**, which is correct at PR time
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing here needs deploying, but the SHA check belongs to whichever release carries this commit

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **This PR changes no deployable artifact** — the files are repo instructions, not application code
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. There is no behaviour on the deployed build to smoke-test
- [ ] Timezone-sensitive behaviour proved — n/a: no dates, no clocks, no "today" anywhere in the diff
- [ ] Boundary or banding change assertions — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff is touched
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in §2 is copied exactly as printed, including the preceding `=== gates: build exited 0 after 168s` line
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes; nothing is edge-cached differently

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration, and no code at all
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `git revert` of this one commit; it restores the previous `SKILL.md` and removes the decision file. **What it does not cover:** the same block has already been pasted by hand into three live batch-2 briefs (`donate-buttons`, `maintenance-bills`, `resident-picker-floor`), which are gitignored local files — reverting this PR does **not** remove it from them, and it does not need to. No schema, no deployed artifact, so nothing else is affected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

The block's wording is the deliverable, and whether it reads clearly to a fresh session is a judgement a person may want to make. Everything else here is either mechanical or n/a.

| # | What to check | Where |
|---|---|---|
| 1 | That the finish-line block reads as an instruction a fresh session will follow, rather than as background — Lutan approved the substance in chat, but not this exact wording in place | `.claude/skills/plan-day/SKILL.md`, §7, the subsection *Every brief also OPENS with this block, verbatim* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is a judgement about wording and only the person who reads it may tick it

Manual verification by: pending: that the finish-line block reads as an instruction a fresh session will follow (item 1 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing to deploy; it reaches the release manager with whichever release carries the commit

Result: pass

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
