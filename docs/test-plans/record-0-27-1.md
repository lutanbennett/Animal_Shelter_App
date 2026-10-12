# Feature test plan — record-0-27-1

## Header

| | |
|---|---|
| Feature | The `0.27.1` release record (`docs/releases/2026-10-12.md`) and the rewritten handover for `0.28.0` (`docs/release-handover.md`) |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-27-1` @ `C:\Development\Animal_Shelter_record-0-27-1` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not started — two documentation files, no rendered surface) |
| PR | #565 |
| Tested by / date | Claude (production release manager session) / 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — write the `0.27.1` release record and rewrite the handover for whoever runs `0.28.0`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-12.md` (new) and `docs/release-handover.md` (rewritten in place), plus this plan. No `src/`, no `worker/`, no migration, no script
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none. Neither file is read by the app or served to any role; both are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the three outstanding production checks Lutan asked to be reminded about, and the one `pending:` row on the cut plan. Those are recorded, not closed, and closing them is not this PR's business

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, bringing the branch from `c6e19730` to `3c7632ca`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed
```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 91s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 259s
=== gates: build — npm run build
=== gates: build exited 0 after 353s
gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR (runs the same three) — all 7 jobs `completed success` on run 38219547436 at `d8614240`, the branch tip. Read from `gh run view`, not `gh pr checks`, for the reason recorded in the release record

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR, and none in flight. The release's two (`0186`, `0187`) merged in their own PRs and were applied to production as a release step, recorded in `docs/releases/2026-10-12.md`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; the release's own `--status` readings are quoted in the record
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; the release's production dry-run was clean and is quoted in the record
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; dev reads `187 applied, 0 pending`, `No drift`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; this PR writes no data and reads none
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR; this belongs to `0186`'s and `0187`'s own plans
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR. The release's apply already happened and is recorded

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two documentation files; there is no path to walk
- [ ] Data persists — reload the page and the change is still there — n/a: no page, nothing written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input and no computation. The dates in both files are fixed strings, and each was checked against the thing it describes rather than typed from memory

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | Neither file is served to any role | unchanged |
| management | nothing in this PR | as above | unchanged |
| second_in_command | nothing in this PR | as above | unchanged |
| head_of_maintenance | nothing in this PR | as above | unchanged |
| head_of_medical | nothing in this PR | as above | unchanged |
| doctor | nothing in this PR | as above | unchanged |
| volunteer | nothing in this PR | as above | unchanged |
| signed out | nothing in this PR | as above | unchanged |

- [ ] Every role above tested — n/a: this PR adds no route and no surface any role can reach
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change; a release record is not a manual topic, and shelter users never read either file
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: both files are internal English documentation, as every previous release record is
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [x] Browser console clean — no errors or React warnings — the only browser work in this release was the edge-cache check on `/`, driven from the browser pane; it returned `status=200` three times with no console errors
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the same three fetches returned `200`, and the two `/api/version` and two `/api/releases/current` reads all returned `200`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — nothing in the app reads either file, so the nearest thing is the deployed release itself: `lannacare.org/api/version` and `test.lannacare.org/api/version` both answer `0.27.1` at `3c7632ca`, both `x-lanna-served-by: pi`, and `/` returns `200` with CSP `ENFORCING`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — n/a as written, and stated rather than ticked blind: no shared file is touched. `docs/release-handover.md` is rewritten, and it is read by people, not by code. `grep -rn "release-handover" src worker scripts` finds nothing that loads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought the branch from `c6e19730` to `3c7632ca` (the release itself) and this branch adds only documentation, so there is nothing it could break. The gates were run after the sync, not before

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release record closes no backlog item. The release did close backlog-adjacent facts — the facility-map upload and the role sign-ins — but those are **items other PRs own**, and the honest home for Lutan's answers is the record and the handover, which is where they are. Nothing was ticked speculatively
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a as a new decision file, and stated rather than skipped: the two judgements this release made are already recorded where they are read. The major-versus-minor call is in the cut's commit message and the record; the PR-list-against-the-release-SHA correction is the handover's lesson 2, which is the file the next release manager actually opens. A third copy in `docs/decisions/` would be a fourth place to keep in step
- [x] `README.md` still accurate — checked: no README statement names a version, a release SHA or a migration number, so the release does not date it
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: two internal documentation files. No shelter user reads a release record or a handover, and this PR changes nothing they can see. `unreleased` is deliberately left empty, which is its correct post-cut state
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose — this is the line that matters most in this PR, since the PR *is* prose. Every figure in the record was read from the thing that produced it: the deploy's project-ref line from Lutan's `| tee` log, the Server Actions fingerprints from both the Worker and the Pi output, `ActiveEnterTimestamp` from `systemctl show`, the drift lines from `--drift`, the edge-cache headers from three real browser fetches, the gate timings from `gates.mjs`, and the CI result from `gh run view` rather than `gh pr checks`. **Two figures are stated as absent rather than estimated**: the migration apply duration, lost to the classifier refusal, and the Pi restart interval, which nothing timestamps

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release shipped from `3c7632ca`, which is this branch's merge base
- [x] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — read from Lutan's log: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (3c7632ca)`, the release SHA exactly

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — run as `node scripts/deploy.mjs --env test` from `3c7632ca`, backgrounded. Exit 0 in 9 min 31 s. `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (3c7632ca)`, the dev project at the release SHA; Server Actions key `ecc41837fc0b`, matching the Pi test build; Worker version `d2169ed3-1dad-4bed-abda-fa2b6c9f863f`. Three `ERROR Failed to copy … node_modules…` lines appeared mid-build and were **non-fatal** — the build went on to upload 178 assets and exit 0, and the deployed build answers `0.27.1`
- [x] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — `/api/version` answers `0.27.1` at `3c7632ca`, served by the Pi. Everything past the front door is behind sign-in and this session has no account, which the record states rather than papers over
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are — proved in source rather than observed: `0186` bounds a receipt by `shelter_today()` and the live app passes `todayIso()`, which formats through `SHELTER_DATE_FORMAT` in Asia/Bangkok. Had it been UTC-based, every receipt issued between midnight and 07:00 Thai would have been refused. Read at the live SHA `47760a81`, before the apply
  - *Does the logic handle the boundary?* — the boundary belongs to `0186`, whose own plan carries the assertions. What this release added was the check that the **caller** sits inside the new bounds, which is the half no signature check reaches
  - *Does the deployed build behave as the source does?* — n/a: not observable now. The window where the two dates differ is 00:00–07:00 Thai and the release ran at midday. Left in the record as a thing the record cannot say, and carried in the handover as the donation-receipt item
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — `0186` is a boundary change and both edges were reasoned at the caller: the upper bound is `shelter_today()`, which is exactly what the app sends, and the lower bound is `received_on`, which can only bite on a donation dated in the future. That case was looked for and no guard against future-dating a donation was found, so it is named as the one visible refusal path — it errors, it does not fail silently
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block and the record's quoted output are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked`, so an anonymous visitor gets the "STAFF TESTING SITE" gate and the real public pages cannot be seen by anyone. The **edge cache** on `/` was checked in a real browser and read `HIT, HIT, HIT`; the standing gap is recorded in the handover

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu`, read from Lutan's log, not assumed
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `removed 11 env var(s)`, and the list includes `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN` and the three Google OAuth values
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: neither this PR nor the release adds a secret or an env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code at all
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — both files `ok`, exit 0, run against production immediately before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — three backups from the morning of the release, the newest `lannacare-production-2026-10-12T0445Z.dump.age` at 11:46 Pi local, left by Lutan exercising the restore recipe. Neither migration holds or rewrites data. **The restore itself was in progress, not finished**, at the time of the apply, and the handover says so
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — already executed, and recorded: `0186` and `0187` to `dbkodyyxxhtygxcxmfcu`, both before either deploy, `185 applied, 2 pending` → `187 applied, 0 pending`, followed by `No drift` on both databases

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `./scripts/pi/deploy-pi.sh --ref 47760a81` on the Pi (a rebuild of `0.27.0`) with `npx wrangler rollback --env production` for the Worker fallback. **It does not cover the two migrations**, neither of which has a down-migration, and `0187` leaves four triggers behind. That is safe in this case because `0.27.0` already sends a receipt date inside `0186`'s rule and already asks `medical.archive` before changing `archived_at` — the same two facts that made the forward direction safe. **For this PR specifically there is nothing to roll back**: reverting two documentation files changes nothing that runs

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Writing the record's and handover's long markdown through a shell heredoc failed on quoting twice, and the handover had to be staged in the scratchpad and copied in because the editor tool requires a prior read of a 256-line file being wholly replaced | accepted, mechanical. No content was affected and nothing reached disk half-written |

The release's own four defects are in `docs/releases/2026-10-12.md` under
**Defects**, where they belong, and are not copied here.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the record back and say whether it matches what you saw from your side — in particular the four items your answers closed, since the record now states them as closed and the next release will not re-ask | `docs/releases/2026-10-12.md` |
| 2 | The handover read cold by whoever runs `0.28.0`. It is only worth anything if its opening instruction — put the whole outstanding list to Lutan in the first message — is actually followed | `docs/release-handover.md` |
| 3 | The `0.27.1` entry on `/releases` and the new "not allowed" message on `/maintenance` and `/projects`. Behind sign-in; this session has no account. Two minutes, and it is the release's own one unverified surface | `/releases`, `/maintenance`, `/projects` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so this stays for the person who looks (see the pending line)

Manual verification by: pending: the three rows above — the record read back by Lutan, the handover read cold by whoever runs `0.28.0`, and the release's two notes read on a screen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: pasted once the PR exists
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-12
