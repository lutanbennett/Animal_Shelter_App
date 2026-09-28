# Feature test plan

## Header

| | |
|---|---|
| Feature | A file-type icon where a non-image attachment has no thumbnail |
| Backlog item | `docs/backlog.md` → "Show a file-type icon for attachments that are not images" |
| Branch / worktree | `claude/file-type-icon` @ `C:\Development\Animal_Shelter_file-type-icon` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | opened from this commit |
| Tested by / date | Claude (file-type-icon session), 2026-09-28, signed in as the dev test user (admin) in the browser pane |
| Carries a migration? | no |
| Tested at SHA | `745c439` (the code; this plan and the docs commit follow it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a PDF (or other non-image) attachment now shows a lucide file icon with an accessible name in place of the thumbnail, instead of a tiny `aria-hidden` 📄
- [x] Files/areas touched listed — new `src/lib/uploads/file-kind.ts` (`fileKind()`), new `src/components/FileTypeIcon.tsx`; `src/components/ProcedureList.tsx`, `BloodTestList.tsx`, `DeferredUploads.tsx`, `src/app/maintenance/[id]/MaintenanceJobView.tsx`, `src/app/projects/[id]/PhotoSection.tsx`; both dictionaries (`uploads.fileKind`); `docs/backlog.md`, `docs/decisions.md`. No route, action, `worker/` or migration change
- [x] Roles affected identified — everyone who can already see those lists (admin, management, staff, vet, volunteer as each list allows); display only, nobody gains or loses access; signed-out public untouched (no public page changed)
- [x] Anything explicitly **out of scope** written down — resident photos, the public galleries (`ThumbnailStrip`) and contact / Shelter Friend logos accept images only, so they have no non-image case. A PDF in a public project folder reaching `/our-work/[id]` as a broken image needs a view migration: logged on the `backlog` branch as "Keep PDFs out of the public story gallery". No `mime_type` column (see decisions.md)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.` at `745c439`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed at `745c439`:

```
=== gates: build exited 0 after 264s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

In the browser pane against `next dev` on :3011, dev database, on the rows Lutan made in Pass 1.

- [x] Happy path works end to end — the procedure "Nail clipping" on Angsumalin (two PNGs and `Petbarn tax invoice.pdf`) shows both thumbnails and a red file icon for the PDF, with the accessibility tree reading `img "PDF document"`; a blood test on Lilly with `…ResultLab.pdf` shows the same icon. The tile's link is unchanged (still the Drive URL), so opening is as before
- [ ] Data persists — n/a: nothing is written; the icon is derived from the stored `file_name` on every render
- [ ] Create / edit / delete all exercised — n/a: no create/edit/delete path changed; upload and remove buttons are untouched. A fresh upload is listed under manual verification because the pane cannot pick a local file
- [ ] Empty state renders sensibly — n/a: the no-attachments branch of each list is untouched by the diff; not driven in the browser
- [ ] Invalid input is rejected with a readable message — n/a: no input added; upload validation is untouched
- [x] Boundary cases checked — a long PDF name no longer spills out of the 96px tile: before, a centred `truncate` overflowed both sides ("tbarn tax invoice.p"); now `max-w-full` gives "Petbarn tax i…". `fileKind(null)` falls back to the generic file icon (same as the old fallback path for a missing name)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | procedures, blood tests | icon with accessible name on PDFs | as expected (dev test user, admin) |
| management | same lists as before | display only, unchanged access | n/a: no access change; same component for every role |
| staff | same lists as before | display only, unchanged access | n/a: no access change; same component for every role |
| vet | same lists as before | display only, unchanged access | n/a: no access change; same component for every role |
| volunteer | same lists as before | display only, unchanged access | n/a: no access change; same component for every role |
| signed out | nothing | redirected to sign in, as before | n/a: no public page changed |

- [ ] Every role above tested — n/a: display-only change inside components every role already renders; no guard, route or query touched, so only admin was driven
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe attachment tiles; nothing it says changed
- [x] Translatable strings — the new labels are dictionary strings in both `en.ts` and `th.ts` (static UI text, not the translations table); Thai checked in the pane: `img "เอกสาร PDF"` on the blood-test page
- [x] Mobile viewport (375px) — procedures page: `scrollWidth` 375 = viewport, the PDF tile wraps to its own row, icon and truncated name visible
- [x] Browser console clean — `read_console_messages` (errors only) returned nothing on the procedures page
- [ ] Network clean — n/a: no request added or changed; thumbnails load through the same Drive proxy URL as before

## 6. Regression

- [x] The pages nearest the change still work — resident Procedures and Blood tests tabs loaded and rendered their image thumbnails as before
- [ ] Shared file checked from a second page — n/a: no shared file from the list (`NavLinks.tsx`, `manual/en.ts`) touched; the dictionaries only gained keys, and the Thai blood-test page loaded with them
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing in (`Already up to date.`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the public-gallery follow-up went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — file name rather than a stored type, and where that is wrong; one icon replacing four copies; named rather than decorative
- [x] `README.md` still accurate — it does not describe attachment tiles
- [ ] **Release notes.** n/a: the tile already showed the file name and a small 📄 glyph; a clearer icon in the same place is a polish nobody would look for in release notes, and the brief expected `n/a`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The truncation claim is from before/after screenshots in the pane; "images only" for resident photos is read from that route's `ALLOWED_MIME_TYPES`; the public-gallery gap is read from the view in `0056_translations.sql`, not reproduced (and says so)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here reads a date or the clock
- [ ] Boundary or banding change covers both edges — n/a: no threshold, band or cutoff
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted output is the gates' closing lines in §2, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] Supabase project ref matches production — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — `npx wrangler rollback --env production` restores the 📄 glyph; no schema or data involved, so it covers everything

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | File name overflowed both sides of the 96px procedure/blood-test tile, cutting off its start | fixed (`max-w-full` on the name) |
| 2 | low | A PDF in a public project folder would render as a broken image on `/our-work/[id]` (read from the view, not reproduced) | deferred to backlog — needs a view migration |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a real PDF and a real image to a procedure (the pane cannot pick a local file) and look at both tiles; open the PDF | Residents → any → Procedures → Attach files |
| 2 | A PDF on a maintenance job and on a project photo folder shows the same icon (no such rows in dev; same component and path as procedures) | `/maintenance/<id>`, `/projects/<id>` |
| 3 | Pick a PDF on the Log procedure form before saving: the pending tile shows the icon too | Log procedure form |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (file-type-icon session)  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items await Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — defect 2 is deferred to the backlog, awaiting Lutan's acceptance
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened from this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
