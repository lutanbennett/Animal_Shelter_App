# Feature test plan — plan-day-batches

## Header

| | |
|---|---|
| Feature | `/plan-day` plans nine backlog items as three sequential batches of three |
| Backlog item | `docs/backlog.md` → none — asked for directly by Lutan in chat, 2026-09-24 |
| Branch / worktree | `claude/plan-day-batches` @ `C:\Development\Animal_Shelter_plan-day-batches` |
| Dev server | not used — no `src/` change |
| PR | #90 |
| Tested by / date | Claude (Daily Planner session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `8de011f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/plan-day` now orders nine backlog items into three sequential batches of three, saves the plan to a gitignored `.plan-day.md`, and sets up one batch at a time — matching Lutan's request of 2026-09-24 ("3 sets of 3 backlog items … rather than getting you to do multiple plans per day"). There is no backlog item; the request is quoted in the commit and in `.brief.md`
- [x] Files/areas touched listed: `.claude/skills/plan-day/SKILL.md` (rewritten), `.gitignore` (one rule + comment), `docs/decisions.md` (one appended entry), `docs/test-plans/plan-day-batches.md` (this file). No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified: none. This is a Claude Code skill in `.claude/`, read by Claude and never served to a browser. No shelter user of any role — admin, management, staff, vet, volunteer or signed-out public — can reach it
- [x] Out of scope, written down: the skill is instructions, not code, so nothing enforces it at runtime — a session that ignores the skill still plans however it likes. Not addressed here, and not intended to be. Also out of scope: any change to `worktree.mjs`, to the cap of three live worktrees, or to `/clean-streams`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in #89, `0076_shelter_friends.sql` + `scripts/check-shelter-friends.mjs` + its test plan; no conflict, `docs/decisions.md` merged by union as designed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run **after** the sync. Closing lines exactly as printed:

```
=== gates: build exited 0 after 142s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or reason stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

The skill has no runtime, so "functional" means: were its steps actually
followed end to end, and did they produce a sensible result? They were —
the rewritten skill was used to plan the 2026-09-24 nine-item plan in the
Daily Planner session, before this PR was opened. That run is the evidence
below, and its output is `C:\Development\Animal_Shelter_App\.plan-day.md`.

- [x] Happy path works end to end: steps 1–6 were run against the live repo. Step 1 synced `main` (clean, `backlog` folded in, both level with `origin`); step 2 listed 15 worktrees and identified three in flight (`contacts-archive`, `release-notes-accordion`, `plan-day-batches`) plus nine free leftovers; step 3 read 49 open backlog items; step 4 ordered nine into three batches; step 5 presented three tables and one `AskUserQuestion`; step 6 wrote `.plan-day.md`. Step 7 (set up) was deliberately not run — see the next line
- [x] Step 0's "current batch has not merged" branch exercised, and it is the branch that fired: three streams were mid-build, so the skill's instruction to name them and ask before setting up the next batch was followed. Lutan chose to wait, and no worktrees were created. This is the case the old skill had no answer for
- [x] Rule 2 (disjoint *within* a batch, overlap allowed *across*) changed a real outcome, not a hypothetical one: `admin-on-mobile` and `frequency-options-to-admin` both touch nav. Under the old same-round rule the lower-priority one would have been dropped from the round; under the new rule they went into batches 2 and 3 and both survived
- [x] Rule 4 (schema-first spans adjacent batches) produced the intended split unprompted: **A public view behind enclosure QR codes** was separated into `enclosure-public-view-schema` (batch 2, `0078`) and `enclosure-public-view` (batch 3)
- [x] Rule 5 (dependencies flow forwards) fired once: **Link to the LCA Facebook page** was placed in batch 3 because the Shelter Friends item says to share its URL validator, and Shelter Friends is in batch 2
- [x] Rule 3 (one migration per batch) bound, and surfaced something worth knowing: four candidate items need schema (`updated_at`, stock-on-hand, enclosure public view, colour theme) against three available slots, so migration capacity — not backlog priority — is what kept two of them out. The skill's requirement to say why an item was left out made that visible in the plan rather than silent
- [x] Rule 7 (nine is a target, not a quota) held without padding: nine were found among Claude-buildable unblocked items, and the seven user-driven Deployment items stayed in **Not today** rather than being promoted to reach the number
- [x] Data persists — `.plan-day.md` was written and read back; it records batch statuses (`pending`), the load-bearing orderings and what was left out, which is what a resume needs
- [x] `.plan-day.md` is genuinely ignored: a probe file was created in this worktree and `git status --porcelain` showed only the two intended modifications, never the probe. Probe deleted afterwards
- [ ] Create / edit / delete all exercised — n/a: the skill creates worktrees via `worktree.mjs new` (unchanged by this PR) and deletes nothing; step 7 was not reached in this run
- [x] Empty state renders sensibly: rule 7 tells the skill to plan fewer than nine and say why rather than pad, and step 0 tells it what to do when a plan exists but its batches are all closed (re-plan). Both paths were read; only the first was exercised
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the skill takes no arguments
- [x] Boundary case checked — the awkward one for a resume is "plan exists, current batch partly merged". Step 0 covers it (name the open streams, ask before proceeding) and it is exactly the case that fired in this run, with three of three still open

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | a `.claude/` skill is not served | n/a — not a web surface |
| management | nothing | as above | n/a |
| staff | nothing | as above | n/a |
| vet | nothing | as above | n/a |
| volunteer | nothing | as above | n/a |
| signed out | nothing | as above | n/a |

- [ ] Every role above tested — n/a: the change adds no route, component or API. `.claude/skills/` is read by Claude Code, never by the Next.js app; nothing in `src/` or `worker/` imports it
- [ ] A role that should not have access is blocked server-side — n/a: as above, there is no server surface to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; `src/` untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual documents the shelter app for shelter staff. A Claude planning skill is not something a shelter user does, so it has no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no rendered surface
- [ ] Network clean — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is `/clean-streams`, the other skill, which also reads `worktree.mjs list` output. Read end to end against the rewritten `plan-day`: no contradiction, and `/clean-streams` is now referenced from the leftovers note in `.plan-day.md` rather than duplicated into the skill
- [x] Shared file touched, checked from a second unrelated place **by loading it**: `.gitignore` is the shared file. Loaded by creating a real `.plan-day.md` in the main checkout — `git status` there shows it as `?? .plan-day.md`, untracked, because main's `.gitignore` does not yet carry the rule (main contains the string "plan-day" only inside the comment `# brief (scripts/worktree.mjs, /plan-day)`, which is not a rule). That is the true runtime behaviour on `main` today and it resolves when this PR merges. The existing `.port` / `.brief.md` / `.claude/launch.json` rules still ignore their files in this worktree, confirming the block was extended and not disturbed
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync brought #89 (`0076_shelter_friends.sql`, `check-shelter-friends.mjs`, a test plan). No file overlaps this PR's four except `docs/decisions.md`, which merged by union as designed. Gates re-run green after the merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: there is no backlog item; this came directly from Lutan in chat. No item was invented in order to tick it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-24: why disjointness now applies only within a batch (it reverses a previous instruction, so the reasoning is worth keeping), why worktrees are still created one batch at a time, why the plan is gitignored rather than committed, and why nine is a target rather than a quota
- [x] `README.md` still accurate: it does not describe `/plan-day`'s internals, so nothing there went stale. Checked rather than assumed
- [ ] **Release notes.** — n/a: no shelter user can notice a change to a Claude Code planning skill. This PR touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`, so no `unreleased` line is owed
- [x] Commit messages say why, not just what: the commit leads with the friction (two planning rounds on 2026-09-24), explains which rule changed and why sequencing removes its justification, and records the two orderings that fall out
- [x] **Claims were measured, not reasoned.** The load-bearing claim is that the new rules change outcomes. It is not asserted — the skill was run against the live backlog before this PR was opened and the specific firings are recorded in section 4 (nav pair split across batches, enclosure QR split schema/feature, Facebook link placed after Shelter Friends, four schema items against three slots). The gitignore claim was likewise probed in both directions rather than read: ignored in this worktree, untracked on `main`

## 8. Pre-production gate

Nothing in this PR reaches a deployed build: `.claude/`, `docs/` and
`.gitignore` are not bundled by OpenNext and not served by the Worker.

- [x] Tested SHA recorded in the header (`8de011f`)
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed; no file in this PR enters the Worker bundle
- [ ] Deployed to test — n/a: as above
- [ ] Smoke-tested on `test.lannacare.org` — n/a: as above
- [ ] Timezone-sensitive behaviour proved — n/a: the change contains no date or time logic
- [ ] Boundary or banding change — n/a: no threshold, rounding rule, window, limit or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, including what it does not cover: reverting is `git revert` of this commit — no Worker rollback is involved because nothing here ships to the Worker, and no migration means nothing to unwind in any database. What a revert would **not** undo: any `.plan-day.md` already written in the main checkout, which would go back to showing as untracked. Deleting that file is the whole cleanup

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `.plan-day.md` shows as `?? .plan-day.md` in the main checkout until this PR merges, because the ignore rule ships in this PR while the file is written by the skill that is already in use | accepted — self-resolving on merge, and recorded in section 6 and in `.plan-day.md` itself |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That a **resume** run behaves as intended — the next `/plan-day` after batch 1's streams merge should sync, re-check batch 1 against the backlog, report changes and set up those three worktrees without re-planning. This run only exercised the "current batch not merged, so stop and ask" branch; the set-up-the-next-batch branch has not been run | `/plan-day` in `C:\Development\Animal_Shelter_App`, once `contacts-archive`, `release-notes-accordion` and this PR have merged |
| 2 | That the three-table presentation is actually easier to work from than three separate planning conversations — the change is a workflow change, and only Lutan can say whether it reduced the friction it was meant to reduce | the next planning round |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are outstanding; see the pending line below

Manual verification by: pending: a resume run of `/plan-day` after batch 1 merges, and Lutan's read on whether the three-batch format reduces the planning friction

Result: pass with accepted defects
