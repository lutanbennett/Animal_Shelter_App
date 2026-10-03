# Feature test plan — cut-release-0-15-1

## Header

| | |
|---|---|
| Feature | Cut release `0.15.1`, **minor**: move the one `unreleased` note into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header and in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-15-1` @ `C:\Development\Animal_Shelter_cut-release-0-15-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-03 |
| Carries a migration? | no — `0130_assistant_action_refused.sql` ships in this release and was **already applied to production**. See §3 |
| Tested at SHA | `f3c0fa8` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.15.1` entry holding the single note written by #309, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — the one note is tagged `admin, management, staff, volunteer`, as #309 tagged it. **`major: false`, so no admin is mailed** — verified, not assumed, in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) installing `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, which is a **hard prerequisite** for every deploy in this release and is not something this session can do (§8); (c) the release record, written after the deploy; (d) the outstanding manual verification on six of the nine PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-03: minor, `0.15.1`.** Asked before cutting,
as `docs/release-procedure.md` §4 now requires — the question `0.15.0` failed to
ask. Nine PRs merged since `0.15.0` but only one wrote a release note; the other
eight were infrastructure or documentation and each answered the release-notes
line as not user-noticeable.

### What is in the release

`node scripts/release-prs.mjs aa9576a f3c0fa8` — nine PRs, exit 0, ten added
migration/test-plan files all accounted for:

```
Release range aa9576a..HEAD
PRs in this release: 9

- #307  claude/schema-assistant-refused  (e298f59)
- #308  claude/pi-down-alert  (ec95b55)
- #309  claude/medication-label-feature  (1cd1a93)
- #310  claude/pi-failover-paper  (8743055)
- #311  claude/acceptance-matrix  (9278907)
- #312  claude/server-actions-encryption-key  (6a6d9ac)
- #313  claude/pi-failover-paper-key  (c4a8ef1)
- #314  claude/dry-run-staff  (e342c8a)
- #315  claude/release-procedure  (f3c0fa8)

Checked 10 added migration/test-plan file(s) against the list.
```

### Six of the nine PRs carry an unsigned manual-verification line

All nine have complete, internally consistent plans and a signed **Automated
checks by** line. #307 and #313 are `n/a` (nothing to look at). The rest are
`pending`, and they are not all the same kind of thing:

| PR | What is outstanding | Can it be done before the deploy? |
|---|---|---|
| #312 | the key is not in any values file, and the cross-over check needs both deploys | **The key half: no — it is a prerequisite, not a verification.** See §8 |
| #309 | six items — the one genuinely user-visible feature in this release (upload, replace, remove, thumbnails on three surfaces) | Yes, on dev |
| #308 | the real outage drill, and the alert mail wording | Drill: after the deploy |
| #310 | Lutan reading the failover paper and agreeing its recommendation | Yes |
| #311 | the matrix's expected results have not been tried against the running app | That is what the dry run and the shelter's run are for |
| #314 | Lutan reading the staff dry-run report and deciding which findings to raise | Yes |

On `0.15.0` Lutan's ruling was ship and record the gap. That ruling was for that
release; this plan raises them again rather than assuming it carries over, and
**#309's six items are the ones worth his attention** — a release whose only
user-visible change has never been driven in a browser is a different
proposition from one whose outstanding items are all documents and drills.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `f3c0fa8` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 263s

gates: typecheck=0 lint=0 build=0
```

  **This is a re-run.** An earlier run was killed when the session ended, printing nothing conclusive; a partial run is not a pass, so it was run again from scratch rather than its fragment quoted.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.15.1`, read back from the parsed register rather than from the diff
- [x] `unreleased` is empty — emptied by this PR; it held exactly 1 entry and the cut script refused any other count
- [x] **`majorReleasesSince("0.15.0")` returns `[]`** — the call that decides whether admins are mailed. A minor release must return nothing, and this is the check that proves `major: false` took effect rather than being typed
- [x] **The date was read from the local clock** — `2026-10-03`, matching the entry, and a day later than `0.15.0`'s
- [x] The register parses the way `deploy.mjs` loads it — `0.15.1` / `2026-10-03` / `major: false` / 1 note, under Node's type stripping
- [x] Order intact — `0.15.1 > 0.15.0 > 0.14.0`, the register's file order still matching a re-sort by `compareVersions` across all 24 entries
- [x] **The cut was verified against the pre-cut register**, not read over: the note compared against `origin/main:src/lib/releases.ts` — `carried across unchanged: 1 of 1`, `text lost: 0 text invented: 0`, roles `["admin","management","staff","volunteer"]`, 391 characters
- [x] **The note renders clean** — `noteText`: no `[object Object]`, no `undefined`
- [x] `node scripts/check-release-guards.mjs` — 15 cases, all ok, exit 0

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed — `0130_assistant_action_refused.sql` was pending and has since been applied
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — `dry-run 0130_assistant_action_refused.sql … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — by #307, before this release
- [x] File is re-runnable — read rather than assumed; it is the one-file form of an enum add-value, which is why it dry-ran cleanly where the two-file rule would normally apply
- [x] Existing rows still read correctly after the change — an added enum value changes no existing row; #307's own plan exercised it with a rollback harness
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in #307
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR. An unused enum value is harmless to leave
- [x] Production apply plan stated — **already done**: `0130` applied to `dbkodyyxxhtygxcxmfcu` ahead of the deploy, and `--drift production` then reported `No drift: production matches origin/main`, `130 file(s), 130 applied row(s)`, zero in each direction

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR. `/releases` reads the register, and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git; there is no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface; an empty `unreleased` is the normal post-cut state and is not rendered
- [ ] Invalid input is rejected with a readable message — n/a: no input; the guard script covers the malformed-register cases
- [ ] Boundary cases checked — n/a: no input. Version ordering across 24 entries is the nearest thing and is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | the `0.15.1` note, and **no email** | not driven — register parse checked instead |
| management | `/releases` | the note | not driven |
| staff | `/releases` | the note | not driven |
| vet | `/releases` | no `0.15.1` note (not in its roles) | not driven |
| volunteer | `/releases` | the note | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed, and the role tags are data carried across unaltered from #309. The behaviour behind them (`noteRoles`) is #62's, unchanged here
- [ ] A role that should not have access is blocked server-side — n/a: no new access path; `/releases` is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe the register; #309 updated it for the feature
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` route with the new register; both are in the build output
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`. All three go through the exports checked in §2, and the third was exercised directly: the register loaded under type stripping, which is how `deploy.mjs` reads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; the cut procedure is `src/lib/releases.ts`'s header and `docs/release-procedure.md`, both unchanged
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* the entry from `unreleased`. The note was written by #309 and is carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the three that could have been guessed were each run: the note comparison against `origin/main`, `majorReleasesSince("0.15.0")` returning `[]`, and `0130`'s applied state and drift on production

## 8. Pre-production gate

### The prerequisite this release has and previous ones did not

- [ ] **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` exists in all four values files** — deferred: Lutan. #312 makes both deploys **refuse to run** without it, by design. It is absent from `.env.deploy.production` and `.env.local` on the dev machine and from `~/Animal_Shelter_App/.env.deploy.production` and `~/Animal_Shelter_App_test/.env.local` on the Pi — all four checked by presence, never by reading a value. Generating and writing it was attempted by this session and **refused by the auto-mode classifier as a secret-store write**, which is the correct outcome and not something to route around. One key per environment, the same value on both machines, verified by comparing `node scripts/actions-key.mjs --env <env>` fingerprints rather than values

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime; the entry's `date` is a literal, read from the local clock at cut time and checked in §2
- [ ] **Boundary or banding change** — n/a: no boundary, band or threshold in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager. `0.15.0`'s record could not say this because the line had scrolled away; this time it is to be read as it prints
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: the one new value this release needs is a **build-time** variable, not a Worker secret; it is covered by the prerequisite above

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form: no migration in this PR. For the release as a whole the ordering held — `0130` was applied to production **before** any deploy, and the code that reads it (#307's assistant path) ships in the same release
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `dry-run 0130_assistant_action_refused.sql … ok`
- [ ] For a **destructive or rewriting** migration only — n/a: `0130` adds one enum value
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref aa9576a` there; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0130`**, and neither needs to: an added enum value nothing writes is safe to leave. Unlike `0.15.0` there is no mail to un-send, because this release sends none. One thing a rollback *would* undo that is easy to miss: both builds would go back to per-build Server Actions keys, so the cross-over fix would be lost until redeployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found in the cut | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.15.1` title reads well. It is Claude's wording, not carried across from a PR | `src/lib/releases.ts`, the `0.15.1` entry |
| 2 | Whether to ship with #309's six items undriven — the one user-visible change in this release has not been exercised in a browser (§1) | `docs/test-plans/medication-label-feature.md` |

The key prerequisite is **not** listed here: it has its own `deferred:` state in
§8, which is where a thing the deploy performs belongs.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's

Manual verification by: pending: the `0.15.1` title, and whether to ship with #309's six items undriven

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §8
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-03 — all nine plans read in full; the six unsigned lines are raised in §1 rather than absorbed, and the key prerequisite is called out as a prerequisite rather than filed as a verification
