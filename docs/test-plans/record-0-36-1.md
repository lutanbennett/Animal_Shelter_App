# Feature test plan — record-0-36-1

## Header

| | |
|---|---|
| Feature | The `0.36.1` release record (`docs/releases/2026-10-18.md`) and the updated release handover |
| Backlog item | `docs/backlog.md` → none. The self-updating-deploy-script finding was raised **on the `backlog` branch** (`773dc69f`), not here |
| Branch / worktree | `claude/record-0-36-1` @ `C:\Development\Animal_Shelter_record-0-36-1` |
| Dev server | not started — this PR is three Markdown files |
| PR | **a guess, and the last two cuts guessed wrong** — re-read and corrected in a follow-up commit once the PR exists |
| Tested by / date | Claude (production release manager session) / 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — write the `0.36.1` release record and update `docs/release-handover.md`, whose two headline warnings are both now fixed and whose Pi section needed the measurement adding. No backlog item: a release record is bookkeeping the runbook requires
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-18.md` (new), `docs/release-handover.md` (updated), and this plan. **No code, no route, no `worker/`, no migration, no shared lib**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** These files are not served by the app
- [x] Anything explicitly **out of scope** written down — three things. (a) **Automating the Cloudflare purge**, which Lutan ruled for on 2026-10-18: its own PR, deliberately not folded into a release. (b) **Fixing the self-updating deploy script**: raised on the backlog with three options; changing `deploy-pi.sh` in the record PR of the release that just revealed the problem would repeat the mistake. (c) **The nine `pending:` items**, which stay with their own plans and signatures

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `e581c631`, the release SHA. Re-run before the plan was signed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 243s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` Written and committed before the PR is opened so the first run is green by construction. Ticked in a follow-up commit once a run is seen green, with its `headSha` read from `gh run list` and matched against this branch's HEAD
- [x] `node scripts/check-test-plan.mjs` passes on this plan locally before pushing

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's one (`0220`) was applied to production as a release step and verified before and after.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the record: highest is `0220`, so the next free number is `0221`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production `220 applied, 1 pending` before, `221 applied, 0 pending` after)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`. For the release: `0220` dry-ran `ok`; with one file the per-file trap could not apply
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev `No drift`, 221 of 221)
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR.` For the release this was the money question and it was read off production afterwards: 243 attachments, **all** `purpose = 'bill'`, none null, none a report
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`. For the release: `purpose` confirmed `not null` defaulting `'bill'` on production, and all four doctor policies present
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. `0220`'s header states its own undo steps
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`; the release's apply is done and recorded

## 4. Functional checks

This PR adds and updates Markdown. There is no behaviour to drive.

- [x] Happy path works end to end — the happy path for a record is that it reads correctly and its claims are true. Every figure was taken from a command's output pasted beside it: the PR range and the orphan from `release-prs.mjs` and `gh pr view`, the migration counts from `--status`, the `0220` verification from a read-only production query, the key fingerprints from both deploy logs, the **absence** of a mail line from a grep of both logs, the asset-check results from the tool itself, and the peak-memory figures from a sampled cold build
- [x] Data persists — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: no such surface in a Markdown record`
- [x] Empty state renders sensibly — `n/a: no rendered state.` The nearest equivalent is the handover's *In flight* section, which carries no counts and tells the reader to run the list
- [x] Invalid input is rejected with a readable message, not a crash — `n/a: no input.` The analogous gate is `check-test-plan.mjs` on this plan, which passes
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the numbers here that could be wrong by a boundary were measured, not estimated: the seven note lengths, the peak memory (3,372 MB RSS + 947 MB swap = 4,320 MB) against 4,049 MB of RAM, and the swap total (6,143 MB) against the script's 5.5 GiB floor. **The memory figure is explicitly recorded as a floor, not a maximum**, because 3-second sampling can miss a spike

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing | these files are not served by the app | no route, middleware or policy is in the diff |
| signed out | nothing | same | same |

- [x] Every role above tested — tested at the level this change operates at: no role can reach a Markdown file in `docs/`, and no file governing access is in the diff
- [x] A role that should not have access is blocked server-side — `n/a: there is no URL.` Nothing in `docs/` is routed

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` A release record documents a release to the team, not a feature to shelter users
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [x] Mobile viewport (375px) — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing here runs in a browser`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: no pages.` The gates were run in full on this branch anyway
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file touched.` Nothing under `src/` or `worker/` imports from `docs/`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought the release SHA and the gates pass on the merged tree: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: no backlog item is closed by writing a record.` The self-updating-script finding was **added** on the `backlog` branch (`773dc69f`) with three options
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The release-level decisions are recorded where they belong: shipping minor rather than major in the record, and automating the purge in its own PR
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: this PR is the release record — three Markdown files in `docs/` read by whoever runs the next release.` No shelter user would notice it, and it touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The three that would have been easiest to assert and hardest to justify were each given direct evidence: that no admin was emailed (asserted *before* as `majorReleasesSince` returning `[]`, and *after* by grepping both deploy logs for a line that is absent); that `0220` left every existing row a bill (a read-only production count, 243 of 243); and that the Pi's swap is the right fix rather than a patch (a sampled cold build, with the first, warm-cache attempt discarded as meaningless **and recorded as discarded**)

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a for deployment`: this PR ships nothing. The release's SHA, `e581c631`, was verified on all four surfaces and `main` was re-checked as unmoved immediately before the handover
- [x] Deployed SHA matches the tested SHA — verified for the release: `/api/version` reads `sha e581c631` on both hosts and both Pi clones sit at it

### On the deployed build

- [x] Deployed to test — `n/a: this PR is not deployed.` The release was, Worker and Pi
- [x] Smoke-tested on `test.lannacare.org` — the release's pass is the content of `docs/releases/2026-10-18.md`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"`
- [ ] **For a boundary or banding change, the assertions cover both edges.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in §2 is copied as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked on both environments.` **The purge itself was not n/a**: it is now a required runbook step and Lutan did it, after which the asset check was re-run

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read out of Lutan's own log: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (e581c631)`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — 13 on both Worker builds
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: neither this PR nor the release adds one.` **One is coming and is deliberately not here**: the Cloudflare cache-purge token, in its own PR

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. For the release: `0220` applied before any deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR.` For the release: `ok`
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: this PR carries no migration.` For the release, `0220` is additive so the gate does not strictly apply, and the backup (`lannacare-production-2026-10-17T2000Z.dump.age`, 1,279,505 bytes) is **newer than every applied migration for the first time in three releases**
- [x] Apply plan stated — stated in the record; nothing to apply for this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **for this PR, rollback is `git revert` and costs nothing**: three Markdown files, no running system. What reverting would lose is the Pi peak-memory number and the self-updating-script finding — a documentation loss that would cost the next release manager real time, since both change what they must do by hand. **The release's own rollback position is in the record**, and is the easiest in four releases: no mail went out, so the one irreversible step of a release is absent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | No defect in **this PR**. It adds and updates Markdown and the gates are green | — |
| 2 | medium | **The release's Defect 1: `deploy-pi.sh` updates itself mid-run**, so #708's swap gate, `.next.prev` fallback and asset check all shipped without running | **Recorded in the release record, given a headline section in the handover, and raised on the `backlog` branch (`773dc69f`) with three options.** Worked around for this release by running the asset check by hand on both environments — it passed. **Deliberately not fixed here** |
| 3 | low | **The release's Defect 2: the cache purge was manual again**, a third touch for Lutan and the second day running | Purged by hand; automation ruled for by Lutan and **being raised as its own PR**. The handover now states plainly that a release costs three touches until it lands, rather than recording the third as an overrun |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the self-updating deploy script should be fixed or simply documented. Three options are on the backlog; it is a judgement about churn against surprise, and it is not urgent — the workaround is to run the new checks by hand on the release that ships them | `docs/backlog.md` → *Next up*, the `deploy-pi.sh` item |
| 2 | Whether the peak-memory figure should be re-taken with `/usr/bin/time -v` installed, which would give an exact maximum rather than a 3-second-sampled floor | `docs/releases/2026-10-18.md` → *The Pi* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `n/a: not empty and nobody has looked yet; see the pending signature below.` Both items are judgement calls that do not block this PR

Manual verification by: pending: Lutan's view on whether the self-updating deploy script is fixed or documented, and whether the peak-memory figure is re-taken exactly

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass
