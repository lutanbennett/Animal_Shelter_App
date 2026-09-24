# Feature test plan

## Header

| | |
|---|---|
| Feature | `check-test-plan.mjs` checks a sign-off PR's release-notes tick against the merge that introduced the plan |
| Backlog item | `docs/backlog.md` → Architecture: "`check-test-plan.mjs` can't tell a post-merge sign-off PR from a feature PR that forgot its release line" |
| Branch / worktree | `claude/check-test-plan-signoff` @ `C:\Development\Animal_Shelter_check-test-plan-signoff` |
| Dev server | n/a: a CI script; no page is served |
| PR | #96 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `c684fbb` (tip of `main`) plus this branch's diff |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for. Option (a): when every touched path is under `docs/test-plans/` and the plan existed before this PR, a ticked **Release notes.** line is checked against the merge that introduced the plan
- [x] Files/areas touched listed: `scripts/check-test-plan.mjs`, `docs/test-plan-template.md` (one sentence in §7), `docs/decisions.md`, `docs/backlog.md`, this plan
- [ ] Roles affected identified — n/a: no app code changes; only the CI checker's behaviour changes
- [x] Anything explicitly **out of scope** written down. Restoring #80's ticked line in `intake-capacity-warning.md` is left to a follow-up plan-only PR, because this PR touches a script and is correctly *not* a sign-off PR (`docs/decisions.md`, 2026-09-24)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [x] CI green on the PR: #96, `check` and `test-plan` both passed on 38886fb

```
=== gates: typecheck exited 0 after 33s
=== gates: lint exited 0 after 87s
=== gates: build exited 0 after 243s
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

Every case below was run against real commits, in a throwaway `git clone --shared` in the session scratchpad, so no worktree or the shared git config was touched. The checker was invoked from this branch; output is unedited apart from being cut to the relevant lines.

- [x] Happy path works end to end: case B, #80 with its line restored to a tick, passes and names #77's merge
- [ ] Data persists — n/a: no data; the checker is stateless
- [ ] Create / edit / delete — n/a: no records
- [x] Empty state renders sensibly: case A, #80 as merged with its `n/a` wording, still passes unchanged
- [x] Invalid input is rejected with a readable message, not a crash: case F (the original PR added no line) and case G (shallow clone) both fail with a sentence saying why
- [x] Boundary cases checked: a plan plus one code file (C) gets no exemption. A new plan in a feature PR (D, E) is judged on its own diff as before

| Case | Shape | Base → head | Expected | Got |
|---|---|---|---|---|
| A | #80 as merged (`n/a` wording) | `a80f090` → `1206960` | pass | pass |
| B | #80 with ticked wording restored | `a80f090` → `1206960` + tick | pass, names #77 | pass, "a80f090 (Merge pull request #77 …)" |
| B-old | case B under `origin/main`'s checker | same | the original false red | "gained no line in this PR" |
| C | case B plus a one-line change to `src/app/layout.tsx` | same | fail (no exemption) | fail, "gained no line in this PR" |
| D | #77 feature PR, with its line | `a80f090^1` → `a80f090^2` | pass | pass |
| E | #77 feature PR with `releases.ts` reverted (forgot its line) | `a80f090^1` → `a80f090^2` | fail | fail, "gained no line in this PR" |
| F | sign-off ticking `gates-command.md`, whose #78 added no line | `c684fbb` → sign-off commit | fail | fail, "neither this sign-off PR nor d355330 (Merge pull request #78 …)" |
| G | case F in a `--depth 3` clone | same | fail, says why | fail, "history is shallow … `git fetch --unshallow`" |

```
=== B. #80 with ticked wording restored
check-test-plan: ok — docs/test-plans/intake-capacity-warning.md
Sign-off PR: release-notes tick checked against the merge that introduced the plan:
  docs/test-plans/intake-capacity-warning.md:94 — a80f090 (Merge pull request #77 from lutanbennett/claude/intake-capacity-warning)
exit 0
=== C. #80 ticked + a code change (no exemption)
  docs/test-plans/intake-capacity-warning.md:94 — release-notes line is ticked, but `unreleased` in src/lib/releases.ts gained no line in this PR — add one written for a shelter user, or untick it and say `n/a: <why nobody would notice>`
exit 1
=== E. #77 feature PR that forgot its line
  docs/test-plans/intake-capacity-warning.md:94 — release-notes line is ticked, but `unreleased` in src/lib/releases.ts gained no line in this PR — add one written for a shelter user, or untick it and say `n/a: <why nobody would notice>`
exit 1
=== F. sign-off ticking a line its feature PR never added
  docs/test-plans/gates-command.md:107 — release-notes line is ticked, but neither this sign-off PR nor d355330 (Merge pull request #78 from lutanbennett/claude/gates-command), which introduced this plan, added a line to `unreleased` in src/lib/releases.ts
=== G. same sign-off in a shallow clone
  docs/test-plans/gates-command.md:107 — release-notes line is ticked in a sign-off PR, but history is shallow, so the PR that introduced this plan cannot be found — fetch it (`git fetch --unshallow`)
```

### Role access matrix

n/a: no app surface; no role can reach a CI script.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] Server-side block — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour; the template's §7 line gained one sentence instead
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: cases A, D and E are the pre-existing behaviours (plain plan, feature with line, feature without line) and are unchanged. This plan passes the checker on this branch
- [ ] Shared file loaded from a second page — n/a: no shared runtime file touched; `check-test-plan.mjs` is only run by CI and by hand
- [x] Nothing merged from `main` during `sync` was broken by this branch (sync was a no-op; gates green)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why (a) over (b) and (c), and why #80's line is restored in a separate PR
- [x] `README.md` still accurate: its "Every deploy is a release" item says the checker flags a UI change with no line and no reason, which is unchanged
- [ ] **Release notes.** n/a: a CI checker change; no shelter user sees it, and the PR touches none of the user-visible paths
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every behaviour claimed is one of cases A–G above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: a CI script; nothing in it is deployed to Workers
- [ ] Deployed SHA matches — n/a: not deployed

### On the deployed build

- [ ] Deployed to test — n/a: not part of the Worker bundle
- [ ] Smoke-tested on test.lannacare.org — n/a: not part of the Worker bundle
- [ ] Timezone-sensitive behaviour — n/a: no dates computed
- [ ] Boundary or banding change — n/a: no threshold; the exemption's boundary (plan-only vs plan plus code) is covered by cases B and C
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (cut to the relevant lines, no wording changed)
- [ ] Public pages re-checked — n/a: nothing public changed

### Deploy safety

- [ ] Production Supabase ref — n/a: no deploy
- [ ] `strip-baked-env` — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. The checker is a soft gate, so a wrong verdict blocks nothing in the meantime. No schema, no Worker

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: the checker's behaviour is fully exercised by the scripted cases above, and there is no screen to look at.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing to look at — a CI checker, exercised by the scripted cases A–G

### Result

- [ ] Open defects fixed or accepted — n/a: none found
- [x] Checklist pasted into the PR (summary and case table in the #96 description; full plan in this file)
- [ ] Handed to the production release manager — n/a: nothing deploys; the release manager's pre-deploy pass reads this plan as part of the release anyway

Result: pass

Release manager acknowledgement: n/a: CI tooling, nothing deployed
