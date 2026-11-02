# Test plan: release-procedure-0292-paragraph

| | |
|---|---|
| Feature | release-procedure-0292-paragraph |
| Backlog item | `docs/backlog.md` → Security, the `0292` hazard paragraph |
| Branch / worktree | `claude/release-procedure-0292-paragraph` @ `C:\Development\Animal_Shelter_release-procedure-0292-paragraph` |
| Dev server | n/a: documentation only |
| PR | pending |
| Tested by / date | Claude 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | bcb2163c |

## 1. Scope and risk

- [x] Change is described in one sentence: the `0292` passage of the release procedure now names the blocking `wrapped-write-paths` check
- [x] Files touched: `docs/release-procedure.md`, a decision file, the backlog tick
- [ ] Roles affected — n/a: documentation only, no role sees a change
- [x] Out of scope: wrapping the header, promoting the check, any script or `WRAPPED_WRITE_PATHS` change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: documentation only, no UI surface
- [ ] Data persists — n/a: documentation only, no UI surface
- [ ] Create / edit / delete — n/a: documentation only, no UI surface
- [ ] Empty state — n/a: documentation only, no UI surface
- [ ] Invalid input — n/a: documentation only, no UI surface
- [ ] Boundary cases — n/a: documentation only, no UI surface

### Role access matrix

- [ ] Every role above tested — n/a: documentation only, no access changes
- [ ] A role that should not have access is blocked — n/a: documentation only, no access changes

## 5. Cross-cutting

- [ ] Nav entry — n/a: documentation only
- [ ] Manual updated — n/a: documentation only, the release procedure is not the in-app manual
- [ ] Translatable strings — n/a: documentation only
- [ ] Mobile viewport — n/a: documentation only
- [ ] Browser console clean — n/a: documentation only
- [ ] Network clean — n/a: documentation only

## 6. Regression

- [ ] Nearest pages — n/a: documentation only, nothing executable changed
- [ ] Shared file touched — n/a: documentation only, no shared code file touched
- [ ] Nothing merged from main broken — n/a: documentation only, nothing executable changed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-02-release-procedure-0292-paragraph.md` added
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a document a release manager reads, nobody in the shelter would notice
- [x] Commit messages say why
- [x] Claims were measured: the named job, script and assertion were read in the repo, not recalled

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: documentation only, nothing to deploy
- [ ] Smoke-tested — n/a: documentation only, nothing to deploy
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no logic changed
- [ ] Evidence pasted is actual output — n/a: documentation only, gates line above is verbatim
- [ ] Public pages re-checked — n/a: documentation only, no public page changed
- [ ] Deploy line read — n/a: documentation only, no deploy
- [ ] strip-baked-env seen — n/a: documentation only, no deploy
- [ ] New secret exists — n/a: documentation only, no secrets
- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — n/a: documentation only, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | n/a |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

- [x] The manual list above is empty

Manual verification by: n/a: documentation only, nothing for a person to look at

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR not yet open
- [ ] Handed to the production release manager — n/a: documentation only

Result: pass

Release manager acknowledgement: pending
