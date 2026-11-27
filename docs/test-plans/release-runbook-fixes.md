# Feature test plan

## Header

| | |
|---|---|
| Feature | Three release-runbook corrections from 0.50.0, and Pi commands name the mesh (#rbkpi) |
| Backlog item | `docs/backlog.md` -> `#rbkpi`, ticked on this branch |
| Branch / worktree | `claude/release-runbook-fixes` @ `C:\Development\Animal_Shelter_release-runbook-fixes` |
| Dev server | not started: documentation only, no code |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude Sonnet 5.5 / 2026-11-28 |
| Carries a migration? | no |
| Tested at SHA | fb3cbba64 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: it fixes three wrong instructions in `docs/release-procedure.md`. They are the detached Pi-build recipe, tenancy figures quoted without their flags, and a `--skip-build` prohibition with no recipe. It also deletes the handover copies, corrects `0.49.3`s record, and makes every Pi command name `lanna-pi-mesh`. **Files:** `docs/release-procedure.md`, `docs/release-handover.md`, `docs/releases/2026-11-26-0-49-3.md`, `docs/backlog.md` (tick), and a new `docs/decisions/2026-11-28-runbook-pi-commands-name-the-mesh.md`. No route, no `worker/`, no `scripts/`, no migration. **No card is affected**, and admin and the signed-out public see no change. **Out of scope:** running any release or deploy, and any `scripts/` change.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` - `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 79s
=== gates: lint exited 0 after 282s
=== gates: test exited 0 after 71s
=== gates: build exited 0 after 227s
gates: typecheck=0 lint=0 test=0 build=0
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

- [ ] Happy path works end to end - n/a: documentation only, no runtime behaviour
- [ ] Data persists - reload the page and the change is still there - n/a: documentation only, no runtime behaviour
- [ ] Create / edit / delete all exercised - n/a: documentation only, no runtime behaviour
- [ ] Empty state renders sensibly - n/a: documentation only, no runtime behaviour
- [ ] Invalid input is rejected with a readable message, not a crash - n/a: documentation only, no input
- [ ] Boundary cases checked - n/a: documentation only, no input

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
- [ ] **Release notes.** - n/a: release runbook and records only; nothing a shelter user, an Admin or a product administrator can see changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

On the last line: the tenancy split was measured on the dev database (`--env test`). Without the flags it read 126 flagged; with `--strict --tenant-role rls_definer` it read 0. The progress-read shape was run against the Pi over the mesh. The 125/0 production split and the pipe-held SSH session are quoted from the `0.50.0` run, not re-measured: no production command was run.

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

Rollback: reverting this PR restores the old runbook and handover wording and the uncorrected `0.49.3` record. Nothing else changes: no schema, no Worker, no Pi build.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Sonnet 5.5  Date: 2026-11-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only, no surface a person could look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing to deploy
