# Feature test plan — release-record-0-15-1

## Header

| | |
|---|---|
| Feature | The `0.15.1` release record: `docs/releases/2026-10-03.md` |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 and `docs/release-smoke-test.md` |
| Branch / worktree | `claude/release-record-0-15-1` @ `C:\Development\Animal_Shelter_release-record-0-15-1` |
| Dev server | not started — one markdown file, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `3fb8816` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one new file recording how `0.15.1` was cut, deployed and verified
- [x] Files/areas touched listed — `docs/releases/2026-10-03.md` (new) and this plan. No code, no migrations, nothing under `src/` or `worker/`
- [x] Roles affected identified — none: repository documentation, never served by the app
- [x] Anything explicitly **out of scope** written down — the record states gaps, it does not close them. #309's six undriven items, the five other unsigned plans and the signed-in smoke test all remain open and are listed as gaps rather than resolved here

**This is a PR rather than a direct commit on Lutan's ruling of 2026-10-03:
there are no exceptions, the release record included.** `release-smoke-test.md`
still says "commit it on whatever branch is to hand"; that line is now wrong and
updating it is a separate change, deliberately not smuggled into this one.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `3fb8816` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 141s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR; `0130`'s state is recorded *in* the file, from runs made during the release
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a record is read, not run
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**What was checked instead, because a record's failure mode is being untrue.**
Every quoted block is unedited output captured during the release, and every
claim was checked against its source rather than recalled:

- [x] The two Worker version IDs, both deploy `no major release … so no email` lines, and the `Server Actions key` lines are copied from the deploy output as printed
- [x] Both Pi logs' closing lines (`lanna-care running`, `lanna-care-test running`, `the build in .next carries that key`) are copied from `~/deploy-prod.log` and `~/deploy-test.log`
- [x] The drift block is the unedited output of `apply-migrations.mjs --drift production`
- [x] The `strip-baked-env` line is the test deploy's own, quoted in full
- [x] The four key fingerprints were read from `actions-key.mjs` on both machines; **no key value was read, by this session or into this file**
- [x] The verification bullets (`0.15.1`, `served-by: pi`, `HIT` twice, no console errors, no Dev badge, clone SHA and `.next` timestamp) were each observed, the cache check in a real browser rather than with curl
- [x] The PR list and count come from `release-prs.mjs`, exit 0
- [x] What the record says it **cannot** say is written as gaps, including the one attempt that failed (grepping the served HTML for the Supabase project ref found nothing, and that is recorded as proving neither way rather than quietly dropped)

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
- [ ] Manual updated — n/a: the in-app manual is for shelter users; this is a release record
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none; `build` compiled the app unchanged, which is the evidence that a new markdown file touched nothing
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: no shared file is touched. The record is a **new** file under `docs/releases/`, so unlike `0.15.0`'s it does not even modify an existing day's record
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; this is a record of events
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: no shelter user could notice a release record
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — §4 is the list, and the record separates what was observed from what is inferred. Two things are explicitly left unknown rather than estimated: whether `cloudflared` fronts both sites, and which Supabase project the production *Worker* bundle carries

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code, no dates derived at runtime. The record's dates are literals describing a day that has happened
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below, and every block in the record itself
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager, next release. Recorded as a gap for `0.15.1`
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager, next release. Seen for test, not for production
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR deletes a record of events that happened anyway. No app change, no schema, nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/release-smoke-test.md` still tells the reader to commit the record "on whatever branch is to hand", which Lutan's no-exceptions ruling has overridden | deferred to backlog: a one-line docs fix, deliberately not folded into this PR so the record is not the vehicle for changing the rule it is subject to |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the account of what went right and wrong is one you recognise — particularly "How the procedure held up, first time out", which is Claude marking its own homework | `docs/releases/2026-10-03.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and it is a judgement about an account of his own release rather than a check Claude could make

Manual verification by: pending: Lutan to read the record, in particular its self-assessment of the new procedure

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-03
