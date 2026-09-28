# Feature test plan

## Header

| | |
|---|---|
| Feature | `public_project_photos` excludes non-image attachments, so a PDF in a public project folder can't reach the gallery or the photo proxy |
| Backlog item | `docs/backlog.md` → "Keep PDFs out of the public story gallery" |
| Branch / worktree | `claude/keep-pdfs-out-of-gallery` @ `C:\Development\Animal_Shelter_keep-pdfs-out-of-gallery` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | (opened after this plan is signed) |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | yes — `0109_public_project_photos_exclude_non_images.sql` |
| Tested at SHA | (recorded at commit — this branch is a straight fast-forward of `origin/main` at `c264109`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `public_project_photos` now filters `attachments.file_name` to the same image extensions `src/lib/uploads/file-kind.ts` calls `"image"`, so a non-image (a PDF) filed in a public project folder no longer appears in the view or answers `true` from `is_public_drive_file()`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0109_public_project_photos_exclude_non_images.sql` (new); `scripts/check-public-views.mjs` (new case). No route, component or `worker/` change — this is the schema half only, and per the brief it is the whole item
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — signed-out public only: the view feeds `/our-work/[id]` and the photo proxy for a visitor with a link. Staff-side upload and the cover picker were already safe (`PhotoSection.tsx` shows a PDF as a file icon; only an image can be a cover) and are unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the upload route (`src/app/api/projects/[id]/photos/route.ts`) still accepts PDFs; this PR does not stop staff uploading one, only stops an uploaded PDF reaching the public site. No page-side change to `StoryGallery.tsx` / `ThumbnailStrip.tsx` — deliberately fixed in the view instead (see `docs/decisions.md`, 2026-09-28), since the view is also what the photo proxy asks

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: `origin/main` had not moved since this branch was created; `git fetch origin` confirms `origin/main` is still `c264109`, the branch's own base, so there was nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 209s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `node scripts/apply-migrations.mjs --status` showed 108 applied on `origin/main` c264109 before writing the file; the brief (written by `/plan-day`) confirms this branch holds batch 4's only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `This checkout: 108 applied, 0 pending` beforehand
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0109_public_project_photos_exclude_non_images.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0109_public_project_photos_exclude_non_images.sql … ok`; `--status` afterwards shows `109 applied, 0 pending`, and 0109 correctly listed as "applied here, no file on origin/main" until this PR merges
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `create or replace view`, idempotent `grant`/`revoke`
- [x] Existing rows still read correctly after the change (checked against real dev data) — checked on dev first, before writing the file: no public project folder holds a PDF or any other non-image attachment today (a scratch query against `attachments`/`project_folders`, zero rows), so the view's row set is unchanged on real data; the filter is proven against fixtures instead (next line)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — a `begin … rollback` block (not committed) created a public project subfolder under an existing category row, attached one image (`photo.jpg`) and one non-image (`report.pdf`), and asserted: the image is in `public_project_photos` and `is_public_drive_file()` returns `true` for it as `anon`; the PDF is in neither; `has_table_privilege` confirms `anon`/`authenticated` still have `SELECT` only, no write privilege. The block's final statement is a deliberate `raise exception 'HARNESS-OK …'` so nothing commits; the query returned exactly that message, confirming every assertion passed before the rollback
- [x] Down-migration written, or the reason one is not needed is stated — not written, following 0101/0103's precedent: nobody should want PDFs back in the gallery or the proxy. Reverting is `create or replace view` with 0056's body (no `file_name` filter) if ever needed
- [x] Production apply plan stated for the release manager (which file, which project, when) — `supabase/migrations/0109_public_project_photos_exclude_non_images.sql`, `dbkodyyxxhtygxcxmfcu`, any time before or after the code deploy — the view is the whole change, no application code reads a new column, and production was not checked for an existing public PDF (do that with the same query used on dev, ideally before applying, so any real leak on production is known rather than silently closed)

## 4. Functional checks

- [x] Happy path works end to end — covered by the schema harness above: a public project folder's image stays visible through the view and the proxy
- [ ] Data persists — reload the page and the change is still there — n/a: no page under test; the view's persistence is `schema_migrations` recording 0109 applied, confirmed by `--status`
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no CRUD surface; the change is a `select` filter on an existing view
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list or page
- [x] Invalid input is rejected with a readable message, not a crash — n/a in the usual sense (no form), but the equivalent case — a PDF attachment — was exercised in the harness and simply does not appear, rather than erroring
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — extension matching is case-insensitive (`~*`) and anchored to the end of the name, matching `file-kind.ts`'s `IMAGE_EXTENSIONS`; not separately re-tested here since the regex is copied verbatim, not reimplemented

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no admin-only surface in this change | not applicable |
| management | n/a | same | not applicable |
| staff | n/a | same — upload/cover behaviour is unchanged and was already correct | not applicable |
| vet | n/a | same | not applicable |
| volunteer | n/a | same | not applicable |
| signed out | `/our-work/[id]`, the photo proxy | an image in a public project folder is servable; a PDF there is not | pass — proved against fixtures in the harness (image visible to `anon` through the view and `is_public_drive_file()`; PDF in neither) |

- [x] Every role above tested — only "signed out" has any surface here; the rest are recorded as not applicable rather than skipped silently
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this change makes a row invisible to everyone equally (anon and authenticated both read the same view), it does not gate a role

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no staff-visible behaviour changed (uploads still accept PDFs; the manual doesn't document the public gallery's internals)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI change
- [ ] Browser console clean — no errors or React warnings — n/a: no UI change
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page change; the relevant network behaviour (the proxy refusing a PDF) is exercised in the SQL harness, not the browser

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `node scripts/check-public-views.mjs` run against dev end to end: every `PUBLIC_VIEWS`/`PUBLIC_TABLES` entry still readable by anon and refused for writes, every allow-listed function still callable, everything else still refused, `is_public_drive_file()` still answers `true` for a real public resident photo and `false` for a real blood-test/procedure file — none of that changed by this PR, confirming the view redefinition didn't regress the objects around it
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: neither file touched; `scripts/check-public-views.mjs`'s new case was run as part of the same script, not read only (previous line)
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing merged (see §2); gates ran clean regardless

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked; no follow-up raised
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-28, "PDFs come out of the public story gallery through the view, not the page (`0109`)"
- [x] `README.md` still accurate — no README content describes `public_project_photos` or the photo proxy's internals
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no public folder holds a PDF today (checked on dev before writing the migration), so nothing was ever visibly broken for a visitor to notice going away; this closes a hole rather than fixing a live symptom
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "no public project folder holds a PDF today" is a query result against dev (`qxkmhwybjggxvsfxsxbd`), not an assumption; the harness's pass/fail came from the database, not from reading the view definition

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date or "today"
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: the change is a set-membership filter (image extension or not), not a threshold or band; both sides (an image and a non-image fixture) were exercised in the harness
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block, the migration status/dry-run/apply lines and the harness result quoted in §3 are the actual command output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no: the migration is the whole PR, no application code changes, so ordering relative to the code deploy does not matter
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (production dry-run needs `.env.deploy.production`, run at release time; not run from this worktree)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: additive/filtering `create or replace view`, no data rewritten or dropped
- [x] Apply plan stated — stated in §3: `0109_public_project_photos_exclude_non_images.sql` against `dbkodyyxxhtygxcxmfcu`, any time relative to the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — `npx wrangler rollback --env production` reverts no schema at all; reverting this migration means a new `create or replace view` restoring 0056's body (no `file_name` filter), not written since nobody should want it. Purely a `select` filter — safe to leave applied even if the (nonexistent) code half were rolled back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Before applying to production, run the same "any public project folder holds a non-image attachment?" query against production and confirm it is still zero rows, the way it was checked on dev — if it isn't, this PR closes a live leak rather than a theoretical one, worth noting in the release | Supabase SQL / Management API against `dbkodyyxxhtygxcxmfcu` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the production PDF check before applying there

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass

Release manager acknowledgement: pending
