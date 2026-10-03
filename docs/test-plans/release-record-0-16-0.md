# Feature test plan — release-record-0-16-0

## Header

| | |
|---|---|
| Feature | The `0.16.0` release record, and the procedure change it produced: use `/api/version`, and `tee` the production deploy |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/release-record-0-16-0` @ `C:\Development\Animal_Shelter_release-record-0-16-0` |
| Dev server | not started — two markdown files, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `4a626930` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — a `## 0.16.0` section appended to `docs/releases/2026-10-03.md`, plus three corrections to `docs/release-procedure.md` that this release earned
- [x] Files/areas touched listed — `docs/releases/2026-10-03.md` and `docs/release-procedure.md`. No code, no migrations
- [x] Roles affected identified — none: repository documentation, never served by the app
- [x] Anything explicitly **out of scope** written down — the record states gaps rather than closing them: #322's and #320's unsigned verification, the signed-in smoke test, and whether the three OpenNext `Failed to copy` errors are new all stay open

### Why the procedure changes ride with the record

Keeping them apart would mean two PRs over the same two paragraphs, and the
reason for each change is the release the record describes. The three:

1. **`/api/version`, not `/api/releases/current`.** The trap the procedure named
   had a remedy that already existed — PR #290, shipped in `0.14.0`. Both
   `0.15.0` and `0.15.1` were verified with the Worker-answered endpoint anyway,
   and so was the first draft of the procedure. It now says which to ask, why,
   and shows both answering differently on the same host.
2. **`tee` the production deploy.** The `deploy: production → Supabase project …`
   line prints before a three-minute build and has scrolled out of the buffer on
   three consecutive releases.
3. The verify section's commands updated to match (1).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `4a626930` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 203s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR; `0131` and `0132` are recorded *in* the file from runs made during the release
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation is read, not run
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**What was checked instead.** A record's failure mode is being untrue, and a
procedure's is telling someone to do the wrong thing:

- [x] Every quoted block is unedited output captured during the release — both deploys, both Pi logs, the drift check, `strip-baked-env`, the mail lines and the cut comparison
- [x] **The `/api/version` claim was verified on the live host, both ways**: `/api/version` returns `x-lanna-served-by: pi` with version *and* sha; `/api/releases/current` returns `x-lanna-served-by: worker`. The sha matches `main`'s HEAD exactly, and test returns the identical object
- [x] **The attribution of `/api/version` to PR #290 and `0.14.0` was checked in git**, not assumed from the route's existence: `git log --diff-filter=A -- src/app/api/version/*` → `7b4c1d6e`, reached by the `#290` merge. `worker/index.mjs` carries a comment saying it must stay app-answered, which is the design intent in the repo rather than an inference
- [x] **The three `Failed to copy` errors were investigated before being called harmless** — `age-encryption` is imported only by `scripts/lib/backup-crypto.mjs` and `scripts/check-backup-encryption.mjs`, nothing under `worker/` or `src/`. What was *not* established — whether the errors are new — is written as unknown
- [x] The mail was confirmed **in the inbox**, not from `sent 1`
- [x] The PR list and count come from `release-prs.mjs`, exit 0
- [x] The production project ref, which could not be read from the scrollback, is settled in the record by the one resolver both tools share, and labelled as indirect

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | documentation is not served by the app | n/a |
| management | nothing | same | n/a |
| staff | nothing | same | n/a |
| vet | nothing | same | n/a |
| volunteer | nothing | same | n/a |
| signed out | nothing | same | n/a |

- [ ] Every role above tested — n/a: neither file is reachable from the app
- [ ] A role that should not have access is blocked server-side — n/a: no access path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the in-app manual is for shelter users; these are developer documents
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none; `build` compiled the app unchanged
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: no shared file. `docs/release-procedure.md` is read by people and by no code; `check-test-plan.mjs` still rejects a release record offered as a feature's gate, and that rule is untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; a record of events and three corrections to a runbook
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: no shelter user could notice a release record or a runbook
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — §4 is the list. Three things are explicitly left unknown rather than estimated: whether the `Failed to copy` errors are new, whether `cloudflared` fronts both sites, and the production project ref as printed by the deploy itself

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code, no dates derived at runtime
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above, and every block in the record
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager. This PR is what makes it likelier next time, by putting `tee` in the procedure
- [ ] `strip-baked-env` seen in the deploy output — n/a: seen and quoted for `0.16.0`; this PR deploys nothing of its own
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR deletes a record and restores a runbook that points at the wrong endpoint. No app change, no schema, nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Two releases were verified with `/api/releases/current`, which cannot report what the Pi serves, while `/api/version` had existed since `0.14.0` | fixed here: the procedure now names the endpoint, shows both answering differently, and says to check `x-lanna-served-by` on whatever is asked |
| 2 | low | The production deploy's project-ref line has scrolled out of the buffer on three consecutive releases | fixed here: the procedure hands the command over with `tee` |
| 3 | low | Three `Failed to copy` errors in the OpenNext bundle, logged as `ERROR`, build succeeds | accepted: the named package is in no runtime import path for the Worker. Whether they are new is unknown and recorded as such |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the account of the release — in particular "the verification trap closed itself, and had been closed for two releases" — is one you recognise | `docs/releases/2026-10-03.md`, `## 0.16.0` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and it is a judgement about an account of his own release

Manual verification by: pending: Lutan to read the `0.16.0` record

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-03
