# Feature test plan — handover-refresh-2026-10-17

## Header

| | |
|---|---|
| Feature | Refresh `docs/release-handover.md` for the state of `main` on 2026-10-17: withdraw the gate-script warning now its fix has landed, record Lutan's answer on the vet calendar, and re-read every state row |
| Backlog item | `docs/backlog.md` → none. The backlog item this refresh reports as **fixed** (gate scripts exiting 127) was raised on the `backlog` branch during `0.34.0` and closed by `3557e06e`; its tick belongs to that PR, not this one |
| Branch / worktree | `claude/handover-refresh` @ `C:\Development\Animal_Shelter_handover-refresh` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not started — no runtime surface) |
| PR | #691 — the plan guessed #690; another stream took it in the interval, as #678 was taken from the `0.34.0` record plan the day before. **A guessed PR number is wrong about as often as it is right here**, so it is corrected after opening rather than trusted |
| Tested by / date | Claude (production release manager session) / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, cut from `origin/main` at `e784df44` |

**Why this file is dated and the 2026-10-13 one is not.** `docs/test-plans/handover-refresh.md` already exists on `main` — PR #582, a previous refresh of the same document from the same branch name. Writing this plan at that path would have overwritten a historical test plan, so it is dated instead. **A plan filename is derived from the branch, and this branch name has been reused**, which is a collision worth knowing about for any recurring maintenance task.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Lutan asked for the handover to be updated; it had drifted in exactly the way it warns about, so each claim was re-read against `main` rather than edited from memory
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/release-handover.md`, one dated addition to `docs/releases/2026-10-16.md`, and this plan. **No code, no route, no `worker/`, no migration, no shared lib**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Repository documents, not served by the app
- [x] Anything explicitly **out of scope** written down — five things. (a) **Another stream's edit was deliberately left alone**: `claude/ci-script-fixes-fold` updated the `public-views` bullet on 2026-10-16 and theirs is newer and more specific than anything this refresh knows, so it is untouched and the refresh note says so. (b) **The `0.33.0` and `0.34.0` records are not rewritten** — a record states what was known at the time; the vet-calendar answer is added as a dated *addition* under the existing bullet, not a replacement. (c) **The 2026-10-13 plan at `docs/test-plans/handover-refresh.md` is not touched**, for the reason above. (d) The three pending production migrations (`0213`–`0215`) are **reported, not applied** — they belong to the next release. (e) No release is being cut here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `e784df44` minutes before the edits, so `sync` had nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). `n/a: not yet — the PR does not exist at this commit`
- [x] `node scripts/check-test-plan.mjs` — `ok`, **and its exit code read directly rather than through a pipe.** That is not a formality here: reading this checker through `| tail` is what hid a failing run on the `0.34.0` record PR, and this refresh is partly about that mistake

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.`

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. **Established for the record while re-reading the state rows:** the next free number is `0216`, `origin/main`'s highest is `0215`, and there are no unmerged `origin/claude/*` branches at all
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: nothing applied in this PR`. Production was read to fill the state row: `213 applied, 3 pending` (`0213`, `0214`, `0215`)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: nothing applied in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`; the three pending files are the next release's work and the handover now says so

## 4. Functional checks

This PR changes prose. What can be checked is whether the prose is **true**, and every factual claim in it was re-read from the live state rather than carried over.

- [x] Happy path works end to end — each updated claim was established by a command whose output is quoted in the PR: `--status --env production` for the pending count, `git ls-tree` plus a sweep of unmerged branches for `0216`, the `unreleased` block for the note count, `gh pr list` for open PRs, and `git log 598c2e56..origin/main` for how far `main` has moved
- [x] **The withdrawn warning was verified fixed, not assumed from a commit message.** `3557e06e` claims gate scripts now drain instead of calling `process.exit` after a `fetch`. Checked two ways: the tail of `scripts/facility-map-holders.mjs` now ends `await exitWith(...)`, and the script was run twice against test, exiting **0** both times with no `async.c` assertion. A withdrawal taken on trust would be worse than leaving the warning in place
- [x] Data persists — `n/a: no runtime state.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: no such surface`
- [x] Empty state renders sensibly — the relevant empty state is "no open PRs and no unmerged branches", which is what `gh pr list` and the branch sweep returned, and both are stated with their date rather than as permanent facts
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the boundary that matters for a snapshot document is **the date it is true on**. Every row changed now carries "as of 2026-10-17", and the one row that cannot be kept accurate (how far `main` has moved) was converted from a count into a standing warning, because a count is what went stale within hours last time

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this diff | repository documents are not served to any role | unchanged — no route, middleware or policy in the diff |
| management | nothing in this diff | as above | unchanged |
| staff | nothing in this diff | as above | unchanged |
| doctor | nothing in this diff | as above | unchanged |
| volunteer | nothing in this diff | as above | unchanged |
| signed out | nothing in this diff | as above | unchanged |

- [x] Every role above tested — tested at the level the change operates at: the diff contains no file any role can reach
- [x] A role that should not have access is blocked server-side — `n/a: these files have no URL`

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The handover is for whoever runs a release, not for shelter users
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [x] Mobile viewport (375px) — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing here runs in a browser`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: no page is near this change.` The consumers are human: the next release manager, and anyone auditing `0.34.0`
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file.** `docs/releases/2026-10-16.md` is the one file in this diff that a script reads: `check-test-plan.mjs` rejects a release record filed under `docs/test-plans/`. It was run on this branch and exited 0, which exercises that path at runtime rather than by inspection. Nothing imports `docs/release-handover.md`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` had nothing to merge, and the suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: this PR closes no backlog item.` The gate-script item it reports as fixed was closed by `3557e06e` and ticked there; ticking it again here would claim credit for another stream's fix
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided.` This refresh records decisions already made elsewhere (Lutan's answer on the calendar, another stream's fix) rather than making any
- [x] `README.md` still accurate — unchanged by this PR
- [ ] **Release notes.** `n/a: two repository documents for the release manager; no shelter user can reach either and nothing about the running app changed in this PR.` Note the **calendar** release note is explicitly *not* written here and the handover now says why: production is dormant by configuration, so a note would promise every admin something that does nothing. It is owed by whichever PR sets the calendar up on production
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The whole point of this PR. Three specific guards: the withdrawn warning was verified by running the fixed script rather than by reading its commit message; every state row was re-read from a command instead of carried over; and the previously-published inference that `strip-baked-env` listing the calendar vars might mean production was configured is **named as a dead end** rather than quietly dropped, because it was published twice and someone will otherwise repeat it

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this branch is cut from `e784df44`, the tip of `origin/main` when the work began. **Nothing is deployed by this PR**
- [x] Deployed SHA matches the tested SHA — `n/a: this PR deploys nothing.` Production remains on `0.34.0` @ `598c2e56`, re-read while filling the state rows

### On the deployed build

- [x] Deployed to test — `n/a: this PR is not deployed.` Docs-only, no build artefact
- [x] Smoke-tested on `test.lannacare.org` — `n/a: nothing in this PR reaches a browser`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The dates added are literal strings, written as "as of 2026-10-17" precisely so a later reader can tell how old the claim is
- [ ] **For a boundary or banding change, the assertions cover both edges.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line above and the script's `EXIT=0` quoted in the handover are as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked, so there is no cacheable public page, and this PR changes nothing public either way`

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: no deploy in this PR`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: no deploy in this PR.` Worth noting that this PR's substance includes **correcting an inference drawn from that line** in two previous records
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none.` It records that the calendar's two vars are configured on **test only**, which is Lutan's stated intent and not a gap to close

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither
- [ ] `--env production --dry-run` run and clean — `n/a: no migration in this PR`
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR`
- [x] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores the previous handover text and removes one dated addition to a release record. Nothing a user or the app can reach changes, no schema moves and no mail is sent, so the rollback is total and free. **What it would not cover:** the facts the document describes would still be true, so reverting would simply reinstate a handover that is wrong in five places

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor — found while refreshing, in the file being refreshed | The handover had drifted in five places within a day of being written: the gate-script warning it led with was already fixed, the vet-calendar item asked a question Lutan had answered, and four state rows (production pending, next migration number, `unreleased` count, open PRs) were stale. **The file warns about exactly this two sections later** | fixed by this PR. The structural change is the mitigation: rows that cannot stay accurate now carry "as of \<date\>", and the one that went stale within hours last time is a standing warning instead of a count |
| 2 | minor — avoided, not hit | The plan for this branch would have been written to `docs/test-plans/handover-refresh.md`, **overwriting a historical test plan** from PR #582 on 2026-10-13, because the plan filename is derived from a branch name that has been reused for the same recurring task | avoided — this plan is dated instead, and the reason is written into its header so the next refresh does not rediscover it. Nothing was lost |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether withdrawing the gate-script warning is the right call.** It is verified fixed on a current checkout, and the section is kept as history with the discrimination rule intact for older trees — but the judgement that a withdrawn warning beats a retained one is the file's own standing instruction being applied, and a second opinion is cheap | `docs/release-handover.md`, the first section |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: whether withdrawing the gate-script warning is the right call (row 1 above). Nothing here blocks the merge — the warning is verified fixed and is kept as history either way

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager, and this PR updates the handover it would otherwise read

Result: pass with accepted defects
