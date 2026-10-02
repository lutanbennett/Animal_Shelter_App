# Test plan — schema-contact-visibility

## Header

| | |
|---|---|
| Feature | A vet reads id, name and type of a contact, a volunteer id, name and phone, and neither sees a login's email: `0126_narrow_contacts_for_vets_and_volunteers.sql`, plus the pages that read contacts as those roles. Also records the DB-7 decision (public roster stays full) |
| Backlog item | `docs/backlog.md` → "Narrow what vets and volunteers can read (DB-5, DB-8)"; "Decide the public roster (DB-7)"; "Should a vet read the shelter's address book at all?" |
| Branch / worktree | `claude/schema-contact-visibility` @ `C:\Development\Animal_Shelter_schema-contact-visibility` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch (number in the PR itself) |
| Tested by / date | Claude, 2026-10-02 |
| Carries a migration? | yes — `0126_narrow_contacts_for_vets_and_volunteers.sql` |
| Tested at SHA | `9406ea7` (after `sync` merged `origin/main` @ `a412804`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a vet's and a volunteer's own session can no longer read a contact's phone, email, address, LINE, WhatsApp, Messenger or notes (vet: id, name, type only; volunteer: id, name, phone), and no longer read any login's email — Lutan's decision of 2026-10-02, taken as written
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0126_…sql`; `scripts/check-contact-visibility.mjs` (rollback harness); `src/lib/contacts/visibility.ts` (new: role → relation), `contacts.ts`, `src/lib/adoption-updates/{options,queries}.ts`; pages `src/app/contacts/page.tsx`, `contacts/[id]/page.tsx`, `ContactList.tsx`, `ContactHub.tsx`, `src/app/residents/[id]/page.tsx`, `[section]/page.tsx`, `adoption-updates/AdoptionUpdatePage.tsx`; `src/lib/releases.ts`, `src/lib/manual/en.ts`; two `docs/decisions/` files, `docs/backlog.md`, this plan. No `worker/` change
- [x] Roles affected identified: **vet** (loses base-table read of `contacts`, reads `vet_contacts`), **volunteer** (likewise, `volunteer_contacts`; its Contacts list and page show name and phone only). Admin, management and staff unchanged. Signed-out public never had access
- [x] Anything explicitly **out of scope** written down: `vet_read_enclosures` and `vet_read_zones` (0105 and 0108 left them for the same review; this item is about the address book only); `shelter_friends` readability; staff-only pages (rehome, deceased, archive, management) which still read `contacts` directly. The DB-7 decision is a record only, no code change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` @ `a412804` merged in cleanly (only `docs/backlog.md` auto-merged); `migration numbers: ok — 0126_narrow_contacts_for_vets_and_volunteers.sql (against origin/main …, highest 0125_doctor_multi_clinic.sql)`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 174s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0125_doctor_multi_clinic.sql`; the brief gave this branch the only slot in batch 28
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `125 applied, 0 pending`, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: first run FAILED (`cannot change data type of view column "email" from character varying(255) to character varying` — `case … end` lost the typmod); fixed with `::varchar(255)`, then `dry-run 0126_narrow_contacts_for_vets_and_volunteers.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0126_narrow_contacts_for_vets_and_volunteers.sql … ok`; `--status` afterwards `126 applied`, `Applied here, no file on origin/main: 1` (this file, expected until the PR merges)
- [x] File is re-runnable: `create or replace view`, `drop policy if exists`, `create or replace function`; the harness runs the whole file twice
- [x] Existing rows still read correctly after the change (checked against real dev data): the harness runs against dev's real 6 contacts and its real logins — `vet_contacts` returns 6/6 and `volunteer_contacts` 6/6, `app_users` still lists every login
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-contact-visibility.mjs`, one rolled-back transaction with each role's own JWT, run on the applied file:

```
HARNESS-OK 0126_narrow_contacts_for_vets_and_volunteers.sql ran twice | applied on dev | 0: skipped, file already applied on dev | A: vet reads 0 rows of contacts, no phone/email/address/LINE/WhatsApp/Messenger/notes column in vet_contacts, 0 of volunteer_contacts | B: vet reads id/name/type of 6/6 contacts | C: volunteer reads 0 rows of contacts, only id/name/phone in volunteer_contacts, 0 of vet_contacts | D: volunteer reads name/phone of 6/6 contacts, phone intact | E: staff/management/admin read all columns and 0 rows of the narrow views, anon refused | F: vet and volunteer see logins with every email null, display_name intact; staff/management/admin see emails | G: check_carer_type is security definer
```

  The same harness run before the file was applied printed `0: before the file a vet read a carer phone (1 row)`, so the refusals are the file's doing and not the harness missing RLS
- [x] Down-migration written, or the reason one is not needed is stated: not written. Restoring is `create policy vet_read_contacts … / volunteer_read_contacts …` from `0001` and the pre-`0126` `private.app_users`; the new views are additive and harmless to leave. Nothing in the app needs rolling back to
- [x] Production apply plan stated for the release manager: apply `0126` to production (`dbkodyyxxhtygxcxmfcu`) **before** the deploy of this PR, because the pages read `vet_contacts` / `volunteer_contacts`, which production does not have until then. Run `--env production --dry-run` first

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser. No vet or volunteer login is available to Claude (entering a password is not something Claude does), so no page was loaded as those roles; the queries' shapes were checked instead (below) and the pages are left for manual verification, row 1
- [ ] Data persists — reload the page and the change is still there — n/a: no data is written by this change; it narrows what is read
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: nothing created, edited or deleted. The one write path touched, a volunteer's `ChangeEnclosure` placement through `check_carer_type`, is covered by the harness's check G (the trigger is security definer) and not by a live placement
- [ ] Empty state renders sensibly (no rows yet) — n/a: a role with no contact rows gets an empty list from the same code as before
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: the boundary is the column set, covered by the refusal matrix (every private column checked by name for both roles)

Embeds checked: `placement_history?select=id,carer:vet_contacts(name)`, `…carer:volunteer_contacts(name)` and `adoption_updates?select=id,sender:vet_contacts(name)` all resolve through PostgREST on dev (HTTP 200, `carer`/`sender` null for the service role, whose `current_user_role()` is null), so the foreign key is followed through the view.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `contacts`, both narrow views, `app_users` | all columns of `contacts`, 0 rows of either view, login emails visible | harness E, F: pass |
| management | same | same | harness E, F: pass |
| staff | same | same | harness E, F: pass |
| vet | `contacts`, `vet_contacts`, `volunteer_contacts`, `app_users` | 0 rows of `contacts`; `vet_contacts` id/name/type for 6/6; no phone, email, address, LINE, WhatsApp, Messenger or notes column; 0 of `volunteer_contacts`; every login email null | harness A, B, F: pass |
| volunteer | same | 0 rows of `contacts`; `volunteer_contacts` id/name/phone for 6/6, phone intact; no email, address, LINE, WhatsApp, Messenger, notes or type column; 0 of `vet_contacts`; every login email null | harness C, D, F: pass |
| signed out | both narrow views | no privilege | harness E: anon refused on both |

- [x] Every role above tested — at the database, with each role's own JWT, not through a page
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): a vet's and a volunteer's reads of the private columns return no rows or an undefined-column error from the database itself; no page guard is involved

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the volunteer role summary and the Contacts topic's first step now say a volunteer sees name and phone only. Source edited and built; the page itself was not loaded as a volunteer (row 1)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new dictionary strings; the manual has no Thai file
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout added; a volunteer's list simply has fewer chips and badges
- [ ] Browser console clean — no errors or React warnings — n/a: no page driven as an affected role (row 1)
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: as above (row 1). The one thing most likely to 4xx is a page still selecting `contacts` as a vet or volunteer; the call sites were enumerated by grep and are listed in the decisions file

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `npx next build` compiles every route, including the resident hub, `[section]`, adoption-updates, `/contacts` and `/contacts/[id]`; typecheck and lint clean. Not loaded in a browser as a vet or volunteer (row 1)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page — n/a: `manual/en.ts` was edited in two strings and `contacts.ts`/`options.ts` gained exports; no page loaded as part of this run, so this is left to row 2 and not ticked
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged one backlog line; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: DB-5/DB-8, DB-7 and "Should a vet read the shelter's address book at all?" (closed by the same decision)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-02-vets-and-volunteers-read-less-of-the-address-book.md` (views not policies, the id in both views, `check_carer_type`, null email) and `2026-10-02-public-roster-stays-full.md` (DB-7)
- [x] `README.md` still accurate: it does not describe what a vet or volunteer reads of contacts
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for vets and volunteers, in plain words
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The refusal claims are the harness's output (above). Two claims were checked rather than assumed: that `doctor-multi-clinic-feature` touches none of this change's files (`git diff origin/main origin/claude/doctor-multi-clinic-feature --name-only` at `fd13073` lists no contacts, resident-hub or adoption-updates file), and that PostgREST embeds follow the foreign key through a view (the three requests above)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the boundary is a column set, and the harness asserts it from both sides (the narrow view has the column list; the base table returns no rows) for both roles and for the roles above them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited:** the gates lines and the harness line above are copied from the runs
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page or `public_*` view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes: the pages read `vet_contacts` and `volunteer_contacts`. The production apply must happen **before** the deploy, and that is written into the apply plan below
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, before the production apply
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: not destructive; it drops two read policies and creates two views, nothing is rewritten
- [x] Apply plan stated: file `0126_narrow_contacts_for_vets_and_volunteers.sql`, project `dbkodyyxxhtygxcxmfcu` (production), **before** the deploy

### Rollback

- [x] Rollback position stated, including what it does not cover: `./scripts/pi/deploy-pi.sh --ref <sha>` redeploys the prior build, which selects `contacts` directly. **That build would show a vet and a volunteer nothing in those places**, because the policies are gone; so rolling the code back without restoring the two policies leaves the resident hub without carer names for them. Restoring is two `create policy` statements from `0001`. The new views and the nulled email are safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | First `--dry-run` failed: `case … end` on `auth.users.email` changed the view column type from `varchar(255)` to `varchar` | fixed — cast to `varchar(255)`; dry-run ok |
| 2 | Low | A vet loses the archived-badge on a carer in the housing section, and a volunteer loses the contact type, address, email and notes on `/contacts`; neither column is in the narrow views | accepted — it is the decision |
| 3 | Low | A vet or volunteer sees "—" in a picker for a login that has no Google display name, because the email fallback is now null | accepted — the cost of DB-8, recorded in the decisions file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **vet** (a clinic-linked one): open a resident the clinic treats — the hub still shows the carer's name, the Housing section lists placements with carer names, and an Adoption updates section shows sender names; no error banner. Signed in as a **volunteer**: `/contacts` lists everyone with name and phone and a Call button, no type chips; a contact's page shows name, phone and any residents in their care and no address, email, notes or Friend card; the resident hub and its sections still show carer and sender names | dev, `http://localhost:3003`, then `test.lannacare.org` |
| 2 | Signed in as a **volunteer**, move a resident between enclosures (a `ChangeEnclosure` placement): it still saves — the placement trigger now runs security definer | dev |
| 3 | Signed in as a **vet or volunteer**: open a maintenance job assigned to someone, and the recurring-job and assignee pickers if reachable — names still appear (display name), none shows an email | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not empty, and only the person who looked may tick it; rows 1–3 are outstanding

Manual verification by: pending: rows 1–3 of Left for manual verification — pages as a vet and as a volunteer, a volunteer's enclosure move, and login names in pickers

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted into the PR description when the PR is opened, which is after this commit
- [ ] Handed to the production release manager — n/a: the release manager reads the plan from the PR at release time; not handed over yet

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager, at release time
