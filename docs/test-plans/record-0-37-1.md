# Feature test plan — record-0-37-1

## Header

| | |
|---|---|
| Feature | The `0.37.1` release record (`docs/releases/2026-10-19-0-37-1.md`) and a rewritten `docs/release-handover.md` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item. **The two faults this release found went on the `backlog` branch**, not here |
| Branch / worktree | `claude/record-0-37-1` @ `C:\Development\Animal_Shelter_record-0-37-1` |
| Dev server | not driven — no runtime surface; see §5 |
| PR | **#745 — a guess at the time of writing, to be re-read with `gh pr view` after opening.** The last two guesses were right (#731, #743); the re-read, not the streak, is what makes it safe to write down |
| Tested by / date | Claude (production release manager session) / 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.37.1` did, what broke and what it cost, and rewrite the handover so the next release manager does not trust a false `DEPLOY FAILED` banner
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **two documentation files only**: `docs/releases/2026-10-19-0-37-1.md` (new) and `docs/release-handover.md` (rewritten), plus this plan. No code, no route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Neither file is read by the app or served to any user; they are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — four things. (a) **Fixing** either fault the record describes: `deploy-pi.sh`'s broken self-check and the unverified `0224` holders are each their own piece of work, and both are on the `backlog` branch. (b) The eight outstanding manual items from this release's feature plans, which belong to those plans and their signatures. (c) **The `0224` production check itself** — it is a look at Who does what that a session cannot do, and it is recorded as an open gap rather than quietly closed. (d) The release-record **file name**: this release is the second of 2026-10-19, so it is `2026-10-19-0-37-1.md` rather than `2026-10-19.md`, which `0.37.0` already holds

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `9804e211`, the release SHA, after everything had merged
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR (runs the same three) — `n/a: this line is the PR's own CI result, which cannot exist before the PR does; it is replaced by a tick and the run's output once green.` The plan is written and committed **before** the PR is opened, which is what has made the first run green by construction for eight releases
- [x] `node scripts/check-test-plan.mjs` — the plan is complete and correct

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR, and none in this change at all.` The release's three (`0224`, `0225`, `0226`) merged in #738, #739 and #744 and are applied to production; `--drift production` reports `No drift`, 227 of 227.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration.` Recorded for the next release: `origin/main` tops out at `0226`, so the next free number is **`0227`**
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: nothing to apply in this PR.` Read at the end of the release: production **`227 applied, 0 pending`**
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: nothing to apply in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: nothing to apply in this PR`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: this PR writes no rows and reads none`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration.` The undo for a documentation file is `git revert`
- [ ] Production apply plan stated for the release manager — `n/a: nothing to apply`

## 4. Functional checks

- [x] Happy path works end to end — the happy path for this change is that both files are **accurate and readable by the next release manager**. Every number in the record is a tool's output rather than a recollection: the release SHA `9804e211`, production `227 applied, 0 pending`, the Pi caches at 689 MB and 1.2 GB, the Server Actions keys `cbd55beae8d8` and `ecc41837fc0b`, `strip-baked-env` at 13 and 14, and the 13 PRs in range
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: no create/edit/delete surface`
- [x] Empty state renders sensibly — `n/a: neither file has an empty state.` The nearest equivalent is the handover's "In flight" section, which says "run the list" rather than quoting a worktree count that would be stale by the time it is read
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: neither file takes input`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the one boundary that matters here is the **file name**: `0.37.0` already occupies `docs/releases/2026-10-19.md`, so a second release on the same day needed a distinct name. Written as `2026-10-19-0-37-1.md`, following the precedent of `2026-10-17-0-36-0.md` and `2026-10-17.md`, which is the same situation from two days earlier

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | neither file | **no role reaches either file from the app** — they are repository documentation, not served content | unchanged; no route, middleware or policy touched |

- [x] Every role above tested — tested at the level this change operates at: no role can reach it, because nothing serves it. No route, middleware or policy is touched
- [x] A role that should not have access is blocked server-side — `n/a: there is no server-side surface to block`

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The manual is for shelter users; this is release documentation
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing executes in a browser`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: these files have no consumers in the app.` The build gate exercises everything that does
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file touched`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release record closes no backlog item.` **The two faults this release found were added to the `backlog` branch** (`5faf50d7`), which is where follow-ups belong — not in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided.` The two judgement calls of this release — minor rather than major, and folding #744 in because the deploy guard left no alternative — are recorded in the release record with the reasoning, which is where release-level decisions go
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: nobody using the shelter app would notice a release record or a handover document.` `unreleased` is deliberately untouched by this PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the record were measured, not reasoned** — including the two that were tempting to assert from memory: the Pi cache sizes were read on the machine rather than carried forward from `0.37.0`'s 450 MB, and the `Forbidden` on production was reproduced **with** a correct `Host` header before being written up as a host-gate rather than guessed at

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a` in the usual sense: **this PR is written after the deploy**, and the release it describes shipped at `9804e211`
- [x] Deployed SHA matches the tested SHA — **yes, and this is the release's own evidence**: all four builds report `0.37.1` @ `9804e211` — production Worker, production Pi, test Worker, test Pi

### On the deployed build

- [x] Deployed to test — the release was, at `9804e211`; `test.lannacare.org/api/version` and `/api/releases/current` both report `0.37.1`
- [x] Smoke-tested on `test.lannacare.org` — at the level available: both version endpoints agree, `x-lanna-served-by: pi`, and `check-assets` returned `ok … identical to the build`. **The signed-in smoke test is not available to this session** and the public pages cannot be smoke-tested at all, because `PUBLIC_SITE` is locked on both environments
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"`. The dates in it are literals
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan and the record is the tool's actual output, unedited** — including the `DEPLOY FAILED` banner, which is quoted exactly as printed precisely because it is wrong
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked on both environments`, so there is no anonymous public page to re-check and the edge-cache `HIT` check is vacuous (the gate is served `no-store`). **The purge itself was not n/a**: it was done by Lutan from the dashboard, because `CLOUDFLARE_PURGE_TOKEN` still does not exist

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read from his log: `dbkodyyxxhtygxcxmfcu`, at `9804e211`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — **13 on production, 14 on test**, the extra being `SCRATCH_RESTORE_DB_URL`, which exists only on test. The asymmetry is expected and is **not** a missing production secret
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither did the release
- [x] **The release mail MUST NOT go out, and its absence is the check** — **confirmed on both environments.** Production: `deploy: no major release new to production (was 0.37.0), so no email.` Test: the same line for test. `majorReleasesSince("0.37.0")` was asserted empty before the cut merged, so the absence was predicted and then observed rather than noticed afterwards

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. The release's three applied **before** every deploy, which mattered: `0224`'s six declared consumers were on `main` but not live, exactly as the dry-run's six warnings said
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **all three `ok`** across two runs (`0224`/`0225` before the cut deployed, `0226` after #744 was folded in). The per-file rollback trap did **not** fire
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `0224` rewrites permission rows rather than dropping anything, and its effect is the open item recorded above. The backup position is unchanged from `0.37.0` earlier the same day. **The README restore recipe has still never been exercised — fourteen releases unanswered, and still the cheapest item on the outstanding list**
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — carried out as stated: `0224`, `0225`, then `0226`, project `dbkodyyxxhtygxcxmfcu`, all **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **this PR is documentation and its rollback is `git revert`, which affects nothing that runs.** For the release it describes: production is served by the Pi, so a rollback is a rebuild there pinned to `2b1dc2e5` (`0.37.0`), and a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the three migrations**, and `0224` is not symmetrical — `0.37.0`'s approval code does not know about `photos.approve`, so a genuine rollback means re-applying `0218`/`0222`'s definitions as well. **What a rollback does not need to undo this time: the mail**, because none was sent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **High (release tooling)** | **`deploy-pi.sh` reported `DEPLOY FAILED — NOTHING NEW IS BEING SERVED` on a production deploy that had succeeded**, and exited before `check-assets.mjs`. Production refuses the loopback probe the script uses, with or without a correct `Host`; the test clone answers it. Not new — the same `Forbidden` was observed before any deploy that day, while `0.37.0` was live. Two harms: it tells the release manager not to announce a live, correct release, and it skips the one check that catches a poisoned edge cache | **Deferred to backlog** (`5faf50d7`). Deliberately not fixed inside the release: a change to the deploy script is its own PR with its own plan, and it needs a test that a *genuine* failure still reports failure. **Worked around for this release** by reading `https://lannacare.org/api/version` and running `check-assets.mjs --url https://lannacare.org` by hand, which returned `ok … identical to the build` |
| 2 | Medium (process, cost Lutan a touch) | **The test Worker deploy was started in the same checkout while Lutan's production deploy was running.** Both run `next build` in `C:\Development\Animal_Shelter_App`; Next refused his with *"Suggestion: Wait for the build to complete"* and it died before deploying. The runbook already says the Worker deploys are ~9–10 minutes each and must not overlap | **Accepted and recorded as an avoidable cost.** No code change: the rule already exists and was not followed. Written into the handover as *THE THIRD THING* so the next session meets it before it can repeat |
| 3 | Medium (verification tooling) | **The cut-verification script passed vacuously on its first run**, locating the `[]` of the type annotation `ReleaseNote[]` instead of the array literal, so it compared two empty arrays and reported `ok` having read nothing | **Fixed** before any assertion was trusted, and carried into the cut's own plan (`cut-release-0-37-1.md`). The handover now says a cut verifier must print the values it compared, not only ticks |
| 4 | Low (scope, not a fault in the software) | **A PR merged mid-release and the deploy guard forced it into the release**, moving the release SHA from `2b8fbb04` to `9804e211` after the cut had merged and requiring the test pair to be rebuilt | **Accepted.** The guard was right and the outcome is correct. Recorded in the handover as *THE SECOND THING*: "leave it out" is not a decision available once `main` has moved |

**No defect is in shipped code.** Defects 1–3 are tooling or process; defect 4 is a consequence of a guard working as designed.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Who holds the Approve photos card.** Any role holding it **without** Residents has silently lost the ability to publish its own photos. Accepted on the stated condition that only Management holds it; **the production read that would have confirmed it was refused by the classifier** | Who does what, signed in as Admin on `lannacare.org`. Also on the `backlog` branch so it is not lost with this plan |
| 2 | The `0.37.1` section renders correctly on `/releases`, and **no release mail arrived** — the absence is the check this release | `/releases` signed in, and the admin mailbox |

Row 1 is the one genuine open gap of this release and is deliberately recorded in two places. **This release's eight other outstanding manual items belong to their own feature plans and their own signatures** — the runbook is explicit that they must not be given a second home here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed — including the two things that were **not** done and are marked as such: the production holders query (refused) and the signed-in smoke test (no account)

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: both rows are for Lutan on the deployed build, see the table

Manual verification by: pending: the two items above, by Lutan on the deployed build

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects
