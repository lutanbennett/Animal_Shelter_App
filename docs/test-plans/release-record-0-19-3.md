# Feature test plan — release-record-0-19-3

## Header

| | |
|---|---|
| Feature | The `0.19.3` release record: `docs/releases/2026-10-06.md` |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/release-record-0-19-3` @ `C:\Development\Animal_Shelter_release-record-0-19-3` |
| Dev server | not started — one markdown file, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | `dca26d00` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one new file recording how `0.19.3` was cut, deployed and verified
- [x] Files/areas touched listed — `docs/releases/2026-10-06.md` (new) and this plan. No code, no migrations
- [x] Roles affected identified — none: repository documentation
- [x] Anything explicitly **out of scope** written down — the record states gaps rather than closing them: thirteen unsigned plans, the unverified behaviour-preservation of the finished permission conversion, whether `npm audit fix` resolves cleanly, and the signed-in smoke test

### What this record had to get right

Three things in this release were easy to state loosely and are stated exactly
instead:

- **The audit check, and a wrong conclusion drawn from it.** The red `audit` job on a `success` run was spotted correctly; the reading that followed — that the reporting was suppressed and should be changed — was wrong, and a `/plan-day` session corrected it the same evening. `docs/decisions/2026-10-02-scheduled-audit-fails-on-purpose.md` settles the design and says "Do not 'tidy' the two to match", and the scheduled backstop **did** fail (run `37470137258`, 13:21Z, after four green days). The record carries the correction rather than the original claim
- **Two SHAs across four artifacts.** A backlog merge landed mid-deploy, so the Worker built from `dca26d00` while both Pis serve `082bf60b`. The record carries both in its header rather than presenting one as all four
- **A correction to the CI-reading rule** adopted after `0.19.2`. "Judge on the run's conclusion" is what let a failing job through here; the honest rule is both the run's conclusion and the per-check conclusions

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `dca26d00` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 60s

gates: typecheck=0 lint=0 build=0
```

  **The first run of this branch FAILED**, and the failure is the reason this plan exists in its current shape:

```
gates: FAILED — lint
gates: typecheck=0 lint=1 build=0
```

  Two things about that are worth keeping. It ran past the foreground timeout and was backgrounded, and **the background task then reported "exit code 0"** — because the command was piped through `tail`, so the shell's status was `tail`'s. The template's warning is exactly this: tick a gate on its own exit code, not on something that looks plausible. The `gates:` line was read instead, and it said `lint=1`.

  And the failure was **real and mine**: `check-backlog-sections` caught an open backlog item appended below `## Completed`, where "nothing will ever read it" — the audit item written earlier in this release. It had already been moved on the `backlog` branch by someone else; `main` had merged the backlog before that fix, so every main-derived branch failed lint until the backlog was folded in again. Resolved by doing the documented daily merge, not by editing `docs/backlog.md` on this branch.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything
- [x] **CI will be judged on the run's conclusion *and* the per-check conclusions** — the rule this release corrected. `gh run view --json` for the run, `gh pr checks` for the jobs, knowing `audit` is `continue-on-error` and will show red

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR; `0147`–`0150` are recorded *in* the file from runs made during the release
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

- [x] Every quoted block is unedited output — the test deploy, the teed production deploy, all three Pi logs, the dry-runs, the drift checks and the `audit` failure
- [x] **The advisory was read from the job log**, not from a summary: package, version range, severity and the GHSA link
- [x] **Its dependency path was resolved locally** — `npm ls source-map-js --omit=dev` gives `next@16.3.5 → postcss@8.5.23 → source-map-js@1.2.1`, and the same command surfaced the `next@16.3.5 invalid: "16.3.8"` mismatch the record mentions
- [x] **"Not new" was established, not assumed** — the `audit` job's conclusion read back across every `pull_request` CI run of 2026-10-06; all failed, back to 11:48. The `skipped` results on push runs were explained by the job's `if:` condition rather than ignored
- [x] **The two-SHA situation was diffed** — `git diff --stat 082bf60b..dca26d00` is `docs/backlog.md | 11 +++--`, one file, no code
- [x] **The pinned test rebuild was verified afterwards** — both clones report `082bf60b`, and `/api/version` on production and test return byte-identical objects
- [x] The verification bullets were each observed: `HIT` twice in a real browser, no console errors, no Dev badge, three services active
- [x] **No release mail was expected or looked for** — a minor; both deploys printed their own `no major release …, so no email`

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

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item. The audit finding was logged on the `backlog` branch during the release, as Lutan chose
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: a record of events
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: no shelter user could notice a release record
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — §4 is the list. Three things are left explicitly unknown: whether the finished permission conversion preserves behaviour, whether `npm audit fix` resolves cleanly, and how far before 11:48 the audit failure actually began

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime dates in this PR
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block, and every block in the record
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [x] `deploy: production → Supabase project <ref>` line read — **yes**, fourth release running: `dbkodyyxxhtygxcxmfcu (dca26d00)`, and the record explains why that SHA is not the release SHA
- [x] `strip-baked-env` seen in the deploy output — `removed 11 env var(s)`
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this release adds none
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR deletes a record of events that happened anyway

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **A CI change was recommended without checking `docs/decisions/` first.** The backlog item claimed the `audit` job's `continue-on-error` was a suppressed signal and should be changed; the design is deliberate, documented, and says not to tidy it | fixed: the item was corrected by a `/plan-day` session the same evening and the record carries the correction. The advisory itself remains open as an ordinary dependency bump |
| 2 | low | `gh run view --json`'s run conclusion is not sufficient to judge CI, which is the rule adopted after `0.19.2` | fixed here as a practice, and recorded in the release record: read the run's conclusion **and** the per-check conclusions |
| 3 | low | A `main` that moves mid-deploy can leave the Worker and the Pi on different SHAs | accepted and documented. The Pi was pinned back to the release SHA; the Worker was not, for reasons the record states |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the account matches what you saw, particularly the audit section and the two-SHA explanation | `docs/releases/2026-10-06.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, a judgement about an account of his own release

Manual verification by: pending: Lutan on the `0.19.3` account

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-06
