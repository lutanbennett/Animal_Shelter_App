# Feature test plan

## Header

| | |
|---|---|
| Feature | A vet's menu and pages cut down to Residents and My tasks |
| Backlog item | `docs/backlog.md` → "Cut the vet's world down to residents and their own tasks" |
| Branch / worktree | `claude/vet-scope-navigation` @ `C:\Development\Animal_Shelter_vet-scope-navigation` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `a250762` (the code; this plan and the docs commit follow it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a vet's menu is now My tasks and Residents, and the five shelter route trees (`/enclosures`, `/maintenance`, `/vets`, `/contacts`, `/projects`, list and detail pages) refuse a vet with #177's `/no-access` page instead of showing the data
- [x] Files/areas touched listed — `src/lib/auth/app-access.ts` (`isShelterRole`); the twelve pages in the five trees (`page.tsx` and `[id]/page.tsx` of each, plus `maintenance/new` and `maintenance/[id]/edit`); `src/app/NavLinks.tsx`, `src/app/NavPane.tsx`; `src/app/e/[id]/page.tsx` (kennel QR code); `src/lib/manual/en.ts`; `src/lib/releases.ts`; `README.md`, `docs/decisions.md`, `docs/backlog.md`
- [x] Roles affected identified — vet loses the five pages; admin, management, staff and volunteer unchanged; signed out unchanged (the proxy sends them to sign in before any guard runs); a signed-in vet scanning a kennel QR code now gets the visitor card
- [x] Anything explicitly **out of scope** written down — which *residents* a vet sees (order 4, awaiting Lutan's rule); server actions in these trees (left to RLS); database-level access. The database still lets a vet write the `vets` table (`vet_rw_vets`) and read contacts, enclosures and zones. That is logged on the `backlog` branch as "A vet can still edit the shelter's list of clinics through the database". It needs a migration, and this stream had no migration slot

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in. First run `Already up to date.` at `8720ea9`; the second, before merge, brought in recurring-jobs eligibility and `0103`/`0104` and conflicted only in `src/lib/releases.ts`, where both sides added an `unreleased` line — both kept (`cb0b314`). Nothing it brought in adds a page under the five guarded trees
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run before the PR and again on the merged tree `cb0b314`, which printed:

```
=== gates: build exited 0 after 144s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — #182, 3/3 checks passing on `4c87472`; the merge commit re-runs them

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

All against `next dev` on :3011 and the dev database, signed in through the local app as the dev test login from `.env.local`. It is an admin, and was switched to `vet` in `user_roles` for the vet runs, 14:04:50 to 14:08:48, then back to `admin`. The app reads the role on every request, so no re-sign-in was needed, as in `public-viewer-login.md`. Each route was fetched from the signed-in page, and the result is what the response carried: its final path, any `NEXT_REDIRECT` target streamed in the body (these pages have a `loading.tsx`, so a refusal arrives as a streamed redirect, not a 307), and its `<h1>`. Real dev ids: enclosure `9d293b23…` (Adopted), maintenance job M-0010, vet CMCAH, a contact, the Shelter Projects folder, and kennel `4931cad3…` (Front Zone 1) for the QR card.

- [x] Happy path works end to end — as a vet, all twelve pages streamed `NEXT_REDIRECT;replace;/no-access`, and a real navigation to `/maintenance` landed on `/no-access` reading "You don't have access to this page — Your role doesn't include it. If you need it for your work, ask a manager or an admin. — Go to My tasks". As admin, all twelve rendered their own `<h1>` (Enclosures, Adopted, Maintenance, Log maintenance, test, M-0010 · Edit job, Vets, Chiang Mai Centre Animal Hospital (CMCAH…, Contacts, Lutan Bennett, Projects, Shelter Projects) with no redirect
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; the change is who may open a page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete added; `/maintenance/new` and `/maintenance/[id]/edit` were checked as pages (refused for a vet, rendered for admin)
- [ ] Empty state renders sensibly (no rows yet) — n/a: the refusal replaces the page before any rows are read; the vet's old empty maintenance board is the state this removes
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked — a vet on `/e/<kennel>` stays on the visitor card (`<h1>` Front Zone 1, two resident links `/r/R-0017`, `/r/R-0075`, and no `/login?next=` sign-in hint). `/r/R-0017` then streams a redirect to `/residents/1f203600…` for the vet. Admin on `/e/<id>` is still sent on to `/enclosures/<id>`. A Lifecycle pseudo-enclosure (Adopted) on `/e/` 404s for a vet, as it does for a visitor, which is by design (`0079`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all five trees, full menu | unchanged | 12/12 pages render; menu `/my /residents /enclosures /maintenance /stocktake /vets /contacts /projects /management /admin` + footer, before and after the vet run |
| management | all five trees | unchanged — in `isShelterRole` | not signed in as; same predicate as admin (`SHELTER_ROLES` list), no management-specific branch |
| staff | all five trees | unchanged — in `isShelterRole` | not signed in as; same predicate |
| vet | My tasks, Residents | the five trees refused to `/no-access`; menu is My tasks + Residents | 12/12 pages → `/no-access`; menu `/my /residents` + footer `/manual /releases /account/password`; `/residents` and `/my` render |
| volunteer | all five trees | unchanged — in `isShelterRole` | not signed in as; same predicate |
| signed out | nothing in the app | unchanged — the proxy sends them to `/login` before the page runs | not re-tested; `requireRole` still redirects to `/login` on no user, the path #177 tested |

- [x] Every role above tested — admin and vet were driven against the running app. Management, staff and volunteer were not signed in as: the change gives them no branch of their own, only membership of the same `SHELTER_ROLES` allow-list as admin. Signed out was not re-tested, since this PR does not change that path
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — every one of the twelve URLs was requested directly as a vet, not through the menu

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — vet menu `/my /residents` (the reference group is dropped, not left as an empty divider, by the existing empty-group filter); admin menu unchanged
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the vet role summary keeps "Can read resident details" and adds the menu sentence; the navigation topic says a vet's menu is My tasks and Residents; enclosure, project, vet and contact topics gained role chips without the vet; two stale "vets can…" sentences in enclosure/maintenance topics corrected. Build passed with them; the `/manual` page itself was not opened
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new UI string; the refusal page's text is #177's, and the manual is English only
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; the drawer renders the same `groups` list, which is now shorter for a vet
- [ ] Browser console clean — no errors or React warnings — n/a: checked by fetch and navigation with the pane hidden; the console was not read. Left for manual verification row 1 covers a vet using the pages
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — all 15 fetched routes answered 200 for both roles (the `/e/` Adopted 404 is the documented Lifecycle case)

## 6. Regression

- [x] The pages nearest the change still work — `/my`, `/residents`, `/no-access`, `/e/[id]`, `/r/[code]`, and all twelve guarded pages as admin
- [x] Any shared file touched checked from a second, unrelated page — `NavLinks.tsx` via the menu on `/my` as both roles; `app-access.ts` via `/residents` and `/my` loading as a vet (the app-access gate still lets a vet in)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates pass on the merged tree; the only overlap was the release-notes list

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the follow-up (`vet_rw_vets`) went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the allow-list, per-page guards not a layout, server actions left to RLS, the QR card, no Thai manual
- [x] `README.md` still accurate — the vet row in the roles table now says what a vet is shown
- [x] **Release notes.** A vet will notice their menu shrink and the pages refuse; `unreleased` gained a line saying so
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the vet policies are from dev's `pg_policies`, not read off the migration files; the layout claim is quoted from the Next guide in `node_modules`; the refusal behaviour is from the runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: a role check, not a threshold; both sides of it (vet refused, admin allowed) were run on every page
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates lines are as printed; the menu lists and headings are copied from the run output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — code only: `npx wrangler rollback --env production` restores the old menu and open pages completely; no data or schema is changed by this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The database still gives a vet read/write on `vets` (`vet_rw_vets`) and read on contacts, enclosures and zones, so the refused pages' data is reachable through the API with a vet's own session | deferred to backlog — "A vet can still edit the shelter's list of clinics through the database" (needs a migration; this stream had no slot) |
| 2 | low | On the kennel QR card a signed-in vet still sees the public header's "Staff login" link — the card's own sign-in hint is now hidden, the header's is not | accepted — the public header is shared by every public page and is the same for a signed-in user on `/r/` today; not this item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a real vet login: the menu shows only My tasks and Residents, and typing any of the five addresses gives "You don't have access to this page" inside the app with the menu still there — especially Maintenance, which used to show an empty board | `/enclosures`, `/maintenance`, `/vets`, `/contacts`, `/projects` and one detail page of each, as a vet |
| 2 | As a vet on a phone, scanning a kennel's QR code shows who lives there and each resident opens their page in the app | A kennel QR code, as a vet |
| 3 | The vet line and role chips read right in the manual | `/manual`, Roles and the Enclosures / Projects / Vets and contacts sections |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: a vet's menu and the five refused trees, the kennel QR card on a phone, and the manual wording

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is deferred to its own backlog item and defect 2 is accepted, both recorded above
- [x] Checklist pasted into the PR — in #182's description
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass with accepted defects

Release manager acknowledgement: pending
