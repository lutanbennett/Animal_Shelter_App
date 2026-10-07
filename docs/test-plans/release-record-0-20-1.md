# Feature test plan — release-record-0-20-1

## Header

| | |
|---|---|
| Feature | Record release `0.20.1` — a `## 0.20.1` section added to `docs/releases/2026-10-07.md`, which already holds `0.20.0` from the same day |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/record-0-20-1` @ `C:\Development\Animal_Shelter_record-0-20-1` |
| Dev server | not started — this PR adds documentation and no code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `50631c85` — the released commit, which is also `main`'s tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one file gains one section: what shipped in `0.20.1`, who ran each step, what the deploys printed, and what the record cannot say
- [x] Files/areas touched listed — `docs/releases/2026-10-07.md` and this plan. No code, no migrations, no `src/`, no `worker/`
- [x] Roles affected identified — none; this file is not served by the app and no role can reach it
- [x] Anything explicitly **out of scope** written down — (a) `0.20.0`'s outstanding Contacts pass, which belongs to that release's section and is carried in this one's gaps table rather than closed; (b) the eight unsigned feature plans, which keep their own `pending:` signatures and are not touched here

**The record is written after the fact and the release is already live.** It is a
record, not a gate — the procedure says so in those words — so this PR cannot
change what shipped. What it can get wrong is the account, which is why §6 checks
every figure in it against the thing it describes rather than against the
session's memory of it.

A `## 0.20.1` section was added to the existing `2026-10-07.md` rather than a new
file, as the procedure directs when a day holds more than one release. 2026-10-02
holds four.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` at `50631c85`, the released commit, minutes before this plan was written. `0` behind, confirmed by `git status -sb`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed, are pasted in §6 — the run is recorded there because for a documentation-only change the gates prove *absence* of effect, which is what §6 is about
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything. This release found out the hard way why that matters: `release-prs.mjs` exited 1 and a piped run reported `tail`'s 0, which would have lost #416 from the release. Recorded in the `0.20.1` section
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. The release's own applies are recorded in the section this PR adds, and were done before any deploy
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown file under `docs/`, read on GitHub and in the repo. There is no path through the app that reaches it
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

- [ ] Every role above tested — n/a: the file is not served by the app, so there is no role that can reach it and no matrix to fill. `docs/` is not a route; the build's route list does not contain it
- [ ] A role that should not have access is blocked server-side — n/a: as above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no route added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release record is an internal artifact, not something a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: an internal English document, as all fourteen previous records are
- [ ] Mobile viewport (375px) — n/a: no layout; Markdown read on GitHub
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work — **the point of running the gates on a documentation PR.** `gates.mjs` ends:

```

=== gates: build exited 0 after 328s

gates: typecheck=0 lint=0 build=0
```

  which is the evidence that a file under `docs/` is reachable by nothing the
  build compiles. The weaker version of this check is to reason that Markdown
  cannot break a build; `docs/` is in the repo root and a stray fenced block or a
  renamed path is the sort of thing that is assumed harmless right up until it is
  not.

  **The `| tail` trap recurred here, in the same session that had just written it
  up.** This run was invoked as `gates.mjs 2>&1 | tail -4`, exceeded the
  foreground timeout, and was reported back as *"completed (exit code 0)"* — which
  was `tail`'s status, not the gates'. It is ticked on the `typecheck=0 lint=0
  build=0` line above, which is `gates.mjs` printing **each gate's own exit code**,
  and that is precisely why the script prints them rather than relying on its own.
  Recorded because the trap is cheap to describe and evidently easy to walk into:
  it had already cost this release its PR count an hour earlier (Defect 1), and
  328s against the cut worktree's 154s is the kind of gap that invites a guess
  rather than a read.

- [x] Any shared file touched checked from a second, unrelated place — `docs/releases/2026-10-07.md` already held the `0.20.0` section, so it **is** a shared file and the real risk is clobbering that section while appending to it. Checked by loading the result, not by reading the diff: both `## 0.20.0` and `## 0.20.1` are present (lines 3 and 216), and `0.20.0`'s section is byte-identical to `origin/main`'s copy — `git diff origin/main -- docs/releases/2026-10-07.md` shows additions only, zero deletions
- [x] **Line endings preserved** — the file is CRLF and the append was converted to match, so the diff is additions rather than a whole-file rewrite. Verified by counting: 451 lines, 451 carriage returns, and `file` still reports CRLF. Checked because `inputs-16px` needed a second commit for exactly this earlier today, and because `releases.ts` hit it again during the cut
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `50631c85` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release record is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice in this PR. The release's one judgement, minor rather than major, is recorded in the section itself with the case put on each side, and in `cut-release-0-20-1.md` §1
- [x] `README.md` still accurate — unchanged by this PR and it does not name a version or enumerate the release records
- [ ] **Release notes.** — n/a: a release record is internal and no shelter user would notice it. The seven notes a user *would* notice shipped in this release and were written by the PRs that made each change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the record were measured, not reasoned** — this is the substance of the PR and §6 is how it is held. Every figure in the new section is quoted from the tool that produced it: both `/api/version` responses with their `x-lanna-served-by` headers, both `/api/releases/current` responses, the three browser-pane cache fetches, both `--drift` runs, the deploy log read through `tr -d '\000'`, both Pi logs, and the cut's fifteen assertions. Nothing is a remembered number

### What was corrected while writing it

The first draft of the PR count said **eleven**. `release-prs.mjs` had been run
through `tail`, which reported exit 0 while the script itself exited 1 and named
a test plan belonging to no PR in its list. Re-run without the pipe, the
disagreement was visible: #416 was squash-merged and had no merge commit to read
a number from. The record says twelve, and says why — because the next release
manager will meet a squash merge again, and the piped exit code is the part that
makes it invisible.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships no build. `50631c85` in the header is the *released* commit this record describes, which is already live
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: a documentation PR is not deployed. `0.20.1` itself reached test before production and the record says so
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change in this PR
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The dates in the record are literals, read from the local clock at the time each step ran
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line above, and every block in the record section. Nothing was tidied or re-typed from memory; the deploy log was read through `tr -d '\000'` rather than transcribed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed by this PR. The `0.20.1` deploy's own edge-cache check was done in a real browser and is quoted in the record

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: nothing is deployed by this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing is deployed by this PR. It was read for `0.20.1` itself and is quoted in the record, with the correct production ref `dbkodyyxxhtygxcxmfcu` and the release SHA `50631c85`
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — n/a: nothing is deployed by this PR. `removed 11 env var(s)` was read for `0.20.1` and is quoted in the record
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — n/a: nothing is deployed by this PR. `cbd55beae8d8` matched on both sides for `0.20.1` and is quoted in the record
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The release mail** — n/a: `0.20.1` is minor and sent none; both deploys printed `no major release new to …, so no email`, quoted in the record

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this PR removes a record and changes nothing that runs. It does **not** roll back `0.20.1`, which is already live; that would be `./scripts/pi/deploy-pi.sh --ref d7f5dddc` on the Pi plus `npx wrangler rollback --env production` for the Worker fallback, and neither reverts `0156` or `0157` — harmless, since both are purely additive

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The release's PR list was briefly recorded as eleven: `release-prs.mjs` exited 1 and a run piped through `tail` reported 0, hiding a squash-merged #416 | **fixed before the record was written** — re-run without a pipe, #416 confirmed on GitHub and proved new in the range with `merge-base --is-ancestor`. The record names the trap rather than just the corrected number, since the next squash merge will be just as invisible |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the account of **who ran what** is right — the record says Lutan ran the Worker production deploy and nothing else, which is the first time since the procedure was written that it was true | the `## 0.20.1` section's header table and "Run by" |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and only he can confirm what he ran

Manual verification by: pending: Lutan on the record's account of who ran what

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises what the record says
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-07 — the record describes a release that is already live and verified: one SHA across all four artifacts, both databases reading `No drift`, and the edge-cache and drift gaps `0.20.0` left open now closed. Two gaps carry forward unchanged and are named in the record rather than absorbed
