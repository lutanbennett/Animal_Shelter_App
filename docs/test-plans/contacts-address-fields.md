# Feature test plan — contacts-address-fields

## Header

| | |
|---|---|
| Feature | Contacts get two boxes, Address (words) and Map link (`contacts.map_url`, 0164); pages print the address as words and draw the map from the link |
| Backlog item | `docs/backlog.md` → **Contacts: separate "Address" and "Map link" fields, so the written address is never a URL** (ticked); **Maps on contacts and Shelter Friends …** (status note: one question left) |
| Branch / worktree | `claude/contacts-address-fields` @ `C:\Development\Animal_Shelter_contacts-address-fields` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this commit |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | no — builds on `0164_contacts_map_url.sql` (#463), already on `main` and applied to dev |
| Tested at SHA | `83e0cbd4` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two inputs on the contact forms (Management → Contacts add and edit, the Friend wizard) with the Share-link guidance under Map link; the hub, `ContactActions`, the contacts list and `FriendCard` print `address` as words and read the map from `map_url` through `addressMap()`; existing rows moved by script
- [x] Files/areas touched listed — `src/lib/contacts/contacts.ts` (`addressText`, `contactMapSource`, `contactAddressFields`, `Contact.map_url`), `src/lib/contacts/create.ts`, `src/app/management/contacts/` (form, table, actions), `src/app/management/shelter-friends/` (wizard, actions), `src/app/contacts/` (list, hub, friend card), `src/components/ContactActions.tsx`, `src/components/FriendCard.tsx`, `src/lib/shelter-friends/` (`friends.ts`, `public.ts`), both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`; scripts: new `move-contact-map-links.mjs`, new `check-contact-address-fields.mjs`, `audit-contact-map-links.mjs` reads `map_url`; README, decision, backlog
- [x] Roles affected identified — admin and management (the forms; `contacts.directory`, `friends.manage`), the 2IC (contact list and page, name and phone only — `VolunteerContact` gets `map_url: null`, unchanged view), signed-out public (`/friends`). Vets and volunteers read contacts through `vet_contacts` / `volunteer_contacts`, which do not list `map_url` (0164 header)
- [x] Anything explicitly **out of scope** written down — no migration; `show_map` / `show_address` and `public_shelter_friends` untouched; no paid Maps API; the "Is this the right place?" pre-save preview (left on the maps item for Lutan); the production row move is Lutan's to run (see section 8)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (release 0.22.0 was cut on main), resolved by keeping only this PR's line in `unreleased`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 88s
gates: typecheck=0 lint=0 build=0
```

  (A first run exited `build=143` straight after "Compiled successfully" while the preview dev server was running on the same checkout; with it stopped, the run above.)
- [x] CI green on the PR — all 7 checks passing on #469 at `7692eb28`, read from the PR status before merging

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; 0164 was applied by #463
- [ ] Re-runnable — n/a: no migration in this PR; the row-move script is re-runnable (second run on dev: `0 contacts have an address starting with a link`)
- [x] Existing rows still read correctly after the change — on dev, before the move the audit said `Summary: dead 2, plaintext 2, trailing 0, unchecked 0, fine 2.`; after `move-contact-map-links.mjs --apply` (`Moved 4 of 4.`) it says exactly the same. `check-contact-address-fields.mjs` contact B is an unmoved row (link at the front of the address, no `map_url`): its page prints the words, not the link, and still draws the map from the link
- [x] Constraints exercised against real rows — `check-contact-address-fields.mjs`: `ok   the database refuses a map_url with words after the link` (`contacts_map_url_form`, 0164). The app side of the same rule, `contactAddressFields()`, run on: link only → all to Map link; link + words → link to Map link, words stay; place name + link pasted into Map link → link taken; non-link in Map link → `mapUrlInvalid`; `javascript:` → `mapUrlInvalid`; a link in Address with a different Map link → `addressIsLink`; the same link in both → accepted; a broken `http//…` → left in Address as words
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR; the production row move is in section 8

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-contact-address-fields.mjs` against this dev server, as a throwaway management login, exit 0, `All expectations held.`:

```
Contact page, A (address + Map link):
  ok   loads (200)
  ok   prints the written address
  ok   prints no link as text
  ok   the map is drawn from the Map link
Contact page, B (link still in the address):
  ok   prints the words after the link
  ok   prints no link as text
  ok   the map is still drawn from the old link
Contact list:
  ok   no link printed as text
Management → Contacts:
  ok   both written addresses printed
  ok   no link printed as text
  ok   A's Map link is a link, not text
  ok   the Map link box is on the create form
Public /friends (signed out):
  ok   loads (200)
  ok   both Friends listed
  ok   C: map shown from the Map link (show_map)
  ok   C: the written address is nowhere in the response (show_address off)
  ok   D: the written address is printed (show_address)
  ok   D: the Map link is nowhere in the response (show_map off)
  deleted 4 throwaway contact(s) and 1 login(s)
```

- [ ] Data persists — n/a: not driven through the forms here (a browser sign-in needs a password the auto-mode classifier refuses to read back); the save path is the shared `contactAddressFields()` checked above, and saving through each form is in **Left for manual verification**
- [ ] Create / edit / delete — n/a: as above, the three forms are in **Left for manual verification**; delete and archive are untouched
- [x] Empty state renders sensibly — contact A's "Map link" anchor appears only when `map_url` is set; a contact with neither shows `—` in the table (unchanged path); the hub shows the Address block only when there are words, a link or a map
- [x] Invalid input is rejected with a readable message — the four refusals (`mapUrlInvalid`, `addressIsLink`, `mapUrlDead`, plus the database check behind them) have plain English and Thai wording; the step-1 wizard check shows them before leaving the step
- [x] Boundary cases checked — the `contactAddressFields()` cases above; a long Thai address at 375 px via `check-phone-width.mjs` (its seeded contact has a long name and address)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Management → Contacts, wizard, contact pages | both boxes; words printed, map from link | phone-width run as admin: pages load, no sideways scroll |
| management | same | same | `check-contact-address-fields.mjs` as management: 13 staff-page expectations held |
| staff | — | no contact pages (0155), unchanged | n/a: no route or permission changed |
| vet | — | reads `vet_contacts` (no `map_url`), unchanged | n/a: no route or permission changed |
| volunteer | — | reads `volunteer_contacts` (no `map_url`), unchanged | n/a: no route or permission changed |
| signed out | `/friends` | map only under `show_map`, words only under `show_address` | 6 public expectations held, incl. nothing leaked from the response |

- [x] Every role above tested — management and signed-out by the check script, admin by the phone-width run; staff, vet and volunteer have no route or grant changed, as the table says
- [ ] A role that should not have access is blocked server-side — n/a: no route, permission or policy changed; `map_url` rides on the existing `contacts` policies and the vet/volunteer views list their columns (0164)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) — Contacts, Managing contacts and Shelter Friends (step 1 and the map step) describe the two boxes
- [ ] Translatable strings go through the translation path — n/a: the new strings are UI dictionary strings (both `en.ts` and `th.ts`), not Friend prose; nothing new goes to the translation queue
- [x] Mobile viewport (375px) — `MSYS_NO_PATHCONV=1 node scripts/check-phone-width.mjs --roles=admin,management --pages=/management/contacts,/contacts,/management/shelter-friends/new,/friends`: `16 page view(s) measured (admin, management; en + th)`, `No page scrolls sideways.`, `No text box, select or textarea is under 16 px`, `Every component action is at least 44 px.` (its 5 notes are the wizard's existing chooser buttons, not touched here)
- [x] Browser console clean — `/friends` in the preview: no errors from the page (only the HMR WebSocket reconnect after the dev server restart)
- [x] Network clean — every page fetched by the check script answered 200
- [x] Public views — `node scripts/check-public-views.mjs`: 0 failures; `node scripts/check-app-access-gate.mjs`: `HARNESS-OK app access gate` (A–E). The view is unchanged; what the public card draws changed, and the change publishes less (decision file, "The public page")

## 6. Regression

- [x] The pages nearest the change still work — `/contacts`, `/contacts/<id>`, `/management/contacts`, `/friends` (check script) and `/management/shelter-friends/new` (phone-width run)
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/manual/en.ts` and both dictionaries: the phone-width run loaded `/friends` and the wizard in English and Thai, and the build prerenders every page that reads them
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green on the merge commit `83e0cbd4`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — the Address / Map link item ticked; the maps item status-noted (only the pre-save preview left, Lutan's call). Searched the open items for the touched names (address, `FriendCard`, `ContactActions`, contact hub, maps, wizard): none other is closed by this
- [x] Non-obvious design choices added — `docs/decisions/2026-10-08-contacts-address-and-map-link.md` (the split rule, why only a leading link is moved, why nothing new is published, the production rows)
- [x] `README.md` still accurate — `move-contact-map-links.mjs` added to the scripts list
- [x] **Release notes.** One line in `unreleased`: "Contacts now have two boxes, Address and Map link …"
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the "nothing new published" claim is asserted against the real `/friends` response (C and D above); the dev row counts are the scripts' own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here reads a date or the clock
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [ ] Evidence pasted is the tool's actual output — deferred: production release manager
- [ ] Public pages re-checked after a cache purge — deferred: production release manager (`/friends` is the one that changed)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and the code that reads it — deferred: production release manager — this code selects `contacts.map_url`, so **`0164` must be applied to production before this deploys** (`node scripts/apply-migrations.mjs --status --env production` first)
- [ ] `--env production --dry-run` — n/a: no migration in this PR (0164's own)
- [ ] Production backup for a destructive migration — n/a: no migration; the row move only fills `map_url` and trims the link off `address`, and its dry run lists every change first
- [ ] Apply plan stated — deferred: production release manager — after 0164 is on production and this is deployed, Lutan may run `node ../Animal_Shelter_contacts-address-fields/scripts/move-contact-map-links.mjs --env production` from the main checkout (dry run), then `--apply`. The audit expects 2 rows, I Blue Paw among them; each ends with an empty Address, to be typed by hand. Not running it is safe: pages read an unmoved link as before and no longer print it

### Rollback

- [ ] Rollback position stated — deferred: production release manager — code only; rolling back leaves any moved rows with the link in `map_url`, which the old code does not read, so their maps would disappear until the move is undone (`update contacts set address = map_url || coalesce(' ' || address, ''), map_url = null where map_url is not null`)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | First gates run killed the build (143) with the preview dev server running in the same checkout | accepted: tooling, not this change; re-run with the server stopped was green |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Add a contact with an Address and a Map link (a real Share link): the contact page prints the words and draws the map; tapping it opens the place | Management → Contacts → Add, then the contact's page, on a phone |
| 2 | Edit a contact, paste a link into Address only, Save: it moves to Map link and the address keeps any words after it | Management → Contacts → Edit |
| 3 | Paste a made-up `https://maps.app.goo.gl/…` into Map link and Save: refused with "Google says that map link doesn't exist any more …", in Thai too | Management → Contacts → Edit |
| 4 | Add a Shelter Friend as a new business with both boxes; the Review preview shows the map only with Map ticked and the words only with Address ticked | Add a Shelter Friend wizard |
| 5 | Thai wording of the two labels, hints and the three messages reads naturally | the same screens in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; only the person who looks may tick this

Manual verification by: pending: the five forms checks in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — summary and checks in the #469 description; the full plan is this file on the branch
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is merged

Result: pass with accepted defects

Release manager acknowledgement: pending
