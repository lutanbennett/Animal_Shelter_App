# Feature test plan — contacts-map-404

## Header

| | |
|---|---|
| Feature | Map tap on contacts and Shelter Friends opens a checked link, never a 404; Share-link guidance (EN/TH); website map link checked on save |
| Backlog item | `docs/backlog.md` → Management → "Maps on contacts and Shelter Friends: fix the 404 when the map is tapped…" (parts 3 and 5 and the 404; left open with a status note) |
| Branch / worktree | `claude/contacts-map-404` @ `C:\Development\Animal_Shelter_contacts-map-404` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this plan's first push |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `b0baed03` (merge with `main`); this plan is the next commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a map tap (thumbnail, Map button, "Open in Google Maps") opens a link checked by the same lookup that draws the thumbnail, and shows no map rather than a 404 when there is nothing valid; the address forms carry the Share-link guidance in English and Thai; Management → Website refuses a map link Google answers 404 for. That is the brief's scope: parts (3), (5) and the 404
- [x] Files/areas touched listed — `src/lib/contacts/contacts.ts`, `src/lib/contacts/map-preview.ts`, `src/components/MapThumbnail.tsx` (new), `FriendCard.tsx`, `ContactActions.tsx`, `src/app/contacts/` (list, hub page, `ContactHub`, `ShelterFriendCard`), `src/app/friends/page.tsx`, `src/lib/shelter-friends/public.ts`, `src/app/management/contacts/ContactsTable.tsx`, `FriendWizard.tsx`, `src/app/admin/website/actions.ts`, both dictionaries, `manual/en.ts`, `releases.ts`, `docs/backlog.md` (status note), `docs/decisions/2026-10-08-map-tap-is-our-link.md`. No `worker/`, no migration
- [x] Roles affected identified — admin and management (Contacts, Management → Contacts, Shelter Friends, Management → Website) and the signed-out public (`/friends`). The 2IC's Contacts scope carries no address, so no map; staff, vet and volunteer have none of these pages
- [x] Anything explicitly **out of scope** written down — storing a pin (item parts 1 and 2) and the clean-up script (part 4): they need a column, so schema first. Separate Address and Map link fields: a new backlog item, 2026-10-08, on the `backlog` branch. A full Maps URL still embeds by the place name it carries (existing order in `mapQueryFromUrl`); its tap opens the exact URL

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — first run "Already up to date."; re-run after the PR went CONFLICTING merged `website-content-grant` (0163). The one conflict was `docs/backlog.md`, two neighbouring lines: kept this branch's status note on the maps item and `main`'s tick on the website-content item; `main` had not touched the maps line (diffed against the merge base). Merge commit `b0baed03`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run on `d2c80d27` and again on the merge `b0baed03`; exit code read directly (`exit=0`) both times, output redirected to a file:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; how existing address text reads is covered in section 4
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — on dev, the test Friend's (Harness Hardware) address was set in turn to each shape below, `/friends` fetched from this branch's dev server, and every map link on the card HEAD-requested. Restored to "Mae Wang, Chiang Mai" afterwards. Script output:

```
"https://maps.app.goo.gl/V5niTogBMv44An7k7"
   iframe: https://www.google.com/maps?q=18.7473128%2C99.0060458&output=embed
   taps: 302 https://maps.app.goo.gl/V5niTogBMv44An7k7
"https://maps.app.goo.gl/V5niTogBMv44An7k7 Hang Dong, Chiang Mai"
   iframe: https://www.google.com/maps?q=18.7473128%2C99.0060458&output=embed
   taps: 302 https://maps.app.goo.gl/V5niTogBMv44An7k7
"https://goo.gl/maps/abc123XYZ"
   iframe: (none)
   taps: (none)
"https://www.google.com/maps/place/Wat+Phra+Singh/@18.7884,98.9817,17z"
   iframe: https://www.google.com/maps?q=Wat%20Phra%20Singh&output=embed
   taps: 200 https://www.google.com/maps/place/Wat+Phra+Singh/@18.7884,98.9817,17z
"7MQ3+QJ Mae Wang, Chiang Mai"
   iframe: https://www.google.com/maps?q=7MQ3%2BQJ%20Mae%20Wang%2C%20Chiang%20Mai&output=embed
   taps: 200 https://www.google.com/maps/search/?api=1&query=7MQ3%2BQJ%20Mae%20Wang%2C%20Chiang%20Mai
"18.8496357, 99.0706297"
   iframe: https://www.google.com/maps?q=18.8496357%2C%2099.0706297&output=embed
   taps: 200 https://www.google.com/maps/search/?api=1&query=18.8496357%2C%2099.0706297
"99/123 หมู่ 4 ต.สุเทพ อ.เมืองเชียงใหม่ จ.เชียงใหม่ 50200"
   iframe: https://www.google.com/maps?q=99%2F123%20…%2050200&output=embed
   taps: 200 https://www.google.com/maps/search/?api=1&query=99%2F123%20…%2050200
```

  The Thai rows are shortened with `…` here for width only; each line also listed `200 https://www.google.com/`, the test Friend's Website button, removed as not a map link. The `goo.gl/maps` link is made up, standing in for a retired one: Google answers it 404, and the card shows no map and no tap. In the browser pane at 375px, `document.elementFromPoint` at the centre of the thumbnail is our `<a aria-label="Open in Google Maps">`, not Google's iframe
- [ ] Data persists — reload the page and the change is still there — n/a: nothing new is saved; the address field and its save path are unchanged, apart from the Website map link refusal below
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete added; existing contact and Friend forms only gained a hint line
- [x] Empty state renders sensibly (no rows yet) — an address with no usable map (the dead link) draws no map box and no "Open in Google Maps", rather than an empty frame (run above)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: driven only as far as `mapLinkLeadsSomewhere`'s HEAD request (curl: `goo.gl/maps/abc123XYZ` → 404, a live `maps.app.goo.gl` link → 302). The Management → Website save itself needs a signed-in admin, which this session could not do; it is in **Left for manual verification**
- [x] Boundary cases checked — link followed by text (opens only the link; text printed as the address), Google's home page as the address (two dev contacts held `https://www.google.com` / `.com.au`: no map and no Map button now, was Google's search page), a Plus Code, coordinates with a space, Thai script, a full Maps URL; the I Blue Paw production link (read read-only on Lutan's say-so in chat) resolves to its pin

### Role access matrix

No permission, route or query scope changed: the map is built from the same `address` / `map_location` each role already reads. Not re-tested per role for that reason.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Contacts, Management → Contacts, Management → Website | map tap opens the checked link | unchanged access; not signed in this session |
| management | Contacts, Management → Contacts | same as admin | unchanged access; not signed in this session |
| staff | none of these pages | no change | unchanged |
| vet | none of these pages | no change | unchanged |
| volunteer | none of these pages | no change | unchanged |
| signed out | `/friends` | map only where `show_map` (0076) | checked: map drawn for the opted-in test Friend; `FriendCard` draws the thumbnail only when `map_location` is set |

- [ ] Every role above tested — n/a: no access change; the matrix says why
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: updated (Contacts, Managing contacts, Shelter Friends wizard) and passes the build, but `/manual` needs sign-in, which this session could not do; in **Left for manual verification**
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: dictionary strings (`en.ts` / `th.ts`), not translatable content
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/friends` at 375px: `scrollWidth` 375, map and "Open in Google Maps" reachable. The contact hub at 375px needs sign-in: in **Left for manual verification**
- [x] Browser console clean — no errors or React warnings — `/friends` at 375px: no error-level messages
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/friends` 200; every map link rendered returned 200/302 (section 4)

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/friends` (public), fetched for seven address shapes; the dev contacts' addresses run through the same `addressMapNow` code
- [x] Any shared file touched checked from a second, unrelated page — `manual/en.ts` and both dictionaries feed every page; `/friends` and `/login` loaded and rendered from this branch's server after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merged work (0163, Management holding `website.content`) touches permissions, not map code; `src/app/admin/website/actions.ts` merged without conflict and gates pass on the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — left open on purpose, per the brief: a status note says parts (3), (5) and the 404 are done and (1), (2), (4) are not. Other open items searched for `mapHref`, `map-preview`, `map_location`, `contact_map_url`, `FriendCard`, `ContactActions`: none closed by this. The separate Address / Map link fields follow-up went on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-08-map-tap-is-our-link.md`
- [ ] `README.md` still accurate — n/a: the README says nothing about contact maps
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`: tapping a map now opens Google Maps every time, a broken map link shows no map, the address boxes explain how to get a Share link, and Management → Website refuses a map link Google says doesn't exist
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** I Blue Paw's link and its redirect: read and curl'd. "goo.gl kept active links": Google's reversal of 2025-08-01, from press coverage, not measured here, and the decision record says the code follows the link instead of relying on it. "The 404 came from a tap inside Google's embed": an inference. Our own links to that row were measured as working and the embed's internal links cannot be inspected, so a real-phone tap is in **Left for manual verification**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here reads the clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the link shapes are listed in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — except the two marked cuts in section 4 (Thai query strings shortened with `…`; the Website button's line removed), each said where it is made
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — code only, no schema: `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi restores the old map behaviour completely. Nothing it writes needs undoing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | A full Maps URL embeds by the place name it carries, so the thumbnail can sit on a guessed spot while the tap opens the exact place | deferred to backlog — storing the pin (item parts 1–2) fixes it |
| 2 | minor | The address field holds both the written address and the map link, so a link-only contact (I Blue Paw) has no written address to print | deferred to backlog — new item "Contacts: separate Address and Map link fields", 2026-10-08 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Tap the map thumbnail and "Open in Google Maps" on an **iPhone** for each shape: a `maps.app.goo.gl` link, a dead `goo.gl/maps` link (no map shown), a full Maps URL, a Plus Code, typed coordinates, a plain Thai address. Each opens the Maps app at the place, never a 404 | a contact's page and `/friends` |
| 2 | The same six on an **Android** phone | a contact's page and `/friends` |
| 3 | I Blue Paw: tapping its map on the contact page and on its public Friend card opens the shop's pin | production after release, or test with the same link pasted |
| 4 | Contact hub at 375px: the address prints the link (linked when it works, grey with the "doesn't open a map" note when it doesn't) and the written text after it | Shelter Operations → Contacts → a contact, signed in |
| 5 | The guidance under the address box reads well in English and **Thai** | Management → Contacts (add form and edit row), Management → Shelter Friends → Add |
| 6 | Management → Website: saving a dead `goo.gl/maps` link as the map link is refused with the plain message; a `maps.app.goo.gl` link saves | Management → Website → Contact & settings |
| 7 | The three manual steps read correctly | `/manual` → Contacts, Managing contacts, Add a Shelter Friend |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; only the person who looks may tick this

Manual verification by: pending: the seven checks under Left for manual verification, chiefly real-phone taps on an iPhone and an Android phone

### Result

- [x] Open defects are either fixed or explicitly accepted above — both deferred to backlog items, named
- [ ] Checklist pasted into the PR — n/a: the PR body links this file and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every feature PR is

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
