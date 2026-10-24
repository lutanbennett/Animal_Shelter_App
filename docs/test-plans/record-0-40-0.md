# Feature test plan — record release `0.40.0`

## Header

| | |
|---|---|
| Feature | Record `0.40.0`: the filled-in smoke test, the handover, and the decision file for the red `audit` |
| Backlog item | `docs/backlog.md` → none; recording a release is `docs/release-procedure.md` step 8, not a backlog item |
| Branch / worktree | `claude/record-0-40-0` @ `C:\Development\Animal_Shelter_cut-release-0-40-0` — **the cut's own worktree, reused**, which is what paperwork rule 2 says to do |
| Dev server | not started; this PR adds three documents and changes no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `9cdb4af2` — the production Pi's build, which is what users are served |

**This PR is not a gate and must not be read as one.** `0.40.0` is deployed and verified; all
four builds serve it and the release mail has been delivered. `docs/release-procedure.md` and
`CLAUDE.md` both provide for a release's own two PRs being merged by Claude as soon as CI is
green, and `0.28.0`'s finding is that presenting the record as "ready when you say" invents a
blocker out of bookkeeping.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the `0.40.0` record, the handover rewritten as a delta, and a decision file recording why the red `audit` was not acted on; no backlog item, this is step 8
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **six, all documentation.** `docs/releases/2026-10-24-0-40-0.md` (new), `docs/release-handover.md` (rewritten), `docs/release-procedure.md` (one new section), `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` (new), `docs/decisions/2026-10-24-read-only-production-checks.md` (new) and this plan. **No code of any kind.** Both decisions are new files per the convention, so two streams can never touch the same path

  **It grew from four to six mid-PR, and deliberately.** Lutan answered the two questions this release raised while the PR was open: *"Check for identical code only"* and *"Yes keep the read only production check script."* The handover said those were "not a release manager's call, so not made here" — **leaving that standing after he had answered would have been the exact stale-pending fault `CLAUDE.md` warns about**, so the answers went into this PR rather than a later one. One of them is a durable rule and therefore belongs in `release-procedure.md`, not the handover (paperwork rule 4)
- [x] Roles affected identified — **none.** Nothing here is reachable by any role; `docs/` is not served
- [x] Anything explicitly **out of scope** written down — the record does not re-verify the ten feature PRs; each has its own plan and the record cites their results. **Three things are deliberately recorded as NOT established rather than resolved**: which production diets `0250` affected, whether any production role holds the Operations or Management card, and whether the doctor role has `0230`'s cells on production. All three need scripts that are hard-locked to dev, and **those guards were left alone rather than worked around**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `9cdb4af2`. **But the reuse check was run rather than skipped**, because this is the cut's worktree being reused per rule 2 and the `0.39.4` handover's caveat is that reuse only saves the install when no dependency changed: `require('next/package.json').version` reads **16.4.2** against `package.json`'s **16.4.2**
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — see below, unedited, all four numbers read
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 68s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 38s
gates: typecheck=0 lint=0 test=0 build=0
```

**The gates were run twice, and this is the second run — the one that covers the final tree.** The first run (`typecheck=0 lint=0 test=0 build=0` likewise) was made before Lutan answered this release's two open questions, which added `docs/release-procedure.md` and a second decision file. Rather than paste the earlier block with a caveat about edits made after it, the gates were simply re-run over everything. **That matters here specifically because a documents-only PR skips the heavy CI jobs** (`check-docs-only.mjs`: `docs-only: true … the heavy jobs will skip; test-plan still runs`), so these local gates are the only ones that run and there is no second pass to catch a late edit.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. Next free is `0254`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a for this PR, which applies nothing; recorded for the release: production ended **`254 applied, 0 pending`**, dev **254 of 254**
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; `0252`/`0253`'s dry-runs are in the record
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no data at all
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: nothing to apply; the release's applies are done and recorded

## 4. Functional checks

- [x] Happy path works end to end — the function of a record is to be true, and **every figure in it is quoted from a tool's output**: the deploy lines read with `Get-Content … | Select-String` (PowerShell's `tee` writes UTF-16), the Pi lines from `~/deploy-prod.log` and `~/deploy-test.log`, drift from `--drift production` and `--drift test`, the Worker version from `wrangler deployments list`, the icon counts from `sync-home-icons.mjs`, the timings from the deployed test build, and **the mail from the inbox itself**
- [x] Data persists — n/a in the UI sense; the standing-in check is that all four files are committed and present in the diff
- [ ] Create / edit / delete all exercised — n/a: a release record is written once; a later release writes its own file. The handover is rewritten each release by design, and this edition replaces `0.39.5`'s
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — the applicable guard is `scripts/check-test-plan.mjs`, which rejects a release record filed under `docs/test-plans/` so that a release record can never satisfy a feature's gate. This record is under `docs/releases/`, and the checker validates this plan instead
- [x] Boundary cases checked — the handover's **line ceiling** is the one that applies: rule 4 sets ~100 and treats 150 as the limit. **Measured at each stage rather than once: 141 as first written, trimmed to 139, then 152 after Lutan's two decisions were written in — over the limit — and trimmed to 146.** The breach was caught by re-measuring after the edits instead of assuming the earlier figure still held; the fix was to compress the "facts no session can read" passage, which its own decision file now holds in full. **Reported honestly as inside the limit but not the ~100 it asks for** — the content is findings, and cutting a finding to hit a line count would be the wrong trade

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing in this PR | no change | none of the four files is served by the app; `docs/` is not a route |

- [ ] Every role above tested — n/a: no surface. The roles whose pages this release changed were tested on the deployed test build and the results are in the record
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission in this PR. **`0253` did narrow the doctor role server-side**, and that was verified on dev both ways; it is in the record

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; a record is not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. **The Thai wording of the new Units screen is #891's open item**, carried in the record and the handover, not here
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no page driven for this PR. (Console was read on test during verification; the only errors were the Cloudflare analytics beacon blocked by CSP, which is expected, and font preload warnings)
- [ ] Network clean — n/a: no page driven for this PR

## 6. Regression

- [x] The pages nearest the change still work — n/a in the UI sense. The nearest thing is the other release records, and this PR only adds a file beside them; `docs/releases/` gained one file and changed none
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file. `docs/decisions/` is one-file-per-decision by design precisely so this cannot conflict
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is four documents beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: recording a release closes no backlog item. **Nothing needed folding at step 1 either** (`git log --oneline main..backlog` was empty)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **two of them.** `2026-10-24-audit-body-parser-undici-not-reachable.md` records why two high advisories were judged unreachable and why no fix was applied, including the measurement (0 matches in the 21 MB deployed bundle) and the three conditions that would change the conclusion — `CLAUDE.md` requires exactly this for a red `audit`. And `2026-10-24-read-only-production-checks.md` records Lutan's decision to have a read-only production check **with its constraints**, which are the reason it needs a decision file rather than just a backlog line: read-only *by construction*, allow-listed named checks rather than arbitrary SQL, and **explicitly not built by loosening the existing dev-only guards one script at a time**. Building it is a feature stream's work and is filed on `backlog`, not done here
- [x] `README.md` still accurate — unchanged; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside this repository reads a record, a handover or a decision file, and nothing a user sees changed. The notes users did notice shipped in #894 and are live on `/releases` **and in their inbox**
- [x] Commit messages say why, not just what — the record commit states what shipped, that the mail was delivered and verified, which counter reset and why it is not the software's fault, and what was found
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the line that matters most for a record PR, since a record is nothing but claims. Three are stated as **not established** rather than smoothed over (section 1), and the one most tempting to assert from a story — "the release mail went out" — was checked **in the inbox**, including that all three notes render correctly, rather than stopping at `sent 1`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `9cdb4af2`, the production Pi's build. **This PR ships no build**; `0.40.0` is already live
- [x] Deployed SHA matches the tested SHA — **read from each build rather than assumed, and it is the one item that did not hold cleanly**: the four builds came from three SHAs (`f2a691e3`, `82666a58`, `9cdb4af2`). Every difference is documentation, measured by diff, so the application code is byte-identical. Recorded as a break with the counter reset to 0

### On the deployed build

- [x] Deployed to test — done, and test was **verified** there rather than merely deployed: three of this release's four `pending:` items were closed by measurement on the deployed test build
- [x] Smoke-tested on `test.lannacare.org` — done; the table is in the record
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR or the release derives "today"
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band in this PR. The release's one boundary, whether it mails, was asserted both ways at the cut **and then confirmed in the inbox**
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below, and every figure in the record
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked`, re-read on the day rather than carried over. The purge itself ran and its asset check passed

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu (82666a58)`
- [x] `strip-baked-env: removed N env var(s)` seen in the deploy output — **14**, on both environments, third consecutive release
- [x] **The release mail actually arrived** — **yes.** `sent 1, skipped 0`, then confirmed in the inbox: from `releases@lannacare.org`, subject `[UAT] Lanna Care release 0.40.0: …`, all three notes correct. **This is the first release in six to mail at all**
- [x] **The doctor role still works after `0253`** — the line this release's cut plan added, and it is closed: both doctor check scripts pass on dev, confirming other-clinic writes refused, own-clinic writes working, admin and management unaffected
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this release adds none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, neither. The release's ordering requirement was met: `0252` (whose consumers ship in #891) and `0253` both applied **before either deploy**
- [x] `--env production --dry-run` run and clean — `dry-run 0252 … ok`, `dry-run 0253 … ok`, and the per-file-transaction caveat was watched for with two pending files and did not bite
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0252` is additive, `0253` is policy-only and changes no row. Read rather than assumed, because the `0.39.4` lesson is that additive is not automatically harmless — here the harm channel was a **narrowed write path**, which was tested directly
- [x] Apply plan stated — done and executed

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `./scripts/pi/deploy-pi.sh --ref 55a23450` on each Pi returns the served app to `0.39.5`, and `npx wrangler rollback --env production` returns only the Worker fallback. **What it does not cover, and the asymmetry matters: `0252` is inert under `0.39.5`'s code, but `0253` is policy** — rolling the code back leaves the narrowed doctor scope in place. That is the right direction for a security fix and must be known rather than discovered. **And the mail cannot be rolled back at all**; it has been delivered

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Nothing in this PR. The release's seven findings — the three-SHA counter reset, a 13-hour orphaned process on the Pi that `TaskStop` did not kill, a near-miss false fault against `/deliveries`, a 200-not-403 refusal that would fool a status-only check, #890's pending signature with no written item, OpenNext copy errors rising from one to three, and the red `audit` | **all recorded in the record's "What broke" table**, with the `audit` conclusion additionally in `docs/decisions/`. Listed there rather than duplicated here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — this PR adds three documents and changes no page, route or permission | — |

**The release's ten `pending: Lutan` items and #891's Thai wording are not copied here.** They
belong to the record and to #891's own plan; a second home is how an open item stops being
closed anywhere (`CLAUDE.md`, and the `0.39.4` handover).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and that is a statement about **this PR**: three documents, no surface. It is not a claim about the release's `pending: Lutan` items, which this plan does not own

Manual verification by: n/a: this PR adds three documents and no page; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-24
