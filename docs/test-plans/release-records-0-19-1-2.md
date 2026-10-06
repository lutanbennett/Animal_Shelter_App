# Feature test plan — release-records-0-19-1-2

## Header

| | |
|---|---|
| Feature | `docs/releases/2026-10-05.md`: the records for `0.19.1` and `0.19.2`, both cut that day |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/release-records-0-19-1-2` @ `C:\Development\Animal_Shelter_release-records-0-19-1-2` |
| Dev server | not started — one markdown file, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | `843569b2` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one new file recording how `0.19.1` and `0.19.2` were cut, deployed and verified
- [x] Files/areas touched listed — `docs/releases/2026-10-05.md` (new) and this plan. No code, no migrations
- [x] Roles affected identified — none: repository documentation
- [x] Anything explicitly **out of scope** written down — the records state gaps rather than closing them: fourteen unsigned plans across the two releases, the signed-in smoke test, the public site after cache expiry, and why CI did not fire on #381

### Both in one file, and `0.19.1`'s is a day late

Both were cut on 2026-10-05, so they share that file. They were written together
on the 6th, after `0.19.2` shipped, which makes `0.19.1`'s record a day late —
better than `0.17.0`, whose record was missed entirely until the next release was
being cut, worse than `0.18.0`'s, which was contemporaneous. The opening of the
file says so.

**The lateness cost nothing this time**, and the record says why: both production
deploys were teed to a log, so the project ref, version IDs and mail lines were
read from disk rather than reconstructed. That is the difference between this and
`0.17.0`, whose production output no longer exists anywhere.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `843569b2` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 246s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything
- [x] **CI will be checked by reading the run's conclusion, not the PR's mergeable status** — stated because `0.19.2`'s cut PR showed `MERGEABLE` / `CLEAN` while **no workflow had run at all**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR. `0144` and `0145` are recorded *in* the file from runs made during `0.19.1`
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

**What was checked instead, because a record's failure mode is being untrue:**

- [x] Every quoted block is unedited output — both test deploys, both teed production deploys, the Pi logs, the refused-deploy message and the `no checks reported` line
- [x] **The refused `0.19.1` deploy was diagnosed from `git status`**, and the three blocking files named with their sizes and timestamps
- [x] **The Excel lock was probed, not inferred** — a `System.IO.File.Open` with no sharing, plus `Get-Process EXCEL`. The big workbook was genuinely held and had been modified twenty minutes earlier; only the unlocked file was moved. The record says this is why the other two waited
- [x] **The CI non-event was ruled out as a conflict before being called unexplained** — branch pushed, `headRefOid` equal to local HEAD, `MERGEABLE`/`CLEAN`, and Actions healthy (#380's run twenty minutes earlier). The record states what was excluded and leaves the cause open rather than inventing one
- [x] **`0.19.2`'s "no migrations" was read from `--status`** (`146 applied, 0 pending`), not inferred from the absence of schema PRs
- [x] **The deploy time that crossed midnight is fixed by the teed log's file timestamp** (`Oct 6 05:40`), stated as what it is
- [x] The verification bullets were each observed: `/api/version` sha against `main`'s HEAD, `HIT` twice in a real browser, no console errors, no Dev badge, both clones and three services
- [x] **No release mail was expected or looked for** — both are minors, and each deploy printed its own `no major release …, so no email` line, which is quoted

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
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: a new file under `docs/releases/`, read by people and by no code. `check-test-plan.mjs` still rejects a release record offered as a feature's gate, and that rule is untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item. The `.xlsx` gitignore follow-up the record names has still not been raised, deliberately, since it is Lutan's to want
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: a record of events
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: no shelter user could notice a release record
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — §4 is the list. Two things are left explicitly unknown: why CI produced no run for #381, and whether the public site's phone-width work survives a cache expiry

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime dates in this PR. The midnight crossing is a fact about the deploy and is recorded in §1 of the `0.19.2` section
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block, and every block in the record
- [ ] Public pages re-checked after a cache purge — deferred: release manager. Carried into the record as an open item
- [x] `deploy: production → Supabase project <ref>` line read — **yes, for both releases**, from their teed logs: `dbkodyyxxhtygxcxmfcu (e4aa06c9)` and `(843569b2)`
- [x] `strip-baked-env` seen in the deploy output — `removed 11 env var(s)` in both
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: neither release adds one
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR deletes a record of events that happened anyway

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `mergeStateStatus: CLEAN` reads identically whether every check passed or **no check exists**. `0.19.2`'s cut PR showed `CLEAN` with no workflow run at all | accepted and recorded. The habit that survives it is reading the run's own conclusion via `gh run view --json`, which this plan ticks in §2 |
| 2 | low | Review spreadsheets dropped in the repo root block a production deploy, as happened to `0.19.1` | not fixed. A small PR ignoring root-level `.xlsx` and `~$` files was offered to Lutan and deliberately not raised without him |
| 3 | low | A release's record file is named for the cut date, which differs from the deploy date when a deploy crosses midnight — twice now | accepted, as in `0.19.0`'s record. Splitting same-day releases across files would be worse |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That both accounts match what you saw — particularly the refused deploy, since you were the one who closed Excel | `docs/releases/2026-10-05.md` |
| 2 | Whether you want the `.xlsx` / `~$` gitignore PR raised, so the next export dropped in the repo root does not block a release | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's; one is a judgement about an account of his own releases and the other is a decision

Manual verification by: pending: Lutan on both accounts, and on whether to raise the gitignore PR

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-06
