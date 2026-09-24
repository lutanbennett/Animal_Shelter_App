# Feature test plan

## Header

| | |
|---|---|
| Feature | Public page behind enclosure QR codes (`/e/<id>`) |
| Backlog item | `docs/backlog.md` → Facility → **A public view behind enclosure QR codes.** |
| Branch / worktree | `claude/enclosure-public-view` @ `C:\Development\Animal_Shelter_enclosure-public-view` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | #106 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no (reads `public_enclosures`, 0079, merged and applied to dev by `claude/enclosure-public-view-schema`) |
| Tested at SHA | `3205427` (code; this file is the commit after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a signed-out visitor scanning an enclosure's QR code sees the enclosure's name, Thai name, zone and a card per resident linking to `/r/`, and a signed-in user still goes to `/enclosures/<id>`
- [x] Files/areas touched listed — `src/app/e/[id]/page.tsx` (rewritten), `src/lib/enclosures/public.ts` (new loader), `src/app/adopt/ResidentCard.tsx` (optional `href`), `src/lib/public-paths.ts` (`/e/` public), `src/lib/supabase/proxy.ts` (comment only), i18n en/th (`enclosureCard`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions.md`
- [x] Roles affected identified — signed-out public (new page); every signed-in role only through the unchanged redirect
- [x] Anything explicitly **out of scope** written down — the view itself (0079, schema half); printing or programming QR codes; Thai names for enclosures and zones on dev are unset, so the Thai rendering was checked with the English fallback

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 361s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — #106, run 36024413969: `check` pass (1m21s), `test-plan` pass

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; 0079 is on `origin/main` (checked with `git ls-tree`)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; `--status` read anyway: "81 applied, 0 pending" on dev
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page was driven against real dev rows (section 4)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; `scripts/check-public-enclosures.mjs` re-run and passed (HARNESS-OK: 6 columns, no capacity/notes, embedded card = `public_resident_cards` row, empty enclosure `[]`, no Lifecycle, 67 physical enclosures, 48 residents each listed once)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; 0079 must be on production before this deploys (see section 8)

## 4. Functional checks

- [x] Happy path works end to end — signed out, `/e/7e6bd871…` (Front Zone 8) returns 200 with title "Front Zone 8 · Lanna Care for Animals", zone chip "Front Zone - White", and seven cards, R-0035 R-0032 R-0030 R-0031 R-0034 R-0033 R-0008, in name order; each links to `/r/<code>` and every one of those returns 200
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page, nothing to save
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only page
- [x] Empty state renders sensibly (no rows yet) — `/e/4e7ed0a0…` (Temple, zone Offsite, no residents) is a 200 page reading "Nobody is living here at the moment.", not an error
- [x] Invalid input is rejected with a readable message, not a crash — `/e/not-a-uuid` and an unknown uuid `/e/00000000-0000-4000-8000-000000000000` are the app's 404
- [x] Boundary cases checked — all five Lifecycle ids (Unassigned, Hospital, Fostered, Adopted, Deceased) signed out: 404, title "Lanna Care for Animals", the same as an unknown uuid, and "Hospital" appears nowhere in the Hospital 404's HTML. Thai locale (`locale=th` cookie): headings in Thai, names fall back to English where `name_th` is null

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/e/<id>` → `/enclosures/<id>` | redirect, as before | pass (signed-in redirect checked by Lutan, 2026-09-24; one role-independent branch) |
| management | same | same | pass (signed-in redirect checked by Lutan, 2026-09-24; one role-independent branch) |
| staff | same | same | pass (signed-in redirect checked by Lutan, 2026-09-24; one role-independent branch) |
| vet | same | same | pass (signed-in redirect checked by Lutan, 2026-09-24; one role-independent branch) |
| volunteer | same | same | pass (signed-in redirect checked by Lutan, 2026-09-24; one role-independent branch) |
| signed out | `/e/<id>` public page; `/enclosures`, `/enclosures/<id>`, `/residents` not | public page for physical enclosures, 404 for Lifecycle/unknown, staff routes → sign-in | pass — `/e/` 200/404 as listed above; `/enclosures`, `/enclosures/<id>`, `/residents` all 307 → `/login?next=…` |

- [ ] Every role above tested — n/a: signed out driven by curl and the browser pane; Lutan checked the signed-in redirect (2026-09-24, told in chat), and the five roles share one role-independent branch (`if (user) redirect(...)` before any lookup), so each role was not signed in separately
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — signed out, `/enclosures/<id>` still redirects to sign-in; the only public data comes from `public_enclosures`, and the HTML of the busiest enclosure contains no "capacity", "notes", "maintenance", "occupan", "Hospital" or "Fostered"

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; the page is reached by scanning
- [x] Manual updated (`src/lib/manual/en.ts`) — the enclosure-page topic says what a visitor sees, and What the public sees gains a line about kennel tags. Wording checked in the source, not rendered at `/manual`: the manual needs a sign-in (Left for manual verification 2)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: new strings are UI dictionary entries (en + th), not user content; resident text is `/r/`'s, untouched
- [x] Mobile viewport (375px) — `scrollWidth` 375 = `innerWidth` on both the busy and the empty enclosure; cards stack one per row as on `/adopt`
- [x] Browser console clean — only Fast Refresh logs on `/e/<id>`
- [x] Network clean — the document is 200 and every asset 200/304

## 6. Regression

- [x] The pages nearest the change still work — `/r/R-0035` 200; `/adopt` 200 with its cards still linking to `/adopt/<id>` (the shared card's default `href`); `/` 200
- [x] Any shared file touched checked from a second, unrelated page — `public-paths.ts`: `/enclosures` and `/residents` still redirect signed out (loaded, not read); `ResidentCard.tsx`: `/adopt` loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was "Already up to date."

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — signed-in check before lookup, why Lifecycle 404s look like unknown ids, reusing the `/adopt` card linking to `/r/`
- [ ] `README.md` still accurate — n/a: the README does not describe the public routes one by one; nothing in it changes
- [x] **Release notes.** `unreleased` gained a line for visitors scanning kennel QR codes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 404-equivalence and the empty-kennel page were requested and compared; the "Postgres rejects a malformed uuid" reason for the uuid check was measured: anon `GET public_enclosures?id=eq.not-a-uuid` → `400 22P02 invalid input syntax for type uuid`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager (add `/e/<id>` to that pass)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but the code reads 0079 (`public_enclosures`) from the schema PR; production needs 0079 applied before this deploys, or `/e/` 404s for every visitor
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; 0079's plan is in the schema PR's test plan

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code only; `npx wrangler rollback --env production` reverts it completely, and `/e/` goes back to redirecting visitors to sign-in

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in (any role, ideally one staff and one volunteer): scanning or opening `/e/<id>` lands on the enclosure page, as before — **checked by Lutan 2026-09-24 (told in chat): redirect works** | `/e/7e6bd871-f2f8-5622-a02f-11e63dbed85e` on dev or test |
| 2 | The two new manual lines read well at `/manual` (Enclosures → The enclosure page; What the public sees) | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: item 2 is outstanding; see the pending line below

Manual verification by: pending: the manual wording (Left for manual verification 2); item 1 checked by Lutan 2026-09-24

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [x] Checklist pasted into the PR — in #106's description
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
