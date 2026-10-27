# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` edition `402`, and three durable rules promoted into the `/plan-day` skill |
| Backlog item | none — the skill's step 8 requires a handover at nine or more workstreams since the last one; this was the second round of nine on 2026-10-27 |
| Branch / worktree | `claude/planner-handover-402` @ `C:\Development\Animal_Shelter_planner-handover-402` |
| Dev server | not started — documentation and a skill file only |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | `16c9fdb6` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the skill asked for — replace the handover with edition `402` as a delta against `393`, and promote this round's three durable lessons into the skill so no future handover carries them
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced, 121 lines) and `.claude/skills/plan-day/SKILL.md` (three insertions: a fourth spoilt-figure case beside the existing three; the split walkthrough rate with its six measured passes, replacing one rate with two; and "never upgrade an item's open question into a finding" in step 7 beside the step-zero block). No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — n/a in the usual sense: no role reads either file in the app. They are read by the planner chat only
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and is NOT in this PR. The `docs/backlog.md` edits this round produced (the manual tick, the doctors tick, buttons slice-2 progress with its rescoped third slice, the new policy-triage item, and three corrections of stale item prose) all went to the `backlog` branch, not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly before the work started
- [x] `node scripts/gates.mjs` ends with all four at zero. Closing lines as printed:

```
=== gates: build exited 0 after 142s

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

- [x] Happy path works end to end — the document's purpose is to be read by the next planner chat; both files were re-read after writing, and the delta structure, the "next slug is `411`" line and all three skill insertions are in place and in the right sections
- [ ] Data persists — `n/a: no data is written; both files are static markdown read by a chat`
- [ ] Create / edit / delete exercised — `n/a: no CRUD surface; this is two documents`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| role | can reach | can change | notes |
|---|---|---|---|
| all roles | n/a | n/a | neither file is served by the app or read by any role; they are repository documents |
| signed out | n/a | n/a | as above |

- [x] Every role above tested — `n/a` recorded for each: neither file is reachable from the app at any URL. Verified by the files' paths (`docs/`, `.claude/skills/`), neither of which is served
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

- [x] **Every figure quoted was read, not recalled.** The nine measured streams' token figures came from `get_usage` with `context.session` checked against the id passed on each of the nine calls; model and effort came from `get_session`. Every band verdict was checked against that stream's PR diff before being banked, and the two rescoped streams are marked **not readings** rather than counted
- [x] **The per-step arithmetic in the skill is arithmetic, not estimate.** Each of the six passes' floors was taken from that stream's own non-`Messages` categories; the work-above-floor and per-step columns are those subtractions. The 17% overrun on #989 and its 11,223 a step are the same sum
- [x] **The round's central claim was verified in the code AND the live database, not inferred.** That the doctors policies exist is from `0147_perm_convert_people.sql:222/:225` (`using ((select has_permission('clinics.doctors')))`); that no migration drops them is from a repo-wide grep; that they are live on **production** is from running the stream's own `table-policy-commands` check with `--env production` — `doctors` was absent, and that check lists only tables where no live policy can answer
- [x] **The production migration gap was measured, not carried.** `apply-migrations.mjs --status --env production` reports **four** pending (`0270`–`0273`) against 274 files on `origin/main`, read 2026-10-27 — the number the handover's "next round" section states
- [x] **The three brief failures are described from what was actually written**, including the one where the item was correct and the brief degraded it; that item's own wording (*"the ordinary signed-in client"*, *"NOT ESTABLISHED ON THE LIVE DATABASE"*) is quoted rather than paraphrased
- [x] **No count, PR number, migration number or release state is carried forward.** The handover's opening block forbids it, and the document was checked against that rule after writing
- [x] **The predecessor's warnings are each reported as fired, held or now closed**, with the one that finally got its test (`src/lib/releases.ts`) marked as no longer a hypothesis
- [x] **The three promoted rules are in the skill and only pointed at from the handover.** `SKILL.md` was read back after the edit and its **CRLF line endings were preserved** — the skill's own documented trap
- [x] **Length measured, not estimated** — `wc -l` reports 121, inside the skill's ~150 target, so no trimming pass was spent

## 7. Release notes

- [ ] A shelter user would notice this change — `n/a: nobody using the shelter app can see a planner handover or a skill file; neither is served by the app, and no behaviour changes`

## 8. Sign-off

Automated checks by: Claude (planner session)  Date: 2026-10-27

Manual verification by: n/a: there is nothing for a person to look at — no UI, no route, no data. The content's accuracy is covered by section 6, which is signed above because every item there was a command that was run or a file that was read, not a screen that was viewed

Result: pass

Release manager acknowledgement: n/a: nothing in this PR deploys
