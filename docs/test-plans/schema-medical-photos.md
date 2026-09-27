# Test plan — schema-medical-photos

## Header

| | |
|---|---|
| Feature | Medical-folder photos leave the public gallery and the photo proxy: `0101_public_photos_exclude_medical.sql` redefines `public_resident_photos` with `lower(btrim(coalesce(a.sub_folder, ''))) <> 'medical'`, same columns, status subquery on `private.resident_current_state` |
| Backlog item | `docs/backlog.md` → Next up → "Keep Medical-folder photos off the public website." (schema half) |
| Branch / worktree | `claude/schema-medical-photos` @ `C:\Development\Animal_Shelter_schema-medical-photos` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch (number in the PR itself) |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | yes — `0101_public_photos_exclude_medical.sql` |
| Tested at SHA | `e05daea` (the change is `79c9cad`; `sync` merged `origin/main` @ `3edd96d`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a resident photo filed under Medical is no longer in `public_resident_photos`, so it leaves `/adopt/[id]`'s gallery and `is_public_drive_file()` stops saying yes to it, so `/api/photos/<id>` answers 404 signed out. This is the item's "fix in the database" step; the profile-photo half, manual and "Move to folder" are the feature stream's
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0101_public_photos_exclude_medical.sql`; `scripts/check-medical-photos.mjs` (rollback harness); `src/lib/releases.ts` (one `unreleased` line); `docs/decisions.md`; this plan. No route, component or `worker/` change
- [x] Roles affected identified: signed-out public (and the `public_viewer` path, which reads the same view) loses Medical gallery photos. Admin, management, staff, vet and volunteer see resident photos through `attachments`, not this view, so nothing changes for them
- [x] Anything explicitly **out of scope** written down: a Medical photo that is a resident's **profile** photo still reaches `/adopt`, the home cards, recent adoptions, `/r/<code>` and the proxy through `profile_photo_drive_file_id` (dev: 8 residents, 1 public — Markey; `/api/photos/1KJTyiknoXzXlUUSngJpOCxCAe5AoL3kP` still `200` signed out). Feature half `claude/medical-photos-profile` decides block vs fall back. Also out: the manual text, "Move to folder", and the read-only production count, which is Lutan's to run from the main checkout

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: merged `3edd96d` (8 files, docs and test plans), no conflicts; `migration numbers: ok — 0101_public_photos_exclude_medical.sql (against origin/main 3edd96d, highest 0100_user_roles_require_aal2.sql)`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 31s
=== gates: lint exited 0 after 102s
=== gates: build exited 0 after 253s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0100_user_roles_require_aal2.sql`; `gh pr list --state open` returned `[]`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 100 applied, 1 pending.
  pending: 0101_public_photos_exclude_medical.sql (not on origin/main)
Against origin/main 3edd96d: 100 file(s), 100 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 0
```

- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 100 applied, 1 pending.
dry-run 0101_public_photos_exclude_medical.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 100 applied, 1 pending.
applying 0101_public_photos_exclude_medical.sql … ok
```

  `--status` afterwards: `Against origin/main 3edd96d: 100 file(s), 101 applied row(s).` / `Applied here, no file on origin/main: 1` / `0101_public_photos_exclude_medical.sql` — expected until this PR merges

- [x] File is re-runnable: `create or replace view` with the same column list, idempotent `grant` / `revoke`; the harness runs the whole file twice
- [x] Existing rows still read correctly after the change (checked against real dev data). Resident photos by `sub_folder` before the apply (`n` all, `public_n` in the view): Foster 46/44, Medical 44/2, Shelter 22/0, `20260927` (adoption update) 2/2, Adoption 1/1, no nulls. The only public Medical photos were Markey's two. After: the harness finds the view equals the old view minus Medical row for row (47 rows)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-medical-photos.mjs`, asked as `anon` as the proxy asks. Asserted: Shelter, Foster, Adoption, null-folder and date-folder photos of a public resident are in the gallery and `is_public_drive_file` says yes; `Medical`, `medical` and `" Medical "` are in neither while `is_known_drive_file` still knows them; on real rows the new view is the old view minus Medical exactly, with no Medical row and no photo of an adopted, deceased or hidden resident; the definition names `private.resident_current_state`; anon and authenticated hold SELECT and no write privilege. Output, unedited:

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK Shelter/Foster/Adoption/null/date photos in gallery + servable to anon | Medical, medical, " Medical " in neither | real rows: view = old view minus Medical (47 rows, 2 real Medical removed), none adopted/deceased/hidden | binds private.resident_current_state | anon+authenticated SELECT only | file ran twice
CONTEXT:  PL/pgSQL function inline_code_block line 65 at RAISE
```

- [x] Down-migration written, or the reason one is not needed is stated: none written. No data changes; the inverse is 0025's view body with `private.resident_current_state`, and nobody should want Medical photos back on the website
- [x] Production apply plan stated for the release manager: **needs Lutan's go**, from the main checkout after merge: `node scripts/apply-migrations.mjs --env production --status`, `--dry-run`, then apply. Independent of any deploy — no code reads anything new. Before or after it, Lutan's read-only count on production (in the PR) lists any public photos that look medical but are filed elsewhere

## 4. Functional checks

- [x] Happy path works end to end, on dev after the apply, signed out against `next dev` on :3002: `/api/photos/1fMS_nxRqEjMz62VGJ_WbYMEdXSjQp7qs` (Markey, Medical, gallery only) → `404`; `/adopt/e07ad9e2-4e55-51aa-af5c-7b3a511dd89f` renders with only the profile photo `1KJTyiknoXzXlUUSngJpOCxCAe5AoL3kP` from Markey (the other `/api/photos` image on the page is Panda's Foster photo, `1pJx99whKp81aBfxmuzZVTVI6bUn61y40`)
- [ ] Data persists — reload the page and the change is still there — n/a: no write path; the view is a read
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI; fixtures in the harness covered insert of each folder value
- [ ] Empty state renders sensibly (no rows yet) — n/a: no page changed; a resident whose photos are all Medical gets the gallery's existing empty/profile-only state, which Markey now shows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): null `sub_folder` stays public; lowercase and space-padded `medical` are excluded; a `YYYYMMDD` folder stays public (harness A/B)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | resident photos via `attachments` | unchanged | n/a: view not read by staff pages |
| management | same | unchanged | n/a: view not read by staff pages |
| staff | same | unchanged | n/a: view not read by staff pages |
| vet | same | unchanged | n/a: view not read by staff pages |
| volunteer | same | unchanged | n/a: view not read by staff pages |
| signed out | `/adopt/[id]`, `/api/photos/<id>` | no Medical photo in gallery; 404 for it | pass (harness as `anon`; HTTP 404 on dev) |

- [x] Every role above tested: signed out as `anon` in the harness and over HTTP; the staff roles read `attachments` under RLS, which this file does not touch — `grep` of `src/` for `public_resident_photos` finds only `src/app/adopt/[id]/page.tsx`
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): `/api/photos/<medical id>` → `404` signed out

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the feature half writes "Medical photos never appear on the website" once profile photos are covered too; saying it now would be untrue for a Medical profile photo
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no client code changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the one new 404 is the intended one (§4)

## 6. Regression

- [x] The pages nearest the change still work: `/adopt/[id]` for Markey rendered signed out with its profile photo; the harness proves every non-Medical row of the view on real dev data is unchanged (47 rows)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched; `releases.ts` gained one string, covered by typecheck and build
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the sync, all 0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is not done until the feature half covers profile photos, the manual and the test upload; that PR ticks it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-27, filter in the view not the page, deny-list on `Medical` (why not an allow-list), `private.resident_current_state`, profile photos left to the feature half
- [ ] `README.md` still accurate — n/a: README does not describe the public views' filters
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: Medical photos no longer appear on the public adoption page or open for someone not signed in, and a Medical main photo still shows for now
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Folder counts, the 404, the 200 on the profile photo and the gate trap are all from runs above; the gate trap is asserted by harness D

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this change derives a date
- [ ] **Boundary or banding change covers both edges** — n/a: not a threshold; the folder comparison's edge cases (case, padding, null) are in harness A/B
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager (an edge-cached `/adopt/[id]` or `/api/photos/<id>` can keep serving a Medical photo until it expires)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code reads anything new; the view keeps its columns, so apply order against the deploy does not matter
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, from the main checkout
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: a view redefinition, no data touched
- [x] Apply plan stated: `0101_public_photos_exclude_medical.sql` → production `dbkodyyxxhtygxcxmfcu`, any time after merge, independent of the deploy (§3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: the Worker is unchanged by this PR, so `wrangler rollback` does nothing here. Reverting means re-creating 0025's view body with `private.resident_current_state` in a new file; nothing depends on the filter

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | A Medical photo that is a profile photo is still public (8 on dev, 1 public) | deferred — the feature half, `claude/medical-photos-profile`, per the backlog item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read-only count of resident photos by `sub_folder` on **production**, and a look at any public ones that seem medical but are filed elsewhere (query in the PR) | main checkout, Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 is waiting for Lutan

Manual verification by: pending: production sub_folder count and review of public photos that look medical (Lutan, main checkout)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is deferred to the feature half by design, recorded above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
