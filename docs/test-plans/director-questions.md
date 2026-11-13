# Feature test plan — director-questions

## Header

| | |
|---|---|
| Feature | One ordered list of in-person questions for the Director and accountant, Chiang Mai, November 2026 |
| Backlog item | `docs/backlog.md` → `#5j6kj`, `#99zuk`, `#cjxq0`, `#hj1c5`, `#s0jgi` (none ticked or edited; asked in person) |
| Branch / worktree | `claude/director-questions` @ `C:\Development\Animal_Shelter_director-questions` |
| Dev server | not started: documentation only, no UI surface |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | 3fe7a5d20 |

## 1. Scope and risk

- [x] Change is described in one sentence — an ordered question list with what each answer unlocks, plus a decision file
- [x] Files/areas touched listed — `docs/director-questions.md`, `docs/decisions/2026-11-13-director-questions.md`, this plan. Nothing under `src/`, `worker/`, `scripts/`, `supabase/`
- [ ] Cards affected identified — n/a: no code or permission changes
- [x] Out of scope written down — no backlog edits; the Desktop copy is not committed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` four gates, closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 158s
=== gates: lint exited 0 after 309s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 177s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: documentation only, no UI surface
- [ ] Data persists — n/a: documentation only, no UI surface
- [ ] Create / edit / delete — n/a: documentation only, no UI surface
- [ ] Empty state — n/a: documentation only, no UI surface
- [ ] Invalid input rejected — n/a: documentation only, no UI surface
- [ ] Boundary cases — n/a: documentation only, no UI surface

### Role access matrix

Not applicable: no page, route or action added; a file in the repository.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a |
| signed out | nothing new | no change | n/a |

- [ ] Every login above tested — n/a: no access surface changed
- [ ] A login that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no app surface
- [ ] Manual updated — n/a: no app surface
- [ ] Translatable strings — n/a: no app surface
- [ ] Mobile viewport (375px) — n/a: no app surface
- [ ] Browser console clean — n/a: no app surface
- [ ] Network clean — n/a: no app surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; gates ran on the tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: asked in person; answers are recorded on the items when Lutan is back, and the task said not to edit the backlog
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-director-questions.md`
- [x] `README.md` still accurate — not touched
- [ ] **Release notes.** n/a: a repository document nobody using the app would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Question wording taken from the backlog tails and the 10 November list

## 8. Pre-production gate

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — n/a: no code ships
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no behaviour
- [ ] Boundary or banding assertions cover both edges — n/a: no thresholds
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy: production → Supabase project` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration and code that reads it in one PR — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: documentation only; reverting the commit removes the files

## Defects found

None.

## Left for manual verification

| What | Who |
|---|---|
| Lutan reads the Desktop copy and asks the questions | Lutan |

## Sign-off

Automated checks by: Claude  Date: 2026-11-13
Manual verification by: n/a: documentation only, nothing to look at in the app

Result: pass
