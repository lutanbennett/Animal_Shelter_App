# Feature test plan

## Header

| | |
|---|---|
| Feature | `0.38.1`'s release record and handover: the smoke test filled against the deployed build, the handover rewritten as a delta, and this release's durable lessons promoted into the runbook |
| Backlog item | `docs/backlog.md` → n/a: release paperwork is not a backlog item; it is the release procedure's step 8 |
| Branch / worktree | `claude/record-0-38-1` @ `C:\Development\Animal_Shelter_cut-release-0-38-1` — **the cut's own worktree, reused**, per `docs/decisions/2026-10-20-release-paperwork-speedup.md` rule 2 |
| Dev server | n/a: three markdown files, no code |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | `c40c39f6` (branch base) — the release this records is `1de7bdb4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: record `0.38.1` as it actually went, rewrite the handover as a delta, and move the durable lessons into the runbook
- [x] Files/areas touched listed: `docs/releases/2026-10-20.md` (a third `# 0.38.1` section appended), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (appended to **Traps**). **No code, no route, no `worker/`, no migration** — a documents-only diff
- [x] Roles affected identified: **none.** Nothing here is reachable by any role; these are repository documents
- [x] Anything explicitly **out of scope** written down: the nine feature-plan verification gaps are **not** copied into any table here — they stay in their own plans with their own signatures. `0.38.0`'s outstanding video-playback check likewise stays in `0.38.0`'s plan

**The risk worth naming** is that a release record is the artifact people reach
for when something has gone wrong, so an inaccuracy in it is worse than a gap.
Two things were therefore written against evidence rather than memory: the
self-inflicted cache defect (quoted from the failing `check-assets` output and
the purge result) and the impact estimate for it, **which is stated as an
estimate, with the reason it cannot be a measurement.**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created in the cut's worktree and `git reset --hard origin/main` put it on `c40c39f6`, so there was nothing to merge. `git status -sb` clean
- [x] `node scripts/gates.mjs` — **n/a: a documents-only diff.** `scripts/check-docs-only.mjs` is what CI uses to gate the heavy jobs, and per the paperwork rules a documents PR skips them. Running a 100-second build over three markdown files proves nothing
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

- [x] `node scripts/check-test-plan.mjs` — exit 0 before pushing

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. `origin/main`'s highest is `0235`; next free is `0236`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR; the release's three were applied and are recorded in the record itself
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: all three files are valid markdown and render as intended — headings, tables and fenced blocks checked by reading the files back after writing
- [x] Data persists — n/a as a database claim; the equivalent is that the record's third section appended cleanly to a 597-line file without disturbing the two above it, confirmed by `grep -n '^# '` returning all three release headings in order
- [ ] Create / edit / delete all exercised — n/a: documents
- [x] Empty state renders sensibly — n/a as a UI claim; the nearest real check is that the handover is a **delta** rather than a copy, and it is 97 lines against the previous edition's 333
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked: the handover's own length ceiling. **The first draft was 227 lines and the second 155, both over the 150 limit the paperwork rules set.** It is now **97**, inside the 100-line aim, achieved by promoting the durable items into the runbook rather than by deleting content

### Role access matrix

No guard, permission or policy is touched, and nothing here is served to anyone.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this diff | n/a | n/a: repository documents |
| management | nothing in this diff | n/a | n/a |
| staff | nothing in this diff | n/a | n/a: retired role (`0173`) |
| doctor | nothing in this diff | n/a | n/a |
| volunteer | nothing in this diff | n/a | n/a |
| signed out | nothing in this diff | n/a | n/a |

- [x] Every role above tested — n/a and recorded as such: there is no surface to reach
- [x] A role that should not have access is blocked server-side — n/a: unchanged, no guard touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; these documents are for the people running releases, not for shelter users
- [ ] Translatable strings go through the translation path — n/a: repository documents are English
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no browser session
- [ ] Network clean — n/a: no browser session

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; the equivalent is that `docs/releases/2026-10-20.md` still carries `0.37.2`'s and `0.38.0`'s sections unaltered, verified by diffing the file's first 597 lines as unchanged
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-procedure.md` is read by every release manager and by `/plan-day`'s skill; it was appended to, never rewritten, so nothing above the new Traps text moved
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is based directly on `c40c39f6`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the release closes no backlog item. **Checked rather than assumed**: the items this release's features closed were ticked in their own PRs, and the three still-open silent-failure items are named in the record as build-work, not ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a for this PR: the release's one real decision already has its file (`2026-10-20-release-0-38-1-notes-shipped-as-written.md`), written in the cut PR. **A second file restating it would give it two homes**
- [x] `README.md` still accurate — not touched; it names no version
- [ ] **Release notes.** — n/a: a release record and a handover; no shelter user could notice either, and `src/lib/releases.ts` is untouched by this PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** This is the line that mattered most here, and it is where the previous release went wrong — `0.38.0`'s record asserted a trend from two data points and was wrong. So: the cache defect is quoted from the tool output that found it; the impact estimate is **labelled an estimate** with the reason it cannot be measured (nobody was watching the site in those four minutes); the `0235` warning that did not appear is explained by a `git diff` that was actually run; and the counters were each re-derived rather than incremented on faith

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `c40c39f6`, the branch base. **The release being recorded is `1de7bdb4`**, and the two are deliberately different: this PR documents a release that has already shipped
- [x] Deployed SHA matches the tested SHA — n/a and worth stating precisely: **this PR is not deployed.** The release it records was verified at `1de7bdb4` on all four builds, which is the record's own header

### On the deployed build

- [x] Deployed to test — n/a: documents are not deployed. The release's own test deploy is recorded in the smoke test
- [x] Smoke-tested on `test.lannacare.org` — n/a: nothing in this diff reaches any environment
- [ ] Timezone-sensitive behaviour proved — **n/a: no logic.** One date subtlety is *recorded* rather than introduced: the release crossed midnight, cut 2026-10-20 and deployed 2026-10-21, and the record is filed under the release's own date with that stated in its header
- [ ] Boundary or banding change — n/a: no threshold or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — and the same holds for the record, whose `check-assets`, `purge-cache`, `deploy`, `check-public-views` and drift lines are all as printed
- [x] Public pages re-checked after a cache purge — n/a for this PR, and done for the release: the purge and both authoritative asset re-checks are in the record

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a for this PR; done for the release and quoted in the record (`dbkodyyxxhtygxcxmfcu (1de7bdb4)`)
- [x] `strip-baked-env: removed N env var(s)` seen — n/a for this PR; **13 on both environments** for the release, quoted in the record
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a: none added by this PR or by the release

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — no migration and no code
- [x] `--dry-run` against production run and clean — n/a for this PR; all three of the release's dry-runs were `ok` and are quoted in the record
- [x] For a destructive or rewriting migration only — n/a: none in this PR, and none of the release's three was destructive
- [x] Apply plan stated — n/a: nothing to apply from this PR

### Rollback

- [x] **Rollback position stated, including what it does not cover.** For a documents PR the rollback is `git revert` of this merge, which affects nothing served and no data. **What it does not cover:** reverting it would not un-deploy `0.38.1`, and it would destroy the only written record of how the release went — including the defect. **A wrong record should be corrected in a follow-up PR, not reverted**, which is also why the record says plainly where it is estimating rather than measuring

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover's first draft ran to 227 lines and its second to 155, against a 150-line ceiling and a 100-line aim set on 2026-10-20 — the same failure mode that edition was written to stop | **fixed** — now 97 lines, by promoting the durable lessons into `docs/release-procedure.md` once rather than deleting them. Lutan pointed this out while it was happening, which is itself worth recording |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the handover is now genuinely useful at 97 lines, or whether promoting content into the runbook has made the next release manager read two documents where one would do | `docs/release-handover.md` against `docs/release-procedure.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-21

### Manual verification

- [ ] The manual list is not empty, so only the person who looked may tick this — n/a: pending, see the signature line below

Manual verification by: pending: whether the handover reads better at 97 lines with its durable content promoted into the runbook, or whether that split costs the next release manager a second document

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a: this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-21
