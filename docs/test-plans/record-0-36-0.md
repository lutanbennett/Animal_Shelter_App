# Feature test plan — record-0-36-0

## Header

| | |
|---|---|
| Feature | The `0.36.0` release record (`docs/releases/2026-10-17-0-36-0.md`) and the corrected release handover |
| Backlog item | `docs/backlog.md` → none. The Pi memory item was **updated on the `backlog` branch** (`bbc7c26d`) with the outcome, not here, because a follow-up belongs there rather than in a PR |
| Branch / worktree | `claude/record-0-36-0` @ `C:\Development\Animal_Shelter_record-0-36-0` |
| Dev server | not started — this PR is three Markdown files |
| PR | #706 — **a guess, and the last one was wrong.** Corrected in a follow-up commit if another stream takes it |
| Tested by / date | Claude (production release manager session) / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — write the `0.36.0` release record and correct `docs/release-handover.md`, whose headline prescription this release disproved. There is no backlog item: a release record is bookkeeping the runbook requires
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-17-0-36-0.md` (new), `docs/release-handover.md` (corrected), and this plan. **No code, no route, no `worker/`, no migration, no shared lib.** Nothing here can change what the app does
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** These files are not served by the app
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — three things. (a) **The Pi swap fix is not written into the repo here.** `/swapfile2` exists by hand on the live Pi and belongs in `scripts/pi/setup.sh` and `docs/pi-hosting.md`; that is its own PR with its own test plan, and it is the open half of the backlog item. (b) **`docs/release-procedure.md` is not edited**, though its "Do not idle" advice still conflicts with the build order; a runbook edit does not belong in a record PR. (c) **The six `pending:` items and the untested photo interface** stay with their own plans and signatures

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `1f7eacb5`, the release SHA. Re-run before the plan was signed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 112s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` Written and committed before the PR is opened so `test-plan` has a complete checklist on the first push. Ticked in a follow-up commit once a run is seen green, with its `headSha` read from `gh run list` and matched against this branch's HEAD
- [x] `node scripts/check-test-plan.mjs` passes on this plan locally before pushing

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's four (`0216`–`0219`) were applied to production as a release step and are recorded, including the dry-run trap firing on `0217`.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the record: highest on `origin/main` is `0219`, so the next free number is `0220`, and the two unmerged branches with no PR were checked with `git ls-tree` and carry nothing beyond it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production `216 applied, 4 pending` before, `220 applied, 0 pending` after)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`. For the release: `0217` reported `FAILED` and that was correct; the runner explained it and the apply confirmed it
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev `No drift`, 220 of 220)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR.` The release's equivalent question — did `0217`'s backfill leave any already-public photo stranded — was answered on production: 121 resident photos, 0 waiting
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR.` For the release, `medical_ok` was confirmed `not null` defaulting false on production with 0 rows ticked
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. `0217`'s absence of one is stated in the record's *Rollback position*
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`; the release's apply is done and recorded

## 4. Functional checks

This PR adds and corrects Markdown. There is no behaviour to drive.

- [x] Happy path works end to end — the happy path for a record is that it reads correctly and its claims are true. Every figure was taken from a command's output pasted beside it: the PR range from `release-prs.mjs`, #697's state from `gh pr view`, the migration counts from `--status`, the drift lines from the named `--drift` checks, the key fingerprints from both deploy logs, the mail's arrival from the inbox, the approval-gate result from a rolled-back `anon` harness, and the production photo counts from a read-only query
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: no such surface in a Markdown record`
- [x] Empty state renders sensibly (no rows yet) — `n/a: no rendered state.` The nearest equivalent is the handover's *In flight* section, which deliberately carries no worktree or PR counts and tells the reader to run the list
- [x] Invalid input is rejected with a readable message, not a crash — `n/a: no input.` The analogous gate is `check-test-plan.mjs` on this plan, which passes
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the numbers in this PR that could be wrong by a boundary were measured rather than estimated: the four note lengths (478, 583, 267, 190), the four retry attempts, the swap sizes before and after (2 GB → 6 GB), and the Pi's free memory between attempts (3.5–3.6 GB of 4 GB)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing | these files are not served by the app | no route, middleware or policy is in the diff |
| signed out | nothing | same | same |

- [x] Every role above tested — tested at the level this change operates at: no role can reach a Markdown file in `docs/`, and no file governing access is in the diff
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — `n/a: there is no URL.` Nothing in `docs/` is routed

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` A release record documents a release to the team, not a feature to shelter users
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles`
- [x] Browser console clean — no errors or React warnings — `n/a: nothing here runs in a browser`
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `n/a: no pages.` The gates were run in full on this branch anyway, so the tree this PR creates typechecks, lints, tests and builds
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `n/a: no shared file touched.` The two files changed are read by people, not imported by code: nothing under `src/` or `worker/` imports from `docs/`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought the release SHA and the gates pass on the merged tree: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: no backlog item is closed by writing a record.` The Pi memory item was **updated** on the `backlog` branch (`bbc7c26d`) with the outcome: more swap was the right call, and what remains is writing it into `setup.sh` and `pi-hosting.md`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The feature decisions have their own files (`2026-10-17-appeal-medical-photos.md`, `2026-10-17-photo-approval-schema.md`). The release-level choices — exercising the pipeline on test, and escalating the Pi blocker rather than improvising — are recorded in the release record, which is where a release-level choice belongs
- [x] `README.md` still accurate — unchanged; it carries no version number a release would stale
- [ ] **Release notes.** `n/a: this PR is the release record — three Markdown files in `docs/` read by whoever runs the next release.` No shelter user would notice it, and it touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`. The four notes a user will notice went out in the cut (#705)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the line a record most has to earn. The three that would have been easiest to assert and hardest to justify were each given direct evidence: that an unapproved photo is invisible to a stranger (a rolled-back harness reading the public views **as the `anon` role**, both directions); that `0217`'s backfill stranded nothing on production (a read-only count: 121 photos, 0 waiting); and that `0217` did not revert `0216`'s medical rule when it recreated the same view (both conditions read out of `0217`'s own definition). **And the claim this PR explicitly does NOT make is stated as a gap**: nothing was seen working by a stranger or a signed-in person, because both environments are gated

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a for deployment`: this PR ships nothing. The release's SHA, `1f7eacb5`, was verified on all four surfaces, and `main` was re-checked as unmoved immediately before the production handover
- [x] Deployed SHA matches the tested SHA — verified for the release: `/api/version` reads `sha 1f7eacb5` on both hosts and both Pi clones sit at it. This PR is not deployed

### On the deployed build

- [x] Deployed to test — `n/a: this PR is not deployed.` The release was, Worker **and** Pi, before the production handover, so the pipeline could be exercised there
- [x] Smoke-tested on `test.lannacare.org` — the release's pass is the content of `docs/releases/2026-10-17-0-36-0.md`, which this PR adds
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change.` The nearest equivalent in the release was tested in both directions: waiting → invisible, approved → visible
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block in §2 is copied as printed, including the `test=0` the template's expected line does not mention
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked.` **And this release established that test is locked too**, which the handover previously got wrong; the record and the corrected handover both say so

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read out of Lutan's own log rather than taken from "that is deployed": `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (1f7eacb5)`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — 13 on both Worker builds
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: neither this PR nor the release adds one`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. The release's ordering is recorded: all four files applied before any deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR.` For the release: `0216`, `0218`, `0219` `ok` and **`0217` `FAILED`, correctly**, with the runner's own explanation quoted in the record and the apply then confirming it
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: this PR carries no migration.` For the release the gate **applied** (`0217` writes to live data) and the backup is named, with the honest caveat that it is the same dump `0.35.0` used and predates both of today's releases
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in the record; nothing to apply for this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **for this PR, rollback is `git revert` and costs nothing**: three Markdown files, no running system. Reverting would lose the record and, more importantly, the corrected Pi warning and the swap precondition — a documentation loss that would cost the next release manager real time. **The release's own rollback position is a different question and is stated in full in the record**: code reversible by rebuilding the Pi at `faee19c5`; `0217` has no down-migration though its practical effect on `0.35.0` code is nil; and the admin mail cannot be recalled

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | No defect in **this PR**. It adds and corrects Markdown and the gates are green | — |
| 2 | high | **The release's own defect: the Pi could not build it at all** — four consecutive OOM kills, retries exhausted, and the previous handover's "budget one retry" prescription proved wrong | **Recorded as Defect 1 of `docs/releases/2026-10-17-0-36-0.md`, the handover's headline section rewritten, and the backlog item updated with the outcome** (`bbc7c26d`). Fixed on the live Pi by Lutan adding swap; **writing that into the repo is deliberately left to its own PR** — see §1 out of scope |
| 3 | medium | **The previous handover offered a check that cannot be performed**: it described the locked public site as a production-only blind spot, so "exercise it on test" looked available. Test is gated identically | **Corrected in the handover** with what to do instead (an `anon`-role harness against the enforcing layer, which is better evidence anyway). Recorded in the release record under *What Lutan asked for, and what it actually proved* |
| 4 | high | **The release's second defect, found by Lutan on his phone after every release check had passed: the Pi deploy poisoned Cloudflare's edge cache with a broken stylesheet**, leaving the app unstyled for whoever reached that location, for up to a year because the assets are `immutable` | **Recorded as Defect 2 of the release record** with the full elimination table, given a **new headline section in the handover** (*THE SECOND THING*), added to the next-release checklist, and raised on the `backlog` branch (`ff55fd1a`) with four candidate fixes. Cleared on the day by Lutan purging the cache — **the only lever available, since there is no purge script in the repo and no dashboard access from a session** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the Pi swap fix should be written into `setup.sh` and `pi-hosting.md` before the next release or after. It is a scheduling call: the live Pi works now, but a rebuild would fail and nothing in the repo explains the 6 GB | `docs/backlog.md` → *Next up*, the Pi OOM item |
| 2 | Whether the handover's rewritten Pi section leads with the right thing. It now opens by saying the previous edition was wrong, which is deliberate but is a judgement about what a reader needs first | `docs/release-handover.md`, the section *THE ONE THING THAT WILL BITE YOU* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `n/a: not empty and nobody has looked yet; see the pending signature below.` Both items are judgement calls about scheduling and emphasis; neither blocks this PR and neither is something this session can sign for

Manual verification by: pending: Lutan's view on when the Pi swap fix is written into the repo, and whether the handover's rewritten Pi section leads with the right thing

### Result

- [x] Open defects are either fixed or explicitly accepted above — the release's Pi defect is recorded, backlogged and accepted as not-fixed-here with the reason stated; the handover's wrong offer is corrected
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager; the record and the corrected handover are the handover

Result: pass
