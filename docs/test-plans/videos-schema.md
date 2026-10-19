# Feature test plan — videos-schema

## Header

| | |
|---|---|
| Feature | Schema half of videos in a resident Photos section: `attachments.media_kind` / `duration_ms`, a `video_uploads` table for in-progress uploads, video size constants |
| Backlog item | `docs/backlog.md` → **Videos of residents: keep them in the resident's Photos section** (left open: the app half remains) |
| Branch / worktree | `claude/videos-schema` @ `C:\Development\Animal_Shelter_videos-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | yes — `0229_video_media.sql` |
| Tested at SHA | `41b357cf` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a resident media row can be a video, and a resumable upload in progress has somewhere to live; nobody can upload a video yet
- [x] Files/areas touched listed — `supabase/migrations/0229_video_media.sql`, `src/lib/uploads/limits.ts` (two new constants, nothing reads them), `docs/decisions/2026-10-19-video-media-schema.md`, this plan
- [x] Roles affected identified — none see a change: no code reads the columns or table. `video_uploads` is service role only
- [x] Anything explicitly **out of scope** written down — the resumable upload, the filter, the play icon, the player, redefining the public photo view, sweeping abandoned uploads and Drive space on System status are the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Output read from the file it was redirected to:

```
=== gates: build exited 0 after 215s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — runner printed `migration numbers: ok`, `0229` against highest `0228`; the brief names this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 229 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0229_video_media.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0229_video_media.sql … ok`
- [x] File is re-runnable — `if not exists`, `drop constraint if exists`, `create index if not exists`
- [x] Existing rows still read correctly after the change — every existing attachments row takes the default `photo`; the harness asserted none is anything else
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (HTTP 201, no exception raised). Asserted: existing rows all `photo`; a Medical-folder video row inserts; `media_kind='gif'` is refused; a duration on a photo is refused; a zero duration on a video is refused; a `video_uploads` row inserts with default state; a bad state and a zero size are refused; `anon` and `authenticated` have no select on `video_uploads`; a Medical video is absent from `public_resident_photos`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the file header says how to undo
- [x] Production apply plan stated for the release manager — `0229_video_media.sql` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none`, so any time before the app half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; row round-trip asserted in section 3
- [ ] Create / edit / delete all exercised — n/a: no UI surface; inserts exercised in section 3
- [ ] Empty state renders sensibly — n/a: no UI surface; every existing row is a photo, as every screen already assumes
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; database refusals asserted in section 3
- [ ] Boundary cases checked — n/a: no UI surface; zero and negative durations and sizes asserted in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | attachments | unchanged | n/a — no policy or grant changed |
| management | attachments | unchanged | n/a — as above |
| staff | attachments | unchanged | n/a — as above |
| doctor | attachments | unchanged | n/a — as above |
| volunteer | attachments | unchanged | n/a — as above |
| signed out | nothing | nothing | n/a — anon has no privilege on `video_uploads`, asserted in section 3 |

- [ ] Every role above tested — n/a: no policy and no grant changed on attachments; the only new table is service role only, asserted in section 3
- [ ] A role that should not have access is blocked server-side — n/a: see above; `anon` and `authenticated` select on `video_uploads` asserted refused

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the Photos and videos topic is the app half
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of `attachments`; the change only adds a defaulted column
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `limits.ts` gained two constants nothing imports
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync reported already up to date; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; this is the schema half and nobody can upload a video yet
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-19-video-media-schema.md`
- [x] `README.md` still accurate — it does not list attachments columns
- [ ] **Release notes.** — n/a: schema only, nothing reads these yet; no shelter user can notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the Medical and anon claims are asserted in the section 3 harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff is read by code
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0229` on production with the next release, before the app half deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert `0229` and does not need to: older code ignores the defaulted column and the unused table

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `public_resident_photos` would list an approved video as an image | deferred to backlog — impossible until the app half; it must redefine the view in the PR that lets a video be filed (noted in the decision file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty, there is no UI to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over once the PR is merged

Result: pass

Release manager acknowledgement: pending
