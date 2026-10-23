# Feature test plan — auto-tiles-out

## Header

| | |
|---|---|
| Feature | App half of removing the automatic home tiles: a role's home is exactly its cards and groups; Operations and Management become cards |
| Backlog item | `docs/backlog.md` → **URGENT, LIVE ON PRODUCTION: the Volunteer home shows an Operations tile nobody chose** (left open: the quick patch is this PR; the full hard-coding sweep is the rebuild) |
| Branch / worktree | `claude/auto-tiles-out` @ `C:\Development\Animal_Shelter_auto-tiles-out` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` |
| PR | to be filled when opened |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no — its seed is `0251`, merged in #881 and applied to dev |
| Tested at SHA | tip of `claude/auto-tiles-out` after sync with `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `landingTiles()` and `RULED_CARDS` deleted; `operations_landing` and `management_landing` added as cards that grant nothing
- [x] Files/areas touched listed — `src/lib/home/tiles.ts`, `src/lib/permissions/cards.ts`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `scripts/check-cards-count.mjs`, `scripts/check-cards-schema.mjs`, three test files, one decision file, this plan
- [x] Roles affected identified — every role with cards: its home loses any tile it had no card for. The seed (`0251`) restores the ones Lutan kept; Operations and Management are dropped for all
- [x] Anything explicitly **out of scope** written down — `JOBS_OF_ROLE`, `CURATED_HOME`, `OUTSIDE_REGISTRY`, `FIXED_FOR_NOW`, role-key ordering and the home of a role with no cards (the rebuild); the patch release and production deploy

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought `0251` and docs)
- [x] `node scripts/gates.mjs` ends green, read from its own output (run before the sync, which added only a migration and docs):

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — deferred: checked on the PR before merging; that is the one line this plan cannot honestly tick until CI has run

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; the seed is `0251` (#881)
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: `0251` was applied from #881
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; the effect of `0251` is in #881's plan
- [ ] Constraints and defaults exercised — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; the order is stated in section 8

## 4. Functional checks

- [x] Happy path works end to end — signed in as the dev Volunteer (`dev-signin.mjs`, aal1): the home shows View residents, Enclosures and My tasks, and no Operations tile
- [ ] Data persists — n/a: nothing is written by this change
- [ ] Create / edit / delete all exercised — n/a: no new write path; giving or taking a card on Who does what is the existing flow, not exercised here
- [ ] Empty state renders sensibly — n/a: a role with cards always has at least its cards; a role with none keeps the derived home, unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: covered by unit tests (wide cells, role keys, card given and taken)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| volunteer | home tiles | no Operations tile; cards only | pass, in the browser on dev |
| other roles with cards | home tiles | cards only | pass in unit tests; not signed in as each |
| admin | home | unchanged (no cards) | not exercised |

- [ ] Every role above tested — n/a: access did not change, only the tiles; one role in the browser, the rest by unit test
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change (the left menu still lists Operations; it is separate from the home tiles)
- [ ] Manual updated — n/a: the manual does not describe the automatic tiles
- [x] Translatable strings go through the translation path — the two new card names and descriptions are in `en.ts` and `th.ts`; the Thai text was written by Claude and has not been read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — `check-home-cards.mjs` against dev: 0 failures
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `tiles.ts` is read only by the home
- [x] Nothing merged from `main` during `sync` was broken by this branch — only a migration and docs came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: left open on purpose; the item's full sweep of hard-coded rules is still to do. A status note goes on the `backlog` branch, not this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-23-home-is-only-its-cards.md`
- [x] `README.md` still accurate — it does not describe the automatic tiles
- [ ] **Release notes.** — n/a: the production seed (`0251`) is still outstanding; the release-note truth rule forbids a line while a manual step is open, so the line goes in the PR that closes it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — orphan counts from `check-menu-coverage.mjs` on dev (25 on `main`, 107 here); the tile list from the old logic run against dev roles

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no migration here; this code assumes `0251` is on production first, or those roles lose the tiles until it is
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [x] Apply plan stated — `0251` on production before this code is deployed; the deploy is Lutan's

### Rollback

- [x] Rollback position stated — redeploying the previous build restores the automatic tiles; `0251`'s rows are ordinary cards and can stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/dev-signin.mjs` drops the role when `--cards` is absent and the role comes first (`i !== cardsIdx + 1` with `cardsIdx = -1` excludes index 0); `--port N <role>` works | deferred to backlog |
| 2 | info | `check-menu-coverage.mjs` unexplained orphans rise from 25 to 107 on dev | accepted: reported, not acted on, as the brief says; each is a card for Lutan to give or not |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Give a role the Operations card on Who does what: the tile appears; take it away: it goes | `/admin/who-does-what` on test |
| 2 | Management, Second in command, Head of medical and Head of maintenance homes show the tiles Lutan kept | each role's home on test |
| 3 | The Thai wording of the two new cards | Who does what in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are left for a person

Manual verification by: n/a: not yet verified by a person; the three items above are open

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
