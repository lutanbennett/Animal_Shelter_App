# Feature test plan — release-procedure

## Header

| | |
|---|---|
| Feature | `docs/release-procedure.md`, a written runbook for a release, plus the `0.15.0` entry in `docs/releases/2026-10-02.md` |
| Backlog item | none — asked for directly by Lutan on 2026-10-02, during the `0.15.0` release |
| Branch / worktree | `claude/release-procedure` @ `C:\Development\Animal_Shelter_release-procedure` |
| Dev server | not started — two markdown files, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `fbe50c0` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — write the release procedure down, after `0.15.0` went badly for mechanical reasons; the `0.15.0` release record rides along because both were briefly committed to `main` together
- [x] Files/areas touched listed — `docs/release-procedure.md` (new) and `docs/releases/2026-10-02.md` (a `## 0.15.0` section appended). No code, no migrations, nothing under `src/` or `worker/`
- [x] Roles affected identified — none: internal documentation, never rendered to any signed-in or public role
- [x] Anything explicitly **out of scope** written down — the procedure records what is already true; it changes no script, no gate and no CI job. Two things it *recommends* are not implemented here and are not this PR's: the `EUID` guard on `setup-test.sh` (on the `backlog` branch) and promoting `test-plan` to a required check (Lutan's call, untouched)

### Why this exists, and why it is a PR rather than a direct commit

Both files were committed straight to `main` as `ac9b3b2` on 2026-10-02 and
reverted by `c00de0e` the next day. The excuse was `release-smoke-test.md`'s
"commit it on whatever branch is to hand — it is a record, not a gate", which
covers a release record and does not cover a new standing document. Lutan's
ruling: **there are no exceptions**, the record included. So both return here
unchanged, with this checklist, and the revert stands in history as what
happened rather than being tidied away.

`0.15.0` was the sloppiest release so far. The causes were almost all
procedural, and four of the five were already written down somewhere nobody
read — which is why the procedure's **step 0** is now "read the last release's
record end to end".

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the branch was eight PRs behind; `sync` brought it to `fbe50c0` and pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 139s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation; it is read, not run
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**What was checked instead, because a runbook's failure mode is being wrong
rather than crashing.** Every command the procedure tells someone to run was
either run during `0.15.0` and its output quoted in the record, or checked here:

- [x] `release-prs.mjs`, `gates.mjs`, `check-release-guards.mjs`, `check-test-plan.mjs`, `check-public-views.mjs`, `apply-migrations.mjs --status/--dry-run/--drift` all exist at the paths named, and each was run for real during `0.15.0` or `0.16.0` prep
- [x] The `--drift <env>` form is real and distinct from `--status` — both run, both quoted
- [x] The four `NOPASSWD` commands are quoted from `sudo -n -l` on the Pi, not from memory
- [x] The `530`-only fallback claim matches `worker/origin.mjs` (`NEVER_ARRIVED_STATUSES = new Set([530])`) and `docs/decisions/2026-10-02-origin-write-fallback.md`
- [x] `/api/releases/current` being Worker-answered is stated in `src/lib/releases.ts`'s own header and was observed live: test reported `0.15.0` while its Pi served the `0.14.0` build

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | documentation is not served by the app | n/a |
| management | nothing | same | n/a |
| staff | nothing | same | n/a |
| vet | nothing | same | n/a |
| volunteer | nothing | same | n/a |
| signed out | nothing | same | n/a |

- [ ] Every role above tested — n/a: neither file is reachable from the app; they are repository documentation
- [ ] A role that should not have access is blocked server-side — n/a: no access path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the in-app manual is for shelter users; this is a developer runbook
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none; `build` compiled the whole app unchanged, which is the evidence that two markdown files touched nothing
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: no shared file is touched. `docs/releases/2026-10-02.md` gains a section and is read by people, not by code; `check-test-plan.mjs` deliberately rejects a release record offered as a feature's plan, and that rule is untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — eight PRs merged in during `sync`; gates were run after it, not before

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item; the follow-up it names (`setup-test.sh`'s `EUID` guard) is on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a in form, satisfied in substance: this PR *is* the document, and a decision record pointing at it would duplicate it. The one decision it embeds — that the release record goes through a PR like everything else — is recorded in §1 and in the revert commit
- [x] `README.md` still accurate — unchanged; it does not describe the release sequence
- [ ] **Release notes.** — n/a: no shelter user could notice a repository runbook or a release record
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and docs were measured, not reasoned** — the procedure's factual claims are each tied to output quoted in the `0.15.0` record or to the source named in §4. Where something is *not* known it says so: how long the edge takes to notice a dead connector, and how long test served the wrong build, are both written as unknown rather than estimated

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code, no dates derived at runtime
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: this PR ships no deploy output, and the gates block above is pasted exactly as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR removes a document. Nothing in the app changes, no schema moves, and the release record it restores is a record of events that happened either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The procedure describes `cloudflared` as serving both production and test, which is what the setup implies, but the tunnel's ingress file was never read — SSH was unavailable at the time | accepted: stated as an expectation to watch for during the drill, not as a fact. Worth confirming the first time someone stops the tunnel |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the procedure matches how you actually want a release run — particularly the division of labour, which is written as "your only job is `node scripts/deploy.mjs --env production`" | `docs/release-procedure.md`, "Who does what" |
| 2 | That the `0.15.0` record's account of what went wrong is one you recognise, since it is the part a future reader will weigh | `docs/releases/2026-10-02.md`, `## 0.15.0` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's, both judgements about whether the document describes what he wants rather than whether it is accurate

Manual verification by: pending: Lutan to read the procedure's division of labour and the `0.15.0` account

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-03
