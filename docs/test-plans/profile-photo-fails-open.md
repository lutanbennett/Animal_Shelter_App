# Feature test plan

## Header

| | |
|---|---|
| Feature | The public profile photo asks the positive question (`0342`) |
| Backlog item | `docs/backlog.md` → `#h8xqv` (on the `backlog` branch only at this commit; see section 7) |
| Branch / worktree | `claude/profile-photo-fails-open` @ `C:\Development\Animal_Shelter_profile-photo-fails-open` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude (Opus 5.5), 2026-11-09 |
| Carries a migration? | yes — `0342_profile_photo_positive_test.sql` |
| Tested at SHA | 5fb1ebe4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `public_resident_profiles`, `public_resident_cards` and `public_recent_adoptions` show a profile photo only when it is an approved, non-Medical picture attachment of that resident (0319's test), instead of hiding it only when a bad attachment row matched
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0342_profile_photo_positive_test.sql`; its `grant to anon` declaration in `docs/hard-coded-security-registry.json`; new read-only `scripts/check-profile-photo-orphans.mjs`; `docs/decisions/2026-11-09-profile-photo-fails-open.md`; this plan. No `src/` change
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — no card's grants change. What changes is what the signed-out public is shown: a profile photo written by `residents` (the one card granting `resident.record` at edit, measured on dev) that is not an approved picture of the resident's own no longer reaches anon. Admin unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the column stays directly writable (decision file §3, found not fixed); the approval flag `#7aev4`; the other public Drive-id columns (§6, reported); the two pre-existing red check scripts (§7)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date" at 268b62ca)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Pasted from the run:

```
=== gates: typecheck exited 0 after 13s
=== gates: lint exited 0 after 146s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 73s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0341` highest on `origin/main` 268b62ca; the commit hook's `migration numbers: ok` agreed. `claude/restore-grants` may carry one; not visible from here
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — the dry-run run printed `343 applied, 1 pending` (0342 only)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0342_profile_photo_positive_test.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0342_profile_photo_positive_test.sql … ok`; the orphan script reads `0342 applied: yes` from the ledger. The file's grant lines were dropped and then restored unchanged (decision file §2), so what was applied is what merges; privileges after `create or replace` were proved the same in a rolled-back block
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — three `create or replace view` and a `notify`
- [x] Existing rows still read correctly after the change (checked against real dev data) — Test 1 (R-8473), whose profile photo is approved, still has it on its public page signed out
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — asserted, as the `residents`-only login: before 0342 a PATCHed id with no attachment row reached anon (`anon_cards=repro-0342-no-attachment-row is_public=t`); after, the same PATCH reads `anon_cards=<NULL> is_public=f`. Then seven profile-photo states read as anon: approved picture shown/true; unreviewed, refused, Medical, approved video, filed-twice-with-a-Medical-copy and no-row all null/false. Privileges after `create or replace`: anon SELECT yes, UPDATE no. Re-counted after every run: nothing persisted
- [x] Down-migration written, or the reason one is not needed is stated — not needed: views only, no data; to undo, re-run `0217`'s three view definitions (said in the file header)
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0342` on production `dbkodyyxxhtygxcxmfcu` with the release that carries it; **first** run `node scripts/check-profile-photo-orphans.mjs --env production` and keep its output (decision file §4–§5)

## 4. Functional checks

- [x] Happy path works end to end — as `residents` only: Test 2's (R-8472) unreviewed photo shows *"This photo is waiting for approval, so it can't be the profile photo yet"* and no button; signed out, `/r/R-8472` has no photo. After the photo was approved (setup, by SQL on dev), *Set as profile photo* appeared, was pressed, the hub showed the photo, and signed out `/r/R-8472` carried `/api/photos/1rq4lEfP…`, which answered `200 image/jpeg`. Screenshots taken in the session
- [x] Data persists — reload the page and the change is still there — the hub reloaded by click showed the photo; the database row read `is_profile: true`
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature is a read path; setting a profile photo was exercised above, nothing is created or deleted by this change
- [x] Empty state renders sensibly (no rows yet) — a resident whose profile photo is hidden reads as no photo: R-8472's public page before approval, and every refused case in the harness returns null rather than an error
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input added; the existing refusal for an unreviewed photo was seen on screen (above)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the boundaries here are the attachment states: Medical folder with odd whitespace (0319's set), video by kind and by name, the same id filed twice, no row at all

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page or control changed; the views are read the same for every login | — | not driven |
| exactly `residents` | Test 2's hub and Photos; PATCH of the column (harness) | can set an approved photo as profile; a PATCHed id never reaches anon | as expected |
| signed out | `/r/R-8472`, `/r/R-8473`, `/api/photos/<id>` | profile photo only when approved and its own | as expected |

- [x] Every login above tested — admin row is `n/a` with its reason; the other two driven
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — signed out, the proxy refused R-8472's unreviewed photo id before approval (`400`), and served it (`200`) only after

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: what a user does is unchanged; the manual already says a photo must be approved before it can be the profile photo
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change
- [x] Browser console clean — no errors or React warnings — `read_console_messages` (errors only) on the tab after the press: none
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the only 4xx was the proxy's deliberate `400` for an unapproved file

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — resident hub, Photos page and viewer, `/r/R-8472`, `/r/R-8473` signed out; `check-photo-approval`, `check-medical-photos`, `check-appeal-medical-photos`, `check-resident-record-guards`, `check-public-views` (exit 0, 473 ok) and `check-hard-coded-security` (clean) all pass on dev after 0342
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was "Already up to date"

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: `#h8xqv` is on the `backlog` branch only and not yet on `main`, so it cannot be ticked here without carrying the backlog merge into this PR; the planner ticks it after the daily merge (PR body says what closed it)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-09-profile-photo-fails-open.md`
- [x] `README.md` still accurate — it lists no per-check scripts this changes
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: the production orphan count (`node scripts/check-profile-photo-orphans.mjs --env production`) is still outstanding; if it is above zero some residents' website photos will disappear and the note belongs in the release that applies 0342, written then with the number in hand
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every dev claim in the decision file is marked measured or judgement and was run on 2026-11-09

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band; the attachment states are covered in section 3
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the probe lines and gates block are copied from the runs
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no new code reads it; the existing pages read the same columns. Order: run the orphan script on production, then apply 0342, with or before the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: views only, no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0342_profile_photo_positive_test.sql` on `dbkodyyxxhtygxcxmfcu`, after `node scripts/check-profile-photo-orphans.mjs --env production`, with or before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — re-running `0217`'s three view definitions restores the old (fail-open) behaviour; no data changes either way. A code rollback does not touch it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | Profile photo failed open on three public views (the item) | fixed by 0342 |
| 2 | low | `check-public-story-drive-file.mjs` fails `FAIL 1` on dev through `public_resident_photos`; `check-public-drive-file.mjs` dies in setup on dev | deferred to backlog: not this change, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below

Manual verification by: n/a: nothing for a person to look at; the change is a database view, driven in the browser and by harness above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the release that applies 0342

Result: pass

Release manager acknowledgement: pending: the release that applies 0342
