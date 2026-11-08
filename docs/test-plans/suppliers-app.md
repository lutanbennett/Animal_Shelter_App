# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Suppliers leave Contacts: the app half (screen, card, readers, Shelter Friend from a supplier) |
| Backlog item | `docs/backlog.md` → #xkfsv (app half) |
| Branch / worktree | `claude/suppliers-app` @ `C:\Development\Animal_Shelter_suppliers-app` |
| Dev server | `preview_start` name `dev` → `http://localhost:3003` |
| PR | see the PR for branch `claude/suppliers-app` |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | yes — 0338 |
| Tested at SHA | 8b392cf2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — suppliers leave Contacts: Management → Suppliers, its card, readers re-pointed, a supplier can be a Shelter Friend (backlog #xkfsv, app half).
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/management/suppliers/**`, `src/app/suppliers/**`, `src/lib/suppliers/**`, deliveries and purchasing readers, Shelter Friend actions/wizard/card, Contacts lists and forms, permissions (catalogue, cards, routes), both dictionaries, manual, `supabase/migrations/0338` + harness. Full list in the decision file.
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — new card `suppliers` (activity `suppliers.directory`); `contacts` card no longer reaches suppliers; `publish_shelter_friends` (friends.manage) gains the supplier subject. Admin unaffected; signed-out public unaffected (the website view is unchanged).
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — dropping `supplier_contact_id`, `source_contact_id` and `stock_vendors` (a later PR); deleting Vendor contact rows; production proof.

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all four
gates (typecheck, lint, test, build) even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged before the gates (the branch was up to date with it).
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 64s
=== gates: lint exited 0 after 135s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 112s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — 0338, highest on `main` was 0337, no other branch carries one (`apply-migrations` printed `migration numbers: ok`).
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — clean.
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied 2026-11-08, `0338_suppliers_card.sql … ok`.
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `on conflict`, `drop policy if exists`, repeated back-fill.
- [x] Existing rows still read correctly after the change (checked against real dev data) — deliveries page lists existing history; dev holds no Vendor contacts so the back-fill moved nothing on dev (said so in the decision file).
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `supabase/harness/0338_suppliers_card_harness.sql` printed HARNESS-OK: card grants exactly one thing, edit/read/stock/Contacts-only logins, no delete, back-fill twice (1 then 0), Friend re-point stays public.
- [x] Down-migration written, or the reason one is not needed is stated — none: additive; undo is in the file header (restore 0335's policies, delete the card rows and activity).
- [x] Production apply plan stated for the release manager (which file, which project, when) — `node scripts/apply-migrations.mjs --env production` (bare) BEFORE the deploy: the code reads `suppliers` and the new activity. Production was not read from this worktree.

## 4. Functional checks

- [x] Happy path works end to end — add, edit, archive, restore a supplier; supplier page; Make a Shelter Friend from it; delivery recorded naming it.
- [x] Data persists — the edit and archive read back after the server action's refresh.
- [x] Create / edit / delete all exercised (whichever the feature has) — create, edit, archive, restore driven; there is deliberately no delete (the harness proves a delete touches nothing).
- [x] Empty state renders sensibly (no rows yet) — the card-only login first saw "No suppliers yet."
 — pending: an empty name and a bad Map link were not typed into the browser; the server returns the same messages as for contacts Invalid input is rejected with a readable message, not a crash
 — pending: long text and Thai input not driven Boundary cases checked (long text, zero, negative, missing optional fields, dates)

### Role access matrix

Sign in as each login that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*): roles are
a transient grouping of cards and get rebuilt, so a row naming one stops being true. Test a
login holding exactly the card under test (`node scripts/dev-signin.mjs --cards <card> --port <yours>`,
card keys, not activity names), plus admin (outside the card system) and signed out. Where a page
needs two cards together, put both on one row. Do not name `staff` (retired, `0173`) or `resident`
(not a role: a resident is an animal). Read card keys from `/admin/who-does-what`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management`, `/management/suppliers`, `/suppliers/<id>`, `/deliveries` | Everything opens; Make a Shelter Friend offered on a supplier | pass |
| exactly `suppliers` | Home tile, `/management/suppliers`, `/new`, `/suppliers/<id>` | List, add, edit, archive, restore work; no Shelter Friend controls | pass |
| signed out | any of the above | not driven in the browser; the guards are `requirePermission` on every page | pending |

- [x] Every login above tested — admin and exactly the `suppliers` card driven in the browser.
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — the harness proves the database refuses insert/update to a read login, a stock login and a Contacts-only login. The page-level redirect for a login with no card was not hit by URL.

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — tile on Home for the card; a Suppliers tile on the Management hub; no dead links (check-permission-catalogue, check-home-screens pass).
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic Managing suppliers and corrected Contacts/Friends/deliveries wording; read in `src/lib/manual/en.ts`, not opened at `/manual` in the browser.
- [x] Translatable strings go through the translation path, checked at `/management/translations` — dictionary strings in both languages (Thai unreviewed); nothing here is queue-translated content.
 — pending: not driven at 375px; the screen reuses the Contacts table and form classes Mobile viewport (375px)
 — pending: console not read during the drive Browser console clean
 — pending: network log not read during the drive Network clean

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — /deliveries (picker and recent list), /management/shelter-friends (list and wizard step 1), /management hub.
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `src/lib/i18n/dictionaries/*` and `manual/en.ts` loaded through /deliveries and /management (strings render); routes.ts through the Home tile.
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran on the merged tree.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — #xkfsv struck through for the app half and retitled; it stays open for the final column drop.
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-08-suppliers-app.md`.
 — n/a: README does not mention suppliers or Vendors `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. — `unreleased` gained a card-tagged line for `suppliers`. No step is outstanding that stops a user seeing it except the production apply, which runs before the deploy.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all … — what the decision file claims was measured (greps, check runs, the harness, the browser drive); the untested parts are listed there.

## 8. Pre-production gate

Owned jointly with the release manager. **Since the 2026-11-05 cutover:**
`lannacareforanimals.org` is **production** (`dbkodyyxxhtygxcxmfcu`);
`test.lannacare.org` is **test** on the **dev** project (`qxkmhwybjggxvsfxsxbd`);
`lannacare.org` is **UAT**, which is moving to its own project
(`fsjagxmxjosauwmxwype`) and runs against dev until that is finished
(`docs/decisions/2026-11-06-uat-own-database.md`). **`lannacare.org` is NOT
production** — it was until 2026-11-05, and this paragraph said so for two
releases afterwards, so any plan written from this template before 2026-11-06
names the wrong hosts.

### Tested build

 — deferred: release manager Tested SHA recorded in the header, and it is the tip of `main` at deploy time
 — deferred: release manager Deployed SHA matches the tested SHA

### On the deployed build

 — deferred: release manager Deployed to test: `npm run deploy:test`
 — deferred: release manager Smoke-tested on `test.lannacare.org`
 — n/a: no date logic added **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand.
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
 — n/a: no boundary or banding logic **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the … — the gates block above is the script's own output.
 — deferred: release manager Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait

### Deploy safety

 — deferred: release manager `deploy: production → Supabase project <ref>` line read and the ref **matches production**.
 — deferred: release manager `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output
 — n/a: no new secret or env var Any new secret/env var exists in the production Cloudflare environment

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. — yes: production apply of 0338 must come before the deploy.
 — deferred: release manager `node scripts/apply-migrations.mjs --env production --dry-run` run and clean
 — n/a: 0338 is additive (a policy narrowing and a re-pointing of Friends that stays reversible); no backup gate For a **destructive or rewriting** migration only: a production backup exists and is fresh.
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — 0338, production project, before the deploy.

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — redeploy the previous ref; 0338 is safe to leave (the old code reads `stock_vendors` and `contacts`, both untouched; Friends re-pointed to suppliers would show no card on the old Contacts page until rolled forward).

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Thai wording unreviewed by a Thai speaker | accepted |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | The five-step Shelter Friend wizard saves with an existing supplier and with a new supplier | /management/shelter-friends/new |
| 2 | Thai wording reads well | Suppliers screen, card label, wizard |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. — pending: the Left-for-manual rows below need a person

Manual verification by: pending: the two Left-for-manual rows need a person

### Result

- [x] Open defects are either fixed or explicitly accepted above — none open.
- [ ] Checklist pasted into the PR — pending: pasted once the PR exists
- [ ] Handed to the production release manager — pending: at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: at release time
