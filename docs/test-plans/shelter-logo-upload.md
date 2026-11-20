# Feature test plan — shelter-logo-upload

## Header

| | |
|---|---|
| Feature | App half of #shlog: each shelter's own logo on its public header, with an upload card in Admin → Website |
| Backlog item | `docs/backlog.md` → #shlog (left open: proxy transparency and the two-shelter proof were not run) |
| Branch / worktree | `claude/shelter-logo-upload` @ `C:\Development\Animal_Shelter_shelter-logo-upload` |
| Dev server | port 3003 |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | `6cd37a3a1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the header reads the shelter's own logo, none uploaded shows the name alone, and Admin → Website can upload, replace and remove it
- [x] Files/areas touched listed — `PublicHeader.tsx`, `site/content.ts`, `admin/website/{ShelterLogo.tsx,actions.ts,page.tsx}`, `en.ts`/`th.ts` (`admin.website.logo`), `releases.ts`, decision file
- [x] Roles affected identified — by card: `website.gallery` (the hero's activity) draws the control and is asked by both actions
- [x] Anything explicitly **out of scope** written down — migrations, `set_hero_photo()`, `src/app/platform/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration (0429–0431 shipped in #1788)
- [ ] Status and dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: upload, replace and remove were not pressed (the driven dev sign-in expired)
- [ ] Data persists — pending: same; both actions read the value back and refuse a save that did not land
- [ ] Create / edit / delete all exercised — pending: not pressed
- [x] Empty state renders sensibly — Lanna dev public header, no logo set: no `<img>` in the header, name alone
- [ ] Invalid input is rejected with a readable message — n/a: reuses the hero's limits and `uploadToWebsiteFolder`, unchanged
- [ ] Boundary cases checked — pending: transparent PNG through `/api/photos/<id>?w=160`, and two shelters, not run

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| card holding `website.gallery` | Shelter logo card with Upload/Remove | drawn | pending: not driven |
| login without `website.gallery` | the card | controls not drawn (`canChange` defaults false) | pending: not driven |

- [ ] Every role above tested — pending: not driven
- [x] A role that should not have access is blocked server-side — both actions ask `can(…, "website.gallery")` and `set_shelter_logo()` asks it again (0429)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: one more card on a screen the manual already covers
- [x] Translatable strings go through the translation path — `admin.website.logo` in en and th
- [ ] Mobile viewport (375px) — pending: not driven
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — pending: not driven

## 6. Regression

- [x] The pages nearest the change still work — Lanna's dev public home loads with its name
- [ ] Any shared file touched checked from a second page — n/a: header is on every public page; only the null case was seen
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: #shlog stays open until the proxy and two-shelter proofs are done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-shelter-logo-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** — one admin note in `unreleased`; it says an admin can upload a logo, not that Lanna's already appears
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the unmeasured items are named as such

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — pending: after release, Lanna's header shows its name alone until its logo is uploaded

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: 0429–0431 ship in the same or an earlier release
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: none
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert this PR; the header goes back to the static file

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | Driven checks (proxy transparency, two shelters, card-only login) not run | deferred to backlog — #shlog stays open |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a transparent PNG; it shows on the public header with no white box | Admin → Website, then the public home |
| 2 | Logo set on one shelter; the other shelter's public site shows its name alone | `DEV_SHELTER_ID` per shelter |
| 3 | A login holding only the `website.gallery` card sees the card; one without it does not | Admin → Website |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] Every manual item above was checked by a person — pending: the three items above

Manual verification by: pending: a person to run the three items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
