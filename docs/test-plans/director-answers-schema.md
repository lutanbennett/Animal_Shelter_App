# Feature test plan

## Header

| | |
|---|---|
| Feature | `0155_director_answers_schema.sql`: four of the Director's 2026-10-07 answers: Management and the 2IC browse Contacts (new cell `contacts.browse`, the 2IC reads name and phone); Management records a microchip; staff keep the Shelter Friend card (new cell `friends.view`, N3 deleted); the vaccine picker loses the price (`picker_immunization_types`) |
| Backlog item | `docs/backlog.md` → three items ticked (immunizations, microchip, Shelter Friend card); the **contacts item stays open** with a status line, option (c) filed on the `backlog` branch |
| Branch / worktree | `claude/director-answers-schema` @ `C:\Development\Animal_Shelter_director-answers-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` (throwaway management, staff and 2IC logins made and deleted by script) |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-07 |
| Carries a migration? | yes: `0155_director_answers_schema.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for: four Director answers become cells, one function, one view and two policies, with the pages, manual and release notes that go with them
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0155_director_answers_schema.sql`; `src/lib/permissions/catalogue.ts` and `routes.ts`; `src/app/contacts/page.tsx` and `[id]/page.tsx`; the immunization readers (`src/app/immunizations/new/page.tsx` and `actions.ts`, `src/app/residents/[id]/page.tsx` and `[section]/page.tsx`, `src/lib/archive/resident-record.ts`); `src/lib/manual/en.ts`, `src/lib/releases.ts`, `README.md`; the probes, harness counts and checks under `scripts/`; `docs/roles-and-permissions.md`, `docs/backlog.md`, one decision file
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management** gains the microchip write and keeps Contacts; **the 2IC** gains Contacts (name and phone) and reads no vaccine price; **staff** lose the Contacts pages (pickers unchanged), keep the Friend card and gain nothing; **volunteer** unchanged (already had no address book since `0134`); **vet** unchanged (own policies); public and signed out unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: option (c) of the contacts item, the data-level close of the address book (filed on `backlog`, not built); the vet's reads of vaccine cost and Friends (C3, C10, parked clinics work); applying the Director's draft to production; `check-contact-visibility` and `check-2ic-role` (red before this PR)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.` at the last sync)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0155_director_answers_schema.sql (against origin/main ce4e85bc, highest 0154_see_translations_cell.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `154 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0155_director_answers_schema.sql … ok`, the only pending file (three `consumer ... differs from release 0.19.3` warnings: the resident pages and the archive read the new view, which is the point)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0155_director_answers_schema.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `on conflict` for the activities and the cells, `create or replace` for the function and both views, `drop policy if exists` before each `create policy`. `check-resident-microchip` replays the whole file inside its transaction
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-resident-microchip` ran over 92 real residents; `check-app-access-gate` reads the real internal objects; the resident pages and the vaccine form rendered over real rows
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. `scripts/check-director-answers-schema.mjs` (new; each login's own JWT): the contacts table answers admin, management, staff and a role holding `contacts.directory`; `volunteer_contacts` answers the 2IC and a name-and-phone role holding `contacts.browse` and nobody else; `shelter_friends` answers by `friends.view` or `friends.manage` and not by `contacts.directory`; `immunization_types` answers `reference.types` only, `picker_immunization_types` answers `medical.immunizations`, and the view has no cost column. Output, as printed:

  ```
  80 checks held, 0 failed.
  RESULT: GREEN (carers: Management and the 2IC browse, staff keep the table for the pickers; friends: staff read by cell; vaccines: the picker has no price)
  ```

  `check-resident-microchip` (now replays `0155` and writes a Management chip, and refuses one on a deceased resident) ends `HARNESS-OK … 0155: management write allowed, and refused on a deceased resident`
- [x] Down-migration written, or the reason one is not needed is stated: not written; reversible by the file's header (restore the `0116` function body, `0147` and `0148` policies, `0134`'s revoke on `volunteer_contacts` and the 2IC's `name_type` scope; delete the five cells, two activities and the view). Nothing was rewritten
- [x] Production apply plan stated for the release manager (which file, which project, when): `0155_director_answers_schema.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, **before the deploy** (the app reads `picker_immunization_types` and asks the two new cells)

## 4. Functional checks

- [x] Happy path works end to end: a scripted run against the dev server on :3012 signed in as throwaway management, staff and 2IC logins (random passwords, deleted at the end). Management opened the list and a contact hub with name, phone and address; the 2IC with name and phone and **no address**; staff's request returned neither; management recorded a chip through `set_resident_microchip` and it showed on the resident hub; the 2IC recorded a vaccination and read its name back through the view embed; staff read a Shelter Friend's row
- [x] Data persists — reload the page and the change is still there: the chip and the vaccination were read back through a second request
- [x] Create / edit / delete all exercised (whichever the feature has): a chip written, cleared by staff again and refused on a deceased resident (harness); a vaccination inserted by the 2IC
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the chip's 15-digit rule is `0113`'s and `check-resident-microchip` still asserts it (14 and 16 digits, spaces, letters, duplicates)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a role with `contacts.browse` but the full scope (the page opens, reads the table), one on the name-and-phone scope (reads the view), one with the directory cell and no browse cell (no page, table still readable); a role holding only `friends.view`, only `friends.manage`, and one holding `contacts.directory` alone (now refused); a role holding only `reference.types` Read (reads the table and the view) and only `medical.immunizations` (view only)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | no change | contacts table and view of vaccines read; chip write allowed (harness) |
| management | `/contacts`, `/contacts/[id]`, chip write, Friend card | gains the chip write; keeps Contacts | list and hub with phone and address; chip written and shown on the hub |
| staff | carer pickers, chip write, Friend card; **not** the Contacts pages | loses the pages only | `/contacts` and `/contacts/[id]` returned no contact data; own login still reads the carer row (pickers); chip cleared; Friend row read |
| second_in_command (2IC) | `/contacts` and hub, name and phone | gains the pages; no address; no vaccine price | name and phone shown, no address; vaccine form lists names, page carries no price; reads no row of `immunization_types` |
| vet | unchanged | no change | not exercised beyond `check-permission-parity` (vet lines unchanged, all 21 mismatches the same vet lines) |
| volunteer | nothing in Contacts | no change | refused (holds no cell, reads no view row) |
| signed out | nothing | no change | no grant to `anon` on the new view |

- [x] Every role above tested: admin, management, staff, volunteer by the harness under their own JWTs; management, staff and the 2IC also through the dev server; the vet only by the parity board; signed out by the grant
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff's request for `/contacts` and `/contacts/[id]` carried no contact data (the in-app no-access redirect); the table refusals are database refusals under each role's own JWT

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links: the entry comes from the route registry, now keyed to `contacts.browse`; no link to `/contacts` is left for a role that cannot open it (`grep` of `src/`: only the contacts pages and the menu)
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: Contacts (who sees what, "ask Management"), Scanning a microchip (Management listed), Logging immunizations (names only, no price). `check-home-screens` and `acceptance-matrix --check` agree
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new user-visible string outside the manual and the release notes, which are English
- [x] Mobile viewport (375px) — no overflow, controls reachable: `check-phone-width.mjs --roles=admin,management,staff --locales=en,th --pages=/contacts,/immunizations/new`: `No page scrolls sideways. Every component action is at least 44 px.` (the header items it lists are the sibling stream's)
- [ ] Browser console clean — n/a: pages were driven by HTTP, not a console-reading browser; see Left for manual verification
- [ ] Network clean — n/a: as above; the dev server logged no error

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/contacts`, `/contacts/[id]`, `/immunizations/new`, the resident hub and `/residents/[id]/immunizations` for management and staff (vaccine names through the embed), the resident hub for the 2IC
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page: `src/lib/permissions/routes.ts` and `catalogue.ts` are read by every page; the resident hub and the immunization form (unrelated to Contacts) loaded for each role above
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: `main` had not moved

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): three ticked; the contacts item carries a status line; option (c) filed on `backlog` (`5fe7eaae`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-07-director-answers-schema.md`, one section per brief question (q5, q6+q7, q8, q12)
- [x] `README.md` still accurate: the staff row of the roles table now says staff no longer browse Contacts
- [x] **Release notes.** Ticked: `unreleased` gained four lines for a shelter user (Contacts for Management and the 2IC and where staff go instead; Management can record a chip; the vaccine list shows no price; staff keep the Friend card)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The parity numbers are the board's output; the decision file says plainly that the brief's 1,913 / 26 / 21 baseline did not reproduce and that two of the three known tightenings that left the list are not attributed. Reasoned and worded so: that probes added on `main` explain the baseline drift

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Each cell was tested held and not held, with and without the neighbouring cell (`contacts.browse` with and without `contacts.directory`; `friends.view` alone, `friends.manage` alone, neither; `reference.types` alone, `medical.immunizations` alone)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: `/friends` reads `public_shelter_friends`, an owner-rights view this policy does not touch; `check-app-access-gate` still ends `HARNESS-OK`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes. The production apply must happen **before** the deploy: the immunization readers select from `picker_immunization_types` and the contacts pages ask `contacts.browse`, neither of which exists on production until `0155` is applied. Written into the apply plan in §3
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is rewritten; cells inserted, one scope value updated, two policies and one function replaced, two views created or replaced
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change of its own, so `wrangler rollback` is irrelevant. To undo the schema: the header of `0155`. **The two halves revert together**: the old readers select vaccine names from the table, which staff and the 2IC can no longer read once `0155` is applied, so reverting only the app breaks the vaccine form and the resident pages for them; reverting only the schema breaks the new readers. It does not undo anything an Admin later edits in Settings

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Option A is a page-level fix: a staff login can still read every contact's phone and address by hand, as C9/C10 describe | deferred to backlog: option (c) filed on the `backlog` branch; recorded in the decision file |
| 2 | Low | The brief named a "dose" column for the vaccine view; `immunization_types` has none | accepted: the view carries `is_mandatory` and `interval_months`, which the form and the recording action need; recorded in the decision |
| 3 | Low | After q6/q7 no staff screen reads a Shelter Friend, so `friends.view` is a data statement for staff | accepted: it is what the Director chose; recorded in the decision |
| 4 | Low | `check-permission-parity` shows 9 harness faults and 21 vet mismatches on dev; `check-contact-visibility` and `check-2ic-role` were red before this PR | accepted: none touches this change; the vet's are the recorded decision (q4) |
| 5 | Low | The 2IC cannot open a resident's Immunizations section page (redirected to no-access); the hub and the form work | deferred: a guard on that section page, not changed by this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as Management, open Contacts and a carer: the list and the hub show phone and address | dev |
| 2 | Signed in as the 2IC (give a test person that role), open Contacts: name and phone, no address, no Edit; open Log immunizations: the vaccines list with no price anywhere | dev |
| 3 | Signed in as staff: Contacts is not in the menu; type `/contacts` and it does not open; on a rehome, the carer picker still lists carers | dev |
| 4 | Signed in as Management, record and correct a microchip on a resident | dev |
| 5 | Read the Contacts, Scanning a microchip and Logging immunizations topics at `/manual`, and the new lines on `/releases`: do they read well to the shelter? | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 5 wait for someone with a login

Manual verification by: pending: a person on the five items above (Contacts as Management, the 2IC and staff; a Management chip; the manual and release wording); Claude drove the same paths by script and measured only that the pages do not scroll sideways at 375 px, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
