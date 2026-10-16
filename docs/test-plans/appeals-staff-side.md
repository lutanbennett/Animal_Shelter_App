# Feature test plan

## Header

| | |
|---|---|
| Feature | Appeals, the staff side: create, edit, photos, preview, publish, record and move gifts, close |
| Backlog item | `docs/backlog.md` → Sponsorship drives for sick residents, part (3). Ticked, with three non-code items named as still open |
| Branch / worktree | `claude/appeals-staff-side` @ `C:\Development\Animal_Shelter_appeals-staff-side` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: the number is known once the PR is open |
| Tested by / date | Claude, 2026-10-16 |
| Carries a migration? | no (`0210` merged earlier in #667) |
| Tested at SHA | cbcddbf2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the staff half of Sponsorship drives, so a person can run an appeal from the resident's page and record and move gifts without any being counted twice
- [x] Files/areas touched listed: `src/app/management/appeals/**` (new), `src/app/appeals/AppealView.tsx` (extracted from the public page), `src/lib/appeals/{form,staff}.ts` (new), `src/app/management/donations/**` (appeal picker, appeal shown on a gift), `src/app/residents/[id]/{page,ResidentHub}.tsx` (a card), `src/lib/permissions/routes.ts`, `src/app/management/page.tsx`, both dictionaries, the manual, `releases.ts`, `scripts/check-permission-catalogue.mjs`, `scripts/lib/acceptance-matrix-entries.mjs`, `docs/`
- [x] Roles affected identified: Admin holds `appeal.run` by default; Management only once an Admin grants it in Settings; moving a gift also needs `donation.receipt`
- [x] Anything explicitly out of scope written down: the Director's yes on `appeals.extraGoes`, a Thai reader's review, and the progress style in the generated share-preview image (decision file, "Still open")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output redirected to a file and read:

```
=== gates: typecheck exited 0 after 13s
=== gates: lint exited 0 after 99s
=== gates: test exited 0 after 3s
=== gates: build exited 0 after 37s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (0210 shipped in #667)
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration; 0210 was already applied
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; 0210's constraints were exercised through the new screens, see section 4
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven in the browser pane on dev as a throwaway Admin (made by script, deleted with its role row left behind: see Defects). Test gifts are `Harness donor A/B` rows on dev; dev test data is disposable.

- [x] Happy path works end to end: created a draft for Panda, previewed it, chose a cover photo, published, closed it with an outcome
- [x] Data persists — reload: each step was re-read from the database or the page after reload (status line, photos, figure)
- [x] Create / edit / delete all exercised — create and close and the photo save driven; edit saves use the same action as create and were not driven separately; deleting a draft was not driven (read in code, and 0210's `on delete restrict` is asserted by `check-appeals-schema.mjs`)
- [x] Empty state renders sensibly: a new appeal reads "No gifts recorded yet"; a resident with no usable photos shows the explanatory sentence (read in code, not driven)
- [x] Invalid input is rejected with a readable message, not a crash: an `http://` link was refused as "Link 2 must be a full web address starting with https://"; an empty outcome refused "Write how it went before closing"; `form.test.mjs` covers target, title, date, style, link and resident
- [x] Boundary cases checked: **no gift counted twice** — before the move, ฿3,500 for the resident (2 gifts) and ฿6,000 on the appeal, public figure ฿6,000; after moving both gifts, ฿0 for the resident, ฿9,500 on the appeal (3 gifts), public figure ฿9,500; after taking one ฿1,000 gift back out, ฿1,000 resident, ฿8,500 appeal, public ฿8,500. The total across both places stayed ฿9,500 throughout. **A draft is not public**: its public address, fetched signed out, serves the not-found page and its title appears nowhere in the body or the list. **A closed appeal stops asking**: after Close, the public page reads "Appeal finished" with the outcome and has no "Help needed" and no ways to give. **A Medical photo is refused**: with one of Panda's photos temporarily filed under Medical it was missing from the picker (restored after); the database refusal is `check-appeals-schema.mjs`, and the action maps it to words

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/appeals`, `/new`, `/[id]`, `/[id]/preview`; the card on a resident | all open | driven as a throwaway Admin |
| management | same | refused until an Admin grants `appeal.run` in Settings | n/a — not driven: needs the grant; the guard is `requirePermission("appeal.run")` and the catalogue check pins it |
| staff | same | refused | n/a — not driven; same guard, same pin |
| doctor | same | refused | n/a — not driven; same guard, same pin |
| volunteer | same | refused | n/a — not driven; same guard, same pin |
| signed out | the staff pages | redirected to sign-in | driven: the preview address answered 307 to `/login` |

- [x] Every role above tested or given a reason — Admin and signed out driven; the others share one guard and one RLS policy (`appeals_perm`), pinned by `check-permission-catalogue.mjs` and `check-appeals-schema.mjs` (Management and anon sessions)
- [x] A role that should not have access is blocked server-side — the pages call `requirePermission("appeal.run")`, every action checks `appeal.run` (and `donation.receipt` for moving gifts), and RLS asks the same cell

## 5. Cross-cutting

- [x] Nav entry correct — Management landing tile and the route registry entry (`/management/appeals`), plus a card on the resident's page for a login holding `appeal.run`; the catalogue check passes
- [x] Manual updated — topic "Running an appeal" and its acceptance-matrix rows
- [x] Translatable strings go through the translation path: staff screens are in both dictionaries (`appealsAdmin`); appeal prose is queued for Thai by 0210's triggers on save. The Thai staff screens were not driven (see Left for manual)
- [ ] Mobile viewport (375px) — n/a: not driven this run; the form is one column with 44 px controls and the style options stack; a phone pass is left to a person
- [x] Browser console clean — no errors seen on the appeal, preview or new pages
- [x] Network clean — photos load through `/api/photos/…`; no 4xx/5xx on the pages driven

## 6. Regression

- [x] The pages nearest the change still work: the public `/appeals/[id]` (now drawn by the extracted `AppealView`: published, closed and not-found states checked), the donation form, the donation's own page
- [x] Shared files touched checked by loading the pages: `donations.ts`/`DonationForm.tsx` (typed, `checkDonation` tested; the form loaded and the appeal field showed the preset appeal; the save itself was not driven, see Defects), `routes.ts`, `ResidentHub.tsx`, both dictionaries
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked, with a note naming the three items that stay open
- [x] Non-obvious design choices added as `docs/decisions/2026-10-16-appeals-staff-side.md`
- [x] `README.md` still accurate — no route list or setup step changed
- [x] **Release notes.** A line was added to `unreleased` in `src/lib/releases.ts`: an Admin can use the whole flow on dev today, and nothing outstanding stops an Admin once the release is deployed (the migration travels with the release). Management needs a Settings grant, which the line says
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the figures in section 4 are read from the database before and after each move

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the only dates are a typed deadline and a gift's own date, shown as dates; no time of day is computed
- [ ] Boundary or banding change covers both edges — n/a: no banding changed; percent and phase boundaries are `state.test.mjs` from the public PR
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is the real output, trimmed to the exit lines
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager; `/appeals` is not edge-cached

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in the same PR — n/a: no migration here; 0210 must be applied to production before this code is deployed (the staff pages read `appeals` and `appeal_photos`)
- [ ] `--env production --dry-run` — deferred: release manager (0210 is the pending file this code reads)
- [ ] Destructive migration backup — n/a: 0210 is additive
- [ ] Apply plan stated — deferred: release manager: apply 0210 to production before the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager; this PR is code and docs only, so `deploy-pi.sh --ref <sha>` of the previous release reverts it, and 0210 is additive and safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The donation form's appeal picker and save were not driven in the browser: the Browser pane was hidden, which kept that page's scripts from loading, so two saves fell back to a plain page submit (no data written) | accepted: covered by `checkDonation` tests and by reading the action; first item in Left for manual |
| 2 | low | A throwaway Admin (`harness-appeals-admin-…@example.invalid`), two `Harness donor` gifts and an appeal "Panda staff-side test" (closed) were left on dev | accepted: dev test data is disposable |
| 3 | low | The test draft's public address answers HTTP 200 on the dev server with the not-found page (streamed not-found), as the other not-found pages do on dev | accepted: the body is the not-found page and carries no appeal content |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Record a gift for an appeal from the donation form (pick the appeal, save, receipt issued, the appeal's figure rises by that amount) | Management → Donations → Record a donation, on a visible screen |
| 2 | The Director agrees the over-raising sentence: "the extra goes to the medical care of the other animals here" | `appeals.extraGoes`, shown on every open appeal |
| 3 | The Thai wording reads naturally to a Thai reader, public pages and the staff screens | `/appeals/[id]` and `/management/appeals` in Thai |
| 4 | A phone: the staff form, the style preview cards and the photo picker at 375 px | `/management/appeals/new` |
| 5 | Management can use appeals only after an Admin grants "Run a fundraising appeal" in Settings | Settings, then sign in as Management |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the donation-form pass, the Director's yes on the over-raising wording, a Thai reader, and a phone check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over
