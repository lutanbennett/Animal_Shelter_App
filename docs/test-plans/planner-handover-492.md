# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover `492`, plus two promotions into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is produced by the `plan-day` skill's step 8 at nine workstreams, not by a backlog item |
| Branch / worktree | `claude/planner-handover-492` @ `C:\Development\Animal_Shelter_planner-handover-492` |
| Dev server | not started — `n/a: documentation only, nothing to serve` |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (Daily Planner) / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | 1961ed2e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `492` (a delta against `483`) and promotes two durable facts into `.claude/skills/plan-day/SKILL.md`
- [x] Files/areas touched listed — exactly two: `docs/planner-handover.md` and `.claude/skills/plan-day/SKILL.md`. No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts
- [x] Roles affected identified — **none.** Neither file is read by the application at runtime; both are read by Claude sessions. A handover outranks nothing and says so in its own opening lines
- [x] Anything explicitly out of scope written down — the documentation-stream band reading is deliberately **not** promoted (one reading is a reading, not a rate); it is carried as an instruction in `.plan-day.md` instead. `scripts/check-backlog-sections.mjs` is deliberately untouched, per Lutan's 2026-10-29 choice

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` — closing lines pasted below exactly as printed, unedited:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, and no table is touched
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written or reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two documentation files, no runtime behaviour
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no input path
- [ ] Boundary cases checked — n/a: no logic. The one measurable property is the handover's length, and `wc -l docs/planner-handover.md` reads **143**, inside the skill's ~150 target

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: not an app surface |
| management | n/a | n/a | n/a: not an app surface |
| staff | n/a | n/a | n/a: role retired by `0173` |
| doctor | n/a | n/a | n/a: not an app surface |
| volunteer | n/a | n/a | n/a: not an app surface |
| signed out | n/a | n/a | n/a: not an app surface |

- [ ] Every role above tested — n/a: neither file is reachable from the app; there is no URL to request
- [ ] A role that should not have access is blocked server-side — n/a: no route exists. Both files are already public in this public repository

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; `src/app/NavLinks.tsx` untouched
- [ ] Manual updated — n/a: the manual is for shelter staff; this is a rule read by Claude sessions
- [ ] Translatable strings — n/a: no user-facing strings added
- [ ] Mobile viewport — n/a: no rendered page
- [ ] Browser console clean — n/a: nothing is loaded in a browser
- [ ] Network clean — n/a: no requests are made

## 6. Regression

- [x] The pages nearest the change still work — `build` compiled every route, exit 0, as pasted in section 2; no page imports either file
- [x] Any shared file touched checked from a second place — **the skill file is the shared one, and it was verified by RE-READING it, which is the right check here**: both promotions were applied by a guarded script that exits non-zero on a missing or non-unique anchor, and the inserted text was read back in place. The template's warning is that reading a file you did *not* edit proves nothing; this is a file that *was* edited, and its only consumer is a reader
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: the handover has no backlog item; it is produced by the skill at nine workstreams
- [ ] Non-obvious design choices added to `docs/decisions/` — n/a: the handover IS the record of this round's reasoning, and the two skill promotions are quoted in it and in the commit message. A decision file would be a third copy of one argument
- [x] `README.md` still accurate — it does not describe the handover or the skill's internals; re-read, nothing to change
- [ ] Release notes — n/a: a rule and a handover read only by Claude sessions; no shelter user can see either file
- [x] Commit messages say why, not just what — the commit states what `483`'s warning did, what the round's subject is, both promotions with their reasons, and the one reading deliberately not promoted
- [x] Claims in commit messages were measured, not reasoned — every claim in the handover is traceable: the band figures and verdicts come from the three `stream-usage:` PR comments (#1094, #1095, #1096) read this morning; *"five of six inside their bands"* is those six figures against the bands recorded in `.plan-day.md` before they ran; the empty production fix list is one command's output, quoted with its clock; and the `can_see_drive_file` table list is from the migration file itself

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `1961ed2e`, the tip of this branch
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic in either file
- [ ] Boundary or banding change covers both edges — n/a: no boundary, threshold or band in the code. (The band *numbers* this edition discusses are planning guidance read by a human, not executed)
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the `gates:` block in section 2 was written into this file by a script that reads `gates.mjs`'s own output and **refuses to write the plan at all** if no closing `gates:` line is present or any gate is non-zero, so it cannot be hand-tidied or invented
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: no secret or environment variable is added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit restores edition `483` and the previous skill text, and that is the whole of it: **neither file is deployed, built into the Worker bundle, or served to anyone**, so no Pi rebuild or `wrangler rollback` is involved and no migration needs reverting. What a revert would **not** undo: any session that has already read `492` or the amended skill in this conversation

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | trivial | The first attempt at the brief-writing script for batch 9 failed to parse: a nested backtick span inside a template literal was not escaped, so node read `scheduled` as an identifier. Caught by the parse error before any file was written | fixed — escaped and re-run; no partial file was produced. Recorded because it is the same class as the trap the skill already documents about `node -e` and Windows paths |
| 2 | low | **The first `gates.mjs` run in this worktree REFUSED and ran nothing** — `gates: node_modules/.bin has no next, tsc, eslint — nothing was run.` The planner started it while `worktree.mjs new` was still finishing `npm ci`, so the binaries were not yet linked. **This is the exact trap section 2 of the template warns about, and `gates.mjs` exists partly to catch it** | fixed — waited for `worktree.mjs new` to exit, confirmed `node_modules/.bin` held `next`, `tsc` and `eslint`, and re-ran; the pasted result is the second run. **Worth recording rather than quietly re-running: the refusal is the guard working, and a session that read `tail`'s exit status instead of the script's own would have recorded this as a pass.** The planner's error was starting the gates on a worktree it had not confirmed was complete |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. Neither file has a surface a person needs to look at, and the one measurable property (length, 143 lines) is checked in section 4 | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing being signed for

Manual verification by: n/a: documentation only — no rendered surface, no behaviour and no wording a shelter user reads

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in the usual sense: a handover document ships with no release gate, and `CLAUDE.md` has it merge on green CI without an approval round-trip. Recorded here so the release manager is not waiting on it

Result: pass

Release manager acknowledgement: n/a: a handover document is not part of a release
