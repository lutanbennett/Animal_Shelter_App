# Feature test plan — clean-streams-orphans

## Header

| | |
|---|---|
| Feature | `/clean-streams` finds the two kinds of leftover `worktree.mjs` cannot see: app-cut worktrees under `.claude/worktrees/` and `claude/*` branches with no worktree |
| Backlog item | `docs/backlog.md` → none. Lutan asked for it in chat on 2026-10-16 after `/clean-streams` reported the streams clean while six merged branches and five stale worktrees were sitting there |
| Branch / worktree | `claude/clean-streams-orphans` @ `C:\Development\Animal_Shelter_clean-streams-orphans` |
| Dev server | not started — no application code changed |
| PR | this one |
| Tested by / date | Claude (planner session) / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `a6be1ba4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one file, `.claude/skills/clean-streams/SKILL.md`: a new step 1b, an updated `description` so the skill's own summary says it covers both kinds, and step 5 re-reading all three sources
- [x] Files/areas touched listed — exactly one: `.claude/skills/clean-streams/SKILL.md`. No routes, no `worker/`, no `supabase/migrations/`, no shared libs, and **no change to `scripts/worktree.mjs`**
- [x] Roles affected identified: none. A skill file is instructions to Claude, not a surface any shelter role reaches
- [x] Anything explicitly **out of scope** written down — `worktree.mjs` itself is untouched, deliberately: teaching `list` and `done` about `.claude/worktrees/` is a filed backlog item and a script change, and this was asked for as a skill fix. Step 2's ban on improvising `git worktree remove` / `git branch -D` for `Animal_Shelter_*` folders is also unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the worktree was cut from `main` after `0.34.0`'s cut merged, so `origin/main` was already current; confirmed with `git log --oneline origin/main`
- [x] `node scripts/gates.mjs` ends clean — output pasted below exactly as printed, four gates
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

**The first `gates.mjs` run was refused** — *"npm ci has not finished here, or never ran"* — because
`worktree.mjs new` was still installing in the background. **That is the second time today the script
has caught this**, and both times `node_modules` already existed enough to look finished. The output
above is from the run after the install exited.

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no row is read by this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The "feature" here is instructions, so the honest functional check is whether the commands it tells
Claude to run actually produce the answers it claims. **Every command in step 1b was run against this
repository before the step was written** — that is how the six branches and five worktrees were found
and removed earlier in the same session.

- [x] Happy path works end to end — the full sequence was exercised by hand on 2026-10-16: `git worktree list` surfaced five app-cut worktrees `worktree.mjs list` could not see; the `claude/*` branch sweep surfaced six branches with no worktree; each was sorted by the test step 1b prescribes; all six were deleted locally and on `origin`
- [x] Data persists — n/a: a skill file holds no state
- [x] Create / edit / delete all exercised — the delete path is the one that matters and it was: `git branch -d` on five, `git branch -D` on the one squash leftover, `git push origin --delete` on the three that had an `origin` ref
- [x] Empty state renders sensibly (no rows yet) — **checked after the deletions**: the branch sweep now returns nothing for hash-suffixed branches, which is the state step 3 must report as "clean" rather than proposing an empty list
- [x] Invalid input is rejected with a readable message, not a crash — `git rev-parse --verify -q origin/claude/<branch>` is the guard step 1b requires before pushing a delete, and it is why the two branches with no `origin` ref were not pushed; `git branch -d` refused the squash leftover exactly as the step says it would
- [x] Boundary cases checked — the two that decide safety: **a squash-merged branch stays ahead for ever** (`weigh-first-app-3636d4`, six commits beyond `main`, PR #663 merged, spot-checked `src/lib/medical/weigh-first.ts` on `main` → safe) and **a branch ahead with no PR is unsubmitted work** (none today, and step 1b says never to propose one)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a — a skill file, not a route |
| management | nothing changed | unchanged | n/a — a skill file, not a route |
| staff | retired role (`0173`) | n/a | n/a — a skill file, not a route |
| doctor | nothing changed | unchanged | n/a — a skill file, not a route |
| volunteer | nothing changed | unchanged | n/a — a skill file, not a route |
| signed out | nothing changed | unchanged | n/a — a skill file, not a route |

- [ ] Every role above tested — n/a: `.claude/skills/` is not served to any role
- [ ] A role that should not have access is blocked server-side — n/a: no new route or RPC

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: the manual is for shelter users; this is a Claude skill
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no page loaded
- [ ] Network clean — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work — n/a by surface; `build` compiled the whole app with the change present, which is the only way a file under `.claude/` could affect it
- [x] Any shared file touched checked from a second, unrelated page — no shared file was touched; `git show --stat` shows one file
- [x] **The skill still reads as one document.** Re-read start to finish after the insert: step 1b sits between "Look" and "Sort each worktree", the step numbering runs 1, 1b, 2, 3, 4, 5, step 3's multi-select and step 5's report both now account for the new kinds, and step 1b states explicitly that step 2's ban on raw git still holds for `Animal_Shelter_*` folders. **The contradiction that ban would otherwise create is the one real review risk in this PR**, and it is addressed in the text rather than by deleting the ban
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch changes one instruction file that nothing imports

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item for the skill fix. The **related** item — teaching `worktree.mjs` itself about `.claude/worktrees/` and its port handling — stays open on purpose and is untouched by this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the reasoning is the skill text itself, which is read every time the skill runs, and a decision file would be a second copy to drift from. The *why now* is in the commit message and this plan
- [x] `README.md` still accurate — unchanged and unaffected
- [ ] **Release notes.** n/a: a Claude skill file — no shelter user would notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The numbers in the commit message and in step 1b are counted, not estimated: five app-cut worktrees and six worktree-less branches, from `git worktree list` and `git branch -a --list 'claude/*'` on 2026-10-16; the "two of nine sessions got an app-cut worktree" figure is from `get_session`'s `worktreePath` and `originCwd` across this round's nine streams, which is also why the step says the behaviour is intermittent rather than switched on

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded; nothing here reaches a deployed build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no logic, no dates, no clock
- [ ] Boundary or banding assertions cover both edges — n/a: no threshold in code. The two decision boundaries in the *instructions* are both exercised in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line is as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this commit restores the previous skill text. It does not cover, and need not cover, anything running; and it does not undo the eleven leftovers already removed by hand, which were removed before this PR existed and are not restorable by it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `/clean-streams` reported the streams clean while five app-cut worktrees and six merged `claude/*` branches were sitting in the repo, because `worktree.mjs list` cannot see either and `done` cannot act on them. Lutan found them by hand | fixed by this PR for the skill; the underlying `worktree.mjs` gap stays filed on the backlog |
| 2 | low | `gates.mjs` was run before `worktree.mjs new` had finished and refused — the second time today | fixed: re-run after the install exited; recorded in section 2 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `/clean-streams` and confirm it now surfaces both kinds, or says "clean" correctly — today's run would find nothing, since the eleven leftovers were removed by hand before the skill was changed, so the real test is the next time an app-cut worktree appears | `/clean-streams` |
| 2 | Whether the raw-git exception in step 1b is the right call, or whether `worktree.mjs` should learn about `.claude/worktrees/` instead so the skill never touches git directly — that is Lutan's call and the backlog item for it is open | `.claude/skills/clean-streams/SKILL.md` step 1b |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-10-16

### Manual verification

Manual verification by: pending: a `/clean-streams` run against a repository that actually has an app-cut worktree in it, and Lutan's view on the raw-git exception

Result: pass
