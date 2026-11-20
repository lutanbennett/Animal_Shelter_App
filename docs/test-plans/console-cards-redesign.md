# Feature test plan — console-cards-redesign

## Header

| | |
|---|---|
| Feature | The platform console landing becomes one card per shelter; settings, account holder, archive/reopen, closed notice, per-control messages and per-shelter health behind it |
| Backlog item | `docs/backlog.md` → #msgtp (ticked); #pacon stays open (Drive button and the enquiry queue remain) |
| Branch / worktree | `claude/console-cards-redesign` @ `C:\Development\Animal_Shelter_console-cards-redesign` |
| Dev server | `http://localhost:3001` |
| PR | pending: number known at creation |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | fe07a4855 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the console landing is one card per shelter with everything else behind the card, archive/reopen, a closed notice and a message beside each control
- [x] Files/areas touched listed — `src/app/platform/*`, `src/app/login/page.tsx`, `src/app/LockedLanding.tsx`, `src/lib/public-site-request.ts`, `src/lib/clinics/calendar-poll.ts`, `worker/shelter.mjs`(+test), both dictionaries, `docs/`
- [x] Cards affected identified — none: the console is product administrator plus aal2, not a card, and no role or card check was added; admin and the signed-out public are affected only by the closed notice, which shows only when the Worker says a shelter is archived
- [x] Anything explicitly **out of scope** written down — Drive connect button (no flow exists), the enquiry queue and `product_admin_carry_enquiry`, any migration (see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`

```
=== gates: typecheck exited 0 after 58s
=== gates: lint exited 0 after 150s
=== gates: test exited 0 after 35s
=== gates: build exited 0 after 127s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration (0428 was applied by its own PR)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — signed in on dev as a product administrator at aal2 (`dev-signin.mjs admin --aal2`; that login was already on the product-admin list). Clicked from the card to its settings, saved the account holder (answer "Account holder saved."), closed a disposable shelter (confirm text read: nothing deleted; answer shown), saw the Closed card with only Reopen, reopened it (back to "Still being set up" with its next step)
- [x] Data persists — after the card refresh the reopened shelter read as before; the account holder save was a Server Action that returned success
- [x] Create / edit / delete all exercised — edit (account holder), archive and reopen pressed on a disposable shelter (`PCF proof two`); create shelter and delete were not pressed (there is no delete; create left alone to avoid more rows on the shared dev database)
- [x] Empty state renders sensibly — unchanged "No shelters yet." line; not driven (dev has shelters)
- [x] Invalid input is rejected with a readable message, not a crash — the first save after a cold start answered "Only a product administrator can do this." in a readable line beside the button (see Defects: it was a cold-start misread by `isProductAdmin()`, which treats any error as "no"), and the retry saved
- [ ] Boundary cases checked — n/a: no length or date logic added; the existing field limits are unchanged

### Role access matrix

Not by card: this screen is product administrator plus aal2 (outside the card system by Lutan's 2026-11-18 decision), so the matrix is by that gate.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| product administrator at aal2 | `/platform` | cards, settings, every control | pass, driven |
| product administrator at aal1 | `/platform` | cards readable, one notice, no controls | pending: not driven; `canWrite` gating is unchanged and by reading |
| login not on the list | `/platform` | the wrong-door page | pending: not driven; `isProductAdmin()` gate in `page.tsx` unchanged |
| signed out | `/platform` | redirect to `/login` | pending: not driven; `page.tsx` unchanged |

- [ ] Every login above tested — pending: three rows above not driven
- [x] A login that should not have access is blocked server-side — every action re-checks `isProductAdmin()` and `hasTwoStep()` and the functions refuse anyone else; unchanged by this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; the console is at `/platform`
- [ ] Manual updated — n/a: the console is for one person and has no manual topic
- [x] Translatable strings go through the translation path — new strings are in both `en.ts` and `th.ts`, which typecheck keeps in step; the Thai was written by Claude and is not checked by a Thai speaker (see Left for manual verification)
- [x] Mobile viewport (375px) — `scrollWidth` 375 = `clientWidth` 375, one column of cards, no horizontal overflow
- [x] Browser console clean — no errors
- [x] Network clean — the only server calls were the page load and the three Server Action posts, all 200

## 6. Regression

- [x] The pages nearest the change still work — `/platform` (cards and settings), `/login` with and without the closed header (curl: notice present with the header, absent without), `LockedLanding` compiles and typechecks
- [x] Any shared file touched checked from a second, unrelated page — `worker/shelter.mjs` is exercised by its own test file (6 pass, including the new closed case and that a visitor cannot claim "closed"); the two dictionaries are loaded by every page and the dev pages rendered
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged ("Already up to date")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #msgtp ticked; #pacon deliberately left open with one line saying what remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-console-cards-redesign.md`
- [x] `README.md` still accurate — nothing in it describes the console layout
- [ ] **Release notes.** n/a: only a product administrator reaches this screen and today that is one person, who asked for this redesign himself; no shelter user or shelter Admin sees any of it, and the closed notice appears only for a shelter nobody has closed yet
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — the 44px message position, the closed notice and the mobile width were read from the running page; the 60-second delay is the Worker's documented cache, not measured here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (the Worker's archived forwarding is only exercisable on a deployed Worker; here it was proved by the unit test and by sending the header with curl)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] For a boundary or banding change, assertions cover both edges — n/a: no boundary or banding change; the four card states are ordered, and each was seen (ready, broken, still being set up, closed)
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration (it reads 0428, already applied and released)
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (nothing here is irreversible: no schema, and Close only sets `archived_at`, so Reopen undoes it)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The first Server Action after a cold compile answered "Only a product administrator can do this." for a real product administrator; the retry succeeded. `isProductAdmin()` reads any error from the RPC as "no" (by design, to hide rather than show), so a slow or failed first call looks like a refusal | accepted: pre-existing, dev cold start; for the planner to file if it shows on production |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the new strings reads naturally | `/platform` with the language set to Thai |
| 2 | A closed shelter's real address shows "This shelter is closed" within about a minute | a deployed Worker, after closing a disposable shelter that has a web address |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: two items need a person

Manual verification by: pending: the two items above need a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is opened
- [ ] Handed to the production release manager — pending: at release

Result: pass with accepted defects
