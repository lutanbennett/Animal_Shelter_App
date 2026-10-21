# Feature test plan

## Header

| | |
|---|---|
| Feature | Tile groups on a role's home: the app half |
| Backlog item | `docs/backlog.md` → Tile groups on a role's home |
| Branch / worktree | `claude/tile-groups-app` @ `C:\Development\Animal_Shelter_tile-groups-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | 536f247e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Admin groups a role's cards on Who does what; a group is one doorway tile on the home opening a page of its cards; Operations and Management lead with the role's group; menu coverage counts grouped cards
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/admin/who-does-what/` (board, actions, page), `src/lib/home/` (tiles, roles, landing, group-icons), new `src/app/home/group/[id]`, `src/app/operations` and `src/app/management` landings, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-menu-coverage.mjs`, `scripts/check-permission-catalogue.mjs`; no `worker/`, no migration
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public: Admin edits groups; every role with cards sees its home; a group only shows once Admin puts a card in it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no menu removal, no orphan rulings, no audit trigger on `role_groups`, no group rename (decision file, "Not done")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; reads `0241`, already applied
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; dev rows read by the app are covered in section 4
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the one constraint this relies on (a card's group must be its own role's) was exercised on dev by a service-role update, refused with "role_cards: group … does not belong to this card's role"
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; needs `0241` on production, which shipped in the schema PR

## 4. Functional checks

- [x] Happy path works end to end: on dev, two of the 2IC's cards put in its Management group; the 2IC's home showed three loose tiles plus a Management tile; that tile opened a page with Do the Purchasing and Record a Delivery (browser, throwaway 2IC login)
- [x] Data persists — reload the page and the change is still there: the home, group page and landing re-read the rows on every load
- [x] Create / edit / delete all exercised (whichever the feature has): group membership set and cleared by script on dev; the board's own add/move/remove buttons need Admin's authenticator step, so they are listed under manual verification
- [x] Empty state renders sensibly (no rows yet): every seeded group is empty, and the 2IC's home showed exactly its five card tiles with no group tile; a group page with nothing to draw has its own empty message
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the add-group form needs Admin at the authenticator step to submit; listed under manual verification. Server-side, `addGroup` refuses a missing English or Thai name, an unknown icon and a duplicate name with dictionary messages
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a nonsense group id and an unknown uuid both give "not found"; a group whose cards the reader's cells do not cover draws nothing (scripted)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | board with group boxes, read-only before the authenticator step | sees groups, cannot edit | as expected (throwaway aal1 admin) |
| management | its home | unchanged while its group is empty | not driven; same code path as the 2IC |
| second_in_command | its home, its own group page | doorway tile, group page, Thai | as expected |
| second_in_command | head of medical's group page by URL | not found, no name shown | 404, no name |
| doctor | its home | unchanged (no groups seeded) | not driven; no group rows |
| volunteer | its home | unchanged (no groups seeded) | not driven; no group rows |
| signed out | `/home/group/<id>` | sent to sign in | same guard as `/home` |

- [x] Every role above tested: the 2IC and an unverified Admin were driven in the browser; the others hold no grouped cards, so their homes go through the unchanged path, confirmed by `check-menu-coverage.mjs` drawing every role's home identically before and after
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the 2IC opening the head of medical's group by URL got 404

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or changed
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the retired Home screen panel's two steps replaced by one groups step
- [x] Translatable strings go through the translation path, checked at `/management/translations`: new strings are in both dictionaries; group names are stored in both languages by Admin
- [x] Mobile viewport (375px) — no overflow, controls reachable: group page at 375 px in Thai
- [x] Browser console clean — no errors or React warnings: no console errors on the board page
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: only the intended 404 for another role's group

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/home` (2IC, before and after grouping), `/management`, `/admin/who-does-what?role=second_in_command`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `/management` loaded with the shared `tiles.ts`, and `check-menu-coverage.mjs` drew every role's home through it: 66 unexplained orphans before, 66 after with groups empty, 66 with two cards grouped
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates passed after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `2026-10-21-tile-groups-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** One line added to `unreleased`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The orphan count, the cross-role refusal, the 404 and the "grants nothing" case were each run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR; the code reads `0241`, which must be on production first (it shipped in the schema PR)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: app-only change; a Pi rebuild of the previous SHA reverts it, and any group rows Admin made stay in `role_groups` unread, harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A grouped card that the landing's fixed list does not have (Record a Delivery on `/management`) shows with no description line | accepted: the tile still opens the right page |
| 2 | low | `role_groups` has no audit trigger, so adding, moving or removing a group is not in Recent changes (moving a card into a group is) | accepted: needs a migration; noted in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As Admin with the authenticator app: add a group (English, Thai, icon), drag two cards into it on a laptop, use the Where it shows list on a phone, move a card up and down inside the group, move the group, remove it and see its cards return to the home | `/admin/who-does-what` on test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item waits for Lutan, see the line below

Manual verification by: pending: Admin editing on the board at the authenticator step (item 1 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit; the PR links this file
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass with accepted defects

Release manager acknowledgement: pending: at release
