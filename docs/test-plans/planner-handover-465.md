# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` edition `465`, a delta on `456`, plus the decision file it promises |
| Backlog item | none — the skill's step 8 requires a handover at nine or more workstreams since the last one; this round reached nine when batch 3 was set up on 2026-10-29 |
| Branch / worktree | `claude/planner-handover-465` @ `C:\Development\Animal_Shelter_planner-handover-465` |
| Dev server | not started — two documentation files, nothing to serve |
| PR | opened from this branch |
| Tested by / date | Claude (Daily Planner session) / 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | `21acc4be` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the skill asked for — replace the handover with edition `465` as a delta against `456`, whose subject is that every cost reaching Lutan this round originated with the planner rather than with a stream or a stale item
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced, 145 lines), `docs/decisions/2026-10-29-pro-only-features-are-dropped.md` (new) and this test plan. **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, and no skill edit this round**
- [x] Roles affected identified — n/a in the usual sense: no role reads either file in the app, and they are read by the planner chat only. Stated by card where it matters: **no card grants, is affected by, or is mentioned as granting anything in this PR**
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and is NOT in this PR. Every `docs/backlog.md` edit this round (the two Supabase rulings, the Cloudflare findings, the new free-steps item, the photo-check gap and the Card review 2 title correction) went to the **`backlog` branch**, not here. **No rule was promoted into the skill this round**, deliberately: the two band corrections are flagged in the handover as skill edits owed, and changing a rate the skill prescribes is its own change with its own reasoning, not a line slipped into a handover PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — printed `Already up to date.`; the branch was cut from `origin/main` minutes before the work and `main` had not moved
- [x] `node scripts/gates.mjs` ends with all four at zero. Closing lines as printed:

```
=== gates: build exited 0 after 304s

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
- [ ] Production apply plan stated — `n/a: nothing to apply; this PR is two markdown files`

## 4. Functional checks

- [x] Happy path works end to end — both documents' purpose is to be read, the handover by the next planner chat and the decision file by anyone grepping `docs/decisions/`. Both were re-read after writing: the delta structure, the `next slug is 474` line, the re-read-every-time block and the cross-reference from the handover to the decision file are all in place and in the right sections
- [ ] Data persists — `n/a: no data is written; these are static markdown files read by a chat`
- [ ] Create / edit / delete exercised — `n/a: no CRUD surface`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| role | can reach | can change | notes |
|---|---|---|---|
| all roles | n/a | n/a | neither file is served by the app and neither is read by any role; both are repository documents |
| signed out | n/a | n/a | as above |

- [x] Every role above tested — `n/a` recorded for each: both files are reachable from no URL. Verified by their paths (`docs/`), which are not served
- [x] A role that should not have access is blocked server-side — same reason: there is no route to either file

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; nothing is added to the app`
- [ ] Manual updated — `n/a: the manual describes the app for shelter staff; a planner handover and a cost-rule decision are not shelter-facing features`
- [ ] Translatable strings — `n/a: no user-facing strings; both files are read only by a Claude chat, in English`
- [ ] Mobile viewport — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` in the usual sense and recorded as such: two markdown files, no page is near them. The four gates in section 2 cover the repository as a whole and all passed
- [x] Any shared file touched checked from a second place — no shared file was touched; `docs/planner-handover.md` is a record and nothing imports it, and the decision file is a new path nothing reads programmatically
- [x] Nothing merged from `main` was broken by this branch

## 7. Accuracy of what is written — the part that actually matters here

A handover's only failure mode is being wrong, so these replace the usual functional checks.

- [x] **The subject's central claim was verified against `456` itself, not recalled.** `456` is in git on this branch's parent: its closing section lists the 60-day Supabase session timeout as being with Lutan, and two paragraphs above it states that leaked-password protection *"is NOT on that list and must never return to it"*. Both passages were read in the file before the handover described the contradiction
- [x] **The 2026-10-07 Pro-plan finding is quoted as it was recorded**, including the `402 User sessions can only be configured on Pro Plans and up` response and that it was returned by both projects. His 2026-10-29 sentence is verbatim from his own message in this session
- [x] **Every backlog edit the handover and decision file rely on was confirmed present on `origin/backlog` after a peer session reworked the file mid-round.** Checked with `git grep -c <phrase> origin/backlog -- docs/backlog.md` for six distinct phrases (the Pro-plan ruling, the `SUPERSEDED 2026-10-29` marker, the rate-limiting step, leaked-credentials detection, the after-the-domain sequencing and the per-card photo gap) — all present. **The peer session's own report that its collapse preserved them was not taken on trust**, which is the practice the handover records under *what went right*
- [x] **The stream count is read from the PR list, not from the counter.** `gh pr list --state merged` shows #1060–#1065 since the handover's own PR #1057 merged, which is six; nine is the counter's at-setup figure including batch 3's three live streams, and the handover says exactly that rather than claiming nine merged. #1058 and #1059, which merged after #1057 but belong to the previous plan's batch 3, are explicitly **not** double-counted
- [x] **Both band figures are quoted from the PR comments that carried them**, and both were already checked against the artifacts when the actuals were captured: #1064 at 221,020 inside a 200–245k band, #1063 at 155,960 against 215–265k, with six of its eight harnesses retired rather than restated as the decision file for that PR states
- [x] **The usage-mechanism count is from the PRs themselves** — a `stream-usage:` comment on each of #1060–#1065, six of six this round, and eight of eight counting #1058 and #1059
- [x] **The Cloudflare correction is reported as a correction, in his favour, and from what was on screen** — the managed ruleset reads *"Always active"* in all three sections of Security → Settings, and what is paid is customising it. The one unknown (whether leaked-credentials detection can read a Next.js server-action body) is recorded as unknown rather than guessed
- [x] **The two-independent-layers claim about the Pi origin is read from the repo**, not inferred: `src/proxy.ts` refuses a request that did not arrive through the Worker, independently of the Cloudflare custom rule
- [x] **His words are quoted verbatim in every case**, including the report of the download problem
- [x] **No count, PR number, migration number or release state is carried forward.** The document's opening block forbids it, and the closing section names the command to re-read each one instead. Checked against that rule after writing
- [x] **The predecessor's warnings are each reported as fired, held or closed**, including the one `456` itself broke
- [x] **Length measured, not estimated** — `wc -l` reports 145, inside the skill's ~150 target, so no trimming pass was spent

## 8. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — `n/a: there is no backlog item; the skill's step 8 is what requires a handover, and this round's backlog edits belong on the backlog branch`
- [x] Non-obvious design choices recorded — `docs/decisions/2026-10-29-pro-only-features-are-dropped.md` records the ruling and, more importantly, **why it needed a decision file rather than a backlog note**. That is the one non-obvious choice in this PR, and it is the handover's own subject
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: nobody using the shelter app can see a planner handover or a decision file; neither is served by the app and no behaviour changes`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see section 7

## 9. Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | The skill's sizing table still prescribes the reconciliation rate (`~11k/step`) for a card re-pass, which has now been measured wrong twice | recorded in the handover as a skill edit owed; **deliberately not made here**, because changing a prescribed rate needs its own change and its own reasoning rather than a line in a handover PR |
| 2 | low | A gap recorded only inside a decision file's *Found, not fixed* section is invisible to the backlog and cannot be ticked | fixed outside this PR — the per-card photo-table check is now its own item on the `backlog` branch; the handover records the general rule |

## 10. Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

Two markdown files with no rendered surface. The only thing a person might want to confirm is that his words are quoted correctly, and they are quoted verbatim in both documents for him to read in the PR.

## 11. Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only — no UI, no route, no data, and nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing to deploy; this PR is two markdown files and carries no code, schema or configuration`

Result: pass
