# Feature test plan

## Header

| | |
|---|---|
| Feature | A role's home screen is its who-does-what tiles: nothing redirects away from `/home` any more, and the Doctor (sent to `/appointments`, which its cells refused) lands on its tiles like everyone else |
| Backlog item | `docs/backlog.md` → **A role's home screen is its who-does-what tiles, and the Doctor's broken `home_path` is the live case** (ticked here); also closes **Mobile sweep leftovers** (its `/appointments` line) |
| Branch / worktree | `claude/role-home-is-tiles` @ `C:\Development\Animal_Shelter_role-home-is-tiles` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #726 |
| Tested by / date | Claude / 2026-10-18 |
| Carries a migration? | no — `roles.home_path` is left unread, not cleared (`docs/decisions/2026-10-18-role-home-is-tiles.md`) |
| Tested at SHA | `b342791d` (after sync with `origin/main`: already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every non-Admin sign-in lands on `/home`, its who-does-what tiles, because the three hard-coded Doctor redirects (sign-in by role key, `/home` and `/my` by clinic scope) and the `home_path` redirect are removed — exactly "stop redirecting and let the tiles home draw"
- [x] Files/areas touched listed: `src/lib/auth/app-access.ts` (`signedInLandingPath`), `src/lib/auth/next-path.ts` (`DOCTOR_HOME_PATH` removed), `src/app/home/page.tsx`, `src/app/my/page.tsx`, `src/app/no-access/page.tsx`; both dictionaries (`noAccess.goToAppointments` removed); `src/lib/manual/en.ts` (sign-in step, Appointments intro and topic); `src/lib/releases.ts`; `scripts/check-menu-coverage.mjs`; `docs/decisions/2026-10-18-role-home-is-tiles.md`, `docs/backlog.md`, `docs/mobile-sweep-inventory.md`, `docs/roles-and-permissions.md`. No `supabase/migrations/`, no `worker/`
- [x] Roles affected identified: doctor (the landing changes from a refused `/appointments` to its tiles); every other non-Admin role (the `home_path` branch is removed, but no dev role had a value that redirected, so their landing is unchanged in practice); admin unchanged (device split untouched); signed-out public unchanged
- [x] Out of scope written down: Admin's device split; the Settings panel for choosing a role's tiles and any `role_home_tiles` table; removing the left-hand menu (`NavPane`, `layout.tsx`); `src/lib/permissions/cards.ts` and `PhotoGallery.tsx` (other streams' this batch); the Doctor's wider cell set (still Lutan's, red-harnesses item). Production's Doctor gets Appointments only when Lutan gives the role the Book clinic visits card on Who does what — the release note says so

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: "Already up to date"
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit code read directly (`gates exit 0`), output in a file:

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 167s
=== gates: test exited 0 after 6s
=== gates: build exited 0 after 320s
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR: #726, all 8 checks passing on `50a9731f` (read from the PR status, 2026-10-18)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0224` was offered for clearing `home_path` and deliberately not used (no dev row had a landing set; the column is unread instead)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration. Dev data changed by hand, recorded: the Doctor role was given the Book clinic visits card via `set_role_cards()` (the Who does what screen's own call), so `role_cards` has `book_clinic_visits` at position 2 and `role_permissions` gained `visit.book` and `medical.visits` read for the Doctor; a throwaway Doctor login (`rolehome-doctor-…@example.invalid`, doctor row linked to `[roster] Test Clinic`) was made and left
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; `roles.home_path` rows are untouched and simply no longer read
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration. The one production step is Lutan's, on the screen: Who does what → Doctor → Add a card → Book clinic visits

## 4. Functional checks

- [x] Happy path works end to end: signed in on dev at 375 px as the throwaway Doctor; the sign-in landed on `/home` with two tiles, View residents and Book clinic visits; tapping Book clinic visits opened `/appointments` ("Visits booked with your clinic", three empty groups), not `/no-access`
- [x] Data persists — n/a: nothing is written by the feature; reloading `/home` drew the same two tiles
- [ ] Create / edit / delete all exercised — n/a: the change is a landing page; nothing is created or edited
- [x] Empty state renders sensibly: `/home` keeps its "no tiles yet" section for a role whose cards draw nothing; on dev every live non-Admin role draws at least one tile (`check-home-cards.mjs`: doctor 2, volunteer 2, head_of_medical 4, head_of_maintenance 1, second_in_command 5, management 2), so no role lands on it. The role-by-role table is in the decision file
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked: `/my` as the Doctor (a clinic login with no tasks) now bounces to `/home` instead of the refused `/appointments`; `/no-access` offers the Home button to everyone (the Doctor's "Go to Appointments" button is gone, since it pointed at a page that could refuse); a `next` parameter on sign-in still wins over the home (`signedInLandingPath` unchanged for that case)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/home` → device split | unchanged: phone → Management home, desk → `/admin` | code path untouched (the `isAdmin` branch is above the removed lines); `check-phone-width` runs admin daily and was not rerun for this |
| management | `/home` → its two card tiles | unchanged | `home_path` is null on dev, so the removed branch never fired; `check-home-cards.mjs` ok (2 tiles = 2 cards) |
| second_in_command / head_of_medical / head_of_maintenance | `/home` → card tiles | unchanged | `home_path` is `/home` on dev, which the removed branch already treated as "draw"; `check-home-cards.mjs` ok for all three |
| doctor | `/home` → View residents, Book clinic visits; `/appointments` | lands on tiles, both open | driven in the browser pane in English and Thai at 375 px; `check-phone-width.mjs --roles=doctor --pages=/home,/appointments`: 4 views measured, 0 skipped |
| volunteer | `/home` → View residents, Enclosures | unchanged | `home_path` null on dev; `check-home-cards.mjs` ok |
| signed out | `/login` | unchanged: `/home` still redirects to `/login` | the `if (!user) redirect("/login")` line is above the change and untouched |

- [x] Every role above tested: the Doctor driven; the others by the scripts named, which read the live dev roles
- [x] A role that should not have access is blocked server-side: nothing was opened up — every tile still passes `canOpen()` / the card's bundle, and `/appointments` kept its own guard (it refused the Doctor before the card was given, which is how the defect showed)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: `NavLinks.tsx` untouched; the Doctor's menu is still Home, Appointments, Residents
- [x] Manual updated (`src/lib/manual/en.ts`): the sign-in step no longer says a doctor lands on Appointments; the Appointments section's intro and topic say it is a tile on the home when the Doctor role has the Book clinic visits card
- [x] Translatable strings go through the translation path: one string removed from both `en.ts` and `th.ts` (`goToAppointments`); `typecheck` holds the Thai dictionary to the English shape. No string added
- [x] Mobile viewport (375px): browser pane at 375 px for the Doctor's home and Appointments in both languages; `MSYS_NO_PATHCONV=1 node scripts/check-phone-width.mjs --roles=doctor --pages=/home,/appointments` printed `4 page view(s) measured (doctor; en + th), 0 skipped because the role cannot open them, 0 warning(s). … No page scrolls sideways. … Every component action is at least 44 px.`
- [x] Browser console clean: `read_console_messages` with errors only returned "No console logs" after the Doctor pass
- [x] Network clean — the sign-in, `/home`, `/appointments`, the Thai switch and `/my` all resolved to 200 pages; no failed request seen

## 6. Regression

- [x] The pages nearest the change still work: `/login` → `/home` (the landing), `/appointments`, `/my` (redirect), `/home` in Thai — all loaded as the Doctor. `/no-access` was not reached by the Doctor (it now opens its pages), so its button change is covered by `typecheck` and the build only
- [x] Any shared file touched checked from a second page: the dictionaries are read by every page (the Thai `/home` loaded and was translated); `next-path.ts` by the login and the public site's Open the app (sign-in exercised it); `app-access.ts` by the request proxy (every page load as the Doctor went through it)
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync was "Already up to date"; gates green after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: the item itself; also *Mobile sweep leftovers* (its last open line, `/appointments`, is now measured); notes added to *Choose each role's home tiles in Settings* (its Doctor clause is closed; part 3 stands) and *Thirteen dev check harnesses* (the Doctor's dev cells gained two through the card)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-18-role-home-is-tiles.md` — Lutan's ruling verbatim, the three redirects, why `home_path` is unread rather than cleared, what happened to the `own_clinic` redirect, the role-by-role table, and the dev data added
- [x] `README.md` still accurate: it does not describe the landing page; `docs/roles-and-permissions.md` did and was updated
- [x] **Release notes.** A shelter user notices this: `unreleased` in `src/lib/releases.ts` gained a line, written for a doctor and the admins, and it does not promise Appointments until Admin gives the Doctor role the card (the one step left for a person, named in the note)
- [x] Commit messages say why, not just what: the three redirects, Lutan's words, why no migration
- [x] **Claims in commit messages and decisions were measured, not reasoned**: every role's `home_path` and cards were read from dev with SQL; the three redirects were found by `grep` for `DOCTOR_HOME_PATH` / `own_clinic`; the orphan counts (68 → 66, Doctor 0) are the script's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (sign in as a doctor: lands on tiles)
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic in this change
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block and the phone-width line above are pasted as printed; nothing else was tabulated by hand
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: a code-only change; `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi restores the old landing. It does not cover the Book clinic visits card on the Doctor role, which is Who does what data and is removed on the same screen if ever unwanted

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/check-menu-coverage.mjs` referenced the removed redirect in two more places and crashed with `redirect is not defined` | fixed in `b342791d` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as a real doctor on a phone (English and Thai) and confirm the home shows View residents and Book clinic visits, and that Book clinic visits opens Appointments | `test.lannacare.org` after deploy, or dev with the throwaway login |
| 2 | On production, give the Doctor role the Book clinic visits card (Settings → Who does what → Doctor → Add a card) so a production doctor gets the Appointments tile | `lannacare.org`, Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items wait for Lutan, recorded on the signature line

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file; it is pasted on opening
- [ ] Handed to the production release manager — n/a: handed at release time, with the next cut

Result: pass

Release manager acknowledgement: n/a: not yet released
