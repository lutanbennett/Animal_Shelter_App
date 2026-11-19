# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release record for `0.47.3` — the smoke test filled in, the testing gaps Lutan asked for, and why production's fallback Worker is deferred |
| Backlog item | n/a: a release record closes no backlog item. The one gap it found was filed separately as `#pdmin` on the `backlog` branch |
| Branch / worktree | `claude/record-0-47-3` @ `C:\Development\Animal_Shelter_record-0-47-3` |
| Dev server | n/a: docs-only, nothing is served or rendered |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | the branch head; it is branched from `7b0d7bb93`, which contains the release commit `c473c1f35` |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-11-19-0-47-3.md`, the filled-in smoke test for a release that **shipped to every user and did not finish deploying its production fallback Worker**
- [x] Files/areas touched — `docs/releases/2026-11-19-0-47-3.md` and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the record is a document. It is not served, imported or rendered, gates nothing and changes no behaviour
- [x] Out of scope, written down so the next release manager is not surprised — **this PR does not deploy anything and does not close the deferred Worker.** It also does not edit any applied test plan: `calendar-connect-screen`'s and `scheduled-writer-visibility`'s release-note reasons are now partly out of date, and that is recorded in the record rather than fixed in their files, because an applied plan is a historical record

### This record describes a partially deployed release, which is unusual and is the reason to read it

`0.47.3` put every user on the new version — all three sites are served by the Pi at
`c473c1f35`, both databases hold all 416 migrations — but **production's fallback Worker is still on
`0.47.2`**. Lutan's one command failed twice on a font fetch, the cause was found and fixed, and the
third attempt was refused because a feature stream had merged and the tree was no longer a
written-down release. The record sets out why that is safe (this release's eight migrations are
purely additive, so older code against the newer schema is the safe direction), what it costs, and
what closes it.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `7b0d7bb93` by `worktree.mjs new` and nothing has been merged into it
- [ ] `node scripts/gates.mjs` — n/a: **docs-only.** No TypeScript, lint target, test or build input changed. `check-docs-only.mjs` is what CI reads to make the same judgement, and the four gates ran in full on the cut PR (#1715), which is the commit this record describes: `typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. The release's eight (`0408`–`0415`) landed in their own PRs and were applied by the release manager; their readings are in the record

## 4. Functional checks

- [ ] Happy path / data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: **a release record has no surface.** It is a file in `docs/`, not served, imported or rendered, and no route reads it
- [x] **The figures in it were re-read rather than remembered, which is this document's equivalent of a functional check.** Every number in the record came from a tool's own output in this session: the version and SHA on each host from `/api/version` and `/api/releases/current`; the migration counts from `apply-migrations.mjs --status` on both databases; the lint counts from `check-tenancy-catalogue.mjs --strict` before and after on production; the backup's size and timestamp from Drive's own listing rather than `backup.log`; the asset byte counts from `check-assets.mjs` run on the Pi after the purge; the Server Actions fingerprints from the two Worker deploys and the three Pi logs; and the IPv4/IPv6 readings from `curl -4` and `curl -6` against the exact failing URL

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the record adds no route and no card reads it

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path is touched by a document in `docs/releases/`

## 6. Regression

- [ ] The pages nearest the change still work / shared file touched / nothing merged from `main` was broken — n/a: nothing imports `docs/releases/`, no shared file is touched, and nothing was merged into this branch

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the record itself. **What this release closes and leaves open is named where it belongs**: `#swrun`'s production step (`0413` reaching production) is corrected on the `backlog` branch, and the gap this release found is filed there as `#pdmin`
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the record *is* the write-up. Its one judgement — deferring production's fallback Worker rather than cutting again or reaching production another way — is set out in the record under its own heading, with the guards quoted by file and line
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record. The file is not served, imported or rendered and no behaviour changes. **This release's one note shipped in the cut PR (#1715) and mailed nobody**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — see §4. Two in particular, because both would have been easy to assert: *"the fallback Worker is safe one release behind"* is argued from grepping all eight migrations for every tightening and destructive form, not from their looking harmless; and *"the deploy cannot be retried"* is read from `releaseProblems()` at `scripts/lib/release-guards.mjs:24` and the guard at `scripts/deploy.mjs:304–316`, which has no override flag, rather than from the refusal message alone

## 8. Pre-production gate

- [ ] Every line in this section — n/a: **this PR ships no code to any environment.** The release it describes was deployed before it was written, and what was not deployed — production's fallback Worker — is the subject of the record rather than something this PR changes. The three hosts were re-read when the record was written: all three serve `0.47.3` @ `c473c1f35` with `x-lanna-served-by: pi`, and the Worker bundles read `0.47.2`, `0.47.3`, `0.47.3` for production, test and UAT

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (operational, no user surface) | **Production's fallback Worker is a release behind.** Lutan's deploy failed twice on the IPv6 fault and was then refused because a feature stream had merged | **recorded, not fixed, and deliberately so.** Both guards that refuse it are correct and neither has an override; reaching production by another path is what `CLAUDE.md` forbids. Safe because this release's migrations are purely additive. Closed by the next release's production Worker deploy |
| 2 | medium (a shipped screen nobody can open) | **Nobody is a product administrator on production and no script places the first one**, so the screen this release's one note describes is live and unreachable | **found, raised, filed as `#pdmin`.** Not fixed inside the release: whose account is first is Lutan's call |
| 3 | low (tooling) | **`deploy.mjs --plan` reports the mail decision without reading the release's own `major` flag**, so it says "would be mailed" on a no-email release | **found, not fixed.** The deploy itself is correct, proven by both real runs. Worth a one-line fix outside a release |
| 4 | low (cosmetic, deferred on purpose) | **`sync-home-icons.mjs --env production` was not run** — about 350 images in a shared Drive folder, skipped while the machine was building three feature streams | **deferred.** The app draws icons in the browser regardless; only the shared folder is stale |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Who the first product administrator is, and whether that account already has an authenticator** — defect 2. Every write on that screen needs `aal2`, and a PADMIN with no authenticator cannot self-enrol | Lutan, then the `#pdmin` script |
| 2 | **Lanna's calendar status tile and the Confirm list on Upcoming visits.** The record argues from the code and the live database that nothing changed for Lanna; this is the look that confirms it on screen | Lutan |
| 3 | **The nine `pending:` items from the release's own plans**, listed in the record with who owns each | Lutan, and a Thai reader for the dictionaries |
| 4 | **That the record reads true to the person who ran the production deploy** — it describes his three attempts, the two failures and the refusal, and he is the only person who saw them from the other side | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Lutan for the first product administrator, the calendar look on test, and whether this record reads true to the person who ran the production deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager. **The one step left is the next release's production Worker deploy**, which is Lutan's and is not part of this PR

Result: pass with accepted defects
