# Feature test plan — `handover-release-line`

## Header

| | |
|---|---|
| Feature | Correct three stale lines in `docs/planner-handover.md`: `0.27.0` was cut while the handover was being written, so it said a release was still due |
| Backlog item | `docs/backlog.md` → none. A correction to a process document merged an hour earlier (#546); not backlog work |
| Branch / worktree | `claude/handover-release-line` @ `C:\Development\Animal_Shelter_handover-release-line` |
| Dev server | `n/a: no runtime surface` |
| PR | this one |
| Tested by / date | Claude (Daily Planner session) / 2026-10-11 |
| Carries a migration? | **no** |
| Tested at SHA | tip of `claude/handover-release-line`, branched from `main` at `4d9e32ea` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three lines in one documentation file. **Lutan asked for this fix directly in chat** after I reported the error
- [x] Files/areas touched listed — `docs/planner-handover.md` only, plus this plan. **No `src/`, no `worker/`, no migrations, no scripts, no skill file**
- [x] Roles affected identified — **none.** No shelter user can reach this file
- [x] Anything explicitly **out of scope** written down — **the other three numbers in the same table were re-verified and left alone because they are still correct**: dev at 185 applied / 0 pending, next free migration `0186`, and 101 open backlog items. **`0.26.0` references elsewhere in the file were deliberately NOT changed** — the one at line ~109 is a historical statement about when the vet-views gate opened, and it is accurate

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branched from `main` at `4d9e32ea`, nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 165s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — `n/a: no migration in this PR`
- [ ] `--status` reviewed — `n/a: no migration in this PR`
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to dev — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly — `n/a: no migration in this PR`
- [ ] Constraints and defaults exercised in a harness — `n/a: no migration in this PR`
- [ ] Down-migration written — `n/a: no migration in this PR`
- [ ] Production apply plan — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: documentation only; there is no path to run`
- [ ] Data persists — `n/a: no data is written`
- [ ] Create / edit / delete exercised — `n/a: no feature surface`
- [ ] Empty state renders sensibly — `n/a: nothing renders`
- [ ] Invalid input rejected — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

**What was verified instead, since the deliverable is three factual statements:** `0.27.0` confirmed as the newest entry in `src/lib/releases.ts`; `unreleased` confirmed **empty**; `main` confirmed at `4d9e32ea` by `git log`; and the three numbers left unchanged re-checked against `apply-migrations.mjs --status`, `ls supabase/migrations/` and an `awk` count of unticked items above `## Completed`. **Every claim in the edited table was re-measured, including the ones that turned out not to need changing.**

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no change | no change |
| management | nothing in this PR | no change | no change |
| staff | n/a — retired by `0173` | n/a | n/a |
| doctor | nothing in this PR | no change | no change |
| volunteer | nothing in this PR | no change | no change |
| signed out | nothing in this PR | no change | no change |

- [ ] Every role above tested — `n/a: nothing in this PR is served to a browser`
- [ ] A role that should not have access is blocked server-side — `n/a: no route, policy or action touched`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: no user-facing behaviour changed`
- [ ] Translatable strings — `n/a: an English-only internal document`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: nothing loads in a browser`
- [ ] Network clean — `n/a: no page to request`

## 6. Regression

- [x] The pages nearest the change still work — the whole file was re-read around both edits. **One real regression was caught and fixed during this work:** the first splice left an orphaned fragment (`carries batches 91–93.`) from the old two-line paragraph, and then removing it left the new paragraph without its preceding blank line. Both corrected; the section now reads correctly as Markdown
- [x] Any shared file touched checked from a second, unrelated page — `docs/planner-handover.md` is read by the next `/plan-day`, and the table and the closing section are the two places it is read from. Both were checked, and `grep` confirms no `d2e30a02` or *"A release cut is due"* remains
- [x] Nothing merged from `main` during `sync` was broken by this branch — branched from current `main`; nothing to merge

## 7. Documentation

- [ ] Backlog item ticked — `n/a: not a backlog item; a correction to a process document`
- [ ] Non-obvious design choices added to `docs/decisions/` — `n/a: no design choice. Correcting three facts needs no decision record, and writing a thin one would dilute the directory`
- [x] `README.md` still accurate — unaffected
- [ ] **Release notes.** `n/a: an internal planning document; no shelter user can reach it and nothing about the app changes`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — every figure in the edited table was re-read from the repo, including the three that were already right. The error being fixed was itself caused by a measurement going stale between writing and merging, which is the failure mode this line exists for

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test — `deferred: production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: production release manager`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date or time logic; the dates in this file are prose`
- [ ] Boundary or banding change — `n/a: no threshold, rounding rule or cutoff is touched`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in §2 is copied verbatim
- [ ] Public pages re-checked after a cache purge — `deferred: production release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `deferred: production release manager`
- [ ] `strip-baked-env` seen in the deploy output — `deferred: production release manager`
- [ ] Any new secret/env var exists in production — `n/a: this PR introduces none`

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — `n/a: no migration in this PR`
- [ ] `--env production --dry-run` clean — `n/a: no migration in this PR`
- [ ] Production backup fresh — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this commit restores the three stale lines and nothing else.** No migration, no deployed artefact, no state outside git. **What it does not cover:** nothing, though a revert would reinstate the wrong release number, so it should be deliberate rather than incidental

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Low (process) | The handover stated the last release as `0.26.0` and said a cut was due. `0.27.0` was cut between the file being written and merged, so the statement was wrong on arrival — and wrong in the direction that would send the next planner looking for work already shipped | **Fixed** — this PR |
| 2 | Low (process, accepted) | The root cause is that the handover records a point-in-time snapshot while other sessions keep working. No edit prevents that recurring | **Accepted** — the file already closes by telling the next writer to re-verify every number against the repo, and the corrected paragraph now says explicitly not to plan a release without checking `unreleased` first. A snapshot that says how to check itself is the available mitigation |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | *(empty)* | |

Nothing needs a person to look at a screen.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-11

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: documentation only — three corrected lines in an internal file, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet cut — this PR carries no deployable change, so it needs no acknowledgement of its own
