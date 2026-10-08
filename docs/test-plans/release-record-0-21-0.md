# Feature test plan — release-record-0-21-0

## Header

| | |
|---|---|
| Feature | Record release `0.21.0` — a new `docs/releases/2026-10-08.md`, the day's first release |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/record-0-21-0` @ `C:\Development\Animal_Shelter_record-0-21-0` |
| Dev server | not started — this PR adds documentation and no code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `adef4ea6` — `main`'s tip after the sync below. The release this records is `9e74be1d`, which is **no longer** `main`'s tip: 24 commits landed while the record was being written |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one new file: what shipped in `0.21.0`, who ran each step, what the deploys printed, what was verified and what the record cannot say
- [x] Files/areas touched listed — `docs/releases/2026-10-08.md` and this plan. No code, no migrations, no `src/`, no `worker/`
- [x] Roles affected identified — none; the file is not served by the app and no role can reach it
- [x] Anything explicitly **out of scope** written down — (a) the signatures on `csp-enforce` and `shelter-operations-nav`, which Lutan's pass earned and which go in their **own sign-off-only PR** (see below); (b) the eight feature plans still `pending:`; (c) `0.20.0`'s Contacts pass, carried in the gaps table rather than closed

**The record is written after the fact and the release is already live.** It is a
record, not a gate, so this PR cannot change what shipped. What it can get wrong
is the account — which is what §6 and §7 are about.

A new file rather than a section appended to an existing one: `0.21.0` is the
first release of 2026-10-08. `2026-10-07.md` holds two (`0.20.0` and `0.20.1`)
and is untouched by this PR.

### Why the two signatures are not in this PR

Lutan verified three CSP items and the Shelter Operations menu on test, and
resolved the fourth. That earns signatures on `csp-enforce.md` and
`shelter-operations-nav.md` — but not here. `check-test-plan.mjs`'s `signoffOnly`
exemption, which holds a later signature's release-notes tick against the merge
that introduced the plan, requires **every** touched path to be a plan. This PR
touches `docs/releases/2026-10-08.md`, which is not one, so including those
signatures would fail the checker on their release-notes lines. `0.20.0` learned
this the same way and recorded it; the fix is a separate sign-off-only PR, which
is the shape the checker was built for.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — **run, and it mattered.** The worktree was created from `origin/main` at `028d5e4d` — already two commits past the release — and by the time the record was written `main` had reached `adef4ea6`, **24 commits beyond `9e74be1d`**, including a large medications/diets split (#451). Synced cleanly to `adef4ea6` and pushed; `0` behind afterwards, confirmed by `git status -sb`. Caught because a `git diff` against `origin/main` showed thirty-odd files this branch had never touched
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines are pasted in §6, where for a documentation-only change they are the evidence that matters
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **Every exit code in this release was read from the script, not from a pipe** — `0.20.1` was bitten twice in one afternoon by `| tail` reporting `tail`'s status. This release ran `release-prs.mjs`, `gates.mjs`, `check-release-guards.mjs`, `check-test-plan.mjs`, `apply-migrations.mjs` and `deploy.mjs` with output redirected to a file and `$?` read from the command itself. `release-prs.mjs` exited 0 on a twenty-PR range as a result, rather than appearing to
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. The release's own applies are recorded in the file this PR adds, and were done before any deploy
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown file under `docs/`, read on GitHub and in the repo. No path through the app reaches it
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

- [ ] Every role above tested — n/a: the file is not served by the app, so no role can reach it and there is no matrix to fill. `docs/` is not a route, and the build's route list does not contain it
- [ ] A role that should not have access is blocked server-side — n/a: as above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no route added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release record is internal, not something a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: an internal English document, as all fifteen previous records are
- [ ] Mobile viewport (375px) — n/a: no layout; Markdown read on GitHub
- [ ] Browser console clean — n/a: no page changed by this PR
- [ ] Network clean — n/a: no page changed by this PR

## 6. Regression

- [x] The pages nearest the change still work — **why the gates are run on a documentation PR at all.** They end:

```
=== gates: typecheck exited 0 after 78s
=== gates: lint exited 0 after 116s
=== gates: build exited 0 after 81s
gates: typecheck=0 lint=0 build=0
```

  These are the **post-sync** figures, on the merged tree at `adef4ea6`. An
  earlier run on the pre-sync tree also ended `typecheck=0 lint=0 build=0`
  (`build exited 0 after 224s`) and was discarded as describing a tree this PR no
  longer proposes. The 81s build is a warm Turbopack cache from that first run,
  not a build that skipped — `CLAUDE.md` warns that a build finishing in seconds
  rather than minutes is contention until proven otherwise, and here the proof is
  that it is the second full build of the same tree and all three gates report
  their own exit code.

  which is the evidence that a file under `docs/` is reachable by nothing the
  build compiles. The weaker version is to reason that Markdown cannot break a
  build; `docs/` sits in the repo root and a stray fenced block or a renamed path
  is exactly the sort of thing assumed harmless until it is not.

- [x] Any shared file touched checked from a second, unrelated place — this PR adds **new** files and edits none, so the clobbering risk `0.20.1`'s record carried does not arise. Verified against the branch's merge-base rather than against `origin/main`, which **moved twice while this was being written**: `git diff --numstat <merge-base>` is empty for tracked files, the two new files are additions, and `docs/releases/2026-10-07.md` is untouched. Comparing against a moving `origin/main` is what produced a thirty-file diff of someone else's feature and briefly made this line read as though the branch had deleted half the app
- [x] **Line endings match the other records** — the file was written LF and converted to CRLF, which every other `docs/releases/*.md` uses. Verified by counting: 251 lines, 251 carriage returns, and `file` reports CRLF. Checked because line endings have now cost this project time on three separate files in two days
- [x] Nothing merged from `main` during `sync` was broken by this branch — 24 commits were merged in, including #451's medications/diets split. This branch adds two Markdown files under `docs/` and touches nothing they touch, and the gates were **re-run after the sync** so the figures above describe the merged tree rather than the pre-sync one

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release record is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice in this PR. The release's two judgements, major rather than minor and the note order, are recorded in the file itself and in `cut-release-0-21-0.md` §1
- [x] `README.md` still accurate — unchanged by this PR; it does not name a version or enumerate the release records
- [ ] **Release notes.** — n/a: a release record is internal and no shelter user would notice it. The six notes a user *would* notice shipped in this release, written by the PRs that made each change
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned** — this is the substance of the PR. Every figure is quoted from the tool that produced it: both `/api/version` and both `/api/releases/current` responses with their `x-lanna-served-by` headers, the three browser-pane cache fetches, the console errors verbatim, both `--drift` runs, the deploy log read through `tr -d '\000'`, both Pi logs, the cut's sixteen assertions, and the delivered email's own subject line and timestamp from the inbox

### Three claims in the record that were checked rather than told

The record makes three statements that would have been easy to assert and wrong:

1. **"The CSP lives in the Worker, not the app."** Found by reading
   `worker/security-headers.mjs` — the only file in `src/` or `worker/` that sets
   the header — after `test.lannacare.org` reported `0.21.0` and
   `content-security-policy-report-only` at the same time. Confirmed by
   `/api/releases/current` answering `0.20.1` from the Worker bundle while
   `/api/version` answered `0.21.0` from the Pi.
2. **"Photos are same-origin, so `img-src 'self'` is satisfied."** Checked by
   grepping `src/app` and `src/components` for `src="http…"` and finding none,
   and by finding the `/api/photos/[fileId]` proxy route — not by assuming a
   Drive-backed app must hotlink.
3. **"The visitor tile has never shown a number."** Lutan said so from memory;
   the record states it because `countVisitors` returns `{ state: "off" }`
   without `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID`, neither of
   which is set. His recollection and the code agree, and the record quotes the
   code.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships no build. `9e74be1d` in the header is the *released* commit this record describes, already live
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: a documentation PR is not deployed. `0.21.0` itself reached test first and was **held there** for verification, which the record describes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change in this PR
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The dates in the record are literals read from the local clock, and the email timestamp is quoted from the message
- [ ] **Boundary or banding change** — n/a: no threshold in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines above, and every block in the record. The deploy log was read through `tr -d '\000'` rather than transcribed, and the console errors are copied verbatim including the `script-src-elem` fallback note
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed by this PR. `0.21.0`'s own edge-cache check was done in a real browser and is quoted in the record

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: nothing is deployed by this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing is deployed by this PR. It was read for `0.21.0` and is quoted in the record, with the production ref `dbkodyyxxhtygxcxmfcu` and the release SHA `9e74be1d`
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — n/a: nothing is deployed by this PR. `removed 11 env var(s)` was read for `0.21.0` and is quoted
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — n/a: nothing is deployed by this PR. `cbd55beae8d8` matched on both sides for `0.21.0` and is quoted
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The release mail** — n/a: nothing is deployed by this PR. `0.21.0`'s mail was sent **and confirmed delivered** in the inbox, which the record quotes by subject and timestamp

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this PR removes a record and changes nothing that runs. It does **not** roll back `0.21.0`, which is live; that would be `./scripts/pi/deploy-pi.sh --ref 50631c85` on the Pi plus `npx wrangler rollback --env production` for the Worker, and **the Worker rollback is what would put the CSP back to report-only**, since the policy is set there. Neither reverts `0160` or `0161`, and neither needs to — one is additive and the other removed an unusable privilege. **The mail cannot be un-sent**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `csp-enforce`'s manual item 5 named the "Management dashboard visitor count" as a CSP risk. It is not one, and never could be: the figure is fetched **server-side** from Cloudflare's GraphQL API, and CSP governs only what the browser loads. The tile has also never shown a number, because `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` are unset | **accepted, and recorded rather than quietly dropped.** The item's own wording ("or stays grey for the same reason as before") allowed for it, so the plan is not wrong — but it pointed a person at something the policy cannot reach, and Lutan spent his attention asking what it meant. Worth knowing the next time a CSP check is written: list only what the *browser* fetches |
| 2 | low | The test Worker deploy printed three `ERROR Failed to copy …\node_modules\…` lines and then succeeded, exit 0 | accepted: known Windows file-lock noise, OpenNext continues past it. Recorded in the release record so the next release manager does not stop on it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the account of **who ran what** is right — the record says Lutan ran the Worker production deploy and the signed-in pass on test, and nothing else | the `## 0.21.0` header table and "Run by" |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and only he can confirm what he ran

Manual verification by: pending: Lutan on the record's account of who ran what

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises what the record says
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-08 — the record describes a release that is live and verified: one SHA across all four artifacts, both databases `No drift`, the edge cache checked in a real browser, the CSP enforcing with only Cloudflare's edge-injected beacon blocked, and the admin mail confirmed **delivered** rather than merely sent — the last of which closes a gap open since `0.19.0`. The test hold earned its place: it is what exposed that a Pi deploy cannot change a security header
