# Feature test plan

## Header

| | |
|---|---|
| Feature | Has open maintenance filter on `/enclosures` |
| Backlog item | `docs/backlog.md` → Facility → **Filter the enclosures page to those with open maintenance.** |
| Branch / worktree | `claude/enclosure-maintenance-filter` @ `C:\Development\Animal_Shelter_enclosure-maintenance-filter` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened from this branch; number in the PR itself |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `175bf46` (code; this file is the commit after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a Has open maintenance tick on `/enclosures`, kept in the URL as `?maint=open`, that narrows the page to enclosures with a job not `Completed`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/enclosures/page.tsx`, `src/app/enclosures/EnclosureFilters.tsx`, `src/lib/maintenance/queries.ts` (new `canReadMaintenance`), `src/lib/i18n/dictionaries/en.ts` + `th.ts` (one key), `src/lib/manual/en.ts` (the browse-enclosures topic only), `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin, management, staff and volunteer (all can read `maintenance`) see the tick; vets do not, and `?maint=open` is ignored for them. Signed-out users never reach `/enclosures`. No policy or route guard changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — zone-wide jobs (`enclosure_id` null) do not qualify an enclosure (`docs/decisions.md`, 2026-09-24); no filter by job status or priority; `/manual` screenshots not regenerated (full rerun planned after this batch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 227s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page reads the same `maintenance` query as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — as admin on dev, ticking the box submitted the form to `/enclosures?q=&sort=zone&maint=open` and left one card (Blue Enclosure 6, "1 open", under Main Zone - Blue), which is the only enclosure with an open job on dev (checked against the unfiltered page's card titles). Unticked view: 64 cards
- [x] Data persists — reload the page and the change is still there — loading `/enclosures?maint=open` directly showed the box ticked and the same one card
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only filter; it creates, edits and deletes nothing
- [x] Empty state renders sensibly (no rows yet) — `?zone=<Cat Zone>&maint=open` and `?q=cat&maint=open` both render "No enclosures match these filters."
- [x] Invalid input is rejected with a readable message, not a crash — `?maint=bogus` is ignored (64 cards, as unfiltered)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — combined with a zone chip (`zone=<Blue>&maint=open` → the one card), with search (`q=blue` → the card, `q=cat` → empty), with `sort=name` (flat list, the one card); zone chips' links carry `maint=open` while it is on; Clear returns to `/enclosures` with the box unticked. Zone-wide-only case: logged a Not started zone-wide job on Cat Zone on dev (`/maintenance/b80e26eb-0ef7-48cf-b463-b91a18a8f66b`, "TEST zone-wide job (enclosure-maintenance-filter verification)", left in place: dev test data is disposable). Unfiltered, Cat Zone's heading reads "1 zone-wide job" and Cat Enclosure's card "0 open"; `?maint=open` drops Cat Zone entirely (only Main Zone - Blue remains); `?zone=<Cat Zone>&maint=open` shows "No enclosures match these filters.", as decided

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/enclosures` | tick shown, filter works | driven in the browser: as expected |
| management | `/enclosures` | tick shown (`canReadMaintenance` → `canWriteMaintenance`; RLS twin of staff, 0039) | not signed in as; same code path as admin/staff |
| staff | `/enclosures` | tick shown | not signed in as; same code path as admin |
| vet | `/enclosures` | tick absent, `?maint=open` ignored | not driven: signing in as a vet needs a vet account's password (Left for manual verification 1) |
| volunteer | `/enclosures` | tick shown (`volunteer_read_maintenance`, 0001) | not signed in as |
| signed out | nothing | sent to sign-in, as before | unchanged by this PR |

- [ ] Every role above tested — n/a: only admin was driven; vet is handed over below (item 1), and the other three share admin's code path through `canReadMaintenance`
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access is granted or withdrawn; for a vet the server ignores `?maint=open` rather than trusting the hidden control, and RLS already returns vets no jobs

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the new step is in the browse-enclosures topic; `/manual` returned 200 and contains it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the one new string is a static UI label in the en/th dictionaries, not user content; the Thai label (มีงานซ่อมบำรุงค้าง) rendered after switching to ไทย
- [x] Mobile viewport (375px) — no overflow, controls reachable — first attempt squeezed the search box to nothing (Defect 2, fixed); after the fix, no horizontal overflow, search 196px wide, the tick on its own line
- [x] Browser console clean — no errors or React warnings — no console errors after the runs above
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every `/enclosures` variant above, `/manual`, `/maintenance` and `/residents` returned 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures` unfiltered (64 cards, zone headings, Lifecycle cards pinned as before), `/maintenance` 200
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `manual/en.ts` loaded via `/manual`; `maintenance/queries.ts` (other users: the maintenance pages) loaded via `/maintenance`; the dictionaries via `/residents` and the Thai switch
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing ("Already up to date.")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — zone-wide jobs left out, Lifecycle cards dropped, vet handling
- [x] `README.md` still accurate — it does not describe the enclosure filters
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: the Enclosures page's new Has open maintenance tick, that it works with zones and search and can be bookmarked, and that vets don't see it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the RLS claims were read from 0001/0039; the filtered count, Clear behaviour and the mobile squeeze were observed in the browser. The zone-wide consequence ("a zone whose only open job is zone-wide disappears") was observed with a test zone-wide job on Cat Zone (section 4)

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
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code only; `npx wrangler rollback --env production` reverts it completely

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Clear (and the zone chips) left the tick, search text and sort showing their old values after the page changed: the inputs use `defaultValue`/`defaultChecked`, which a client navigation does not reset. Search and sort had this before this PR | fixed — the form is keyed on its values, so it remounts; after Clear the box is unticked |
| 2 | low | At 375px the new tick shared a row with search and sort and squeezed the search box (`flex-1` from zero) to nothing, overlapping the labels | fixed — the tick takes its own line below `md` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **vet**: no Has open maintenance tick, and `/enclosures?maint=open` shows every enclosure as if unfiltered. Needs a vet account's sign-in | `/enclosures` and `/enclosures?maint=open` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is outstanding; see the pending line below

Manual verification by: pending: the vet view (Left for manual verification 1)

### Result

- [x] Open defects are either fixed or explicitly accepted above — both fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
