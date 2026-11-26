# Feature test plan

## Header

| | |
|---|---|
| Feature | Host attach trial: does a deploy remove an API-attached custom domain |
| Backlog item | `docs/backlog.md` → `#hstau` (not ticked: a measurement does not close it) |
| Branch / worktree | `claude/host-attach-trial` @ `C:\Development\Animal_Shelter_host-attach-trial` |
| Dev server | n/a, no app code changed (port 3007) |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | 973f80032 |

## 1. Scope and risk

- [x] Change is described in one sentence: measure on the test Worker whether `deploy.mjs` removes a custom domain attached by the Cloudflare API, and write the spec; matches `#hstau`'s "measure it on test before writing a line of the feature"
- [x] Files/areas touched: `docs/decisions/2026-11-26-host-attach-trial.md` and this plan only; the test Worker's custom-domain list was changed and restored
- [x] Cards affected: none; no app code, no admin or public change
- [x] Out of scope: the console attach feature, production, UAT, `.env.deploy.*`, `scripts/deploy.mjs` edits

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` closing lines as printed:

```
=== gates: typecheck exited 0 after 109s
=== gates: lint exited 0 after 211s
=== gates: test exited 0 after 49s
=== gates: build exited 0 after 99s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path: attach by `PUT /accounts/{account}/workers/domains` succeeded; `https://host-trial.lannacare.org/` answered 200; after `node scripts/deploy.mjs --env test` the API list no longer held it (lists in the decision file, read back from the API each time)
- [ ] n/a: no app data written
- [x] Create / delete exercised: attach by API, removal observed by deploy, detach pass found nothing left; list read back afterwards equals the list before
- [ ] n/a: no UI
- [ ] n/a: no UI input
- [ ] n/a: measurement, no boundary logic

### Role access matrix

n/a: no page or action changed.

- [ ] n/a: no page or action changed
- [ ] n/a: no page or action changed

## 5. Cross-cutting

- [ ] n/a: no nav change
- [ ] n/a: no user-facing behaviour to document
- [ ] n/a: no strings
- [ ] n/a: no UI
- [ ] n/a: no UI
- [ ] n/a: no UI

## 6. Regression

- [x] `test.lannacare.org` keeps the same custom-domain id before and after (`1b862959…`); `uat.lannacare.org` untouched
- [ ] n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken (gates above ran after sync)

## 7. Documentation

- [ ] n/a: measurement only; `#hstau` stays open, proposed new title is in the PR body for the planner
- [x] Decision file `docs/decisions/2026-11-26-host-attach-trial.md`
- [ ] n/a: README describes nothing this changes
- [ ] **Release notes.** n/a: no user, Admin or product administrator would notice; knowledge and a decision file only
- [x] Commit messages say why
- [x] Claims were measured: domain lists read back from the Cloudflare API, not inferred

## 8. Pre-production gate

- [ ] n/a: nothing ships to production
- [ ] n/a: nothing ships to production
- [ ] n/a: test deploy was the measurement itself, not a release
- [ ] n/a: no app behaviour to smoke-test
- [ ] n/a: no time handling
- [ ] n/a: no boundary change
- [x] Evidence pasted is the tool's actual output (domain lists in the decision file, gates above)
- [ ] n/a: no public page changed
- [ ] n/a: no production deploy
- [ ] n/a: no production deploy
- [ ] n/a: no new secret
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: no migration
- [ ] n/a: docs-only; nothing to roll back

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

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no screen exists for anyone to look at; the trial is an API measurement

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] n/a: no production release carries this

Result: pass
