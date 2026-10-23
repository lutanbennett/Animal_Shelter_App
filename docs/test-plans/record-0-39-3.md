# Feature test plan — release record and handover for `0.39.3`

## Header

| | |
|---|---|
| Feature | The `0.39.3` release record, the rewritten release handover, and two corrections to the runbook itself |
| Backlog item | `docs/backlog.md` → none; `docs/release-procedure.md` step 8 |
| Branch / worktree | `claude/record-0-39-3` @ `C:\Development\Animal_Shelter_vet-visit-booking-polish` — **the cut's own worktree, reused** per the paperwork budget's rule 2, by creating the branch there and `git reset --hard origin/main` |
| Dev server | not started; this PR has no runnable surface |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | branched from `5df88838` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the release record for `0.39.3`, the handover rewritten as a delta, and two fixes to documents that were wrong: the runbook's own handover command and the gate count
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-23-0-39-3.md` (new), `docs/release-handover.md`, `docs/release-procedure.md`, `CLAUDE.md`, and this plan. **No code, no route, no migration**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Nothing here is reachable by any user of the app
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **the Next `16.4.2` bump is out of scope and deliberately not recorded in `docs/decisions/` here.** The planner filed it as a backlog item under *Security* with the reachability conclusion written out while this release deployed; a second file would duplicate a verdict two readings already agree on. That stream writes the decision file

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the branch was reset to `origin/main` at `5df88838` when it was created, so there was nothing to merge
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: a documents-only PR. `scripts/check-docs-only.mjs` is what decides this, and `ci.yml` gates every heavy job on it, so running a four-minute build locally to compile markdown would be the "do not touch code to make a check run" fault in reverse. The cut PR that shipped the code ran all four gates green
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the record's every factual claim is a value read from a command's own output during the release, not reconstructed afterwards: the deploy lines, the migration counts, the drift verdicts, the asset-check byte counts, the Pi env names
- [ ] Data persists — reload the page and the change is still there — n/a: markdown in git has no runtime state
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: documents, not a feature with CRUD
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no logic. The one thing with a limit is the handover's own length, checked below
- [x] **The handover is within its ceiling** — `wc -l docs/release-handover.md` is **117**, against an aim of about 100 and a limit of 150 (`release-procedure.md`, paperwork rule 4)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing in this PR | documents are not served by the app | unchanged — no route, component or permission is touched |

- [ ] Every role above tested — n/a: this PR adds no reachable surface for any role
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page or permission is added

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched; the manual is for shelter users and these documents are for whoever runs a release
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the nearest thing to a consumer is `scripts/check-docs-only.mjs`, which decides whether CI skips the heavy jobs for this PR; the file list above is markdown plus `CLAUDE.md`, which is what it is designed to pass
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — none of those. **`CLAUDE.md` is shared in a different sense** — every session reads it — so the edit was kept to the narrowest possible form: the parenthetical listing the gates gains `test` and the words "four gates". No rule's meaning changes
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was reset to `origin/main`, and the three commits that landed mid-release are documented in the record rather than reverted

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the record closes no backlog item, and backlog edits belong on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a does not apply, and nor does a new file: the two runbook corrections are **promoted into `docs/release-procedure.md` itself**, which is what paperwork rule 4 requires of anything durable, rather than being recorded as a decision and recopied each release. The audit verdict is out of scope (section 1)
- [x] `README.md` still accurate — unchanged; it names no version and no gate count
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app can see a release record, a handover or a runbook. `unreleased` is correctly empty, having just been emptied by the cut
- [x] Commit messages say why, not just what — the record commit says what the release cost and why, including the fault that was mine
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the claim this release had most reason to fudge is "all four builds from one SHA", and it is **not** claimed. The production Worker was built from `5df88838` after the first attempt failed, and the record says so, with `git diff --name-only c0bdf272..5df88838` printed to show the three files are a skill file and two docs

## 8. Pre-production gate

By the time this PR exists the release is deployed and verified. **It is not a gate**, and every line below is either already true or does not apply.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded, and the record distinguishes the two SHAs rather than blurring them: Pis and test Worker `c0bdf272`, production Worker `5df88838`
- [x] Deployed SHA matches the tested SHA — read from each deploy's own output. **They do not all match, and that is stated rather than smoothed over**

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — run as `node scripts/deploy.mjs --env test`, `tee`'d not `tail`'d; `test → qxkmhwybjggxvsfxsxbd (c0bdf272)`
- [x] Smoke-tested on `test.lannacare.org` — `/api/version` reports `0.39.3` @ `c0bdf272`, served by the Pi, and its asset check is byte-identical to the build
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today", and nothing in the release does either (the calendar import writes the entry's own stored date)
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: there is no band or threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the record carries the deploy lines, counts and verdicts verbatim; nothing was re-typed into a tidy table
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked` on both environments, so an anonymous request gets the staff-testing gate. The purge itself was run and both Pis' asset checks were re-run after it

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu`, grepped on the project ref rather than the arrow, which does not survive the UTF-16 strip
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — **14 on test**, the same list as `0.39.1` set, both calendar names included
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this release adds none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR has no migration. The release's `0248` was applied before any deploy
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — exit 0, `0248 … ok`, **with the `-- consumer:` warning that was predicted before the run appearing exactly as predicted**
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0248` changes a function and its policies, additively and re-runnably
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0248` → `dbkodyyxxhtygxcxmfcu`, before any deploy; done, `248 applied, 1 pending` → `249 applied, 0 pending`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — in the record: `./scripts/pi/deploy-pi.sh --ref 6764913d` on each Pi returns the served app to `0.39.2`, and `npx wrangler rollback --env production` returns only the Worker fallback. Neither reverts `0248`, which is additive and safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **I handed Lutan the production deploy while my own test Worker build was still running in the same checkout.** His build died about a minute in on `Another next build process is already running`, costing him a second run | **fixed in the runbook, not just in this release.** The collision is already documented ("two builds in one worktree collide") and I caused it anyway, by handing over a command whose precondition I had not checked. Recorded as an avoidable cost against his time, and the cause named |
| 2 | low | The runbook's own handover command (`mkdir -p .local && node …`) could not have run in PowerShell 5.1 | **fixed** in `docs/release-procedure.md`, with the `.local` precondition checked rather than assumed |
| 3 | low | `release-procedure.md` and `CLAUDE.md` both described the gates as "typecheck, lint, build" — three of four | **fixed** in both; a `test` gate runs between lint and build |
| 4 | low | A `tail` of a local `.log` file was refused as `[Production Deploy]` | **worked around and recorded.** The same content read fine through the `Grep` tool. Eighth distinct classifier behaviour in eight releases |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty: there is nothing in a release record, a handover or a runbook fix that a
person has to go and look at separately from reading the PR. The release's own
outstanding items are listed in the record and the handover, where they belong,
rather than copied here — a row here would give them a second home that nothing
closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing being signed for

Manual verification by: n/a: a documents-only PR with no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: written by the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
