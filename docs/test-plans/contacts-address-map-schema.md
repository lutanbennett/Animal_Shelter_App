# Feature test plan — contacts-address-map-schema

## Header

| | |
|---|---|
| Feature | Schema half of separate Address and Map link fields: `contacts.map_url`, and `public_shelter_friends.map_location` reading it; plus the fix for adding a zone's facility plan (`refuse_lifecycle_map()`), folded in on Lutan's say-so |
| Backlog item | `docs/backlog.md` → **Contacts: separate "Address" and "Map link" fields** and **Maps on contacts and Shelter Friends** parts (1)/(2) (both left open, status notes added) |
| Branch / worktree | `claude/contacts-address-map-schema` @ `C:\Development\Animal_Shelter_contacts-address-map-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR this file is on |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | yes — `0164_contacts_map_url.sql` |
| Tested at SHA | `58541219` (after sync with `origin/main` `b5cdfdb6`: already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema the separate-fields item asks for: a `map_url` on `contacts`, additive, and `public_shelter_friends` exposing it under `show_map`; the "map_url or pin" choice made and recorded
- [x] Files/areas touched listed — `supabase/migrations/0164_contacts_map_url.sql`, `docs/backlog.md` (two status notes), `docs/decisions/2026-10-08-contacts-map-url-not-pin.md`, this plan. The backlog item for the zone-plan bug is not on this branch yet (it is on `backlog`, not yet merged to `main`), so its tick is left to `facility-map-upload`
- [x] Roles affected identified — none see a change: no screen reads `map_url` yet, and `map_location` returns exactly today's value while `map_url` is empty everywhere. Staff and above can read the column through contacts' existing policies; vets and volunteers cannot (0126's fixed-column views)
- [x] Anything explicitly **out of scope** written down — the two form inputs, the hub / `ContactActions` / `FriendCard` / contacts list reading `map_url`, moving existing links out of `address`, manual, dictionaries and releases line are batch 76; the bad-row list is `contacts-link-audit`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `b5cdfdb6`: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run at `58541219`; the zone-plan fix added after it is SQL and docs only, which none of the three gates read beyond lint's migration checks, rerun by hand (`check-migration-grants`, `check-new-policy-role-names`: ok). Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 287s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — all 7 checks passing on #463 at `ace66c3c`, read from the PR checks before merging

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0164` against highest `0163`; the brief names this as the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 163 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0164_contacts_map_url.sql … ok`; the consumer warnings say the readers are not live yet, which is the intended order
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied from this branch on Lutan’s "merge it", 2026-10-08: `applying 0164_contacts_map_url.sql … ok`; `--status` then 164 applied rows, the one extra being `0164`
- [x] File is re-runnable — the harness below ran the whole file **twice** in one transaction before asserting
- [x] Existing rows still read correctly after the change — `public_shelter_friends` rewritten from its **live** definition (`pg_get_viewdef` on dev; it reads `private.approved_translations`, which 0076's text predates); the harness asserts the same 16 columns in the same order, and `map_location` equal to the address while `map_url` is null. `check-view-write-grants.mjs --with 0164`: 292 statements, 0 failed
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (kept in the session scratchpad; nothing added to `scripts/`, per the brief). Asserted: one `contacts_map_url_form` after two runs; view grants for anon/authenticated are `SELECT` only; `vet_contacts` / `volunteer_contacts` have no `map_url`; accepts `https://maps.app.goo.gl/…`, `HTTPS://www.google.com/maps/search/?api=1&query=18.9,98.9` and null; refuses `javascript:alert(1)`, a schemeless link, link-space-text, a bare `https://`, a trailing newline and the empty string with `check_violation`; a published friend with `show_map` gets the address while `map_url` is null and the link once set; with `show_map` off and `show_address` on, `map_location` is null and the link appears nowhere in the row; anon is refused on `contacts`. Result: `HARNESS-OK` (rolled back). **Zone plan fix**, a second harness on dev: *before* (current dev, no 0164) inserting a `facility_maps` row for House Zone failed with `42703: record "new" has no field "name"` — the bug reproduced; *after* (0164 run twice) the House Zone plan inserts; a Lifecycle plan is still refused ("cannot be on the map"); colour, sort_order and map_shape on the Lifecycle zone are still refused, each with its own message; a new zone named Lifecycle with a colour is still refused ("takes no colour"); an ordinary zone still takes a colour. Result: `HARNESS-OK` (rolled back)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive (one nullable column with a form check, and a view whose one changed expression returns today's value until the column is filled). Old code ignores all of it. The trigger fix needs none either: going back to 0162's body would only bring the bug back
- [x] Production apply plan stated for the release manager — `0164_contacts_map_url.sql` on `dbkodyyxxhtygxcxmfcu` with the next release; it must be on production before the batch 76 feature deploys, which reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence of the column asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface; null is every row's state today, and `map_location` then returns what it always has
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the form boundaries (bare scheme, whitespace, empty, case) are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | contacts table | gains `map_url` on the row it already reads | n/a — no policy or grant changed |
| management | contacts table | as admin | n/a — as above |
| staff | contacts table | as admin | n/a — as above |
| vet | `vet_contacts` | no `map_url` | asserted in §3's harness |
| volunteer | `volunteer_contacts` | no `map_url` | asserted in §3's harness |
| signed out | `public_shelter_friends` | same columns; link only under `show_map` | asserted in §3's harness; `check-app-access-gate.mjs` HARNESS-OK |

- [ ] Every role above tested — n/a: no policy and no grant changed; the narrowed views and the public view were asserted in the harness, and `check-view-write-grants.mjs` exercised every role's select with the file applied
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; `check-app-access-gate.mjs` confirms public_viewer and anon gain nothing, and the harness confirms anon is refused on `contacts`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; Contacts and Shelter Friends topics are batch 76's
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of `public_shelter_friends`; the view keeps its shape, and while `map_url` is empty `map_location` is the address exactly as before (harness)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: the sync merged nothing (already up to date)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: both items deliberately left open, as the brief says, with a status note on each naming the shape chosen and what remains. Searched the backlog for `map_url`, `map_location`, `splitAddress`, `address` and `contact_map_url`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-08-contacts-map-url-not-pin.md` (link not pin, one-link form check, no row move yet, the coalesce on the public view)
- [x] `README.md` still accurate — it does not list contact columns
- [ ] **Release notes.** — n/a: no screen reads the new column until batch 76
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the view's live definition and grants and the views over `contacts` came from dev (`pg_get_viewdef`, `role_table_grants`, `pg_depend`), and the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager; `/friends` reads `map_location`, which returns today's value until rows are moved

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the `-- consumer:` header names the batch 76 readers, so `0164` must be on production before that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0164` on production with the next release, any time before the feature half deploys

### Rollback

- [x] Rollback position stated — code rollback via the Pi `--ref` does not revert `0164`, and does not need to: older code ignores the column, and `map_location` equals the address while `map_url` is empty

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
