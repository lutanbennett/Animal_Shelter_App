# Feature test plan

## Header

| | |
|---|---|
| Feature | Shelter Friends — thank the businesses that help, on the public site (the feature half; schema 0076 was #89) |
| Backlog item | `docs/backlog.md` → Public website: **"Shelter Friends" — thank the businesses that help, on the public site** |
| Branch / worktree | `claude/shelter-friends` @ `C:\Development\Animal_Shelter_shelter-friends` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | [#103](https://github.com/lutanbennett/Animal_Shelter_App/pull/103) |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no — builds on 0076 (on `main`, applied to dev) |
| Tested at SHA | `2eb9510` for the gates (after the second sync). Browser checks ran on `9be8589` plus the uncommitted docs; the only code change after them is two dictionary strings ("Vendor" → "Supplier") |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — staff can make a Supplier contact a Shelter Friend, write its public profile, tick what the business agreed to show and publish it; visitors see it on `/friends`, with a header/footer link, a home logo strip and a `/donate` mention once anyone is published
- [x] Files/areas touched listed — new: `src/app/friends/`, `src/app/management/shelter-friends/`, `src/app/contacts/[id]/ShelterFriendCard.tsx`, `src/components/FriendCard.tsx` / `FriendBadge.tsx` / `FacebookIcon.tsx`, `src/lib/shelter-friends/`, `src/lib/links/validate.ts`. Changed: `/`, `PublicHeader`, `PublicFooter`, `SitePageView` (donate), `/contacts`, `/contacts/[id]`, `/management/contacts`, `/management`, translation-approval revalidation, `src/lib/public-paths.ts`, `worker/index.mjs` (edge-cache list), both dictionaries, the manual, `releases.ts`
- [x] Roles affected identified: admin / management write; staff / vet / volunteer read (badge, read-only card); signed-out public sees `/friends` and the links
- [x] Anything explicitly **out of scope** written down — no migration (0076 already settled the shape); the Thai page title "เพื่อนของศูนย์พักพิง" is a placeholder until the customer confirms it; no Facebook link for the shelter itself (batch 3 reuses `src/lib/links/validate.ts` for that); recording in-kind donations against a Friend is the Fundraising item's, and would meet on `contact_id`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in twice. The first brought in 0079 (enclosure public view) cleanly. The second brought admin-on-mobile and conflicted in `src/lib/releases.ts` (both lines kept) and `src/app/management/contacts/page.tsx` (main’s `LargerScreenNotice` wrapper around this branch’s chip row). The page was reloaded after resolving: `?friends=1` lists the two Friends with the chip active
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 120s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — #103: 2 of 2 checks passing, mergeable

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; 0076 was applied with #89
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the code reads 0076's table and view, exercised on dev in section 4
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — re-ran 0076's own harness against dev, and it still holds with this code on top: `node scripts/check-shelter-friends.mjs` → `HARNESS-OK defaults unpublished + opted out | anon: unpublished hidden, published shows name/prose/links with every detail null, no private columns | each show_* releases only its field (map without address) | archived contact hidden, restored shown | anon refused on table and on view write | unique contact, http(s) links | 3 translations queued with label+path | proxy knows logo | contact delete cascades | file ran twice`. Plus a new rolled-back role matrix, in section 4
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; 0076 must be on production before this deploys (#89's plan)

## 4. Functional checks

All on `localhost:3003` against dev, signed in as admin. "Anonymous" below means a
same-origin `fetch(…, { credentials: "omit" })` — no cookies reach the server, so
it queries as `anon`, and the header it renders shows **Login**, not **Open the app**.

- [x] Happy path works end to end — on supplier X: Make a Shelter Friend → profile filled (kind of help, blurb, offer, website, Facebook, friend since) → Save → Publish; the card appeared on `/friends` for an anonymous visitor with website / Facebook links (`target="_blank" rel="noreferrer"`), the badge flipped to "On the website", and View on the website opened `/friends#friend-<id>`
- [x] Data persists — reload the page and the change is still there — reloaded the contact after each save; profile and opt-ins were as saved
- [x] Create / edit / delete all exercised (whichever the feature has) — create, edit, publish / unpublish, reorder and the live preview driven. **Remove profile and the logo upload were not driven** — see Left for manual verification
- [x] Empty state renders sensibly (no rows yet) — with nothing published (today's state): `/friends` shows "We're just getting started…", and `/`, `/donate`, `/adopt` have no Shelter Friends link, strip or mention (checked in the HTML). After publishing, then unpublishing, all of it went away again
- [x] Invalid input is rejected with a readable message, not a crash — `http://feedshop.example.com` → "Use a secure link that starts with https://"; `https://instagram.com/feedshop` in Facebook → "Use a link on facebook.com / fb.com."; Save disabled while either shows. The validator alone, 20 cases all passing, including `javascript:` in either case, `data:`, `ftp:`, `https://localhost`, `facebook.com.evil.test`, `evil.test/facebook.com`, `http://facebook.com/…`, and bare `www.shop.co.th` / `facebook.com/x` being given `https://`. The server action runs the same function
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — a Friend with **nothing** filled in and **nothing** opted in, published: the anonymous card is initial + name + "A friend of the shelter.", no empty rows, and none of the contact's phone / email / LINE / address in the HTML. With all five ticked: `tel:053111222`, `line.me/ti/p/~harnesshardware`, `mailto:`, the address text, and a `loading="lazy"` map embed. A long name wraps on the card and in the home strip at 375px. Friend since saved as a date and shown formatted

**Opt-ins and hiding, as an anonymous visitor** (the thing most worth getting right):

- supplier X with only Phone ticked: phone shown; its address (`https://www.google.com.au`) absent from the page; no map
- unpublished: gone from `/friends`, the home strip, the `/donate` mention and the header link at once
- contact archived: gone from `/friends` for anonymous **and** signed-in visitors, with the profile still published; the hub dims the badge and says why. Restored: back
- straight at the REST API with the anon key: `public_shelter_friends` returned only the published rows with exactly the ticked fields (supplier X `address: null`, `map_location: null`); `shelter_friends` → 401 / 42501; `contacts` → `[]`
- `node scripts/check-public-views.mjs`: `public_shelter_friends: anon can SELECT — 200`, `anon PATCH is refused — 500`, `anon DELETE is refused — 500`, `shelter_friends: anon SELECT is refused — 401`

### Role access matrix

UI driven as admin only. The server side for every role was measured with a
rolled-back harness against dev: one real user given each role in turn,
impersonated as `authenticated`, reading, updating and inserting
`shelter_friends` (output as printed):

```
MATRIX admin: read=2 view=2 update_rows=1 insert=ALLOWED
management: read=2 view=2 update_rows=1 insert=ALLOWED
staff: read=2 view=2 update_rows=0 insert=refused
vet: read=2 view=2 update_rows=0 insert=refused
volunteer: read=2 view=2 update_rows=0 insert=refused
```

Every server action also starts with `assertManagementRole()`, and
`/management/shelter-friends` with `requireManagementUser()`.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | contact card, Management → Shelter Friends, `/friends` | full edit | UI driven: create / edit / publish / reorder all worked; DB: writes allowed |
| management | same as admin | full edit | DB harness: writes allowed. UI not driven as this role — see manual list |
| staff | badge, read-only card, `/friends` | read only | DB harness: 0 rows updated, insert refused. UI not driven — see manual list |
| vet | same as staff | read only | DB harness: as staff |
| volunteer | same as staff | read only | DB harness: as staff |
| signed out | `/friends`, links, strip, mention | published profiles, opted-in fields only | driven, above |

- [x] Every role above tested — server side for all five by the harness; signed-out and admin in the browser. The read-only card as staff / vet / volunteer is in the manual list
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — staff / vet / volunteer writes affect 0 rows and inserts are refused by RLS; anon is refused on `shelter_friends` and gets `[]` from `contacts`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: `NavLinks.tsx` is untouched; Management is a single link to its landing page, which gained a Shelter Friends tile (checked). The public header's new link was checked in section 4
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic "Shelter Friends — thanking the businesses that help" under Management, leading with the ask-first warning; one line added to "The public pages". Loaded `/manual#shelter-friends`: listed and highlighted in Contents, text as written
- [x] Translatable strings go through the translation path, checked at `/management/translations` — blurb, kind of help and the offer each got a "Needs translation" panel on the contact page as soon as they were saved (0076's trigger). Approved a Thai translation of "Kind of help": `/friends` in Thai showed it, in English the original
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/friends` and the home strip: `scrollWidth` 375 = viewport, cards and links fit
- [x] Browser console clean — no errors or React warnings — no warnings. The only errors were 404s for `/manual/management-diets.png` and `/manual/management-cashflow.png`, which predate this branch (the manual screenshot rerun is deferred)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — only those two manual PNGs

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/`, `/donate`, `/adopt`, `/friends`, `/contacts`, `/contacts/[id]` (a Supplier and a Carer), `/management/contacts` (with and without `?friends=1`), `/management/shelter-friends`, `/manual`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `PublicHeader` / `PublicFooter` loaded on `/adopt` and `/donate`; the dictionaries on `/contacts` and `/manual`; the manual on `/manual`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought only 0079 and its harness / plan; gates ran after it, green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — "Shelter Friends, the feature half": view-only public reads, the preview mirroring the view, links hidden until someone is published (and why `hasPublicFriends` takes no argument), the shared link validator and `noValidate`, the one type gate, Management rather than Settings for the order, `refresh()`, the ten-minute edge cache on an unpublish, the Thai placeholder. The table-vs-columns and per-field opt-in reasons were already recorded with 0076
- [x] `README.md` still accurate — added `src/lib/shelter-friends/` and `src/lib/links/` to the source map
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: Shelter Friends — where to make one, what to fill in, tick only what they agreed to, publish; where it shows; ordering under Management; nothing shows until published, and archiving takes the card down
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the stale card without `refresh()`, the browser's `type="url"` refusing `www.…`, the hiding cases, the role matrix and the validator cases were all observed. One claim is read from config, not measured: that an unpublish can take up to ten minutes for signed-out visitors in production (`CACHE_TTL_SECONDS = 600` in `worker/index.mjs`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives "today"; `friend_since` is a date the user picks, stored and shown as typed
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the pasted blocks (gates, role matrix, harness) are copied as printed; nothing was re-typed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager. Add `/friends` to that pass

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var (logos use the existing Drive root)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here. The code reads 0076, which must be on production first (#89's apply plan)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; 0076 precedes this deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code only; `npx wrangler rollback --env production` reverts it completely. Profiles created meanwhile stay in `shelter_friends`, invisible to the old code, and 0076's view is harmless unread

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | After Save / Publish the card kept showing the old profile until a reload: the actions are called directly, and `revalidatePath` alone doesn't re-render the caller here | fixed — the actions call `refresh()`, as `management/diets/actions.ts` does |
| 2 | low | The browser's own `type="url"` check refused `www.feedshop.example.com`, which the shared validator accepts | fixed — the form is `noValidate`; the shared rule is the only one |
| 3 | low | User-facing strings said "Vendor"; the app calls that type "Supplier" | fixed |
| 4 | low | The logo upload said "Logo updated." without confirming the row changed; an update matching no row is not an error to PostgREST. Found while chasing a logo that turned out simply not to be saved yet | fixed — the update selects the row back and reports an error (removing the uploaded file) unless the new id is on it. Code-only change after the test deploy; gates re-run |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Done — Lutan, 2026-09-24, on test.lannacare.org (build `11ee873`), confirmed in chat.** Uploaded to Harness Hardware; saved at 15:00:32 UTC and served on `/friends` via `/api/photos/1SJzLnkEPk358gw931Rk7CsqyX-2egHe9`. An earlier "not on the public page" was a check made before the save landed, not a defect. Replace and remove were not reported. Logo upload, replace and remove on a Friend — not driven by Claude: the local Google OAuth client is dead (`invalid_client` since 2026-09-24), so Drive uploads only work on UAT | `test.lannacare.org` → a Supplier → Shelter Friend → Edit profile → Upload logo; then `/friends` and the home strip |
| 2 | **Done — Lutan, 2026-09-24, on test.lannacare.org** (backlog item 1 of #103's sign-off). Signed in as staff (or vet / volunteer): a Friend contact shows the badge and a read-only Shelter Friend card with no Publish / Edit, and `/management/shelter-friends` redirects away | `/contacts/[id]`, `/management/shelter-friends` |
| 3 | **Done — Lutan, 2026-09-24, on test.lannacare.org** (backlog item 2): he found it and it works. His concern was the wording — a red "Remove profile" on a contact's page reads as deleting the contact — and the follow-up `shelter-friends-remove-profile` relabelled and moved it. Remove profile: the card leaves `/friends`, the contact stays, and its translations leave `/management/translations` | a test Friend → Edit profile → Remove profile |
| 4 | **Done — Lutan, 2026-09-24** (backlog item 3): the Thai wording passed and the title "เพื่อนของศูนย์พักพิง" is kept. Thai wording of the new strings reads naturally (written by Claude, not reviewed by a Thai speaker), and the customer confirms or replaces the placeholder title "เพื่อนของศูนย์พักพิง" | switch to ไทย on `/friends`, a Friend's contact page, `/management/shelter-friends` |
| 5 | **Done — Lutan, 2026-09-24** (backlog item 4): "fine for now". The look of `/friends`, the home strip and the `/donate` mention is what the shelter wants to show a business it is thanking | `/friends`, `/`, `/donate` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — Lutan checked all five on 2026-09-24 (recorded above from the backlog item he wrote), and the signature waits for him to confirm it in chat

Manual verification by: pending: Lutan's confirmation in chat of the five items recorded above as done on 2026-09-24

### Result

- [x] Open defects are either fixed or explicitly accepted above — all three fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
