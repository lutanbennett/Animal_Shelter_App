# Feature test plan

## Header

| | |
|---|---|
| Feature | `shelter_friends` table + `public_shelter_friends` anon view: Shelter Friends, schema half only |
| Backlog item | `docs/backlog.md` → Public website → **"Shelter Friends" — thank the businesses that help, on the public site** (ticked on the feature PR, not this one) |
| Branch / worktree | `claude/shelter-friends-schema` @ `C:\Development\Animal_Shelter_shelter-friends-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes: `0076_shelter_friends.sql` |
| Tested at SHA | branch on `main` @ `e496a0e`; the migration, two scripts, the `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one migration adds a 1:1 `shelter_friends` public profile on `contacts` and a `public_shelter_friends` view that anon can read, showing only published Friends of live contacts, and only the contact details each Friend opted into
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0076_shelter_friends.sql`; `scripts/check-shelter-friends.mjs` (dev-only rollback harness, new); `scripts/check-public-views.mjs` (new view + base-table refusal); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. New table: admin and management write, staff/vet/volunteer read, anon nothing (grants revoked). New view: anon and authenticated read. The migration also redefines `translation_queue` (adds a Friend label) and `is_known_drive_file()` (adds logos), keeping every existing case
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: everything in the brief's feature list goes to `claude/shelter-friends`, branched from `main` after this merges: the staff cards on `/contacts/[id]`, the Friend badge and filter, the `/admin/website` list, `/friends`, the header/footer links, the `/` logo strip, the `/donate` mention, the manual topic and the dictionary strings. The backlog tick goes on that PR too

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date", exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: typecheck exited 0 after 138s
  === gates: lint exited 0 after 271s
  === gates: build exited 0 after 623s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: CI starts when this plan is pushed with the PR; the result is on the PR, and a plan cannot record its own CI run

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0075_contacts_archive.sql`; `gh pr list --state open` returned no open PRs at all
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `77 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`, then `77 applied, 1 pending` with the file in place
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0076_shelter_friends.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0076_shelter_friends.sql … ok`; `--status` afterwards shows `78 applied, 0 pending`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness runs the whole file twice in one transaction, and it was run again after the real apply
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-public-views.mjs` reads every existing public view as anon (all `HTTP 200`); harness step I checks that an existing attachment still passes the redefined photo proxy; no existing table gains or loses a column
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-shelter-friends.mjs`, which reads the view with `set local role anon`, the way the website reads it. Asserted: (A) a new profile is unpublished with all five `show_*` false; (B) an unpublished Friend is invisible to anon; (C) once published, anon sees the name, prose and links, with phone/email/LINE/address/map all null, and no private `contacts` column (`notes`, `messenger_id`, `whatsapp`, `type`, `contact_id`, archive fields, `published`) exists on the view; (D) each opt-in releases only its own field, and `show_map` gives the pin without the printed address; (E) archiving the contact removes the Friend and restoring it brings it back; (F) anon is refused a direct SELECT on `shelter_friends` and an UPDATE through the view; (G) a second profile for one contact and a `javascript:` website URL are both rejected; (H) the three prose fields are queued for translation, labelled `Shelter Friend · Harness 0076 Feed Shop` and linked to `/contacts/` + the contact id; (I) the photo proxy knows the logo and still knows existing attachments; (J) deleting the contact deletes the profile and its translations. Output, unedited (run after the apply):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK defaults unpublished + opted out | anon: unpublished hidden, published shows name/prose/links with every detail null, no private columns | each show_* releases only its field (map without address) | archived contact hidden, restored shown | anon refused on table and on view write | unique contact, http(s) links | 3 translations queued with label+path | proxy knows logo | contact delete cascades | file ran twice
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`.) **Negative controls:** the harness was rerun three times against a deliberately broken copy of the migration, and each broken copy was caught. With the phone printed with no opt-in it failed `FAIL C a detail nobody opted into reached anon`. With the `archived_at` filter removed it failed `FAIL E archived contact's Friend visible to anon`. With the `published` filter removed it failed `FAIL B unpublished Friend visible to anon`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive; undoing it is dropping the view, the triggers, the three `translatable_fields` rows and the table, then restoring 0059's `translation_queue` and 0019's `is_known_drive_file`. No existing data depends on it
- [x] Production apply plan stated for the release manager (which file, which project, when): `0076_shelter_friends.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan, `node scripts/apply-migrations.mjs --env production --dry-run` then without, from the main checkout, **before** the `shelter-friends` feature is deployed; then `node scripts/check-public-views.mjs --env production`

## 4. Functional checks

- [x] Happy path works end to end: harness steps A, C and D are the create / publish / opt-in writes the feature will make, and the anon read the `/friends` page will make
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these tables yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert, update and cascade delete are exercised in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; the dev view is empty and `check-public-views` reads it with `HTTP 200`
- [x] Invalid input is rejected with a readable message, not a crash: at the schema level that means a second profile for one contact (`unique_violation`) and a non-http(s) link (`check_violation`), step G. The app's wording belongs to the feature PR
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a profile with only `contact_id` set is valid (step G's second insert fails only on the URL); `show_map` without `show_address`, and the reverse

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route; policy `admin_all_shelter_friends` read in the file, not exercised as that role | — | — |
| management | n/a: no route; policy `management_rw_shelter_friends` read in the file, not exercised as that role | — | — |
| staff | n/a: no route; read-only policy, not exercised as that role | — | — |
| vet | n/a: no route; read-only policy, not exercised as that role | — | — |
| volunteer | n/a: no route; read-only policy, not exercised as that role | — | — |
| signed out | `public_shelter_friends` only | published, live, opted-in fields only; base table refused | pass: harness B–F as `anon`, and over REST in `check-public-views` (`HTTP 200` view, `HTTP 401` base table, PATCH/DELETE refused) |

- [ ] Every role above tested — n/a: no route or UI exists yet for the signed-in roles, whose policies follow the repo's standard `current_user_role()` shape (admin and management write, as the brief asks; staff, vet and volunteer read only, so staff cannot publish a Friend even though they can edit contacts); the feature PR drives them in the browser. The one role this PR exists for, anon, is tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): anon `GET /rest/v1/shelter_friends` → `HTTP 401`; anon PATCH/DELETE on the view refused (`HTTP 500`: the view joins two tables, so it cannot be updated; the refusal is the same kind the other join views give)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature PR adds the topic
- [x] Translatable strings go through the translation path, checked at `/management/translations`: `blurb`, `help_kind` and `discount_note` join `translatable_fields` and are queued by trigger (harness H, via the `translation_queue` view that page reads). The page itself was not loaded; nothing in dev has a Friend to show
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded, because nothing in `src/` reads these tables. The two shared objects this migration redefines keep all their old cases: `translation_queue` has 0059's cases verbatim plus one, and `is_known_drive_file` has 0019's plus one (harness I checks an existing attachment still passes). `check-public-views` still passes on all seven existing public views
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in, and the build is green on this tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the brief puts the tick on the feature PR, which is when the item is actually done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: a separate table instead of `contacts` columns, an opt-in per field, `show_map` independent of `show_address`, `help_kind` as free text (Lutan's choice), http(s)-only links, archived contacts dropping out
- [x] `README.md` still accurate: it does not list tables or the check scripts one by one
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: a table and a view that no screen reads yet; the feature PR adds the line when `/friends` exists
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** everything the view hides, the rejected inputs, the queue label and the cascade come from the harness and its negative controls

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; `friend_since` is a stored date the admin types
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page reads the new view yet; the photo proxy change only adds a case

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, but the follow-on `shelter-friends` feature will, so production must have 0076 **before** that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; the two redefined objects keep every existing case
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. The new objects are safe to leave in place. Removing them means dropping the view and table *and* re-applying 0059's `translation_queue` and 0019's `is_known_drive_file`, because 0076 redefines both. Once the feature ships, dropping the table loses every Friend profile and its approved translations

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: the only surface is the anon view, which the harness and `check-public-views` read as anon. The staff-facing screens arrive with the feature PR and its own plan.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness and check-public-views

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager: the PR states that Lutan applies it to production, before the feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
