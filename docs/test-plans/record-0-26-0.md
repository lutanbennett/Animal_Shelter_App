# Feature test plan — release record 0.26.0

## Header

| | |
|---|---|
| Feature | The `0.26.0` release record (`docs/releases/2026-10-11.md`) and the rewritten handover for the next release manager |
| Backlog item | `docs/backlog.md` → none. Writing the record is release process, required by `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/record-0-26-0` @ `C:\Development\Animal_Shelter_record-0-26-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` — not started; this PR is documentation only |
| PR | #535 |
| Tested by / date | Claude (production release manager session) / 2026-10-11 |
| Carries a migration? | **no** |
| Tested at SHA | documentation only; the release it records is `c3862e52` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the record of what `0.26.0` actually did, plus the handover rewritten in full as that file requires. No backlog item; `docs/release-procedure.md` §8 requires both
- [x] Files/areas touched listed — two documentation files: `docs/releases/2026-10-11.md` (new) and `docs/release-handover.md` (rewritten). No code, no route, no migration, no script
- [x] Roles affected identified — none. Nothing here is reachable by any role; these files are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down — the two backlog items this release raised went on the `backlog` branch, not here (`93ca3f5b`), as `CLAUDE.md` requires. The fourteen `pending:` test plans are named in the record but not closed by it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The worktree was created from `origin/main` at `c3862e52` after the release merged, so there was nothing to merge
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: this PR changes two Markdown files and no code. The gates were run on the cut at `f0c61dc9` and CI runs all three on this PR regardless
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. Ticked in a follow-up commit once the run is actually green, as the template requires

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR. The release's four are recorded in the record itself
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; this change touches no table
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

The deliverable is prose. What can be checked is whether its **claims are true**,
and that is what was checked — every figure in the record was taken from the
output of the command that produced it, not retyped from memory.

- [x] Happy path works end to end — both files render as Markdown, and every table has a matching header and separator row
- [ ] Data persists — n/a: documentation; nothing is stored
- [ ] Create / edit / delete all exercised — n/a: documentation
- [ ] Empty state renders sensibly — n/a: documentation
- [ ] Invalid input is rejected with a readable message — n/a: documentation
- [x] Boundary cases checked — the claims most likely to be wrong were each re-derived rather than remembered: the release SHA (`c3862e52`, read from `gh pr view` and from both `/api/version` endpoints), the window (`1m38s`, from `apply end 07:16:38Z` and systemd's `ActiveEnterTimestamp` of `14:18:16 +07`), the PR count (fourteen, after adding squash-merged #530 by hand), the migration count and timing (four, 17 seconds), both Worker version IDs and both Server Actions keys (from the two deploy logs)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a — documentation, not a page | n/a |
| management | n/a | n/a | n/a |
| staff | n/a | n/a — role retired by `0173` | n/a |
| doctor | n/a | n/a | n/a |
| volunteer | n/a | n/a | n/a |
| signed out | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: nothing in this PR is reachable by any role
- [ ] A role that should not have access is blocked server-side — n/a: no surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; documentation adds no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The release record is for whoever runs releases, not for shelter users, and has no manual topic
- [ ] Translatable strings go through the translation path — n/a: internal English documentation, deliberately not translated
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none exist; `docs/` is not served by the app. Confirmed that neither file is imported or read by any code: both are referenced only in prose by `CLAUDE.md`, `docs/release-procedure.md` and each other
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is the one file here that something else depends on, and the dependency is a human instruction: `CLAUDE.md` and the runbook tell the next release manager to read it. Checked by reading it back in the order that reader meets it — runbook, record, handover — and confirming the handover does not contradict either and says so explicitly where it defers to them
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was created at `c3862e52`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. The two items the release *raised* went on the `backlog` branch (`93ca3f5b`), which is where follow-ups belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a as a new decision file, and deliberately so: the two calls made in this release (the outage window, and the order to apply the migrations in) were Lutan's, were made in chat, and are recorded in full in the release record, which is where release-time decisions have always lived. No new standing rule was created that a decision file would hold
- [x] `README.md` still accurate — checked; it points at `docs/release-procedure.md` for the process and names no version or SHA
- [ ] **Release notes.** — n/a: no shelter user can notice a change to a release record or a handover file. This PR touches only `docs/`, and `unreleased` is deliberately empty immediately after a cut
- [x] Commit messages say why, not just what — the record commit says what the release did and which of its findings are new; it names the failure (an apply plan offered without checking it could be run) rather than describing the release as smooth
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the whole substance of the PR and it was taken seriously. Every figure is quoted from the tool that produced it; the one previously-bracketed figure, the Pi window, was replaced with a measured one from systemd, and the record says so and tells the next person how. Where something could *not* be measured — the production Worker deploy's duration — it is labelled as a bracket with both ends named, rather than given as a number

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: documentation only; this PR ships no build and is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: documentation only

### On the deployed build

- [ ] Deployed to test — n/a: documentation only; no deploy follows this PR
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documentation only
- [ ] Timezone-sensitive behaviour proved — n/a: no logic. The timestamps in the record are historical facts, quoted with their zone (`Z` or `+07`) so they cannot be misread
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — and in the record too: the dry-run error, both deploy logs, the drift output, the edge-cache readings and the mail subject are quoted verbatim, including the `HINT` line and the `E_RECIPIENT_NOT_ALLOWED` skip
- [ ] Public pages re-checked after a cache purge — n/a: documentation only

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR is not deployed, so it has no deploy output of its own. The line was read for the release and is quoted in the record: `dbkodyyxxhtygxcxmfcu (c3862e52)`
- [ ] `strip-baked-env` seen in the deploy output — n/a: this PR is not deployed. Read for the release and quoted in the record (11 env vars)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: neither. The release's migration ordering, which was the substance of `0.26.0`, is recorded in `docs/releases/2026-10-11.md` and in `docs/test-plans/cut-release-0-26-0.md` §8
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a destructive or rewriting migration: a production backup exists and is fresh — n/a: no migration in this PR. That gap, which is real and was accepted at the release, is recorded as Defect 4 and is now a backlog item
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes a record and restores a handover describing a release that is no longer live, which would be strictly worse than keeping it. There is nothing to roll back operationally: no build, no schema, no deployed artifact. The release it describes is already live and its own rollback position is in the record

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The record cannot say anything about the app behind a sign-in, and this was the release that most needed it — `0.26.0` changed who may do what across six roles | accepted and stated plainly in the record under "What this record cannot say". Carried to the handover as the **most valuable** outstanding check |
| 2 | low | The production Worker deploy's duration is a bracket, not a measurement — the handover time is known and the mail delivery time is known, but not when Lutan pressed Run | accepted; written as a bracket with both ends named rather than given as a figure. Lesson 2 of the record fixes the equivalent problem for the Pi, which was measurable and had been guessed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The record read against what you remember of the release** — particularly the account of the apply plan that could not be executed, which is this session's own failure and so the part it is least able to describe fairly | `docs/releases/2026-10-11.md` |
| 2 | **The handover read cold**, by whoever runs `0.27.0`. That is the only real test of it, and this session cannot do it by definition — it has the context the file exists to replace | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the two rows above are Lutan's and the next release manager's

Manual verification by: pending: the two rows above — the record read against the release as Lutan remembers it, and the handover read cold by whoever runs 0.27.0

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-11
