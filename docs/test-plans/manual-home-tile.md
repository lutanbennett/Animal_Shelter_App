# Feature test plan

---

## Header

| | |
|---|---|
| Feature | A User manual tile on every home screen |
| Backlog item | `docs/backlog.md` → `#ce6ec` (Documentation) |
| Branch / worktree | `claude/manual-home-tile` @ `C:\Development\Animal_Shelter_manual-home-tile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | 4e731397 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every home screen ends with a User manual tile, so a menu-off login can find the manual without opening a menu; no card was created
- [x] Files/areas touched listed: `src/lib/home/tiles.ts` (`manualTile`, `withManualTile`, `hasJobTiles`, `MANUAL_HREF`), `src/app/home/page.tsx`, `src/app/home/[role]/page.tsx`, `src/lib/home-icons/catalogue.ts`, `src/lib/manual/en.ts` (one sentence), `src/lib/releases.ts`, `scripts/check-home-screens.mjs`, three home tests and a new `src/lib/home/manual-tile.test.mjs`
- [x] Cards affected identified: none. The tile is the same for every login and comes from no card; a test asserts no card opens `/manual`. Admin sees it on `/home/<role>`; the signed-out public is unaffected (`/home` sends them to `/login`)
- [x] Anything explicitly **out of scope** written down: no card for reading the manual (Lutan's choice, 2026-11-08); a group's own page (`cardTilesFor`) does not carry the tile, on purpose (decision file); no Thai manual text exists to update

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date" at 4e731397)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 208s
=== gates: lint exited 0 after 575s
=== gates: test exited 0 after 132s
=== gates: build exited 0 after 555s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: one-card login (`--cards view_residents`), menu switched off on its disposable role, `/home` reached by clicking Home shows View residents and User manual; pressing User manual opens `/manual` (heading "User manual")
- [ ] Data persists — n/a: nothing is saved; the tile is computed on every load (it was still drawn after a full reload and click-through)
- [ ] Create / edit / delete all exercised — n/a: the feature is a link tile with no create, edit or delete
- [x] Empty state renders sensibly: a role with no job tiles still shows "Nothing here yet" (`hasJobTiles`), with the manual tile under it; asserted in `manual-tile.test.mjs` and `check-home-screens.mjs` (D)
- [ ] Invalid input is rejected with a readable message — n/a: no input on this surface
- [x] Boundary cases checked: no counts passed (`withCounts` early return) and counts passed both give exactly one manual tile; multi-role merged gives one, grouped gives one per group; Thai label renders (คู่มือการใช้งาน); 375px puts the two tiles side by side with no horizontal scroll

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/home/<role>` draws the tile (`homeTilesFor`) | tile shown | unit tests and `check-home-screens` B on every seeded role; not clicked in the browser |
| exactly `view_residents`, menu off | `/home`, then `/manual` from the tile | tile shown and opens the manual | pass (browser, 2026-11-08) |
| exactly `add_photos` + `contacts` across two roles | `/home` grouped | tile in each group | pass (`manual-tile.test.mjs`) |
| signed out | `/home` | redirected to `/login`, no tiles | unchanged code path (`redirect("/login")` first line) |

- [x] Every login above tested (as recorded in the Result column)
- [ ] A login that should not have access is blocked server-side — n/a: nobody is denied the manual; `/manual` loads for every signed-in login by design and its server checks are unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: NavLinks not touched; the left menu and account menu still link the manual
- [x] Manual updated (`src/lib/manual/en.ts`): one sentence in *Signing in* says the last tile is always User manual
- [x] Translatable strings go through the translation path: no new string; the tile uses the existing `t.nav.manual` in both dictionaries
- [x] Mobile viewport (375px) — no overflow, controls reachable
- [x] Browser console clean — no errors on `/home` and `/manual`
- [ ] Network clean — n/a: no new requests; the tile is a link drawn server-side

## 6. Regression

- [x] The pages nearest the change still work: `/home` (one role), `/manual`, `/residents` loaded by click in the browser; `check-home-screens`, `check-multi-role-build`, `check-permission-catalogue`, `check-hard-coded-security` pass; `check-home-cards` (`propose_website`) and `check-menu-coverage` fail identically on `main` at `8c9722aa`, before this branch
- [x] Any shared file touched checked from a second, unrelated page: `/residents` loaded by click with the changed `tiles.ts`, and the icon library's test passes with the manual added
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged nothing (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-08-manual-home-tile.md`
- [x] `README.md` still accurate: it does not describe home tiles
- [x] **Release notes.** A user will notice; `unreleased` gained one plain line for everyone (untagged, because every login gets the tile)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** `withCounts`'s early return read from the file; callers of each home builder found by grep; tile drawn and opened in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here depends on the date or time
- [ ] **For a boundary or banding change, both edges covered** — n/a: no threshold or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted evidence is the gates block in section 2, which is the run's own output
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated: redeploy the previous release on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema involved, so it is complete — deferred: production release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Found while building: `withCounts()` returns early when no counts are passed, so the brief's suggested placement (beside `withApprovalTile`) would have dropped the tile on `homeTilesFor` calls without counts | fixed: the tile is added outside `withCounts` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Director, on a real menu-off login and her phone, finds User manual on the home | production after release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Director looking at her own home after release

Manual verification by: pending: the Director to confirm she sees the User manual tile on a menu-off login

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: at the next release cut

Result: pass

Release manager acknowledgement: pending: next release cut
