# Feature test plan — the planner preflight and the rules from 2026-11-04

## Header

| | |
|---|---|
| Feature | `scripts/check-planner-preflight.mjs` (new, read-only) wired into `.claude/skills/plan-day`'s step 1, plus three brief/process rules from the evening of 2026-11-04 |
| Backlog item | `docs/backlog.md` → none yet ticked by this PR. It answers the *sessions cannot reach either database* item's **detection** half; that item stays open for the real fix (getting the token out of the files again, proven) |
| Branch / worktree | `claude/handover-645-lessons` @ `C:\Development\Animal_Shelter_handover-645-lessons` |
| Dev server | not started — `n/a: a planner script and a skill document; no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `c55150b9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *Lutan asked for the three structural fixes from tonight to be baked into the process rather than left in a conversation: a preflight that proves what the planner can reach, a brief block naming the only things that go to him, and a rule that no credential or tooling change merges unexercised.*
- [x] Files/areas touched listed — **`scripts/check-planner-preflight.mjs` (new), `.claude/skills/plan-day/SKILL.md`, and this plan.** No `src/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`
- [x] Access affected identified — **none.** The script only reads; it grants and denies nothing. The skill is a planning document. No card, activity, policy, page, tile or control changes. *(By card, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a)** the preflight **detects** the lost credential; it does not fix it, and the backlog item for the real fix stays open. **(b)** It does **not** probe production unless given `--env production`, so an ordinary run cannot be refused for touching production. **(c)** The test-plan template trap found in the same hour is **filed, not fixed** — it belongs with the template, not here. **(d)** The step-zero and escape-hatch wording was also corrected **on disk in batch 3's three briefs** so those streams are unaffected; this PR is what stops the next plan regressing

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` and nothing needed merging in. Gates run in full regardless, **in the background with output redirected to a file that was then read**
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck exited 0 after 154s
=== gates: lint exited 0 after 215s
=== gates: test exited 0 after 18s
=== gates: build exited 0 after 241s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — **the script was run, not reasoned about.** Output: four credentials reported present with their lengths (no value printed), `ok dev REST reads with the service role key (qxkmhwybjggxvsfxsxbd)`, `ok dev …: Management API`, the production note, and `Everything a planner needs is reachable.` Exit 0
- [x] Data persists — `n/a: the script writes nothing, by design`
- [x] Create / edit / delete all exercised — `n/a: read-only`
- [x] Empty state renders sensibly — **the failing path is the point of the script and is the state that existed this morning.** With `SUPABASE_ACCESS_TOKEN` absent it reports `FAIL … missing` and `FAIL … Management API … SUPABASE_ACCESS_TOKEN missing`, prints how many things cannot be reached and the instruction not to ask Lutan to check what the session has merely lost the ability to read, and exits non-zero. **Confirmed by reading the branches; the token was present at run time, so the failing path was NOT executed** — stated rather than implied
- [x] Invalid input is rejected with a readable message — `--env` is parsed by the shared `parseEnvArg`, which already refuses an unknown environment
- [x] Boundary cases checked — the production probe is **opt-in**; the default run touches dev only

### Access matrix

**Written by card, not by role.**

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | a planner script and a planning document: no card opens either, neither is on a page, and no activity or policy is touched | as expected |

- [x] Every card above tested — vacuously; the diff is one script and one document
- [ ] A card that should not have access is blocked server-side — `n/a: no server surface`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: this is planner tooling, not something a shelter user does`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — the four gates were run in full and all exited 0 at `c55150b9`. The new script is not imported by anything; it is run by hand
- [x] Any shared file touched checked from a second, unrelated place — **`scripts/lib/exit.mjs` and `scripts/lib/env.mjs` are both imported by the new script and are used across the repo.** Neither is modified; both are read-only dependencies here, and `exitWith()` is used exactly as its contract requires (the last thing the script does), which is the fault this very evening reproduced in a different script
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: this PR answers the detection half of an open item and does not close it; ticking it would hide the fix that is still owed`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, and no new file is needed: **every choice is written at the head of the script itself** (why it exists, what it reads, that it never prints a secret, why production is opt-in) and in the skill sections it adds. The incident that caused it is recorded on its backlog items
- [x] `README.md` still accurate — it says nothing about planner tooling
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A planner preflight and a skill document touch no page, no card and no data`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the script's output is pasted from an actual run; the gates line is read from the redirected file; the skill anchors were each located with `grep -n` before editing and every substitution carries a guard that exits non-zero on a missing anchor; the skill's line count went 1,934 → 2,042, measured with `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code in `src/` or `worker/`, no schema, no secret, no env var. The new script is run by a planner on this machine`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **high** | The fault this script detects — no session could reach either database for nine hours — **is not fixed by this PR**, only detected | **Correct and deliberate.** Detection is what was missing: the outage was invisible until a stream needed a migration. The fix stays on its own open item, with the note that a restart does not work and that the token is currently back in the files at Lutan's instruction |
| 2 | medium | The script's **failing** path was not executed, because the token was present when it ran | **Accepted and stated in §4** rather than implied. It is the path that matters most, and the honest record is that it was read, not run |
| 3 | low | The skill is now **2,042 lines**, and tonight added about a hundred of them | **Accepted, and named as a risk in the work itself.** Prose is the weakest fix; that is precisely why the first of the three changes is a **script**. If this recurs, the answer is more checks, not more paragraphs |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the next `/plan-day` actually runs the preflight and reports what it cannot reach | The next planning session. **This is the real test of the change** and it cannot be run tonight |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: the next /plan-day must run the preflight and report what it cannot reach

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
