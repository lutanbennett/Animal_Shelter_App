# Feature test plan — account-menu-min-width

## Header

| | |
|---|---|
| Feature | The header's account-menu button no longer shrinks to 15.9 px wide on phones for Vet and Head of Medical logins |
| Backlog item | `docs/backlog.md` → *The header's account-menu button shrinks to 15.9 px wide on phones for some logins* |
| Branch / worktree | `claude/account-menu-min-width` @ `C:\Development\Animal_Shelter_account-menu-min-width` |
| Dev server | `preview_start` name `dev` → `http://localhost:3003` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (account-menu-min-width session), 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `6d6f2ad4` (after `sync`, origin/main at `dd682a12`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: below `sm` the account menu now wraps to its own row instead of shrinking into what row 1 leaves, and the button has a 44 px minimum width. The cause turned out to be the missing Assistant button, not the role name's length: Vet and Head of Medical have no `assistant.ask`, so row 1 had room beside the logo and Sign out, and the menu (`flex-1`, zero basis, `min-w-0`) squeezed into it
- [x] Files/areas touched listed: `src/app/AppHeader.tsx` (the menu's classes: `min-w-0` → `min-w-32 sm:min-w-0`), `src/app/AccountMenu.tsx` (`min-w-11` on the button; the wrapper's own `min-w-0` removed so the header's class decides), `src/lib/releases.ts`, `docs/backlog.md`
- [x] Roles affected identified: Vet and Head of Medical on phones (and any configured role without the assistant). Admin, Management, Staff measured identical before and after
- [x] Anything explicitly **out of scope** written down: Sign out, Open menu and Assistant sizes (#413), the name · role wording (#410), the button height (#432) — none changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 184s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; no query changed
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: reproduced first (`check-phone-width.mjs --roles=vet,head_of_medical --locales=en` noted "Account menu: … · Vet" and "… head_of_medica…" at 15.9 x 44 px on 11 and 10 pages), then measured after the fix with no note
- [ ] Data persists — n/a: a class change; nothing writes data
- [ ] Create / edit / delete — n/a: no create, edit or delete in this change
- [ ] Empty state — n/a: no list or data view changed
- [ ] Invalid input — n/a: no input
- [x] Boundary cases: the longest label in dev, Head of Medical in Thai ("Phone width head_of_medical · หัวหน้าฝ่ายการแพทย์"), measures 339.7 px on row 2 and truncates within the 375 px row; nothing scrolls sideways

### Role access matrix

Account-menu button at 375 px on `/home`, measured with a scripted copy of `check-phone-width.mjs` (disposable dev logins), before the fix and after it:

| Role | Before (en / th) | After (en / th) | Result |
|---|---|---|---|
| vet | 15.9 x 44 on row 1 / 15.9 x 44 on row 1 | 154.8 x 44 / 191.2 x 44, row 2 | fixed |
| head_of_medical | 15.9 x 44 on row 1 / 15.9 x 44 on row 1 | 327.8 x 44 / 339.7 x 44, row 2 | fixed |
| admin | 194.3 / 214.9, row 2 | 194.3 / 214.9, row 2 | unchanged |
| management | 245.0 / 242.4, row 2 | 245.0 / 242.4, row 2 | unchanged |
| staff | 173.4 / 190.2, row 2 | 173.4 / 190.2, row 2 | unchanged |

- [x] Every role above tested; `check-phone-width.mjs --pages=/home,/residents,/enclosures,/appointments` over all seven of its roles, en + th: 36 page views, no account-menu note, "No page scrolls sideways", "Every component action is at least 44 px"
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [x] Nav entry correct — n/a as a change; the header was checked against the new Shelter Operations nav (#448 is in this branch)
- [ ] Manual updated — n/a: the manual does not describe the header layout at phone width
- [ ] Translatable strings through the translation path — n/a: no string changed; classes only. Checked in Thai anyway (table above)
- [x] Mobile viewport (375 px): before/after screenshots of the header for vet and head_of_medical, en + th — before shows only the ▾ beside the language switch; after shows the name and role on their own row
- [ ] Browser console clean — n/a: driven by Playwright through the scripts, not inspected in the pane; the run reported 0 warnings
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] Pages nearest the change still work: the header on `/home`, `/residents`, `/enclosures`, `/appointments` for every role
- [x] Shared files checked from an unrelated page by loading it: the header is on every signed-in page; admin, management and staff measured identically before and after
- [x] Nothing merged from `main` during `sync` was broken: nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked on this branch, with a note naming the real cause. The *Bare buttons under 44 px* item was checked: its only open part is the photo lightbox, which this does not touch, so it stays open
- [ ] Non-obvious design choices recorded — n/a: the reason is in comments beside the class in `AppHeader.tsx` and in the backlog note; no decision file was needed for a class change
- [x] `README.md` still accurate (it does not describe the header)
- [x] **Release notes.** One line in `unreleased`: the name and role at the top are a proper button again on phones for vets and the head of medical
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: every width above is the button's `getBoundingClientRect()` at 375 px

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy time
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary assertions cover both edges — n/a: no threshold or band changed
- [ ] Evidence pasted is the tool's actual output — deferred: release manager at deploy time
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager at deploy time
- [ ] `strip-baked-env` seen — deferred: release manager at deploy time
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR, or roll the Pi back with `./scripts/pi/deploy-pi.sh --ref <sha>`. No data or schema changed, so a rollback is complete

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The backlog item blamed the role name's length; the cause was the missing Assistant button leaving room on row 1 | fixed (noted on the backlog item) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, signed in as a vet (or head of medical): your name and role sit on their own line under the logo, and tapping them opens the account menu | a phone, English and ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (account-menu-min-width session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — one item waits for Lutan

Manual verification by: pending: item 1 above needs Lutan to look on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — it is handed over when the next release is cut

Result: pass

Release manager acknowledgement: pending
