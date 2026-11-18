# Feature test plan — advisory-glob-judged

## Header

| | |
|---|---|
| Feature | Judge GHSA-3g3m-2fjr-6pw4 (glob AbortSignal bypass): not reachable, recorded under `resolved` |
| Backlog item | `#globh` (ticked) |
| Branch / worktree | `claude/advisory-glob-judged` @ `C:\Development\Animal_Shelter_advisory-glob-judged` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |

## 1. Scope and risk

- [x] Change described in one sentence — a dependency advisory is judged and recorded; no dependency changes
- [x] Files touched — `docs/advisory-register.json`, `docs/decisions/2026-11-18-glob-abortsignal-advisory.md`, `docs/backlog.md`, this plan
- [x] Roles affected — none
- [x] Out of scope — any `@opennextjs/*` upgrade, `advisories.yml`, `ci.yml`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` — `gates: typecheck=0 lint=0 test=0 build=0`
- [x] CI green on the PR — read from the PR before merging

## 3. Schema and data

- [ ] n/a: no migration, no schema change

## 4. Functional checks

- [ ] n/a: no UI surface; the one behaviour is `npm run audit:register`, which ran after the change and exited 0 ("1 high/critical advisory, all registered and still unreachable")

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing changed | unchanged | n/a: docs and a register file only |

## 5. Cross-cutting

- [ ] n/a: no UI surface (nav, manual, strings, viewport, console, network)

## 6. Regression

- [ ] n/a: no app code touched
- [x] Nothing merged from `main` during `sync` — already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — `#globh`
- [x] Decision recorded — `docs/decisions/2026-11-18-glob-abortsignal-advisory.md`
- [x] `README.md` still accurate
- [ ] Release notes — n/a: a dependency assessment; no shelter user sees it
- [x] Commit messages say why
- [x] Claims were measured — advisory text fetched from GitHub, severity read from `npm audit --json`, grep results in the decision file

## 8. Pre-production gate

- [ ] n/a: no deploy; docs and register only. Nothing for the release manager.

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | The 2026-11-17 nightly showed this advisory as high; the live database now says moderate | accepted: recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

Manual verification by: n/a: no UI surface

- [x] Open defects are fixed or explicitly accepted above

Result: pass

Release manager acknowledgement: n/a: not yet released
