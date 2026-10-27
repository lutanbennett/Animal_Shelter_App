# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` edition `393`, and three durable rules promoted into the `/plan-day` skill |
| Backlog item | none — the skill's own step 8 requires a handover at nine or more workstreams since the last one; this round ran exactly nine |
| Branch / worktree | `claude/planner-handover-393` @ `C:\Development\Animal_Shelter_planner-handover-393` |
| Dev server | not started — documentation and a skill file only |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | `37c155e7` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the skill asked for — replace the handover with edition `393` as a delta, and promote this round's three durable lessons into the skill so no future handover carries them
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced, 145 lines) and `.claude/skills/plan-day/SKILL.md` (three insertions: the prior-pass expiry rule beside the walkthrough rate, the "band the RED harnesses" clause on the harness-triage band row, and the "do not band a proof the stream cannot run" rule above the token estimates). No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — n/a in the usual sense: no role reads either file in the app. They are read by the planner chat only
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and is NOT in this PR; its batch-3 setup, its nine-stream counter and its six measured actuals were written in place by the planner session. The `docs/backlog.md` edits this round produced (the rejoined split item, two phantom ticks, four recorded answers, the staff dev-vs-production correction, the harness red-count restatement and the 9-of-14 card progress) all went to the `backlog` branch, not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly before the work started
- [x] `node scripts/gates.mjs` ends with all four at zero. Closing lines as printed:

```
=== gates: build exited 0 after 130s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-test-plan.mjs` run and clean before pushing
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `--status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to dev and recorded — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly — `n/a: no migration in this PR`
- [ ] Constraints and defaults exercised against real rows — `n/a: no migration in this PR`
- [ ] Down-migration written, or why not — `n/a: no migration in this PR`
- [ ] Production apply plan stated — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — the document's purpose is to be read by the next planner chat; both files were re-read after writing, and the headings, the delta structure, the "next slug is `402`" line and the three skill insertions are each in place and in the right section
- [ ] Data persists — `n/a: no data is written by this change; both files are static markdown read by a chat`
- [ ] Create / edit / delete exercised — `n/a: no CRUD surface; this is two documents`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| role | can reach | can change | notes |
|---|---|---|---|
| all roles | n/a | n/a | neither file is served by the app or read by any role; they are repository documents |
| signed out | n/a | n/a | as above |

- [x] Every role above tested — `n/a` recorded for each: neither file is reachable from the app at any URL, so there is nothing for a role to reach. Verified by the files' paths (`docs/`, `.claude/skills/`), neither of which is served
- [x] A role that should not have access is blocked server-side — same reason: there is no route to either file

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; nothing is added to the app`
- [ ] Manual updated — `n/a: the manual describes the app for shelter staff; a planner handover is not a shelter-facing feature`
- [ ] Translatable strings — `n/a: no user-facing strings; both files are read only by a Claude chat, in English`
- [ ] Mobile viewport — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Accuracy of what is written — the part that actually matters here

A handover's only failure mode is being wrong, so these replace the usual functional checks.

- [x] **Every figure quoted was read, not recalled.** The six measured streams' token figures came from `get_usage` with `context.session` checked against the id passed on each of the six calls; model and effort came from `get_session` for each. Every band verdict was checked against that stream's PR diff and elapsed time before being written
- [x] **The round's central claim was verified against the code, not inferred.** That `0265` narrowed three cards is quoted from `0265_card_review_1_reads.sql:118-126` (`delete … where activity = 'resident.record'`, then `insert … 'resident.who_and_where', 1`); that the app half moved the nav is from #965's own file list (`NavLinks.tsx`, `NavPane.tsx`, `routes.ts`, `management/purchasing/page.tsx`); the ambiguous card was settled by commit times, `e4946259` at 00:09:07 against `0af6fa5c` at 16:16:42
- [x] **The production claims carry their database and their clock.** `role-cards` listing six roles was read on production (`dbkodyyxxhtygxcxmfcu`) at 09:4x on 2026-10-27; the pending migration was read from `apply-migrations.mjs --status --env production`. The handover states the dev-versus-production split rather than saying "deleted"
- [x] **The `gh`-not-the-session-list warning is reported from what actually happened** — `list_sessions` reported PR #982 as `OPEN` while `gh pr view 982` reported `MERGED`, which is why that warning is marked fired rather than held
- [x] **No count, PR number, migration number or release state is carried forward.** The handover's own opening block forbids it, and the document was checked against that rule after writing
- [x] **The predecessor's warnings are each reported as fired, held or untested**, with the untested one (`src/lib/releases.ts`) explicitly carried into a fourth round rather than dropped or promoted
- [x] **The three promoted rules are in the skill and not duplicated in the handover** — the handover points at them in one clause each. `SKILL.md` was read back after the edit and its CRLF line endings were preserved (the skill's own trap)
- [x] **Length measured, not estimated** — `wc -l` reports 145, inside the skill's ~150 target, so no trimming pass was spent

## 7. Release notes

- [ ] A shelter user would notice this change — `n/a: nobody using the shelter app can see a planner handover or a skill file; neither is served by the app, and no behaviour changes`

## 8. Sign-off

Automated checks by: Claude (planner session)  Date: 2026-10-27

Manual verification by: n/a: there is nothing for a person to look at — no UI, no route, no data. The content's accuracy is covered by section 6, which is signed above because every item there was a command that was run or a file that was read, not a screen that was viewed

Result: pass

Release manager acknowledgement: n/a: nothing in this PR deploys
