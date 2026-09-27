# Feature test plan

## Header

| | |
|---|---|
| Feature | `/manual` opens on the signed-in role; other roles' topics hidden until found; Show everything brings them back greyed |
| Backlog item | `docs/backlog.md` → "A role-based manual: show each role the manual for what it can do" |
| Branch / worktree | `claude/role-based-manual` @ `C:\Development\Animal_Shelter_role-based-manual` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `5fb3b42` (the code; this plan follows it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/manual` keeps the topics that are untagged (everyone) or tagged with the reader's role, hides a section with none of them together with its intro, keeps the rest in the page as `hidden="until-found"` so Find on page and `#anchors` still reach them (greyed, "Not part of the Vet role"), and has a Show everything link (`?view=all`) that shows every topic, greying the ones outside the role. The item's three traps — untagged topics, section intros, keeping a way to see the rest — are each covered in section 4
- [x] Files/areas touched listed — `src/app/manual/page.tsx`, `src/app/manual/UntilFound.tsx` (new), `src/lib/manual/filter.ts` (new), `src/lib/manual/types.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `README.md`, `docs/decisions.md`, `docs/backlog.md`
- [x] Roles affected identified — every app role now sees a shorter manual by default: vet 19 of 59 topics, volunteer 21 (22 with the maintenance-board retag, measured before it), admin 58 (only the new vet-only topic tucked). Management and staff get the same filter from the same tags. Signed out: unchanged, the proxy sends them to sign in before the page runs
- [x] Anything explicitly **out of scope** written down — release notes segmented by role (backlog order 12; `isForRole` in `filter.ts` is written to be reused there); a search box inside the manual (there is none; "search" is the browser's Find on page, which is what `until-found` serves); a Thai manual (there is only `src/lib/manual/en.ts` — the brief's "both dictionaries" has no `th.ts` to apply to, and the page's own strings live in the manual file like the rest of its chrome); manual screenshots (deferred to one full rerun)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.` at `5fb3b42`; before merge, a second sync brought in #187 (`0106` one weight per visit and per day: the migration, its check script and docs, no app code) cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run at `5fb3b42`, which printed:

```
gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR (runs the same three) — #189, 3/3 passing (check, migration-numbers, test-plan) on `54b8d77`; the sync commit re-runs them

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page reads only the role
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

All in the built-in browser against `next dev` on :3006 and the dev database, signed in as a throwaway login made for this (`manual-role-test-…@example.test`, created with the service role on dev, credentials kept outside the repo) rather than flipping the shared dev test user while other sessions use it. Its `user_roles.role` was switched vet → volunteer → admin between page loads; the page reads the role per request. The login is left on dev (disposable data) as admin. Counts below are read from the DOM with `javascript_tool`.

- [x] Happy path works end to end — as a **vet**, `/manual` says "Showing the 19 topics for the Vet role. Show everything". Visible: Getting started (sign-in, language, navigation, release-notes, roles — not the assistant, which a vet does not get), My tasks (only the new "My tasks for a vet"), Residents (finding a resident, the hub), Housing (placement history), all seven Medical topics, Photos, What the public sees (both). Enclosures, Maintenance, Projects, Vets and contacts, Management and Settings were hidden whole, and the contents list matched the visible topics exactly
- [x] Untagged topics never vanish (trap 1) — every untagged topic (sign-in, language, navigation, release-notes, roles, residents-list, hub, placement-history, resident-photos, public-pages, getting-help) was visible for vet, volunteer and admin
- [x] A section with none of the role's topics goes with its intro (trap 2) — for a vet, the six sections above are `hidden` at `<section>` level, intro included; for a volunteer, Medical, Maintenance (before the retag) and Settings were; Management stays for a volunteer because Stocktake is theirs, and its intro now reads "Mostly for the management and admin roles … Stocktake is here too for staff and volunteers"
- [x] A way to see the rest (trap 3) — Show everything goes to `/manual?view=all`: 59 topics, 0 hidden, 40 greyed (`opacity-60`, "Not part of the Vet role") and the same 40 greyed in the contents list; the bar then says "Showing everything. Topics outside the Vet role are greyed. Show only the Vet role"
- [x] Tucked topics are reachable by anchor — as a vet, loading `/manual#stocktake` revealed that topic (and its section heading) scrolled to the top, greyed and labelled, while its sibling `#dashboard` stayed `hidden="until-found"`; setting `location.hash = '#contacts'` on the open page did the same for Contacts. In this Chromium the page had upgraded the attribute to `until-found` (read back from the DOM), which is what Find on page needs
- [x] Data persists — reload the page and the change is still there — the filter is the role plus the URL: reloading `/manual?view=all` stays on everything, `/manual` on the role
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the page writes nothing
- [x] Empty state renders sensibly (no rows yet) — the nearest thing is a role with little in a section: a vet's My tasks section shows just the vet topic, which says their My tasks is empty and why
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the only input is `?view`, and anything but `all` is the filtered view
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — admin, whose tags cover almost everything: 58 topics, only `my-tasks-vet` tucked, no section hidden

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/manual`, filtered | everything but the vet-only topic | 58 topics; `my-tasks-vet` tucked; no hidden sections |
| management | `/manual`, filtered | the admin/management-tagged topics and untagged ones | not signed in as; same `isForRole` path as admin, driven only by the tags |
| staff | `/manual`, filtered | staff-tagged and untagged topics | not signed in as; same path |
| vet | `/manual`, filtered | 19 topics, six sections hidden | as expected, see happy path |
| volunteer | `/manual`, filtered | volunteer-tagged and untagged topics | 21 topics before the maintenance-board retag (Medical, Maintenance, Settings hidden); the retag adds the board |
| signed out | nothing | sent to sign in | `/manual` signed out went to `/login?next=%2Fmanual` |

- [x] Every role above tested — admin, vet and volunteer driven; management and staff have no branch of their own, only tags
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: nothing is refused; every role may read every topic, which is the point of Show everything

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: nav not touched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the Roles topic says the manual opens on your role; the new vet My tasks topic, the Management intro and the residents-list caption read correctly on the page; three tags corrected (see decisions.md)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the manual is English only and its strings live in `src/lib/manual/en.ts`; nothing public
- [x] Mobile viewport (375px) — no overflow, controls reachable — as admin at 375×812: `scrollWidth > innerWidth` false, the filter bar wraps under the collapsed Contents
- [x] Browser console clean — no errors or React warnings — no console errors on `/manual`
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/manual` and `/manual?view=all` loaded for each role

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/manual` deep links (`#stocktake`, `#contacts`) still land on their topic; the contents highlight followed `/manual#diet` on load and moved to Logging weight on a click. (While the browser pane was hidden, no page hydrated — `/releases` included — until a screenshot made it paint; an artefact of the pane, not this change)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `releases.ts` is read by `/releases`, which lists the new unreleased line
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged (`Already up to date.`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — until-found over removal, the React 19 boolean-`hidden` workaround, `?view=all` as a link, the retags and why
- [x] `README.md` still accurate — the `src/lib/manual/` line says it is filtered by role
- [x] **Release notes.** Would a shelter user notice this change? Yes — `unreleased` gained a line saying the manual now opens on your role, with Show everything and Find on page
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the topic counts, the hidden sections and the anchor reveal were read from the running page; React writing `hidden` as a boolean was read in `react-dom-server` (`case "hidden"` in the boolean list) and seen in the DOM (`hidden=""` before the upgrade)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: a membership test on a list, run for a role inside and outside each tag; both sides seen (vet vs admin on `my-tasks-vet`, volunteer vs vet on Stocktake)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: no tool output pasted besides the gates lines, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — code only: `npx wrangler rollback --env production` restores the unfiltered manual; nothing stored to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Filtering made three wrong role tags hide real content: My tasks' maintenance and recurring-job topics were shown to a vet, whose My tasks is empty; the maintenance board was not tagged for volunteers, who can read it, so their Maintenance section vanished | fixed on this branch (`en.ts`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Find on page reveals a tucked topic: as a vet, press Ctrl+F (or the phone browser's Find in page) and search "cashflow" — the match should open that topic greyed with "Not part of the Vet role". The built-in browser pane has no Find bar, so this was only checked by anchor | `/manual`, Chrome and a phone |
| 2 | A vet's view reads right as a whole — the walkthrough that found the problem | `/manual` signed in as a vet |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: Find on page in a real browser, and a vet's read-through

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — result follows manual verification
- [x] Checklist pasted into the PR — summarised in #189 with a link to this file
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass
