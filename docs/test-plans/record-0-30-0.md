# Feature test plan — record-0-30-0

## Header

| | |
|---|---|
| Feature | The `0.30.0` release record (`docs/releases/2026-10-14.md`) and the rewritten `docs/release-handover.md` for whoever runs `0.31.0` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-30-0` @ `C:\Development\Animal_Shelter_record-0-30-0` |
| Dev server | not started — this PR is two markdown files and no code |
| PR | #615 |
| Tested by / date | Claude (production release manager session) / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

**This PR is not a gate.** `0.30.0` was deployed and verified before it existed;
it describes a release that has already shipped. It is merged by Claude as soon as
CI is green, without asking (`docs/decisions/2026-10-13-release-prs-merge-without-asking.md`).

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.30.0` did, from `docs/release-smoke-test.md`, and rewrite the handover for the next release manager
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-14.md` (new) and `docs/release-handover.md` (rewritten), plus this plan. No route, no `worker/`, no migration, no shared lib, no `src/`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none. No role can reach `docs/`, and the app never imports it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: closing any of the five items in the record's "Left for a person" table. They are stated, not closed, and three of them need Lutan or an account this session does not have

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. **Needed here**: the worktree was created during the cut's CI wait, so it predated `ab59e475` and had to be synced before the record could be written against the merged release
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: this PR changes two markdown files under `docs/` and adds no code, so the gates have nothing of this PR's to compile or lint. They were run on the cut PR at `0.30.0`'s content and ended `gates: typecheck=0 lint=0 test=0 build=0`; CI runs them again on this branch regardless
- [x] CI green on the PR (runs the same three) — all 7 jobs `success` on run 38557243751 at `2101447b`, the branch tip: migration-numbers, check, script-integrity, public-views, audit, new-policy-role-names, test-plan. Read from `gh run view 38557243751 --json jobs`, not from `gh pr checks`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's one, `0194_role_cards.sql`, was applied to production as a release step and is recorded in section 8 and in the record itself
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step — production went `194 applied, 1 pending` → `195 applied, 0 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run twice against production as a release step, `ok` both times
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0194` was already on dev from #602, and dev read `195 applied, 0 pending` throughout
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR. Worth noting rather than repeating: `0194` carries its own `raise exception` assertions *inside the migration*, so the proof ran on production as part of the apply rather than in a separate harness
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: the apply already happened; what it did is recorded in the release record

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour in this PR — two markdown files under `docs/`
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | `docs/` is not served by the app | unchanged |
| management | nothing | as above | unchanged |
| second_in_command | nothing | as above | unchanged |
| head_of_maintenance | nothing | as above | unchanged |
| head_of_medical | nothing | as above | unchanged |
| doctor | nothing | as above | unchanged |
| volunteer | nothing | as above | unchanged |
| signed out | nothing | as above | unchanged |

- [ ] Every role above tested — n/a: no role can reach a file under `docs/`; the app never imports it and no route serves it
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string; `docs/` is English-only by construction
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no page reads either file
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched. Neither file is imported by anything; `docs/release-handover.md` is read by people, not by code
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in the cut (`ab59e475`) and this branch adds only `docs/` files on top of it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release record closes no backlog item. Nothing in `0.30.0`'s own work closed an item that its feature PRs had not already ticked — checked by searching the backlog for the files and tables this PR touches, which are two `docs/` files that no item refers to
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice here. The one new finding — that the OpenNext copy errors are intermittent rather than universal — is a fact about the toolchain, not a decision, and it is recorded in the release record and carried into the handover's "things that look alarming" list where the next release manager will actually meet it
- [x] `README.md` still accurate — no README statement is about release records or the handover
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside this repository can see a release record or a handover file. No shelter user reaches `docs/`, and `unreleased` is deliberately empty immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every factual claim in the record is a command's own output: the four version endpoints, both `--drift` lines, the five deploy-log lines read through `tr -d '\000'`, the Gmail message's own date and subject, the backup file's name and byte count, and `gh pr view` on each of the three squash-merged PRs. **The one that mattered most was measured rather than reasoned twice over**: the intermittent copy errors were counted on both builds (3 and 0) and the three modules checked present in the bundle, rather than carried forward from `0.29.0`'s "on every Worker build"

## 8. Pre-production gate

**Every deploy-time gate below is already closed, not deferred** — unusually for a
plan, because this PR is written *after* the release it describes. The evidence is
in `docs/releases/2026-10-14.md`; it is cited here, not restated.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release shipped `ab59e475` on all four builds
- [x] Deployed SHA matches the tested SHA — `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (ab59e475)`, read from the log rather than assumed

### On the deployed build

- [x] Deployed to test — test Worker exit 0, and the test Pi rebuilt and restarted; both report `0.30.0` @ `ab59e475`
- [x] Smoke-tested on `test.lannacare.org` — to the extent a session without an account can: version and release endpoints, the Pi's own `served by: pi` check, and `systemctl is-active`. What could not be reached is listed in the record's "What this record cannot say"
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives a date. The release's two date-derived changes carry that check in `vet-visits-director.md` and `us-date-order.md`, and are deliberately not re-signed here
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the record quotes commands' own output throughout, including the `No drift` lines verbatim because that is what reads as a drift check afterwards
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked`, so an anonymous request gets the "Staff testing site" gate, confirmed with `curl` this release. There is no public page to re-check and nothing cacheable — the gate is served `private, no-cache, no-store`

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `removed 11 env var(s)`, the eleven named
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a as a new secret: the release adds none. `BACKUP_DRIVE_FOLDER_ID` is an **existing** setting that `backup-check-alarm` now surfaces as a stated fault when unset; the production Pi has it (its backup log names it), and the Worker side is row 3 of the record's "Left for a person"
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — run before any deploy, exit 0, and the first Worker build printed `Next.js version : 16.3.8` against `package.json`'s `16.3.8`
- [x] **Server Actions key fingerprints match on both pairs** — production `cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on Worker and Pi. New this release: previously only the production half was ever read

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, and neither did the release: `0194` merged in its own schema-first PR (#602) and was applied **before** either deploy. Its consumer warnings named files absent from live `0.29.0`, which is the safe direction
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — twice, `ok` both times, the second immediately before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `lannacare-production-2026-10-13T2000Z.dump.age`, 1,147,241 bytes, written by the cron at 03:00 on the release day and uploaded to Drive. `0194` writes rows, so the gate was satisfied rather than waived
- [x] Apply plan stated — stated before the apply and followed exactly: `--status`, `--dry-run`, `--env production`, all before either deploy. `applying 0194_role_cards.sql … ok`, then `195 applied, 0 pending` and `No drift` on both databases

### Rollback

- [x] Rollback position stated, **including what it does not cover** — recorded in the release record: `./scripts/pi/deploy-pi.sh --ref 9cb36eea` on the Pi with `npx wrangler rollback --env production` for the fallback, covering neither `0194` nor the release mail. It was never needed; nothing broke and no rollback was considered at any point

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | No defect in **this PR**. The release's three are in `docs/releases/2026-10-14.md`: `release-prs.mjs` exit 1 (routine, fifth release running), the benign and intermittent OpenNext copy errors, and the 19 `pending:` manual verifications accepted as a stated gap | — |

## Left for manual verification

The release's own outstanding items live in `docs/releases/2026-10-14.md` →
"Left for a person", which is where anyone looking for them will go. They are
deliberately **not** copied here: that would give them a second home that nothing
closes, which is what the template forbids and what five earlier release-cut
plans did before it was noticed.

What is left for a person about **this PR** is only whether it reads correctly.

| # | What to check | Where |
|---|---|---|
| 1 | The record is accurate and complete to someone who was not in this session — in particular that "What this record cannot say" is the honest list and does not read as more verified than it was | `docs/releases/2026-10-14.md` |
| 2 | The handover reads as a usable briefing **cold**, to whoever runs `0.31.0`. That is the only test it has, and it cannot be run by the session that wrote it | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the record read back, and the handover read cold by whoever runs `0.31.0`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass
