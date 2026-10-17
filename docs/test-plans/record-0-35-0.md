# Feature test plan — record-0-35-0

## Header

| | |
|---|---|
| Feature | The `0.35.0` release record (`docs/releases/2026-10-17.md`) and the rewritten release handover for whoever runs the next one |
| Backlog item | `docs/backlog.md` → none. The Pi OOM fault this record documents was raised **on the `backlog` branch** (`b8a0cb29`), not here, because a follow-up noticed during work belongs there rather than in a PR |
| Branch / worktree | `claude/record-0-35-0` @ `C:\Development\Animal_Shelter_record-0-35-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not started — this PR is three Markdown files) |
| PR | #693 |
| Tested by / date | Claude (production release manager session) / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — write the `0.35.0` release record and rewrite `docs/release-handover.md` for the next release manager. There is no backlog item: a release record is bookkeeping the runbook requires, not a backlog feature
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-17.md` (new), `docs/release-handover.md` (rewritten), and this plan. **No code, no route, no `worker/`, no migration, no shared lib.** Nothing in this PR can change what the app does
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** These files are not served by the app; they are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — two things. (a) **The fix for the Pi out-of-memory fault.** It is documented here and raised on the backlog branch, and deliberately **not attempted**: changing how production builds in order to work around a fault found in that release is how a small problem becomes a shipped one. It needs its own PR with its own test plan. (b) **`docs/release-procedure.md` is not edited.** Its "Do not idle" advice still conflicts with the build order, and the decision file remains the newer and more specific of the two; a runbook edit does not belong in a record PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `faee19c5`, bringing the cut. Re-run before the plan was signed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 100s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` This plan is written and committed **before** the PR is opened, so `test-plan` has a complete checklist to validate on the first push rather than failing by construction. Ticked in a follow-up commit once a run is seen green, with its `headSha` read from `gh run list` and matched against this branch's HEAD
- [x] `node scripts/check-test-plan.mjs` passes on this plan locally before pushing

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's three (`0213`, `0214`, `0215`) were applied to production as a release step and are recorded in `docs/releases/2026-10-17.md`; their own test plans carry their schema checks.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the record: `origin/main` tops out at `0216`, so the next free number is `0217`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production read as a release step: `216 applied, 0 pending` after)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev reports `No drift`, 216 of 216)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. `0213`'s absent down-migration is stated as a one-way step in the record's *Rollback position*
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`; the release's apply is already done and recorded

## 4. Functional checks

This PR adds and rewrites Markdown. There is no behaviour to drive.

- [x] Happy path works end to end — the happy path for a record is that it reads correctly and its claims are true. Every figure in it was taken from a command's output pasted in the same section, not recalled: the PR range from `release-prs.mjs`, the migration counts from `--status`, the drift lines from the named `--drift` checks, the key fingerprints from the two deploy logs, the mail's arrival from the inbox, and the `0213` before/after reads from dev and production respectively
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: no such surface in a Markdown record`
- [x] Empty state renders sensibly (no rows yet) — `n/a: no rendered state.` The nearest equivalent is the handover's *In flight* section, which deliberately carries **no** worktree or PR counts and tells the reader to run the list instead, because a copied count is a quotation and not a fact
- [x] Invalid input is rejected with a readable message, not a crash — `n/a: no input.` The analogous gate is `check-test-plan.mjs`, which validates this plan's own content and passes
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the one number in this PR that could be wrong by a boundary is the note length asserted in the **cut's** plan, which said 592 characters as an estimate; it was measured at **600** and corrected before that commit. Recorded in the handover as a worked example rather than quietly fixed

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
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings in this PR`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles`
- [x] Browser console clean — no errors or React warnings — `n/a: nothing in this diff runs in a browser`
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `n/a: no pages.` The gates were nonetheless run in full on this branch, so the tree this PR creates is proven to typecheck, lint, test and build
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `n/a: no shared file touched.` The two files changed are read by people, not imported by code — confirmed rather than assumed: nothing under `src/` or `worker/` imports from `docs/`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought `faee19c5` (the cut) and the gates pass on the merged tree: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: no backlog item is closed by writing a record.` The Pi OOM fault was **added** to the backlog on the `backlog` branch (`b8a0cb29`), which is where a follow-up belongs, and the vet calendar item was annotated there as half-closed by Lutan's answer
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here`, and deliberately so. The one decision this release raises — how to stop the Pi running out of memory — is **explicitly not taken** in this PR, because taking it mid-release is the thing the record argues against. It belongs in the PR that fixes it, with its own decision file
- [x] `README.md` still accurate — unchanged; it carries no version number a release would stale
- [ ] **Release notes.** `n/a: this PR is the release record — three Markdown files in `docs/`, read by whoever runs the next release.` No shelter user would notice it, and it touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`. The five notes a user *will* notice went out in the cut (#692) and are quoted in the record
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the line this PR most has to earn, since a record is nothing but claims. Each one is pasted from the tool that produced it. The two that would have been easiest to assert and hardest to justify were both given direct evidence instead: that `0213` left production in dev's shape (read off both databases, before and after, and pasted), and that the release mail arrived (found in the inbox with its timestamp and subject, rather than inferred from `sent 1`)

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a for deployment`: this PR ships nothing. The **release's** SHA, `faee19c5`, is recorded in the record and was verified on all four surfaces
- [x] Deployed SHA matches the tested SHA — verified for the release itself: `/api/version` reads `sha faee19c5` on both hosts, and both Pi clones sit at `faee19c5`. This PR is not deployed at all

### On the deployed build

- [x] Deployed to test — `n/a: this PR is not deployed.` The release was, and both test surfaces report `0.35.0`
- [x] Smoke-tested on `test.lannacare.org` — the release's pass is the content of `docs/releases/2026-10-17.md`, which is what this PR adds
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The record's date is a literal string
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block in §2 is copied as printed, including the `test=0` the template's expected line does not mention
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked`, so an anonymous request gets the staff-testing gate and there is no cached public page to re-check. The record states this as a blind spot rather than ticking round it

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read out of Lutan's own log rather than taken on his word: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (faee19c5)`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — 13 on both Worker builds
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither did the release. The vet calendar env question that stood open for two releases is now answered rather than carried: configured on test only, dormant on production (Lutan, 2026-10-17)

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — it contains neither. The release's ordering is recorded: all three files applied **before** either Worker deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR.` Run as a release step: all three `ok`, exit 0, trap did not apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: this PR carries no migration.` For the release, the gate **applied** (`0213` rewrites two live column types) and the backup is named in the record: `lannacare-production-2026-10-16T2000Z.dump.age`, 1,215,818 bytes, 20:00Z on 2026-10-16
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in the record for the release; nothing to apply for this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **for this PR, rollback is `git revert` and costs nothing**: it changes three Markdown files and no running system. Reverting it would lose the record of the release and the handover's new Pi warning, which is a documentation loss rather than an operational one. **The release's own rollback position is a different question and is stated in full in the record**: code is reversible by rebuilding the Pi at `598c2e56`; `0213`'s column retyping has no down-migration; and the admin mail cannot be recalled

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | No defect in **this PR**. It adds three Markdown files and the gates are green | — |
| 2 | high | **The release itself had one: both Pi builds were OOM-killed at the TypeScript stage and each needed a retry**, leaving production serving `0.34.0` from the Pi while the Worker served `0.35.0` and the announcement mail had already gone out | **Recorded in full as Defect 1 of `docs/releases/2026-10-17.md`, headlined in the rewritten handover, and deferred to the backlog** (`b8a0cb29`) with three candidate fixes. **Deliberately not fixed here** — see §1 out of scope |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the handover's new top section is the right thing to put first. It displaces nothing, but it is a judgement about what the next release manager most needs to read before deploying. **Nothing in this PR blocks on it** — the fault is documented either way, and the backlog item stands on its own | `docs/release-handover.md`, the section *THE ONE THING THAT WILL BITE YOU* |
| 2 | Whether the Pi fault should be fixed before the next release rather than after. It is a scheduling call, not a verification: the release manager can work around it with retries, but the workaround depends on them reading the warning | `docs/backlog.md` → *Deployment (before go-live)*, first item |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `n/a: not empty and nobody has looked yet; see the pending signature below.` Both items are judgement calls about what the next release manager should read and when the fault should be fixed; neither blocks this PR, and neither is something this session can sign for

Manual verification by: pending: Lutan's view on where the Pi warning belongs in the handover, and whether the Pi memory fix should land before the next release or after

### Result

- [x] Open defects are either fixed or explicitly accepted above — the release's Pi fault is recorded, backlogged and accepted as not-fixed-here with the reason stated
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager; `docs/releases/2026-10-17.md` and the rewritten `docs/release-handover.md` are the handover

Result: pass
