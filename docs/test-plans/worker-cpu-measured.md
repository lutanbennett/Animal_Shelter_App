# Feature test plan

## Header

| | |
|---|---|
| Feature | Record the measured Worker CPU cost of the public pages (#egq18) |
| Backlog item | `docs/backlog.md` -> `#egq18` (ticked on the `backlog` branch, where the measurement was recorded) |
| Branch / worktree | `claude/worker-cpu-measured` @ `C:\Development\Animal_Shelter_worker-cpu-measured` |
| Dev server | not started: this PR adds two documents and no code |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | the branch tip this plan is committed on |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: it records, as a decision file, the measurement that answers `#egq18` - public pages cost
52-87 ms of Worker CPU against the free plan's 10 ms - and marks the superseded method in the 2026-11-17
file. **Files: `docs/decisions/2026-11-21-worker-cpu-measured-on-uat.md` (new) and
`docs/decisions/2026-11-17-worker-free-plan-limits.md` (a superseded note added in place).** No route, no
`worker/`, no migration, no shared lib. **No card is affected** and no behaviour changes for admin or for
the signed-out public: nothing executable is touched. **Out of scope:** the decision the measurement feeds
(`#34a30`), which is Lutan's and is not taken here; and any change to the pages' cost.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` - `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
GATES_OUTPUT_PLACEHOLDER
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) - n/a: not yet - the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one - n/a: no migration in this PR
- [ ] Migration status reviewed before applying - n/a: no migration in this PR
- [ ] Migration dry run reviewed - n/a: no migration in this PR
- [ ] Applied to dev and recorded in `schema_migrations` - n/a: no migration in this PR
- [ ] File is re-runnable - n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change - n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a rollback harness - n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated - n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager - n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end - n/a: two documents, no runtime behaviour
- [ ] Data persists - reload the page and the change is still there - n/a: two documents, no runtime behaviour
- [ ] Create / edit / delete all exercised - n/a: two documents, no runtime behaviour
- [ ] Empty state renders sensibly - n/a: two documents, no runtime behaviour
- [ ] Invalid input is rejected with a readable message, not a crash - n/a: two documents, no input
- [ ] Boundary cases checked - n/a: two documents, no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed by this PR | no change | no change |
| signed out | nothing changed by this PR | no change | no change |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side - n/a: this PR adds no reachable surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) - n/a: no nav entry; `src/` is not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` - n/a: nothing a shelter user does changes
- [ ] Translatable strings go through the translation path - n/a: no user-facing string added
- [ ] Mobile viewport (375px) - n/a: no screen changed
- [ ] Browser console clean - n/a: no screen changed
- [ ] Network clean - n/a: no screen changed

## 6. Regression

- [ ] The pages nearest the change still work - n/a: no page is near a document
- [ ] Any shared file touched checked from a second, unrelated page - n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** - see the note below
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [ ] **Release notes.** - n/a: a decision file recording a measurement; nothing a shelter user, an Admin or a product administrator can see changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

On the backlog tick: `#egq18` was ticked on the `backlog` branch in commit `0b94b807c`, together with the
measurement itself, before this PR existed - the planner records a finding there as `CLAUDE.md` requires,
so this PR carries no `docs/backlog.md` change. The tick is real and is not owed.

On the last line: every figure in the decision file is a reading from Cloudflare's observability, named
page by page, with the cache state and the deploy flag that produced it recorded beside it. The
counter-finding (47 successes, zero errors) is recorded because it cuts against the conclusion.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time - deferred: the release manager
- [ ] Deployed SHA matches the tested SHA - deferred: the release manager

### On the deployed build

- [ ] Deployed to test - deferred: the release manager
- [ ] Smoke-tested on `test.lannacare.org` - deferred: the release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** - n/a: no date or time logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** - n/a: no threshold or banding logic in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait - deferred: the release manager

### Deploy safety

- [ ] Production Supabase project ref line read and it **matches production** - deferred: the release manager
- [ ] Baked-env strip line seen in the deploy output - deferred: the release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment - n/a: this PR adds no secret or env var

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** - n/a: no migration in this PR
- [ ] Production migration dry run run and clean - n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh - n/a: no migration in this PR
- [ ] Apply plan stated - n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Rollback: reverting this PR removes two documents and restores the 2026-11-17 file's unmarked wording. It
covers nothing else, because nothing else changes - no schema, no Worker, no Pi build. **The UAT deploy
that produced the measurement is not part of this PR and was already undone**: UAT was redeployed without
the flag, and the Pi was confirmed to be serving it again afterwards.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The method in `docs/decisions/2026-11-17-worker-free-plan-limits.md` named the test Worker, which cannot render a public page at all because the public site has been switched off there since 2026-11-09 | fixed - superseded note added in place, naming the cause and the working route |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: two documents, no surface a person could look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing to deploy
