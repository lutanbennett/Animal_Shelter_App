# Feature test plan

## Header

| | |
|---|---|
| Feature | `0103`: the public views show no profile photo when it is in Medical (a live leak). `0104`: the `relocation` site page's slug becomes `international-adoption`. Schema PR; `0104`'s feature half is another stream |
| Backlog item | `docs/backlog.md` → **Public views show no profile photo when it is in Medical (schema)** (ticked here); **Hide the Pet relocation page, and give International adoptions a page instead** (schema half only, not ticked) |
| Branch / worktree | `claude/schema-photo-views-and-slug` @ `C:\Development\Animal_Shelter_schema-photo-views-and-slug` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | to be opened from this commit |
| Tested by / date | Claude (automated) / 2026-09-27 |
| Carries a migration? | yes: `0103_public_profile_photo_exclude_medical.sql`, `0104_site_pages_international_adoption.sql` |
| Tested at SHA | `23c852d` on `main` @ `8720ea9`; later commits add only this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `public_resident_profiles`, `public_recent_adoptions` and `public_resident_cards` report the profile photo as null when it is the resident's Medical attachment (0101's test), so the site shows its placeholder and the proxy stops serving it signed out; and the `relocation` row is renamed, retitled and emptied, with the slug check constraint updated
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): the two migrations; `scripts/check-medical-photos.mjs` (harness extended to 0103); `src/lib/releases.ts` (the "being fixed next" clause replaced); `src/lib/manual/en.ts` (one sentence on what the website shows); `docs/decisions.md`; `docs/backlog.md`; this plan. No routes, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Signed-out public: 8 residents' Medical profile photos stop showing / being served. Every role inside the app: unchanged — `residents.profile_photo_drive_file_id` is untouched. Admin: the relocation editor on `/admin/website` has no row until the feature half ships
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: `record_attachment` / `delete_resident_photo` still pick a Medical photo automatically (decided, `docs/decisions.md`); removing `/relocation` and building the International adoption page is the feature half (`claude/…` for backlog item "Hide the Pet relocation page"); the production check of the relocation body is Lutan's (see §3)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (nothing new on `main`, `8720ea9`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 305s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0102`; no open PR touches `supabase/migrations/`; the commit hook printed `migration numbers: ok — 0103…, 0104… (against origin/main 8720ea9, highest 0102…)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `102 applied, 2 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0103_public_profile_photo_exclude_medical.sql … ok`, `dry-run 0104_site_pages_international_adoption.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0103… ok`, `applying 0104… ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness runs 0103 twice in one transaction; 0104 drops the constraint `if exists` and its update matches only a row still on `relocation`, so a re-run is a no-op
- [x] Existing rows still read correctly after the change (checked against real dev data): after the apply `site_pages` lists `international-adoption | International adoption | 0` beside the six other pages unchanged, and the title's translation is re-queued (`title | pending | International adoption`); the harness's real-row check (I) passed again after the apply
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-medical-photos.mjs`. For 0103 it asserts (F) a Medical profile photo, including `' MEDICAL '`, reads null to anon in profiles, cards and recent adoptions, the resident stays on `/adopt`, and a Shelter profile photo is untouched; (G) none of the Medical profile files is servable to anon through `is_public_drive_file`, the Shelter one is; (H) `residents.profile_photo_drive_file_id` is unchanged; (I) on real rows every view keeps exactly its rows, with the photo nulled exactly where it was Medical — so the adopted/deceased filters survived; (J) no real Medical profile photo is servable; (K) the definitions name `private.resident_current_state` / `private.approved_translations`; (L) anon and authenticated have SELECT only. The 0101 assertions still run first. Output, unedited (before the apply; re-run after it, identical and exit 0 — the `1` is Markey, the one public resident whose profile photo the view nulls, computed from the folder rather than as a before/after delta):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0101: Shelter/Foster/Adoption/null/date photos in gallery + servable to anon; Medical, medical, " Medical " in neither; real rows = old view minus Medical, none adopted/deceased/hidden; binds private.resident_current_state; SELECT only; ran twice | 0103: Medical profile photo (incl. " MEDICAL ") null in profiles, cards and recent adoptions and not servable to anon, resident still listed, still the profile photo in residents, Shelter profile untouched; real rows unchanged except 1 Medical profile photo(s) nulled on /adopt; no real Medical profile photo servable; binds private objects; SELECT only; ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 91 at RAISE
  ```

  0104 was not given a harness: it is one guarded `update` and a constraint swap, and the dry-run plus the post-apply read above cover it
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: 0103's down is each view with `r.profile_photo_drive_file_id` in place of the case expression, and nobody should want the leak back; 0104's down is the reverse rename and 0099's constraint, but the relocation text it cleared is gone by design (dev's body was already empty)
- [x] Production apply plan stated for the release manager (which file, which project, when): `0103` and `0104` to production `dbkodyyxxhtygxcxmfcu` by Lutan from the main checkout, `--env production --dry-run` then without. **Before that, Lutan reads production's relocation body** (`select slug, title, length(body) from site_pages where slug = 'relocation'`) — `0104` clears it, and it is relocation text by definition, but worth knowing what is lost. `0103` is safe before or after any deploy; `0104` must reach production before or with the feature half's deploy, since that code reads `international-adoption`

## 4. Functional checks

- [x] Happy path works end to end: signed out on `http://localhost:3010/adopt`, Markey's card shows "No photo yet" and no image; `/adopt/e07ad9e2-…` and `/r/R-0004` both render without his file id; `/api/photos/1KJTyiknoXzXlUUSngJpOCxCAe5AoL3kP` (his profile file) answers `404` with `credentials: 'omit'`, while another resident's profile photo from the same page answers `200`
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written from the UI; the change is in the views
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI actions added or changed
- [x] Empty state renders sensibly (no rows yet): a resident with a null public photo gets the site's existing "No photo yet" placeholder (Markey's card, screenshot taken)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): folder case and padding (`' MEDICAL '`), a resident with a Medical photo that is *not* the profile photo (profile untouched), a hidden resident (cards), a fresh adoption (recent adoptions) — harness F–G

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | resident hub | profile photo unchanged, Medical or not | harness H: column untouched; not driven in the browser |
| management | same | same | same |
| staff | same | same | same |
| vet | same | same | same |
| volunteer | same | same | same |
| signed out | `/adopt`, `/adopt/[id]`, `/r/<code>`, `/api/photos/<id>` | no Medical profile photo shown or served | Markey: placeholder, 404 (browser); all real Medical profile files not servable (harness J) |

- [x] Every role above tested: signed out in the browser; signed-in roles through harness H (the app reads `residents`, which 0103 does not touch)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): `/api/photos/<Markey's profile file>` fetched directly, signed out → `404`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: one sentence added to the photos entry. Read in the source, not at `/manual` — that page needs a sign-in this pane does not have; listed below
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new UI strings; 0104's title change re-queued its translation through the existing trigger (checked in the database, §3)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: the placeholder is the existing one; the screenshot was at a narrow pane width
- [x] Browser console clean — no errors or React warnings: `preview_logs --level error` → "No server errors found."
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: `/adopt`, Markey's page, `/r/R-0004`, `/` all `200`; the one `404` is the intended one

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/adopt` (other residents' photos still load, one fetched → `200`), `/adopt/[id]`, `/r/R-0004`, `/`, and `/relocation`, which still answers `200` without its row
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `manual/en.ts` is read only by `/manual`, which is the item left below; `releases.ts` only by `/whats-new`, which renders the string unchanged in shape
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): "Public views show no profile photo when it is in Medical (schema)"
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-27, `0103` / `0104`
- [x] `README.md` still accurate: it does not describe either view or the relocation page's slug
- [x] **Release notes.** The existing Medical-photo line in `unreleased` is rewritten: "that is being fixed next" became what the website now does (no photo rather than the Medical one). This PR drops the clause; the feature half does not need to
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "All 8 servable" is from the harness's before/after (cards cover every resident, and J passed only after 0103); the 404/200 pair and "only White has another photo" are from the browser run and the script's listing

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; the folder test is covered for case and padding both ways (harness F)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code here reads the new slug; the manual and release line describe behaviour, not columns
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, from the main checkout
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. `0104` empties the relocation body; read it first (§3)
- [x] Apply plan stated: §3

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` does not touch either migration. `0103` is safe to leave; undoing it would restore the leak. `0104` would need the reverse rename, and any production relocation text it cleared does not come back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The photos entry of the resident topic reads well with its new last sentence | `/manual`, signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is outstanding, see the signature below

Manual verification by: pending: `/manual` wording (item 1)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at the next production release, after merge

Result: pass
