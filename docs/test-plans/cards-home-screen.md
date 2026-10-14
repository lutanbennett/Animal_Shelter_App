# Feature test plan — cards-home-screen

## Header

| | |
|---|---|
| Feature | The home screen is the role's cards: one tile per card, in the order Who does what keeps, each opening a page the role can use |
| Backlog item | `docs/backlog.md` → **Who does what, simplified into cards …** (left open; this is stream 3 of 4) |
| Branch / worktree | `claude/cards-home-screen` @ `C:\Development\Animal_Shelter_cards-home-screen` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `2b688afb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a role that has cards shows exactly those as its home tiles, in order, and a tile is drawn only for a page the role can open
- [x] Files/areas touched listed — `src/lib/home/tiles.ts` (`cardTile`, `cardTilesFor`), `src/lib/home/roles.ts` (`loadRoleCards`), `src/app/home/page.tsx`, `src/app/home/[role]/page.tsx`, `src/components/HomeTiles.tsx` (tile key), `scripts/check-home-cards.mjs` (new), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`
- [x] Roles affected identified — every role that has cards (doctor, head_of_maintenance, head_of_medical, management, second_in_command, volunteer) sees a card-built home; admin's homes and roles with no cards are unchanged; no access changes (cells are not written)
- [x] Anything explicitly **out of scope** written down — the left-menu removal (stream 4); no migration; no card added, renamed or merged; a person with several roles (`my_permissions()` returns one); extras give no tile by design

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see the PR for the merge state; `origin/main` merged before the PR was opened
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit codes read from the script's own output:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; `role_permissions` before and after is in section 4
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration; `0194` (already in the next release) must be applied to production before this deploys

## 4. Functional checks

- [x] Happy path works end to end — `scripts/check-home-cards.mjs` builds each role's permissions from the live dev cells, runs `cardTilesFor` in English and Thai and ends `all ok`: every card a role holds has a tile (or is subsumed by a held card that includes it and opens the same page), no tile exists without a card, tiles are in `role_cards` order. Not driven as a signed-in 2IC in a browser: see Left for manual verification
- [x] Data persists — n/a in effect: this change only reads; ordering is `role_cards.position`, written by Stream 2's Move up / Move down
- [ ] Create / edit / delete all exercised — n/a: the home screen creates nothing
- [x] Empty state renders sensibly — a role with no cards, or whose cards all give no tile, falls back to the derived home or the existing "nothing here yet" panel (unchanged code)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked — a card that another held card includes and shares a page with (View residents under Residents) draws no second tile; cards whose bundle the cells do not cover, or whose page is refused, draw no tile at all (`cardTile` returns null) — a second lock, never triggered by the seeded data (the script would fail on it)

**`role_permissions` was not touched** (nothing in this PR writes it). Hashed per role by the script (sha256 of the sorted `activity=level` list, first 12), read live from dev before and after the checks, same both times:

```
admin                     e3b0c44298fc (0 cells)
doctor                    14196ca70922 (2 cells)
head_of_maintenance       fce6bae7a63d (8 cells)
head_of_medical           15b2df889e59 (9 cells)
management                e8979aa8ea33 (57 cells)
public_viewer             e3b0c44298fc (0 cells)
second_in_command         af17346e5794 (22 cells)
volunteer                 76835ba4b10a (5 cells)
```

(The cell counts equal Stream 2's; its hashes used a different recipe, so only the counts compare.)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/home`, `/home/<role>` | phone → Management preview, desk → Settings; the preview shows that role's cards | pass — code path unchanged for the redirect; preview reads the role's cards with the same loader; not driven in a browser |
| management | `/home` | Recurring jobs and Residents tiles | pass — script (en and th) |
| second_in_command | `/home` | its 5 cards as 5 tiles | pass — script |
| head_of_medical | `/home` | its 4 job cards as 4 tiles | pass — script |
| head_of_maintenance | `/home` | Do Maintenance | pass — script |
| volunteer | `/home` | 2 tiles | pass — script |
| doctor | `/home` | sent to appointments as before | pass — script checks its 1 tile; the redirect is unchanged code |
| staff | `/home` | retired role | n/a: retired (`0173`), no login holds it |
| signed out | `/home` | sent to /login | pass — unchanged code |

- [x] Every role above tested — all live roles with cards by script; admin, doctor and signed-out redirects are unchanged code
- [x] A role that should not have access is blocked server-side — unchanged: tiles are links, the pages and the database still refuse; `role_cards` is read with the service role for one role key only

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added or moved (the left menu is stream 4)
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly — a paragraph on the home screen added to the Who does what topic; not loaded at `/manual` on screen
- [ ] Translatable strings go through the translation path — n/a: no new words; tile labels are the cards' existing labels in both dictionaries (the script renders every held card in Thai)
- [ ] Mobile viewport (375px) — n/a: the tile grid component is unchanged (two across at 375 px); not re-driven; see Left for manual verification
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still work — `scripts/check-home-screens.mjs` (part of lint) passes unchanged: the derived home for roles with no cards is intact
- [x] Any shared file touched checked from a second, unrelated page — `HomeTiles.tsx` only changed its list key; the build compiles every reader
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, stream 4 remains; STATUS notes added to the cards item and to *Choose each role's home tiles* (parts 1 and 2 built, part 3 remains). Searched the backlog for `home page`, `tiles` and `jobs.ts`; nothing else is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-14-home-screen-is-the-roles-cards.md`
- [x] `README.md` still accurate — it does not describe the home screen
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for every member of staff: the home screen is now the role's cards, chosen per role. No manual step is outstanding (the Worker deploy is the normal release)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — "no tile without a card, no card without a tile" is the script's output; "access did not change" is that nothing writes `role_permissions`, plus the identical live hashes

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the script and gates output above are the tools' own
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR; it reads `role_cards` from `0194`, which must be applied to production first or Home errors on a missing table
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration of this PR's own; `0194` goes first

### Rollback

- [ ] Rollback position stated — n/a: code only; reverting restores the derived homes and changes no one's access

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Management's curated home showed an intake shortcut and My tasks as well; from cards it shows Recurring jobs and Residents only | accepted — intake is one tap in Residents; recorded in the decision file |
| 2 | info | A person with several roles gets one role's cards (`my_permissions()` returns one role) | deferred — outside this stream |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan's acceptance test: as Director give the 2IC View residents, sign in as a 2IC on test and see a Residents tile with no edit buttons; swap for Residents and see edit and photo upload; give the 2IC Enclosures and see that tile open | `/admin/who-does-what`, then `/home` as the 2IC |
| 2 | The home at 375 px on a phone looks right and tapping every tile opens its page | `/home` on a phone |
| 3 | The Home paragraph in the Who does what manual topic reads correctly | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and only the person who looks may tick this; it is recorded as pending on the signature below

Manual verification by: pending: the 2IC acceptance walk-through, the phone view and the manual topic need a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and linked from the PR description
- [ ] Handed to the production release manager — n/a: handed over when the release is cut, after merge

Result: pass

Release manager acknowledgement: pending
