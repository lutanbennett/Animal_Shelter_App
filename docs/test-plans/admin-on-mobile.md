# Feature test plan

## Header

| | |
|---|---|
| Feature | Admin on mobile: per-screen verdict on which Settings/Management pages belong on a phone, and a "Best on a larger screen" notice on the desktop-only ones |
| Backlog item | `docs/backlog.md` → Mobile → **Review which admin features (if any) belong on mobile.** |
| Branch / worktree | `claude/admin-on-mobile` @ `C:\Development\Animal_Shelter_admin-on-mobile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-24 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | `3b3df28` (code, browser-checked); gates re-run at `541f5ec` after merging `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every `/admin` and `/management` route was opened and measured at 375px and given a verdict (field-needed / nice-to-have / desktop only) in `docs/decisions.md`; the seven desktop-only pages show a notice with **Show anyway** below `md`, and their hub tiles carry a phone-only "Larger screen" pill
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/components/LargerScreenNotice.tsx` (new), `src/components/SectionTiles.tsx` (optional `phoneNote`), page bodies of `src/app/admin/{zones,enclosures,immunization-types}/page.tsx` and `src/app/management/{contacts,vets,medications,diets}/page.tsx`, the tiles in `src/app/admin/page.tsx` and `src/app/management/page.tsx`, both dictionaries (`largerScreen`), `src/lib/manual/en.ts` (getting-started intro only), `src/lib/releases.ts`, `docs/`. `NavLinks.tsx` not touched. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin (all seven wrapped pages and both hubs) and management (the four `/management` pages and its hub). Staff, vet and volunteer reach none of these pages; no guard, RLS or nav entry changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — fixing field-page layout (the Mobile responsiveness sweep's job). One real defect found there, `/enclosures` scrolling sideways at 375px, is recorded on that backlog item with its cause, not fixed here. Security's users table (role column off-screen at 375) likewise left for the sweep

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: first "Already up to date." at `66d5550` (release 0.2.2 already in), then again as `541f5ec`, bringing in 0079_public_enclosures.sql and its check script — no conflict, nothing this branch touches; gates re-run on top of it
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 129s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

All driven in the in-app browser against `next dev` on :3007 (dev database), signed in as admin, at a 375×812 mobile viewport and at 1280×800.

- [x] Happy path works end to end — at 375px each of the seven pages reached **directly by URL** shows the notice and no table; **Show anyway** reveals the full page (create form and table) in place. At 1280px the same seven show no notice (`display: none`) and their tables render
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written. (Checked instead that Show anyway does not stick: a reload shows the notice again, by design)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature has no create/edit/delete; the wrapped forms and tables are unchanged code
- [x] Empty state renders sensibly (no rows yet) — the notice does not depend on rows; `/admin/security` access requests' empty state ("No one is waiting for access") seen at 375
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input added
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the breakpoint itself: at the pane's own 590px width (below `md`) the notice shows, at 1280 it does not; long tile labels ("Immunization Types") keep the pill on one line after the `whitespace-nowrap` fix; Thai strings render in both the notice and the pills

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/*`, `/management/*` | notice on 7 pages + 7 pills below `md`; nothing at desktop | **pass** — signed in, every route at 375 and 1280 |
| management | `/management/*` | notice on contacts/vets/medications/diets, 4 pills | not signed in as; same components as admin's view (`requireManagementUser`, unchanged) — manual item 1 |
| staff | none of these | redirected by the page guard, as before | not signed in as; no guard or nav entry changed |
| vet | none of these | same as staff | not signed in as; no guard or nav entry changed |
| volunteer | none of these | same as staff | not signed in as; no guard or nav entry changed |
| signed out | nothing | sent to sign-in | **pass** — `/admin/enclosures` by URL while signed out served `/login` |

- [ ] Every role above tested — n/a: admin and signed-out verified; management needs its own sign-in (manual item 1); staff, vet and volunteer reach no page this PR touches and no guard or nav entry changed
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — signed-out direct URL to `/admin/enclosures` served the sign-in page; the notice is explicitly layout, not access control, and every wrapped page keeps its own server guard

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — unchanged; the mobile drawer as admin lists all 13 expected links (read from `#mobile-nav`); Settings and Management both still hold phone-usable pages, so neither is hidden
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the Getting started intro names the notice and the pill; read back from the rendered `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new strings are UI dictionary entries (`en.ts`/`th.ts`), not record content; `/management/translations` queues data translations only. Thai rendering checked in the browser instead
- [x] Mobile viewport (375px) — no overflow, controls reachable — every `/admin` and `/management` route measured (table `scrollWidth`/`clientWidth` in decisions.md); no page overflows as a whole; the notice and its button fit. Field pages checked: resident edit and intake fit; `/enclosures` overflows (pre-existing, see Defects)
- [x] Browser console clean — no errors or React warnings — `read_console_messages` errors-only empty after the mobile and desktop runs
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no request added; the change is client-side display only and every page loaded with its content

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin/procedure-types`, `/admin/blood-test-types`, `/admin/security`, `/admin/website`, `/management/dashboard`, `/management/cashflow`, `/management/translations` (no notice, unchanged) at 375; the seven wrapped pages at 1280
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `SectionTiles` loaded on both hubs (pills where set, none on the other tiles); `manual/en.ts` loaded at `/manual`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the second sync brought only a migration file and `scripts/check-public-views.mjs`; gates pass on the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked; the `/enclosures` overflow and the inherited field list went onto the Mobile responsiveness sweep item on `backlog`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-24 "Admin on mobile": the verdict table, notice over hiding, nav unchanged, notice only where the table overflows
- [x] `README.md` still accurate — it does not describe per-page mobile behaviour
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR** — yes: an admin or manager on a phone now meets the notice and the tile pills; one line added
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every width in the table is a `scrollWidth/clientWidth` reading from the browser; the zones figure was first written as a guess and corrected to the measured 434 before commit

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold logic; the one boundary (`md`) was checked on both sides in the browser (590/375 vs 1280)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates lines, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

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

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` restores the pages without the notice; no schema or data to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | "LARGER SCREEN" pill wrapped mid-label on the Immunization Types tile at 375 | fixed (`whitespace-nowrap`) |
| 2 | moderate, pre-existing | `/enclosures` (a field page, untouched here) scrolls sideways as a whole at 375px — `scrollWidth` 492; per-zone card grids have no column template below `sm` | deferred to backlog (Mobile responsiveness sweep item, with the cause) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as **management** on a phone: the Management tiles for Contacts, Vets, Medications and Diets show "Larger screen", each of those pages shows the notice, Show anyway reveals it; Dashboard/Cashflow/Translations show no notice | `/management` on :3007 or `test.lannacare.org` |
| 2 | On an actual phone (not the emulated viewport), as admin: open Settings → Zones and tap Show anyway; confirm the notice reads well and the button is easy to hit | `/admin/zones` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: management sign-in on a phone, and a real-phone look at the notice (items 1–2)

### Result

- [x] Open defects are either fixed or explicitly accepted above — #1 fixed; #2 predates this branch, on a page it does not touch, and is deferred to the backlog sweep item with its cause
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over at release time

Result: pass

Release manager acknowledgement: pending  Date: —
