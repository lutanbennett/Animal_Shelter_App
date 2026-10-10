# Feature test plan — donation-picker-and-map-zoom

Two unrelated bugs in one stream, one commit each: (A) Record a donation's
"Choose a resident" found nobody; (B) the facility map's zoom buttons sat over
Main Zone's enclosure 1 on a phone.

## Header

| | |
|---|---|
| Feature | (A) donation resident picker loads residents again, and says so when it cannot; (B) map zoom buttons in a row under the plan |
| Backlog item | `docs/backlog.md` → "Bug: on Record a donation, "Choose resident" finds nobody when you search." and "Facility map: the zoom buttons sit over the bottom-right enclosure on a phone…" |
| Branch / worktree | `claude/donation-picker-and-map-zoom` @ `C:\Development\Animal_Shelter_donation-picker-and-map-zoom` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `9ec7fcdf` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — (A) the picker reads `resident_list_view` instead of a column `residents` does not have, deceased included, and a failed load is shown on the form rather than passing for "no matches"; (B) + / − / fit sit under the plan, so they no longer cover enclosure 1
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — (A) `src/app/management/donations/new/page.tsx`, `new/DonationForm.tsx`, `donations/[id]/page.tsx`, both dictionaries (one string); (B) `src/app/enclosures/map/PanZoom.tsx` (shared with the map editor), one word in `src/lib/manual/en.ts`; `src/lib/releases.ts`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — (A) whoever holds `donation.receipt`: Admin and Management; (B) everyone who opens the facility map, and Admin in the map editor
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the same `?? []`-without-`error` pattern in eight other files is a new backlog item, not fixed here; the receipt PDF does not name the resident and never did

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — one conflict in `releases.ts`, because `main` had cut a release and emptied `unreleased`; resolved by keeping only this branch's two new lines
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 216s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end — **reproduced first:** the old select against dev returned `400 {"code":"42703", … "message":"column residents.current_status does not exist"}`; the same fields from `resident_list_view` returned 200. Then in the browser pane as a throwaway admin on dev: A resident → Choose a resident; "Summer" finds Summer; "ซัมเมอร์" finds Summer (ซัมเมอร์); "Lilly" finds Lilly, labelled Deceased; picked Summer, saved; the donation page reads "For: A resident: Summer" and receipt LCA0009003 was issued. (B) at 375 × 812 on Main Zone, a tap on enclosure 1's bottom-right corner opens Blue Enclosure 1's details at zoom 1; + zooms to 1.6, fit returns to 1
- [x] Data persists — reload the page and the change is still there — the saved donation opened on its own page, read from the database, with the resident named
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the fix touches only how the create form loads its picker; edit and void are unchanged
- [x] Empty state renders sensibly (no rows yet) — the failure state, which used to pass for empty: with the view name broken on purpose, choosing A resident shows "The list of residents could not be loaded, so none can be chosen…" above the picker, and the server log names the PostgREST error; restored before committing
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new input; saving without a resident is the existing "Choose the resident this gift is for." check, unchanged
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — Thai-script search; a deceased resident; (B) both 375 px and 1280 px, where the buttons measured under the frame (frame bottom 664 / buttons 672–716 at 375; 734 / 742–786 at 1280), 44 × 44 each, page 375 px wide

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Record a donation; facility map; map editor | picker lists residents; buttons under the plan | browser pane, throwaway admin: as expected; `check-phone-width.mjs` as admin on all three pages |
| management | Record a donation; facility map | same as admin | `check-phone-width.mjs` as management measured the pages the role can open (layout only; the run skipped 6 views across roles as unreachable, without naming them here); the picker contents not checked as management |
| staff | — | n/a | role retired (no login holds it) |
| doctor | no `donation.receipt`, no `facility.map` | refused | not run; neither gate changed |
| volunteer | facility map only | buttons under the plan | `check-phone-width.mjs` as volunteer (layout only) |
| signed out | nothing | sent to sign-in | `/management/donations/new` redirected to `/login?next=…` before the session was set |

- [ ] Every role above tested — n/a: admin driven in full; management and volunteer by the phone-width script only; doctor's gates are unchanged; staff is retired
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — signed-out direct load of `/management/donations/new` went to sign-in (the server redirect, before any session existed); the `donation.receipt` gate itself is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the map topic now says the buttons are "under the plan"; read in the diff, the manual page itself not loaded
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no staff-typed prose; the one new UI string is in both dictionaries
- [x] Mobile viewport (375px) — no overflow, controls reachable — `node scripts/check-phone-width.mjs --roles=admin,management,volunteer --pages=/enclosures?view=map,/admin/facility-map,/management/donations/new`: "No page scrolls sideways." and "Every component action is at least 44 px." (12 page views, en + th). The default role list crashes on the retired Staff role, hence `--roles`; filed on the backlog branch
- [x] Browser console clean — no errors or React warnings — the only console error seen was the deliberate one from the broken-view check
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the donation saved and redirected to its page; the map loaded its plan

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the donation's own page after saving; the facility map overview and Main Zone; Settings → Facility map (editor), whose buttons now sit under its plan too (frame bottom 985, buttons 993–1037)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `PanZoom.tsx` is shared with the map editor: `/admin/facility-map` loaded and measured
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought map-rooms-schema (0175) and a release cut; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both items; follow-ups (the other silent `?? []` reads; the phone-width script's Staff role) committed on `backlog`. Swept the open items for donation, receipt, picker and map: none other is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-10-donation-picker-and-map-zoom.md`
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 42703 error was observed before the fix; "still covered part of enclosure 1 at 1280 px" was seen in the browser pane before the overlay was dropped at every width

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — redeploy the previous SHA on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema, so nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | The donation's own page turned a failed read into "not found" or "no receipts yet", and the latter offers a second receipt | fixed: it now throws on a failed read |
| 2 | minor | `check-phone-width.mjs` crashes on its default role list (retired Staff) | deferred to backlog |
| 3 | minor | Eight other files read `.data ?? []` with no `error` check | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, tap enclosure 1 anywhere in its shape and it opens; the + / − / fit row under the plan is easy to reach | Enclosures → Map → Main Zone - Blue, Lutan's phone |
| 2 | The Director finds a resident by English and Thai name on her phone, and the row reads clearly | Management → Donations → Record a donation → What it is for: A resident |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see the signature line

Manual verification by: pending: enclosure 1 tap and the button row on a real phone; the picker on the Director's phone

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defects 2 and 3 are deferred to the backlog
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
