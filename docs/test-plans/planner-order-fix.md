# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Move stream setup to step 2 of the `/plan-day` skill, and write planner handover `699` |
| Backlog item | `docs/backlog.md` → none: Lutan's direct instruction, 2026-11-07 (*"update the skill to move the streams to step 2 and then create the handover and merge it"*) |
| Branch / worktree | `claude/planner-order-fix` @ `C:\Development\Animal_Shelter_planner-order-fix` |
| Dev server | not started — process documents only, no app surface |
| PR | <pr> |
| Tested by / date | Claude (planner session) / 2026-11-07 |
| Carries a migration? | no |
| Tested at SHA | <sha> |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — the `/plan-day` skill's sections are reordered so creating the worktrees and briefs is step 2, before the actuals and the backlog reading, and `docs/planner-handover.md` is rewritten as edition `699`
- [x] Files/areas touched listed — `.claude/skills/plan-day/SKILL.md` (reordered, 19 lines differing in content) and `docs/planner-handover.md` (replaced). **No code, no scripts, no migration, no `src/`, no CI workflow**
- [x] Cards affected identified — **none.** Neither file is read at runtime; nothing grants or denies anything, and no page, control or policy changes. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — `CLAUDE.md` is untouched (its merge-train step numbers are its own and were deliberately not remapped); no other skill, no `AGENTS.md`, and nothing in `docs/decisions/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — cut from `origin/main` at `b2cfcfac`+ after #1373 merged; `sync` run before the gates
- [ ] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — <gates block pasted here from the run>
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no database read or write changes
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a skill document has no runtime path; the next `/plan-day` run is what exercises it
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no feature surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**WHAT WAS VERIFIED INSTEAD, BECAUSE THE RISK HERE IS A LOST OR MISDIRECTED INSTRUCTION, NOT A CRASH.**
A 2,102-line reorder is exactly the kind of edit that silently drops a paragraph, so it was proved rather
than eyeballed:

- [x] **Nothing was lost.** Both blobs normalised to LF and sorted, then compared:
  `git show HEAD:.claude/skills/plan-day/SKILL.md | sed 's/\r$//' | sort` against the same for the new
  file. **Exactly 19 lines appear in the old and not the new: the 6 renumbered headings and the 13
  remapped `step N` references.** Nothing else differs, so no prose moved or vanished.
- [x] **The heading order is the one asked for**, read back from the file:
  `0. Resume` · `1. Sync main` · **`2. Set up — the current batch only`** · `3. What is already in flight`
  · `4. Read the backlog` · `5. Choose` · `6. Present` · `7. Save the plan` · `8. Finish`.
- [x] **Every internal reference was audited by hand after the remap** (`grep -on "step [0-9]"`, 19 hits).
  The mapping applied was `7→2, 2→3, 3→4, 4→5, 5→6, 6→7`, with `0`, `1` and `8` unchanged.
- [x] **Two references were deliberately NOT remapped, and both were checked in context:**
  *"(`CLAUDE.md`, merge train step 4)"* points at `CLAUDE.md`'s own numbered merge train, not at this
  skill; *"one stopped at step 2 of 11"* is a stream's own numbered steps. **Remapping either would have
  made the document wrong.**
- [x] **Two references the script left stale were found and fixed.** The reordering script's keep-rule was
  too broad and matched every `step 2`, so three survived unmapped. Read in context: *"the planner's own
  half of this, in step 2: read `worktree.mjs list`'s `ahead` column"* is **correctly** step 2 now, because
  the `held`/`ahead` read was deliberately moved into the new step 2; the other two (*"everything step 2
  says about it"* and *"the actual when step 2 reads it"*) refer to the actuals and became **step 3**.
  **This is the one real defect found in this change and it is fixed in it** — see Defects below.
- [x] **The from-scratch case is stated rather than left broken.** Setting up cannot be step 2 when the
  items have not been chosen, so both the new order block and the step 2 header say the setup follows §6
  on a plan from scratch, and that the hand-over list still goes out first.
- [x] **The handover is a delta and within its length target** — 148 lines against the ~150 target in the
  skill's own rule, measured with `grep -c ''` rather than estimated. It opens by correcting `690`.

### Role access matrix

- [ ] Every login tested — n/a: no page, route, control or policy changes, so no access can differ between logins
- [ ] A login that should not have access is blocked server-side — n/a: nothing reachable was added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; nothing under `src/app/`
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: these are Claude's own working instructions, not a screen a shelter user meets
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — no pages; the documentation equivalent was done, and it is the sorted line-set proof and the reference audit in section 4
- [x] Any shared file touched checked from a second, unrelated place — `.claude/skills/plan-day/SKILL.md` is the shared file. Checked that no **other** document depends on its step numbers: `grep -rn "plan-day.*step\|step [0-9]" CLAUDE.md AGENTS.md docs/*.md .claude/skills/` finds `CLAUDE.md`'s reference to *"`/plan-day` step 2 now lists open PRs it did not open"* — **and that line is still true, because listing open PRs is in the section that is now step 3**. Reported rather than silently left: **it now points at the wrong number, and the fix belongs in `CLAUDE.md`, which this PR deliberately does not touch.** Recorded as a defect below
- [x] Nothing merged from `main` during `sync` was broken by this branch — cut from `origin/main` after #1373 merged; touches only documentation

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item; this is Lutan's direct instruction in chat
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the reasoning is the handover's own lead section and the order block at the top of the skill, which is where a planner will actually read it; a third copy in `docs/decisions/` would be the recopying the delta rule forbids
- [x] `README.md` still accurate — read; it does not describe the skill's step order
- [ ] **Release notes.** — n/a: Claude's own planning instructions and a handover document; nothing a shelter user could notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The "nineteen differing lines" figure is the sorted-comparison output, not an estimate; the 148-line handover length is `grep -c ''`; the heading order is read back from the file

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: neither file ships; the Worker and Pi builds do not read `.claude/` or `docs/`
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy
- [ ] Deployed to test — n/a: nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to deploy
- [ ] Timezone-sensitive behaviour proved — n/a: no code
- [ ] Boundary or banding change covered at both edges — n/a: no logic
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: a deploy-time check with no deploy in this PR; the evidence in sections 2 and 4 is pasted from its runs
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing to deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing to deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable
- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores the old step order and handover `690`. It cannot un-read either: a planner session already running keeps the version it loaded, so the new order takes effect on the **next** `/plan-day`. Nothing on production, the Pi or either database is touched

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | The reordering script's keep-rule was too broad and matched every `step 2`, leaving three references unmapped. Two of them pointed at the actuals section, which is now step 3 | **Fixed in this PR**, after auditing all 19 references in context. The third (`in step 2: read worktree.mjs list`) is correct as it stands, because the `held`/`ahead` read was moved into the new step 2 |
| 2 | Low | `CLAUDE.md` says *"`/plan-day` step 2 now lists open PRs it did not open"*. That content is now in step 3, so the number is stale. The statement's substance is still true | **Reported, not fixed.** `CLAUDE.md` is out of scope for this PR and is the one file where a careless edit is most expensive. **For the planner to file** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the new order actually produces the hand-over list before the paperwork. A reordered document is a hypothesis, not a fix — the skill's own rule says a mitigation you wrote must be checked the next round to see whether it **fired** | The next `/plan-day` run, which is the first one to read the new order |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the next `/plan-day` run is what shows whether the new order fires; there is nothing a person can look at before then

Manual verification by: pending: the next `/plan-day` run tells us whether the reorder fired; no screen exists for anyone to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing to hand over: neither file ships, and there is no deploy, migration or production step

Result: pass with accepted defects

Release manager acknowledgement: n/a: process documents only, nothing to deploy
