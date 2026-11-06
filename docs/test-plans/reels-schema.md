# Feature test plan — reels-schema

## Header

| | |
|---|---|
| Feature | Schema half of the Reels library: `reels`, `reel_residents`, `social_shares` widened to `'reel'`, `video_uploads` able to carry a reel |
| Backlog item | `docs/backlog.md` → **A REELS LIBRARY** (`#8bz78`; left open for the app half) |
| Branch / worktree | `claude/reels-schema` @ `C:\Development\Animal_Shelter_reels-schema` |
| Dev server | `http://localhost:3001` (started to run `check-public-views.mjs`) |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | yes — `0322_reels.sql` |
| Tested at SHA | pending: recorded after the final commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema half only: two never-public tables modelled on `memes`, the reel owner type for shares, and the upload bookkeeping able to carry a reel
- [x] Files/areas touched listed — `supabase/migrations/0322_reels.sql`, `supabase/harness/0322_reels_harness.sql`, `scripts/run-harness.mjs`, `scripts/check-public-views.mjs`, `docs/decisions/2026-11-06-reels-schema.md`, this plan. No `src/`
- [x] Cards affected identified — none change: reels reuse `social.library`, no card or activity added; admin unaffected; signed-out public refused (proved below)
- [x] Anything explicitly **out of scope** written down — all app code, the `#tag` parser, the upload route, any card split (`#i7qkz`), any website path (`#7j2qf`), Facebook posting (`#vkswg`, on hold)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body for the merge result
- [x] `node scripts/gates.mjs` four gates, all `0`:

```
=== gates: typecheck exited 0 after 93s
=== gates: lint exited 0 after 325s
=== gates: test exited 0 after 39s
=== gates: build exited 0 after 331s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `0322` against highest `0321`; no other in-flight branch carries one
- [x] `apply-migrations.mjs --status` reviewed — dev 322 applied before the apply, 1 pending
- [x] `--dry-run` reviewed — first run FAILED `function sees_all_residents() does not exist` (the draft copied `0223`'s policies; `0264` removed that call from the live ones). Fixed to the live shape; second run `ok`
- [x] Applied to **dev** — `applying 0322_reels.sql … ok`
- [x] File is re-runnable — every statement is `if not exists` / `or replace` / `drop … if exists`
- [x] Existing rows still read correctly — `video_uploads` and `social_shares` gain only a relaxed NOT NULL / a wider check; existing rows satisfy both
- [x] Constraints exercised in a `begin … rollback` harness (`supabase/harness/0322_reels_harness.sql`): a share records against a reel; the guard refuses a share on a non-reel id; deleting a reel removes its shares and not another reel's; `reel_residents` refuses a duplicate pair; the meme guard still refuses a non-meme owner; a reel upload needs no resident, a resident upload still does. Result: `HARNESS PASSED (rolled back)`
- [x] Down-migration — not needed: additive; the undo is described in the file header
- [x] Production apply plan — `0322_reels.sql` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these tables yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes and the cascade/cleanup deletes exercised in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI input; database refusals asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; duplicate pair and bad owner asserted in §3

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | reels tables | unchanged (outside the card system) | n/a — no app page reads them |
| exactly `meme_library` | reels tables | same policy as memes (`social.library`) | n/a — policy text identical in shape to `0223`; no page to drive |
| signed out | nothing | refused every method | pass — `check-public-views.mjs`: anon GET/POST/PATCH/DELETE on `reels` and `reel_residents` all refused (HTTP 401) |

- [ ] Every login above tested — n/a: only the signed-out refusal is observable without an app page, and it passed
- [x] A login that should not have access is blocked server-side — anon refused on all methods, both tables

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-public-views.mjs` ran in full against dev with the migration applied, exit 0, 469 `ok`, 0 failures; the build compiles every reader of `social_shares`/`video_uploads`
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran on this tree

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open for the app half; annotated on the `backlog` branch (not in this PR)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-06-reels-schema.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: schema only, nothing a user can see yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the policy shape came from `0264`, the failure from the dry run, the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: `date_taken` defaults to `shelter_today()`, which already exists; nothing new derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: no public view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`; the app half must not deploy before `0322` is on production
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive only
- [x] Apply plan stated — `0322` on production with the next release, before the app half deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert `0322` and does not need to: older code ignores the new tables, and the relaxed `video_uploads.resident_id` still holds a value for every existing row

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry run failed on `sees_all_residents()` (copied from `0223`, removed from live policies by `0264`) | fixed — policies restated in the live shape |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these tables yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
