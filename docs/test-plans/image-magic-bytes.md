# Test plan — image-magic-bytes

## Header

| | |
|---|---|
| Feature | Refuse uploads whose bytes aren't an accepted format; trash, don't delete, replaced Website files |
| Backlog item | `docs/backlog.md` → Refuse an "image" upload that isn't a real image |
| Branch / worktree | `claude/image-magic-bytes` @ `C:\Development\Animal_Shelter_image-magic-bytes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | #147 |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `737e643` (code `d56d943`, merged with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every Drive upload is refused unless its leading bytes are one of the formats that path accepts, and the Website and logo replace paths confirm the new file, then trash (not delete) the old one. Both halves of the item
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — new `src/lib/uploads/file-signature.ts` and `scripts/check-file-signature.mjs`; `src/lib/google/drive.ts` (`trashFile`, `confirmUploaded`, `size`); the five upload routes under `src/app/api/`; `src/app/admin/website/actions.ts`; `src/app/management/shelter-friends/actions.ts`; en/th dictionaries; `src/lib/releases.ts`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — whoever can upload today: admin (Website), management (logos), staff/vet/volunteer (photo and attachment routes). No role gate changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — "Remove" on resident, project, maintenance, procedure and blood-test files still deletes permanently (those are never replaced; see decisions.md). No client-side byte check: the server refuses before Drive. Production's hero was not checked (Left for manual verification #3)

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — brought in the 0.6.0 release cut and the drop-backfill release-note fix, no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 280s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three). — check, migration-numbers and test-plan all passed on PR #147 (run 36231331417), after syncing main

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

- [x] Happy path works end to end — on :3012 a real JPEG replaced the hero ("Hero photo updated.", the new file `1nxKl…` serves), was added to the gallery, and was uploaded through `/api/residents/<id>/photos` (200, attachment recorded)
- [x] Data persists — reload the page and the change is still there — after a reload the hero is the new file and the added gallery photo is listed; after removing that photo, Drive reports it `trashed: true`
- [x] Create / edit / delete all exercised (whichever the feature has) — replace (hero), add and remove (gallery). Drive read back afterwards: the old hero `IMG_2257 - Copy.JPG` and the removed `gallery-test.jpg` are both `trashed: true`, the new hero is `trashed: false`, and each `size` is 279212, the bytes sent
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or page added; the one empty case is an empty file, covered under boundary cases
- [x] Invalid input is rejected with a readable message, not a crash — a 3 MiB zero-filled `mid3.jpg`, the incident file, was refused on the hero, the gallery and a Shelter Friend logo (message in the UI) and on the resident and project routes (400 JSON, which the uploaders show); a zero-filled `quote.pdf` was refused by the maintenance route; the Thai message came back with `locale=th`. The hero stayed the same file throughout
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `node scripts/check-file-signature.mjs` passes 18/18: each format accepted, a PNG named .jpg stored as PNG, the HEIF spelling kept, an empty file, zero-filled .jpg and .pdf, text renamed .jpg, an MP4 renamed .heic, GIF/PDF where the path does not take them, a PDF with a preamble

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Website hero/gallery, all upload routes | refused on bad bytes, accepted on a real image | as expected (the dev test account) |
| management | Shelter Friend logo, upload routes | same | not signed in as management; the logo was tested as admin through the same action |
| staff | upload routes | same | not signed in as staff; role gates unchanged |
| vet | upload routes | same | not signed in as vet; role gates unchanged |
| volunteer | upload routes | same | not signed in as volunteer; role gates unchanged |
| signed out | none | refused by the existing gates before the byte check | not re-tested; unchanged |

- [ ] Every role above tested — n/a: no role gate was touched; the byte check runs after each route's existing gate, the same for every role that passes it
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: access rules unchanged by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the refusal explains itself where it appears; nothing new for a user to learn
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new string is UI copy in the en/th dictionaries, not translatable content
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; the message uses each uploader's existing error slot, seen wrapping correctly in the narrow pane
- [x] Browser console clean — no errors or React warnings — only the five deliberate 400s from the refused test uploads
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the 400s are the refusals under test; nothing else

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin/website` (hero, gallery), a Shelter Friend's contact page (Edit profile → logo), the resident photo upload route
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. — `drive.ts` is shared: `/admin/website` loaded its photos through `/api/photos/…` after the change, and the resident route uploaded through it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought only the 0.6.0 release cut and a release-note fix; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the accepted byte list, the forgiving-about-names rule, the replace-then-trash scope
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? — yes: one line added to `unreleased`. Bad files are refused with a message, and replaced or removed Website photos and logos go to the Drive trash
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the trash and read-back claims were checked against Drive's own `trashed` and `size` fields, and the refusals against real requests

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — no threshold, but the same idea applied to formats: each accepted format passes, each path refuses the formats it does not take, and the near-misses (empty, zero-filled, renamed text, an MP4 `ftyp`) are refused
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing changes public pages at deploy; a hero changes only when an admin uploads one

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts it fully. Files trashed in the meantime stay in the Drive trash, restorable; nothing in the schema changed.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a real HEIC photo straight from an iPhone as a resident photo. HEIC was tested only on a hand-built `ftyp` header, not a real camera file | `test.lannacare.org`, any resident → Photos |
| 2 | Upload a real scanned PDF as a blood-test or procedure attachment. Those two routes were not driven here (same code as the maintenance route, which was) | `test.lannacare.org`, a blood test or procedure |
| 3 | Whether `lannacare.org`'s home page hero is broken too: check production's `site_content.hero_drive_file_id`. Not read from this worktree | `lannacare.org` / production database |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items await Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links `docs/test-plans/image-magic-bytes.md` and summarises it; the file on the branch is the record
- [ ] Handed to the production release manager — n/a: not yet — goes with the release, after merge

Result: pass

Release manager acknowledgement: pending
