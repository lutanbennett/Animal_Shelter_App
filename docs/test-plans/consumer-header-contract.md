# Feature test plan

## Header

| | |
|---|---|
| Feature | consumer-header-contract — the `-- consumer:` header is a write-time snapshot |
| Backlog item | `docs/backlog.md` → `#c0nhd` |
| Branch / worktree | `claude/consumer-header-contract` @ `C:\Development\Animal_Shelter_consumer-header-contract` |
| Dev server | n/a — no UI surface |
| PR | opened after this commit |
| Tested by / date | Claude (Sonnet 5.5), 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 660b374c9 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified — n/a: no card, page or access path changes; this is a convention and a script
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `scripts/lib/migration-consumers.mjs`, `scripts/check-migration-consumers.mjs`, `docs/decisions/2026-10-02-migration-consumer-header.md`, `docs/backlog.md`. Out of scope: editing any applied migration, fixing the stale headers found by the sweep.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 99s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 296s
=== gates: test — npm test
=== gates: test exited 0 after 95s
=== gates: build — npm run build
=== gates: build exited 0 after 243s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-migration-consumers.mjs` passes, including the new case that a pending `none` file is named in a "not re-checked" note
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete — n/a: no records
- [x] Empty state renders sensibly — with no `none` files pending no new note is printed (the existing "consumer live -> silent" case still passes)
- [ ] Invalid input — n/a: the header parser is unchanged
- [ ] Boundary cases — n/a: the parser is unchanged; only a note is added

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no page | n/a |
| signed out | n/a | no page | n/a |

- [ ] Every login above tested — n/a: no UI surface, this is a convention and a script
- [ ] Server-side block — n/a: no access path changes

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no user-facing behaviour
- [ ] Translatable strings — n/a: script output only
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — every existing case in `check-migration-consumers.mjs` still passes
- [ ] Shared file checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — amended in place in `2026-10-02-migration-consumer-header.md`, dated
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a release-manager script note; no shelter user, Admin or product administrator sees it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 18-file sweep was grep'd file by file against `src/`, `scripts/`, `worker/`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts only, nothing deployed changes
- [ ] Smoke-tested on test — n/a: scripts only
- [ ] Timezone — n/a: no date logic
- [ ] Boundary cases — n/a: no boundary
- [x] Evidence pasted is the tool's actual output, unedited
- [ ] Public pages — n/a: no public page changes

### Deploy safety

- [ ] Supabase ref line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reader together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the PR; it changes only a printed note and docs

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no surface a person needs to look at | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no surface for a person to look at; a script note and a decision file

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: next release

Result: pass

Release manager acknowledgement: pending: next release
