# Feature test plan — release-handover

## Header

| | |
|---|---|
| Feature | A handover file for the next release manager (`docs/release-handover.md`), and the four durable `0.21.0` lessons folded into `docs/release-procedure.md`'s traps |
| Backlog item | none — requested directly in chat by Lutan, 2026-10-08, ahead of starting a fresh session for the next production release |
| Branch / worktree | `claude/release-handover` @ `C:\Development\Animal_Shelter_release-handover` |
| Dev server | not started — this PR adds documentation and no code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `75e34afb` — `main`'s tip when the worktree was created |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a new `docs/release-handover.md`, and four traps plus one clarification added to `docs/release-procedure.md`
- [x] Files/areas touched listed — `docs/release-handover.md` (new) and `docs/release-procedure.md`. No code, no migrations, no `src/`, no `worker/`
- [x] Roles affected identified — none; neither file is served by the app
- [x] Anything explicitly **out of scope** written down — (a) the 243 plans repo-wide awaiting manual verification, which are the normal standing state and are **not** a backlog to clear; (b) `#456`, an open schema PR belonging to another stream; (c) `worktree.mjs done account-menu-min-width`, named in the handover as a leftover but left for `/clean-streams` or its own session

**Why a handover file at all, and why it is marked short-lived.** The durable
artifacts already exist: `docs/releases/<date>.md` per release and
`docs/release-procedure.md` as the runbook. What neither holds is *current
state* — what `main` is, what is in flight, which database is deliberately ahead
of the other. The file says in its own opening that it is rewritten each release
and that the record and the runbook outrank it, so a stale copy cannot quietly
become authoritative.

**The split between the two files is deliberate.** Anything that will be true
next month went into `release-procedure.md`, where a release manager meets it in
the runbook. Anything true only this week went into the handover. Putting the
traps only in a handover file would have lost them at the next rewrite.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` at `75e34afb` minutes before the edits, so there was nothing to merge in. `0` behind, confirmed by `git status -sb`. **`main` moves fast at the moment** — 40 commits in the day since the release — so this was re-checked rather than assumed; see §6
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines are pasted in §6
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **Exit codes read from the script, not through a pipe** — which is one of the traps this PR documents, so running it any other way here would be self-refuting. `gates.mjs` and `check-test-plan.mjs` were redirected to a file with `$?` read from the command itself
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Both databases' current state is **read and recorded in the handover**, which is the point of the file, but nothing is applied here
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two Markdown files under `docs/`, read in the repo and on GitHub. No path through the app reaches either
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

- [ ] Every role above tested — n/a: neither file is served by the app, so no role can reach them and there is no matrix to fill. `docs/` is not a route
- [ ] A role that should not have access is blocked server-side — n/a: as above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no route added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. These are internal process documents, not something a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: internal English documents, as the runbook and every release record are
- [ ] Mobile viewport (375px) — n/a: no layout; Markdown read on GitHub
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work — the gates are the evidence that files under `docs/` are reachable by nothing the build compiles:

```
=== gates: typecheck exited 0 after 135s
=== gates: lint exited 0 after 193s
=== gates: build exited 0 after 245s
gates: typecheck=0 lint=0 build=0
```

  Written into this plan **after** the run finished, not before. The placeholder
  that sat here until then was a deliberate guard: `check-test-plan.mjs` rejects
  placeholders, so a figure that had not been measured could not have reached a
  commit even by accident. An earlier plan today did carry an invented build
  time for a few minutes, which is why the guard was used here.

- [x] Any shared file touched checked from a second, unrelated place — `docs/release-procedure.md` **is** the shared file, and the risk is clobbering it while inserting. Checked by loading the result rather than by reading the diff: it still opens on `# Release procedure`, still carries exactly one `## Traps` heading, and ends on the last trap. `git diff --numstat` against the merge-base reads **56 added, 1 deleted** — and the one deletion was inspected rather than waved through: it is the line `until proven otherwise.`, the tail of the existing two-builds trap, which was **extended** rather than removed. No existing guidance was lost. The handover file is wholly new
- [x] **Diffed against the merge-base, not `origin/main`** — which is the third trap this PR documents. `main` moved 40 commits in the day before this branch was cut and will have moved again; comparing against it would show other streams' work as though this branch had done it
- [x] **Line endings match the files around them** — `release-procedure.md` was edited in place so its endings are unchanged, and `release-handover.md` was written to match. Checked with `file` and by counting carriage returns against lines
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `75e34afb` directly, and this branch adds Markdown that nothing imports

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: requested in chat, not a backlog item. Nothing in the backlog is closed by writing a handover
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one judgement here — durable lessons to the runbook, current state to the handover — is stated in §1 and in the handover's own opening. It is a filing decision about two documents, not a design choice about the app
- [x] `README.md` still accurate — unchanged by this PR; it does not index the process documents
- [ ] **Release notes.** — n/a: internal process documentation. No shelter user would notice it; nothing about the app changed
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — every figure in the handover was read rather than remembered: `main` at `75e34afb` and 40 commits past `9e74be1d` from `git log`; `161 applied, 0 pending` and `162 applied` from `apply-migrations.mjs --status` against each database; `0.21.0` on all four artifacts from `/api/version` and `/api/releases/current`; four `unreleased` notes counted from the register; the open PR and the worktree states from `gh` and `worktree.mjs list`; the 243 pending plans from a `grep` across `docs/test-plans/`

### The one claim worth flagging

The handover says **dev is one migration ahead of `main` on purpose**. That was
checked, not assumed: dev reads `162 applied` with `0162_zone_colour.sql` listed
as *applied here, no file on `origin/main`*, and PR **#456** — which carries that
file — is open. A release manager who runs `--drift dev` before #456 merges will
get a disagreement, and the procedure tells them both checks must read
`No drift`. Without this note that is a stop; with it, it is expected.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships no build and precedes no deploy
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: a documentation PR is not deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change in this PR
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The dates in both files are literals
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines in §6. An earlier draft of this plan carried a build time typed before the build had finished; it was replaced with the real figure rather than left to look plausible, which is the same class of mistake as the piped exit code this PR documents
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed by this PR

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: nothing is deployed by this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing is deployed by this PR
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — n/a: nothing is deployed by this PR
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — n/a: nothing is deployed by this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The release mail** — n/a: nothing is deployed by this PR and no release is cut

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this PR removes two documents and changes nothing that runs. It does not affect `0.21.0`, which is live at `9e74be1d`. The only cost of reverting is that the four traps return to being things the next release manager re-derives, which is what this PR exists to prevent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/release-handover.md` is a new convention: a per-release file that is rewritten rather than appended, sitting beside a runbook and a record that are both permanent. A third process document is a thing that can rot | **accepted, with the rot guarded in the file itself.** Its first lines say it is a snapshot, that it is rewritten each release, and that `docs/releases/<date>.md` and `docs/release-procedure.md` outrank it if they disagree. The durable lessons were deliberately **not** left in it — they went to the runbook — so a stale handover loses only state, never guidance |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the handover says what Lutan wants a fresh session handed. He asked for findings, lessons, process updates and work in progress; whether the split between this file and the runbook is the one he had in mind is his call, not a thing to verify by script | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and it is a judgement about what he wants handed over rather than something to run

Manual verification by: pending: Lutan on whether the handover covers what he wants a fresh session to have

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §7
- [ ] Handed to the production release manager — n/a: this PR *is* the handover to them

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-08 — every figure in the handover was read from a tool at the time of writing and will age; the file says so and names the two documents that outrank it. The four traps went to the runbook rather than the handover precisely so that they survive the next rewrite
