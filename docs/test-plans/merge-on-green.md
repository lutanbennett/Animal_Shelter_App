# Feature test plan — every PR merges on green

## Header

| | |
|---|---|
| Feature | `CLAUDE.md` records Lutan's decision of 2026-11-01: every PR merges on green, feature PRs included |
| Backlog item | `docs/backlog.md` → none. It was never filed as an item; it came out of a question asked while reporting batch 6, and the decision file says so rather than inventing a tick |
| Branch / worktree | `claude/merge-on-green` @ `C:\Development\Animal_Shelter_merge-on-green` |
| Dev server | not started — `n/a: two markdown files, no runtime surface` |
| PR | #1146 |
| Tested by / date | Claude (Daily Planner) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `1d89f96e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *`CLAUDE.md` is rewritten in the three places that stated the old merge rule, and a decision file records the question, the answer and what did not change.* There is no backlog item, as the header says
- [x] Files/areas touched listed — `CLAUDE.md` (three passages), `docs/decisions/2026-11-01-every-pr-merges-on-green.md` (new), this plan. **No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow**
- [x] Access affected identified — **none.** This grants and denies nothing: it is a working rule read by Claude sessions, not code, and no card, activity, policy or page changes. *(Written by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here to describe.)*
- [x] Anything explicitly **out of scope** written down — the gates, the seven CI checks, the test plans, `gh pr create`, the no-auto-merge-switch rule, and *major versus minor* and *the production Worker deploy* staying his. All listed in the decision file under what did not change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the worktree was cut from `origin/main` minutes earlier, so it was already current)
- [x] `node scripts/gates.mjs` ends:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the deliverable is prose in two files`
- [ ] Data persists — `n/a: no runtime surface`
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Access matrix

**Written by card, not by role** (`CLAUDE.md`: all analysis is by card, because roles are a transient
grouping of cards and every assignment will be rebuilt).

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | `CLAUDE.md` and `docs/decisions/` are developer documents, not app surfaces: no card opens them, no card is read by them, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

- [x] Every card above tested — vacuously: the change touches no card-derived code. Verified by the diff: two markdown files and this plan
- [ ] A card that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: this is a working rule for Claude sessions, not something a shelter user does`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` would be wrong here: `CLAUDE.md` is **read by `scripts/`**, and a stray character has broken a check before, so the four gates above were run in full rather than skipped as a documentation change. All four exited 0
- [x] Any shared file touched checked from a second, unrelated place — `grep` over every `.md` and `.mjs` outside `docs/decisions/`, `docs/releases/` and `docs/test-plans/` found **no other statement of the old rule**; in particular `.claude/skills/plan-day/SKILL.md` and `docs/release-procedure.md` carry none, so nothing else contradicts the new one
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is one commit of markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: there is no item; the header and the decision file both say so rather than inventing a tick`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-every-pr-merges-on-green.md`, which records the question that was put to him, why it was put, the three passages changed, and the conditions that did not change
- [x] `README.md` still accurate — it says nothing about who merges a PR
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. This changes how Claude sessions merge their own pull requests; it touches no page, no card and no data`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the three batch-6 merge times and head-commit checks are read from the PRs themselves, the "no other statement of the old rule" claim is a `grep` that was run, and the three changed passages were located by matching their exact text (the edit script refused to run unless each anchor matched exactly once)

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefacts are two markdown files read by Claude sessions`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the new wording says what he meant. He answered a one-line question with a button, and the rule as written adds the conditions the answer did not spell out — green on your own head commit, `skipped` is not a pass, never merge past a red, and `gh pr merge` being refused is reported rather than worked around. **If any of that is more than he intended, it is one line to change** | `CLAUDE.md` → *"Every PR merges on green"* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is Lutan's to tick after reading the new wording

Manual verification by: pending: Lutan reading the new wording in `CLAUDE.md` and saying whether the conditions written around his answer are what he meant

### Result

- [x] Open defects are either fixed or explicitly accepted above — there are none
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass

Release manager acknowledgement: n/a: nothing in this PR is deployed
