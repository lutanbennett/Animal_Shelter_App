# Feature test plan

## Header

| | |
|---|---|
| Feature | R1's app half. A volunteer's screens read `resident_who_and_where` and nothing else of a resident; every page and Drive route they lost refuses to the no-access page; the menu, manual, walkthrough pass 5 and the matrix say who and where. Nobody holds the role (Lutan, 2026-10-04) |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, then one role at a time**. **Not ticked**, because the item is the whole roles build and five roles remain; its status line now says **R1 is complete** and names what is left for batch 45 |
| Branch / worktree | `claude/volunteer-read-only` @ `C:\Development\Animal_Shelter_volunteer-read-only` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated, and driven in the browser pane at 375 px) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `main` @ `90180159` (#348) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a volunteer sees who each resident is and where they live, and the enclosures, and every other page, route and Drive upload they lost refuses with the app's own no-access page rather than rendering empty or failing
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/lib/residents/who-and-where.ts` (new: the who-and-where reader, `requireFullResident()`, `loadOccupants()`); `src/app/residents/` (list, a resident's page and `ResidentWhoAndWhere.tsx`, and a guard on every page under `[id]/` and on `new`); `src/app/enclosures/` (list, page, map); the create and edit pages of the seven medical kinds (`vet-visits`, `weight`, `diets`, `prescriptions`, `blood-tests`, `immunizations`, `procedures`); `src/lib/auth/require-role.ts` (`assertPhotoWriteAccess`); `src/app/NavLinks.tsx`, `NavPane.tsx`, `no-access/page.tsx`; `src/lib/manual/en.ts`; both i18n dictionaries (a `whoAndWhere` group and one search placeholder); `scripts/check-permission-parity.mjs`, `check-home-screens.mjs`, `lib/permission-seed.mjs`, `lib/acceptance-matrix-entries.mjs`; `docs/role-walkthrough.md`, the decision file, `docs/backlog.md`. No `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **volunteer** (the point); **vet** is refused `/residents/new` (it never held `resident.register`); admin, management and staff unchanged, which the staff crawl below is for. No login holds `volunteer` on dev or production, so nobody lost anything
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: `/my` for a volunteer (F-21), a recurring job with no screen still listing a volunteer as eligible, F-10 and F-15, the medical-role, maintenance-role and 2ic-role streams, policies (`0135` is `perm-convert-medical`), and production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in; one conflict, in `docs/backlog.md`'s one long Roles-build line, resolved by taking `main`'s line and re-applying this branch's R1 replacement to it (both stream's status lines are present)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: build exited 0 after 141s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0134` is the database half
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the pages read dev's real residents (78) and enclosures
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the database refusals this relies on are `check-volunteer-narrowing.mjs`'s, run below
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration. One ordering note: `0134` must be applied to production before this deploys, because the volunteer's pages read the view it creates

## 4. Functional checks

A disposable volunteer was made on dev **by script** (a service-role script creating an `auth` user and a `user_roles` row, the same pattern as `check-access-requests-card.mjs`), its password kept in a scratch file outside the repository, and signed in both by script (session cookies, to fetch every address) and in the browser pane through the login form. A disposable staff and a disposable vet were made the same way for the control crawl. The three logins are deleted at the end of the session (below).

- [x] Happy path works end to end: Home is two tiles (Residents, Enclosures); the list shows 78 residents with name, ID, enclosure, zone and status; a resident opens a who-and-where page (photo or "No photo yet", name, ID, species, sex, status, enclosure as a link, zone); an enclosure shows its residents
- [x] Data persists — reload the page and the change is still there — n/a: nothing is written; this change only reads
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature removes writes; each refused page above is the check
- [x] Empty state renders sensibly (no rows yet): a volunteer search for a name that does not exist reads "0 residents" (fetched as a volunteer: `?q=zzzqq`); a name (`Chok`, 2 residents) and an ID (`R-0025`, 1 resident) both find their residents
- [x] Invalid input is rejected with a readable message, not a crash: a typed address for a page the role lost lands on `/no-access` ("You don't have access to this page", with a Home button), in English and Thai
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a resident with no photo, a Thai name, a resident in the Lifecycle pseudo-zone (the zone row is left out, the status says it), a resident in no enclosure ("Not in an enclosure right now")

### Role access matrix

Addresses typed directly (fetched with each role's session cookies, and a sample in the browser pane), not read off the menu.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: unchanged | no change | not crawled: the guards ask `can()`, which answers yes for admin before any cell; `check-home-screens-live.mjs` signs an admin in and passes |
| management | n/a: unchanged | no change | `check-home-screens-live.mjs` lands a management login on its own home with 19 tiles; not crawled address by address |
| staff | every resident, enclosure, medical, stock, maintenance, project, contact, vet and assistant page | no change | crawled 46 addresses: none of the pages guarded here redirected; `/appointments`, `/management/*` and `/admin` refused, as before |
| vet | residents and the medical pages; no enclosures, stock, maintenance, projects, contacts or vets | no change, plus `/residents/new` refused | crawled 46 addresses: the seven medical new-record pages and the resident pages open; `/residents/new` is now refused (it never held `resident.register`) |
| volunteer | `/home`, `/residents`, `/residents/:id` (who and where), `/enclosures`, `/enclosures/:id`, the manual, release notes, change password | everything else refused to `/no-access` | 46 addresses: 32 refused to `/no-access` (every `/residents/:id/…` page, `/residents/new`, stocktake, deliveries, maintenance, projects, contacts, vets, appointments, management, admin, and the seven new-record pages). **Not refused: `/my` (F-21, left for batch 45) and `/assistant`, which renders its existing "can't use" note by design** |
| signed out | n/a: no route changed | no change | `check-home-screens-live.mjs`: signed out is sent to sign in (307 → `/login?next=%2Fhome`) |

- [x] Every role above tested: volunteer, staff and vet by crawl; admin, management and signed out by `check-home-screens-live.mjs`, which signs each in
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): every refusal above is a typed address answered with `NEXT_REDIRECT /no-access` by the page's own guard. The Drive routes and the database were already refusing; `check-volunteer-narrowing.mjs` shows 55 of 55 removed rights refused under the volunteer's own JWT

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links: a volunteer's menu read from the page is `/home`, `/residents`, `/enclosures`, `/manual`, `/releases`, `/account/password`. Appointments, which used to appear for any login without My tasks, now needs `/appointments` to open
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: nine topics lose the volunteer, two gain a role list, two gain a volunteer callout, six sentences reworded; `acceptance-matrix.mjs --check` passes. The manual's own pages were fetched as a volunteer (200)
- [x] Translatable strings go through the translation path, checked at `/management/translations`: the new strings are interface text in both dictionaries (`residents.whoAndWhere`, one search placeholder), not public-site content, so there is nothing at `/management/translations` to check; both languages were read in the browser pane
- [x] Mobile viewport (375px) — no overflow, controls reachable: Home, the residents list, a resident's page, the enclosures list and `/no-access`, in English and Thai (the resident page, `/no-access` and the enclosures list in Thai). No sideways scroll; the list shows the name only, as it does for staff
- [x] Browser console clean — no errors or React warnings: the pane reported no console errors on the last page driven (the enclosures list, in Thai); it was not read after every page, so this is one page, not all of them
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: every address in the crawls answered 200 (a refusal is a 200 carrying a redirect to `/no-access`, as every guard in this app does), and the pane's requests for the enclosures list were 200 or 304

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/residents` and a resident's hub, `/enclosures` and an enclosure page as **staff**, the seven medical new-record pages as staff and as a vet, `/home` for every role (`check-home-screens-live.mjs`: "All expectations held")
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**: the menu was read from `/enclosures`, `/residents/:id` and `/no-access` as a volunteer, and `/home` as staff, which render the same `NavLinks`
- [x] Nothing merged from `main` during `sync` was broken by this branch: `perm-convert-medical` (#348) and `public-site-findings` (#347) merged in; parity is GREEN (1,924 match, 36 known, 0 mismatch) and `npm run lint` passes

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): deliberately **not ticked**, as the item is the whole roles build; its status line says R1 is complete, so the next planning run reads it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-volunteer-read-only.md`: the app's list was short in a different way (the eleven predicates were gone; the real gaps were the pages and one hardcoded Drive guard), why `current_user_role()` decides the form, why layer 2 does not empty, what was found and not done
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: no login holds the volunteer role on test or production, so there is no shelter user who sees a different screen today. This is what a future volunteer, and the 2IC and Heads who borrow the role's rights, will meet. A line saying volunteers "can no longer" do something would read as a change to someone's job, and none is. The only change staff or management could meet is that the "no access" page's button now says Home instead of My tasks, where it went to Home all along
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (32 of 46 refused; 1,924 / 36 / 0; 55 of 55) are scripts' output. The decision file says which claims are reasoned: that server actions under a resident rely on the database to refuse, and that the Thai wording reads well

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; the boundary that exists, volunteer versus staff and vet, was crawled from both sides
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR. The code reads `resident_who_and_where` from `0134`, so `0134` must be applied to production before this deploys; that is the whole ordering
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR; `0134` before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `./scripts/pi/deploy-pi.sh --ref <sha>` rebuilds the previous release. Nothing here touches the schema. The volunteer's pages would then read tables they cannot read, which is harmless while nobody holds the role

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work, fixed in it | `assertPhotoWriteAccess()` still listed `volunteer` in front of a Drive upload, the one guard Drive has | fixed: asks `photos.resident_add` |
| 2 | Medium, found by this work, fixed in it | The residents list, a resident's page and the enclosure pages rendered empty or blank for a volunteer, and twenty-two pages under them had no guard | fixed |
| 3 | Low, found by this work, fixed in it | The menu offered Appointments to any login without My tasks; the no-access button said My tasks and went Home | fixed |
| 4 | Low, found by this work, fixed in it | The acceptance matrix and home check read only `0132`'s seed, so they believed the volunteer still held 24 cells | fixed in `permission-seed.mjs` |
| 5 | Low | `/my` opens for a volunteer and shows "Nothing is assigned to you right now" | deferred: batch 45 (F-21); named in the decision file and the backlog status line |
| 6 | Low | A recurring job with no screen lists a volunteer as eligible, who holds no `recurring.do_own` and is refused by `record_recurring_job()` | deferred: batch 45 (F-21) |
| 7 | Low | While this branch was open the parity check's layer 1 went STALE for a few hours because `0135` was applied to the shared dev database before its PR merged | accepted: not this branch's; green after the merge of #348 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The volunteer's home, list, resident page and enclosures on a real phone, and the Thai wording read by a Thai speaker (`residents.whoAndWhere`: "อยู่ที่ไหน", "กรง", "โซน", "คุณดูได้ว่าตัวนี้คือใครและอยู่ที่ไหน") | `test.lannacare.org`, as a volunteer account made for the purpose |
| 2 | Walkthrough pass 5 (`docs/role-walkthrough.md`), once, by a person, when a volunteer login first exists | a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. — n/a: not yet — the list has two items and nobody has looked; the signature below says `pending:` so that is on the record

Manual verification by: pending: a person looking at the volunteer's screens on a real phone and reading the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
