# Feature test plan — handover update after `0.39.4`

## Header

| | |
|---|---|
| Feature | Two additions to `docs/release-handover.md`: the backlog is folded into `main`, and #878 is open with its worktree `HELD` and deliberately not merged |
| Backlog item | `docs/backlog.md` → none; the handover is `docs/release-procedure.md`'s closing step, not a backlog item |
| Branch / worktree | `claude/handover-0-39-4-update` @ `C:\Development\Animal_Shelter_vet-visit-booking-polish` — the release's own worktree reused a third time, per paperwork rule 2 |
| Dev server | not started — no code in this PR |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | the handover commit on this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one markdown file, two facts added at Lutan's request to update the handover after the release closed. No backlog item; this is the runbook's closing step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly one, `docs/release-handover.md`. No code, no route, no Worker, no migration, no shared lib
- [x] Roles affected identified — none. The handover is not served by the app
- [x] Anything explicitly **out of scope** written down — **#878 is not merged by this PR, and that is the point of one of the two additions.** Its worktree is `HELD`, so the session owning it is still working; merging another live stream's feature PR is not a release manager's call. The record (`docs/releases/2026-10-23-0-39-4.md`) is **not** amended: it describes the release as deployed, and the backlog fold happened afterwards

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — the branch was created from `origin/main` at `3e7fa943` minutes before the edit, so there was nothing to merge
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — **n/a: a documents-only PR.** `scripts/check-docs-only.mjs` decides this and `ci.yml` gates every heavy job on it; the `0.39.4` record PR saw all eight heavy jobs report `skipping`, which is the gate working as paperwork rule 1 describes
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. `changes` and `test-plan` are the two jobs expected to run

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or why one is not needed — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the file renders as GitHub markdown: the two new table rows have matching column counts against the rest of the table, and the new paragraph sits inside the existing section
- [x] Data persists — the standing-in check for a document is that its claims are traceable. Both additions were measured: `main`, `origin/main`, `backlog` and `origin/backlog` all at **`3e7fa943`**, read with `git rev-parse`; #878's state read with `gh pr view` (`MERGEABLE`/`CLEAN`, two checks passing) and its `HELD` status from `worktree.mjs list`
- [ ] Create / edit / delete all exercised — n/a: the handover is edited in place and replaced wholesale each release
- [ ] Empty state renders sensibly — n/a: the document has no empty state
- [x] Invalid input is rejected with a readable message, not a crash — the relevant guard is `check-test-plan.mjs`, which validates this file's shape and is run below
- [x] Boundary cases checked — **the length limit is the boundary.** The edit took the handover to **exactly 150**, the stated hard limit, so a passage the record already covers in full was compressed back to **149**. Measured with `wc -l` both times, not estimated. **Shipping at the ceiling is how the next edition goes over it**

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | the file | no change — a repository document, not an app page | unchanged; this PR adds no page, route or permission |

- [ ] Every role above tested — n/a: no app surface in this PR
- [ ] A role that should not have access is blocked server-side — n/a: no app surface in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; the handover is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: a repository document, English by design
- [ ] Mobile viewport (375px) — n/a: no UI in this PR
- [ ] Browser console clean — n/a: no page was driven
- [ ] Network clean — n/a: no page was driven

## 6. Regression

- [x] The pages nearest the change still work — the consumer is the next release manager. **Both additions were checked against the document's purpose**: it is a delta, and neither addition restates anything `release-procedure.md` already holds
- [x] Any shared file touched — `docs/release-handover.md` is the one file every release rewrites, and this is an edit to the edition merged an hour earlier in #879, not a second edition. **No fact in it was contradicted**, only added to
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is one document beyond `3e7fa943`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. **The release's two items were filed on the `backlog` branch** and are now on `main` via the fold this PR records
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. **The one judgement made — not merging #878 — is recorded in the handover itself with its reason**, which is where the next release manager will look
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: one repository document that no user can reach.` Nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit says what was asked, what was added, and why #878 was left alone
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the four SHAs and #878's state were read from `git rev-parse`, `gh pr view` and `worktree.mjs list` rather than inferred. **The `HELD` status is the load-bearing fact** behind leaving #878 alone, and it was read rather than assumed from the PR being recent

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships no build. `0.39.4` is already deployed at `e077f45b` on all four builds, and nothing here changes that
- [x] Deployed SHA matches the tested SHA — n/a in the usual sense; **restated for clarity: this PR does not deploy.** A documents change reaches nobody until the next release builds, and nothing in it is user-visible even then

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only, no deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today"; the dates in it are literal
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no band, threshold or rounding rule. The one boundary present, the 150-line limit, was measured on both sides of the edit (150, then 149)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the SHAs and line counts quoted above are verbatim
- [ ] Public pages re-checked after a cache purge — n/a: documents only, and the purge for `0.39.4` was done during the release

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR runs no deploy. `0.39.4`'s line was read and is in the record
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — n/a: no deploy in this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores the handover as #879 merged it, with no runtime effect whatever. **What it does not cover:** nothing, because nothing is deployed by it. The `0.39.4` rollback position is stated in that release's own record and is unchanged by this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edit took the handover to **exactly 150 lines**, the hard limit, leaving no headroom | **fixed** before committing: a paragraph the record covers in full was compressed, bringing it to 149. The previous edition had the same problem and was trimmed from 150 to 148, so this is the second consecutive edition to hit the ceiling — **the aim of ~100 is not being met by either** |
| 2 | low | This is a **second PR against a document merged an hour earlier**, which paperwork rule 3 exists to avoid (the record and handover are meant to be one PR) | **accepted.** Rule 3's target is not paying two CI cycles for two documents written at the same moment; this addition could not have been written then, because the backlog fold and #878 both happened afterwards. Cost is one short documents-only cycle |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing from this PR. One repository document, no app behaviour | — |

**#878 is not listed here.** It is another session's PR, not an item this plan can
close, and putting it in this table would give it a second home that nothing closes.
It is named in the handover instead, with the reason it was left alone.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: a documents-only PR with no surface a person needs to look at

Manual verification by: n/a: a documents-only PR with no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
