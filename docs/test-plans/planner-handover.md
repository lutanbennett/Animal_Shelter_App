# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` edition `384`, and one durable rule promoted into the `/plan-day` skill |
| Backlog item | none — the skill's own step 8 requires a handover at nine or more workstreams since the last one; this round ran ten |
| Branch / worktree | `claude/planner-handover` @ `C:\Development\Animal_Shelter_planner-handover` |
| Dev server | not started — documentation and a skill file only |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | `3c938909` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the skill asked for — replace the handover with edition `384` as a delta, and promote this round's one durable lesson into the skill so it is not rewritten every nine streams
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced, 147 lines) and `.claude/skills/plan-day/SKILL.md` (rule 5 added to step 7's planner-touches-production rules). No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — n/a in the usual sense: no role reads either file in the app. They are read by the planner chat only
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and is NOT in this PR; its batch-3 actuals and its counter were updated in place by the planner session. The `docs/backlog.md` entries this round produced went to the `backlog` branch, not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly before the work started
- [x] `node scripts/gates.mjs` ends with all four at zero. Closing lines as printed:

```
=== gates: build exited 0 after 159s

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

- [x] Happy path works end to end — the document's own purpose is to be read by the next planner chat; both files were re-read after writing and the headings, the delta structure and the "next slug is `393`" line are correct
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

- [x] **Every figure quoted was read, not recalled.** The nine measured streams' token figures came from `get_usage` with `context.session` checked against the id passed on each call; the model and effort came from `get_session`. The band verdicts were checked against each stream's diff and elapsed time before being written
- [x] **The four instrument failures are each traceable to a command that was actually run** — the clinic-login-helpers reading, `check-menu-coverage`'s 118 against its real 30, `role-cards` listing an archived role, and `0269`'s header quoting that reading. All four are recorded on `docs/backlog.md` with their evidence
- [x] **The cron lesson states only what was established.** Both environments' last-run times and both Workers' deploy times were read from production, from the dev database and from `wrangler deployments list`; the remaining hypothesis is labelled as a hypothesis in both the handover and the backlog item
- [x] **No count, PR number, migration number or release state is carried forward.** The handover's own opening block forbids it, and the document was checked against that rule after writing
- [x] **The predecessor's warnings are each reported as fired, held or untested**, with the untested one explicitly carried rather than dropped
- [x] **Length measured, not estimated** — `wc -l` reports 147, inside the skill's ~150 target, so no trimming pass was spent

## 7. Release notes

- [ ] A shelter user would notice this change — `n/a: nobody using the shelter app can see a planner handover or a skill file; neither is served by the app, and no behaviour changes`

## 8. Sign-off

Automated checks by: Claude (planner session)  Date: 2026-10-26

Manual verification by: n/a: there is nothing for a person to look at — no UI, no route, no data. The content's accuracy is covered by section 6, which is signed above because every item there was a command that was run rather than a screen that was viewed

Result: pass

Release manager acknowledgement: n/a: nothing in this PR deploys
