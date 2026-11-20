# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release records for `0.47.7` and `0.47.8`, and the release handover |
| Backlog item | n/a: a release record closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-8` @ `C:\Development\Animal_Shelter_cut-release-0-47-8`, port `3006` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-20 |
| Carries a migration? | No |
| Tested at SHA | this commit; it documents the release deployed at `3d93e90ec` |

## 1. Scope and risk

- [x] Change is described in one sentence — three markdown files: a record for `0.47.7` (UAT only), a record for `0.47.8` (what production runs), and a rewritten `docs/release-handover.md`
- [x] Files/areas touched — `docs/releases/2026-11-20-0-47-7.md`, `docs/releases/2026-11-20-0-47-8.md`, `docs/release-handover.md`, and this plan. **No code**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered; no card, route or gate changes
- [x] Out of scope — the deploys themselves, which already happened and are what these files describe
- [x] **Two records, not one, and deliberately** — `0.47.7` never reached production, so a single record would have had to either hide it or muddle two deployed states. **`check-release-handover.mjs` reads the newest record, which is `0.47.8`'s**

### Why this PR is not a gate

By the time it exists the release is deployed and verified. **It describes a release that already
shipped**, so nothing here is waiting on anyone and it must not be presented as a blocker — the fault
`0.28.0` made.

### The one finding this PR is the product of

**Writing the record is what caught an incomplete release.** All four hosts reported `0.47.8` on
`/api/version`, but **test's Worker was still `0.47.6` and UAT's `0.47.7`** — a Pi build does not deploy
the Worker. Both were then deployed, and all four hosts now agree on **both** endpoints. **Recorded in
the `0.47.8` record's defect table with the probe that settled it**, and carried into the handover as its
headline lesson.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was cut from `origin/main` and `main` was merged in before this commit; the record PR rides in the cut's own worktree as `docs/release-procedure.md` rule 2 requires
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0
=== gates: lint — npm run lint
=== gates: lint exited 0 after 244s
=== gates: test — npm test
=== gates: test exited 0 after 40s
=== gates: build — npm run build
=== gates: build exited 0 after 164s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] `node scripts/check-release-guards.mjs` — n/a: it guards a cut's data, and this PR changes no release data. It exited 0 on the cut commit this branch already carries
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] **`audit` will show `skipped`** on this PR, because it changes no `package.json`. **Skipped is not a pass** — it means nothing was checked, on purpose. The real run was on the cut, exit 0

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration. **The release's one migration, `0427`, was applied to production and UAT before the deploys** and is recorded in both files
- [x] **Both deploy databases read while writing the record** — production and UAT each 428 applied, 0 pending, 0 drift

## 4. Functional checks

- [x] **Every figure in both records was measured, not recalled** — the 17 PRs from `release-prs.mjs` (exit 0); each plan's `Result:` line read by hand; the four hosts' Worker and app versions from `/api/releases/current` and `/api/version`; the icon probe from `/icon-192.png`; the deploy lines from the real output; the migration figures from `--status` on each project; `majorReleasesSince("0.47.6")` read directly
- [x] **Nothing is ticked in either record that was not run.** Twelve items in the `0.47.8` record are `pending: Lutan`, each one a press only a signed-in person on a deployed host can make, and the signed-out half is `n/a` because the public site is locked
- [x] **The `0.47.7` record states plainly that it never reached production**, so the version history does not read as a gap
- [ ] Empty state / invalid input / boundary cases — n/a: documents have no inputs
- [ ] A signed-in browser read — n/a: nothing here is served or rendered

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no gate

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: three markdown files, English, not served

## 6. Regression

- [x] The pages nearest the change still work — none: no file here is imported or rendered. The gates' typecheck and build cover that nothing accidentally references them
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by `scripts/check-release-handover.mjs`, which is the one consumer. **It will name `0.47.8` after this merges**; before it, it correctly reports the handover as naming `0.47.6`
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a record ticks nothing. The items this release's contents closed were ticked by their own PRs, and `#hostx` was closed on the backlog branch when the UAT sign-in was pressed
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **these three documents are the write-up.** The one judgement worth keeping — two records rather than one — is in §1
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a release record or a handover.** Neither is served, imported or rendered, and no behaviour changes. **This release's two notes shipped in #1773 and #1774 and were published by the `0.47.8` cut**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — every figure named in §4

## 8. Pre-production gate

- [ ] Deployed SHA / smoke test / UAT project line — n/a: **nothing is deployed by a record.** The smoke test it contains was already run against the deployed release, which is what the record is

### Rollback

- [x] Rollback position stated — reverting this PR removes three documents and restores a handover naming `0.47.6`. **Nothing live changes**, and the release it describes is unaffected

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (release completeness) | **Nothing asserts that an environment's Worker and its Pi app are on the same release**, which is how test and UAT sat on stale Workers while every `/api/version` agreed | **recorded, not fixed here.** Both Workers were deployed and all four hosts verified on both endpoints. The guard is worth building; it is named in the `0.47.8` record and the handover |
| 2 | low (process) | **Two cuts in one hour**, because a stream merged a release note between the first cut and its deploy | **recorded.** Cut after a batch has drained, not during it |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | The twelve `pending: Lutan` items in the `0.47.8` record — the Google sign-in journey above all | `lannacareforanimals.org` | **Lutan's.** Listed in the record itself, which is where they belong |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (planner session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: this PR adds three documents and there is nothing on screen to look at. The release's own pending presses are tracked in its record, not here

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the release is already deployed and verified; this PR is its record

Result: pass with accepted defects
