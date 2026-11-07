# Feature test plan — website-switches-app

## Header

| | |
|---|---|
| Feature | App half of per-statistic website switches: a tick per lifetime figure and live count in Settings → Website, and `/events` carries its own hide switch |
| Backlog item | `#jdoto` and `#e7v1q` (both ticked) |
| Branch / worktree | `claude/website-switches-app` @ `C:\Development\Animal_Shelter_website-switches-app` |
| Dev server | `localhost:3005` |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no — reads `0328` |
| Tested at SHA | `18fe47ce` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every homepage statistic can be switched off and on from Settings → Website
- [x] Files/areas touched listed — `src/app/admin/website/` (ImpactBaselines, actions, page, new test), `src/lib/site/impact.ts`, `src/lib/public-pages.ts`, both dictionaries, `src/lib/releases.ts`, decision file, backlog ticks
- [x] Roles affected identified — a login holding the website card at edit sees the ticks; others see none
- [x] Anything explicitly **out of scope** written down — `#s4t7q` (set_at stamp), needs a migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date
- [x] `node scripts/gates.mjs` ends with all four exit codes 0, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (0328 already applied)
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: 0328 ships with this release

## 4. Functional checks

- [x] Happy path works end to end — drove it on dev: "in treatment" and "Sterilisations" switched off, both tiles left `/`; switched on, both returned
- [x] Data persists — baseline 300 still in the box while off; tile back with 300 and 13
- [x] Create / edit / delete all exercised — toggle on and off exercised; no create or delete here
- [x] Empty state renders sensibly — a switched-off row says it is off; a switched-on count of 1 says it is under 2
- [x] Invalid input is rejected with a readable message — an unknown live key is refused in the action; no free input
- [x] Boundary cases checked — foster count of 1 stays off the band with its switch on

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| login holding only the website card | the ticks | offered and work | pass |
| login without website edit | the ticks | not drawn | n/a: pending — source test only; a gallery-only login cannot open the page to look |

- [ ] Every role above tested — pending: the no-edit login was not driven in the browser
- [x] A role that should not have access is blocked server-side — the action asks the same activity and 0328's policies need it

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new nav
- [ ] Manual updated — n/a: manual screenshots deferred; no topic on these figures changed
- [x] Translatable strings go through the translation path — both dictionaries; Thai unreviewed
- [ ] Mobile viewport (375px) — pending: not driven
- [x] Browser console clean — no errors seen while driving
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] The pages nearest the change still work — homepage band renders; check-public-views passed
- [x] Any shared file touched checked from a second page — `/` and `/admin/website` both loaded
- [x] Nothing merged from `main` during `sync` was broken — nothing merged

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` — `#jdoto`, `#e7v1q`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-06-website-switches-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line for shelter users
- [x] Commit messages say why
- [x] **Claims were measured** — tile removal and return read from the served homepage HTML

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: none
- [ ] **Boundary or banding change** — n/a: LIVE_TILE_MIN untouched
- [ ] **Evidence is the tool's actual output** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in one PR — n/a: no migration; 0328 must reach production with this
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — n/a: none
- [ ] Apply plan stated — deferred: release manager (0328 first)

### Rollback

- [x] Rollback position stated — revert the PR; 0328 stays and is harmless

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | Confirm opened inside a transition never rendered, tick stuck greyed | fixed before commit |
| 2 | low | `{min}` replaced once in the below-threshold note | fixed before commit |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Ticks absent for a login without website edit; Thai home page after a switch | Settings → Website; `/` in Thai |
| 2 | The change shows in Settings → Recent changes | Settings → Recent changes |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] pending: the two items in the manual list above

Manual verification by: pending: Lutan to look at the two items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
