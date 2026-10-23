# Feature test plan — record release `0.39.5`

## Header

| | |
|---|---|
| Feature | Record release `0.39.5` — the filled-in smoke test as `docs/releases/2026-10-23-0-39-5.md` |
| Backlog item | `docs/backlog.md` → none; recording a release is `docs/release-procedure.md` step 8, not a backlog item |
| Branch / worktree | `claude/record-0-39-5` @ `C:\Development\Animal_Shelter_auto-tiles-out` (a free leftover reused — **its folder name does not match its branch**, so cleanup by name will miss it) |
| Dev server | not started; this PR adds two documents and changes no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | `55a23450` (the released SHA; this PR is documentation of a release already live) |

**This PR is not a gate and must not be read as one.** `0.39.5` is deployed and verified;
all four builds are live on `55a23450`. This records what happened. `docs/release-procedure.md`
and `CLAUDE.md` both say a release's own two PRs are merged by Claude as soon as CI is green,
without an approval round-trip, and the `0.28.0` finding is that presenting the record as
"ready to merge when you say" invents a blocker out of bookkeeping.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the `0.39.5` release record, plus this plan; no backlog item, this is the release procedure's own step 8
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two, both new, both documentation: `docs/releases/2026-10-23-0-39-5.md` and `docs/test-plans/record-0-39-5.md`. No route, no component, no Worker, no migration, no shared lib, no i18n, no manual
- [x] Roles affected identified — **none.** Nothing in this PR is reachable by any role; neither file is served by the app. `docs/releases/` is not read at runtime
- [x] Anything explicitly **out of scope** written down — the record does not re-verify the five feature PRs; each has its own plan, and the record cites their results. It also does **not** adopt their open items as its own: #882's manual items stay #882's, listed in the record as the release's outstanding work rather than copied into this plan's table

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a as a merge: the branch was created directly from `origin/main` at `55a23450`, so there was nothing to merge. **But the reuse check was run rather than skipped**: this is a leftover worktree 10 commits behind, and the `0.39.4` handover's caveat is that reuse only saves the install when no dependency changed inside the range. `require('next/package.json').version` reads **16.4.2** against `package.json`'s **16.4.2**, so `node_modules` is current and the four-minute `npm ci` was legitimately skipped
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — see the block below, unedited, all four numbers read
- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 11s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 179s
=== gates: test — npm test
=== gates: test exited 0 after 16s
=== gates: build — npm run build
=== gates: build exited 0 after 165s
gates: typecheck=0 lint=0 test=0 build=0
```

**Two markdown files were edited after this run started** — `docs/release-handover.md` and `docs/release-procedure.md`, when the empty-`unreleased` lesson was promoted out of the handover per paperwork rule 4. **Stated rather than glossed, because a documents-only PR skips the heavy CI jobs** — `check-docs-only.mjs` reports `docs-only: true … the heavy jobs will skip; test-plan still runs` — so these local gates are the only ones that run, and nobody re-runs them but me. It was checked rather than assumed: the only scripts naming either file are `check-docs-only.mjs` and its test, which classify paths, plus `check-assets.mjs` and `sync-home-icons.mjs`, none of which parses their content. **No gate reads them, so the result above holds for the final tree.**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. Next free number is `0252`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a for this PR, which applies nothing, but recorded for the release: production ended **`252 applied, 0 pending`** and dev **`252 of 252`**
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; `0251`'s dry-run is recorded in the release record
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no data at all
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply; the release's apply is done and recorded

## 4. Functional checks

- [x] Happy path works end to end — the record's own claims are its function, and **every number in it is quoted from a tool's output rather than recalled**: the deploy lines from the production log (read with `Get-Content … | Select-String`, since PowerShell's `tee` writes UTF-16), the Pi lines from `~/deploy-prod.log` and `~/deploy-test.log` on the Pi, the drift lines from `--drift production` and `--drift test`, the icon counts from `sync-home-icons.mjs`, the Worker version from `wrangler deployments list`, and the role-home table from the deployed test build
- [x] Data persists — reload the page and the change is still there — n/a in the UI sense; the standing-in check for a document is that it is committed on the branch and present in the diff, which `git show --stat` confirms
- [ ] Create / edit / delete all exercised — n/a: a release record is written once and never edited; a later release writes its own file
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — the applicable check is `scripts/check-test-plan.mjs`, which rejects a release record filed under `docs/test-plans/` precisely so a release record cannot satisfy a feature's gate. This record is under `docs/releases/`, where it belongs, and the checker validates this plan instead
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the date boundary is the only one present and it is a literal: the filename and header both read `2026-10-23`, matching the released entry's date and the deploy day

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing in this PR | no change | neither file is served by the app; `docs/` is not a route |

- [ ] Every role above tested — n/a: this PR adds two documents and no surface. The roles whose **homes** changed were tested on the deployed test build and the results are in the record
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; a release record is not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no page was driven for this PR
- [ ] Network clean — n/a: no page was driven for this PR

## 6. Regression

- [x] The pages nearest the change still work — n/a in the UI sense; the nearest thing to this change is the other release records, and this PR only adds a file beside them. `docs/releases/` gained one file and changed none
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file is touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is two new files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: recording a release closes no backlog item. Two backlog edits were made during this release and both went on the `backlog` branch where they belong, not here: the diets step Lutan closed, and the dev sign-in tooling faults
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the record makes no design decision. The one judgement in this release that could have been a decision file — publishing a release note from an empty `unreleased` — is the existing `2026-10-11-release-note-truth-rule.md` being applied, not a new rule, and it is explained in #883
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside this repository reads a release record, and `unreleased` is deliberately empty immediately after a cut. The note describing what users will notice shipped in #883 and is live on `/releases`
- [x] Commit messages say why, not just what — the record commit says what the release was, which ordering mattered and why, and what it found
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — this is the line that matters most for a record PR, since a record is nothing but claims. Each is traceable to the command that produced it, and three are stated as **not** established rather than smoothed over: which production diets had been affected, whether #882's Who does what toggle behaves (blocked at aal1), and whether the Thai wording reads well

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `55a23450`, which is what all four builds serve
- [x] Deployed SHA matches the tested SHA — **yes, and read from each build rather than assumed**: `/api/version` answers `55a23450` on both `lannacare.org` and `test.lannacare.org`, and both Pi clones report `55a23450` from `git log --oneline -1`

### On the deployed build

- [x] Deployed to test — done, same SHA as production
- [x] Smoke-tested on `test.lannacare.org` — done, and this is where the release's substance was verified: five roles' homes, signed in on the deployed build, plus `/releases` rendering the new note
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR or the release derives "today". `0251` is a static insert; `cardTilesFor()` reads no clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band or threshold in this PR. The release's one boundary, whether a patch mails anyone, was asserted both ways at the cut
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below, and every figure in the record
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked`, so an anonymous request reaches the staff-testing gate. The purge itself ran and its asset check passed

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu (55a23450)`
- [x] `strip-baked-env: removed N env var(s)` seen in the deploy output — **14**, on both environments
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this release adds none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, this PR contains neither. The release's ordering requirement (`0251` before the deploy) was met and is recorded
- [x] `--env production --dry-run` run and clean — recorded for the release: `dry-run 0251 … ok`
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0251` is a single `insert … on conflict do nothing` into `role_cards`, touching no existing row and no `role_permissions`. Read rather than assumed, because the previous release's lesson was that additive in the database is not automatically harmless — here the harm channel was ordering, not data loss, and a backup would not have been its remedy
- [x] Apply plan stated — done and executed before both deploys

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `./scripts/pi/deploy-pi.sh --ref e077f45b` on each Pi returns the served app to `0.39.4`, and `npx wrangler rollback --env production` returns only the Worker fallback, also to `0.39.4` (unlike last release, `0.39.4` genuinely was deployed there, so the two agree). **Neither reverts `0251`, and neither needs to**: the rows it adds are inert under `0.39.4`'s code, which adds those tiles itself regardless. That asymmetry is the safe direction and is exactly why the migration went first

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Nothing in this PR. The release's own findings — three `dev-signin` faults, a `check-home-screens-live.mjs` that cannot run, #882's aal2-blocked manual item, and two method faults of my own that each inverted or stalled an answer | **all recorded in the release record's "What broke" table**, and the three script faults filed as one consolidated item on `backlog`. Listed there rather than duplicated here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — this PR adds two documents and changes no page, route or permission | — |

The release's ten `pending: Lutan` items are behind production sign-in and belong to the
**record**, which lists them individually. They are deliberately not copied here: a
feature's or a release's open items given a second home in a later plan are items nothing
closes, which is the fault `CLAUDE.md` and the `0.39.4` handover both name.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and that is a statement about **this PR**: two documents, no page, no route, no permission. It is not a claim about the release's `pending: Lutan` items, which this plan does not own

Manual verification by: n/a: this PR adds two documents and no surface; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
