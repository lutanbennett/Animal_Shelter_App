# Feature test plan — release-record-0-19-0

## Header

| | |
|---|---|
| Feature | The `0.19.0` release record, appended to `docs/releases/2026-10-04.md` beside `0.17.0` and `0.18.0` |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/release-record-0-19-0` @ `C:\Development\Animal_Shelter_release-record-0-19-0` |
| Dev server | not started — one markdown file, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-05 |
| Carries a migration? | no |
| Tested at SHA | `f93a7fe5` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — a `## 0.19.0` section recording how the third release of 2026-10-04 was cut, deployed and verified
- [x] Files/areas touched listed — `docs/releases/2026-10-04.md` and this plan. No code, no migrations
- [x] Roles affected identified — none: repository documentation
- [x] Anything explicitly **out of scope** written down — the record states gaps rather than closing them: nine unsigned plans, what the three new roles actually see, the signed-in smoke test, and note 4's clock-dependent round windows

### Why it is in the 2026-10-04 file when it was deployed on the 5th

The register entry is dated `2026-10-04` and that is what the app reports, so the
record sits with its two siblings from that day. The production Worker deploy
ran at **05:26 on 2026-10-05** — `22:26Z` on the 4th — and the record says so in
its header and in a section of its own rather than letting the filename imply
otherwise.

This is the same UTC/Thailand asymmetry `docs/release-smoke-test.md` warns about
for the app's own "today", landing on the record instead of the code. Worth
noting generally: a register entry's `date` is the **cut** date and need not be
the deploy date.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `f93a7fe5` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 270s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own, and its exit code read** — stated because the previous PR in this sequence committed a failing plan after piping the checker through `head`, which swallowed the result. It exits 0 here, read directly

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR; `0142` and `0143` are recorded *in* the file from runs made during the release
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a record is read, not run
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**What was checked instead:**

- [x] Every quoted block is unedited output from the release — the test deploy, the teed production deploy, both Pi logs and the drift checks
- [x] **The deploy time was established three ways that agree** — the teed log's file timestamp (`Oct 5 05:26`), the release mail's own timestamp (`2026-10-04T22:26:20Z`, which is 05:26 at UTC+7), and the register entry's separate cut date. The record states which is which rather than presenting one as all three
- [x] **The release mail was confirmed in the inbox**, not taken from `sent 1`
- [x] The verification bullets were each observed: `/api/version` sha against `main`'s HEAD, `HIT` twice in a real browser, no console errors, no Dev badge, both clones and three services
- [x] **The account of the discarded validator is first-hand** — it happened in this sequence, the checker's real output is what caught it, and the fix is `751fc5f5`
- [x] **The cut-script tally discrepancy was read from the two numbers in the same output**, not recalled from the previous release

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | documentation is not served by the app | n/a |
| management | nothing | same | n/a |
| staff | nothing | same | n/a |
| vet | nothing | same | n/a |
| volunteer | nothing | same | n/a |
| signed out | nothing | same | n/a |

- [ ] Every role above tested — n/a: the file is not reachable from the app
- [ ] A role that should not have access is blocked server-side — n/a: no access path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the in-app manual is for shelter users
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none; `build` compiled the app unchanged
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: `docs/releases/2026-10-04.md` gains a section and is read by people, not by code. `check-test-plan.mjs` still rejects a release record offered as a feature's gate, and that rule is untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: a record of events
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: no shelter user could notice a release record
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — §4 is the list. Four things are left explicitly unknown: what the three new roles actually see, whether note 4's round windows behave at their edges, the signed-in smoke test, and whether anyone has looked at the medication list during the hour this was deployed

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime dates in this PR. The record's own date handling is covered in §1, and note 4's clock-dependence belongs to `medical-round-screens`
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block, and every block in the record
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [x] `deploy: production → Supabase project <ref>` line read — **yes**, second release running: `dbkodyyxxhtygxcxmfcu (f93a7fe5)`, from the teed log
- [x] `strip-baked-env` seen in the deploy output — `removed 11 env var(s)`, same log
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this release adds none
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR deletes a record of events that happened anyway

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A release's record file is named for the cut date, which can differ from the deploy date when a deploy crosses midnight | accepted and documented in the record itself. Renaming by deploy date would split same-day releases across files, which is worse |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the account matches what you saw, particularly the midnight-boundary section | `docs/releases/2026-10-04.md`, `## 0.19.0` |
| 2 | **The medication list's round choice at an edge hour.** Note 4 starts on the round "that suits the time of day", this deploy ran at 05:26, and nobody looked. It sits inside the 00:00–07:00 window the smoke test singles out | `medical-round-screens`' own plan owns this; flagged here because the deploy hour made it concrete |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's

Manual verification by: pending: Lutan on the account, and the medication list's round choice at an edge hour

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-05
