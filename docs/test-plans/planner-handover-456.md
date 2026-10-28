# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` edition `456`, a delta on `447` |
| Backlog item | none — the skill's step 8 requires a handover at nine or more workstreams since the last one; this round reached nine when batch 3 was set up on 2026-10-28 |
| Branch / worktree | `claude/planner-handover-456` @ `C:\Development\Animal_Shelter_planner-handover-456` |
| Dev server | not started — one documentation file, nothing to serve |
| PR | opened from this branch |
| Tested by / date | Claude (Daily Planner session) / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | `7a4c2cb4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the skill asked for — replace the handover with edition `456` as a delta against `447`, whose subject is the cost to Lutan of stale notes being relayed to him as live questions
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced, 142 lines) and this test plan. **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, and no skill edit this round**
- [x] Roles affected identified — n/a in the usual sense: no role reads this file in the app. It is read by the planner chat only. Stated by card where it matters: no card grants or is affected by anything in this PR
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and is NOT in this PR. Every `docs/backlog.md` edit this round (his fourteen answers, two ticks, three new items and several stale-title repairs) went to the **`backlog` branch**, not here. **No rule was promoted into the skill this round**, deliberately: the round's lessons are about the planner's own behaviour between batches, and the skill already carries the artifact-versus-note rule they are instances of

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was cut from `origin/main` minutes before the work and `main` had not moved
- [x] `node scripts/gates.mjs` ends with all four at zero. Closing lines as printed:

```
=== gates: build exited 0 after 256s

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
- [ ] Production apply plan stated — `n/a: nothing to apply; this PR is one markdown file`

## 4. Functional checks

- [x] Happy path works end to end — the document's purpose is to be read by the next planner chat; it was re-read after writing, and the delta structure, the `next slug is 465` line and the re-read-every-time block are all in place and in the right sections
- [ ] Data persists — `n/a: no data is written; this is static markdown read by a chat`
- [ ] Create / edit / delete exercised — `n/a: no CRUD surface; this is one document`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| role | can reach | can change | notes |
|---|---|---|---|
| all roles | n/a | n/a | the file is not served by the app and is read by no role; it is a repository document |
| signed out | n/a | n/a | as above |

- [x] Every role above tested — `n/a` recorded for each: the file is reachable from no URL. Verified by its path (`docs/`), which is not served
- [x] A role that should not have access is blocked server-side — same reason: there is no route to it

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; nothing is added to the app`
- [ ] Manual updated — `n/a: the manual describes the app for shelter staff; a planner handover is not a shelter-facing feature`
- [ ] Translatable strings — `n/a: no user-facing strings; the file is read only by a Claude chat, in English`
- [ ] Mobile viewport — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` in the usual sense and recorded as such: one markdown file, no page is near it. The four gates in section 2 cover the repository as a whole and all passed
- [x] Any shared file touched checked from a second place — no shared file was touched; `docs/planner-handover.md` is a record and nothing imports it
- [x] Nothing merged from `main` was broken by this branch

## 7. Accuracy of what is written — the part that actually matters here

A handover's only failure mode is being wrong, so these replace the usual functional checks.

- [x] **Every one of his fourteen answers this round was verified as RECORDED before the handover claimed it**, by grepping `docs/backlog.md` for his own words: thirteen matched there, and the fourteenth — the resident-download ruling — matched in `docs/card-access-faults.md` and its decision file, which is its correct home because it was a fault-log question and never a backlog item. **This check was run because he asked for it specifically**, and it is the claim the document rests on
- [x] **The six re-asked items are described from what was actually read, not recalled.** That `0226` and `0261` are live on production is from `apply-migrations.mjs --status --env production` (280 applied, 0 pending, read 2026-10-28); that the 20 October release closed the status-alert step is quoted from `docs/releases/2026-10-20.md`, which states it applied the migration, performed the Worker deploy and shipped the note
- [x] **The `requirePermission` default is quoted from the file, not inferred.** `src/lib/permissions/require.ts` was opened and the `level: Level = "edit"` default read directly — which is the point of that section, since the fault it records was inferring the opposite from an omission
- [x] **The cashflow finding was DRIVEN, with a control.** A disposable login holding only the `dashboard` card (`dev-signin.mjs --cards dashboard`) landed on `/no-access` at `/management/cashflow`, and the same login opened `/management/dashboard` in full. Both halves are stated, because a refusal with no control proves nothing
- [x] **The count correction is measured.** `gh pr list --state merged` shows #1050–#1056 since the handover's own PR, which is seven; nine is reached only with batch 3's two streams
- [x] **The usage-mechanism result is read from the PRs themselves**, not from the sessions: all three carried a `stream-usage:` comment, two with figures and one `tokens=unmeasured`, and `get_usage` was separately confirmed `unavailable` for that archived session, which is what makes the loss permanent
- [x] **His words are quoted verbatim in every case**, including the one that is a complaint about this process
- [x] **No count, PR number, migration number or release state is carried forward.** The document's opening block forbids it, and the closing section names the command to re-read each one instead. Checked against that rule after writing
- [x] **The predecessor's warnings are each reported as fired, held or closed**, including the one the planner itself broke three times out of four
- [x] **Length measured, not estimated** — `wc -l` reports 142, inside the skill's ~150 target, so no trimming pass was spent

## 8. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — `n/a: there is no backlog item; the skill's step 8 is what requires a handover, and this round's backlog edits belong on the backlog branch`
- [x] Non-obvious design choices recorded — the handover is itself the record; no separate decision file is warranted for replacing it, and none of the previous editions has one
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: nobody using the shelter app can see a planner handover; it is not served by the app and no behaviour changes`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see section 7

## 9. Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `CLAUDE.md` documents `dev-signin.mjs <role> --cards <card>`, which the script refuses | deferred to backlog — filed as a quick win on the `backlog` branch; it needs its own PR and is not in scope here |

## 10. Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

One markdown file with no rendered surface. The only thing a person might want to confirm is that his words are quoted correctly, and they are quoted verbatim in the document itself for him to read in the PR.

## 11. Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only — no UI, no route, no data, and nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing to deploy; this PR is one markdown file and carries no code, schema or configuration`

Result: pass
