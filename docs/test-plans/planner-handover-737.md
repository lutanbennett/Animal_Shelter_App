# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `737` — a delta against `736` and its amendment, written at the setup of this plan's last batch. Reports what `736`'s owed items did, six band readings (one of them explicitly NOT a reading), the production figure that had been lost twice, four backlog corrections, and the next cause of the hand-over-list fault |
| Backlog item | `docs/backlog.md` → none. A handover is process bookkeeping, not a backlog item; `CLAUDE.md` names `docs/planner-handover.md` as one of the two documents whose PR merges on green |
| Branch / worktree | `claude/planner-handover-737` @ `C:\Development\Animal_Shelter_planner-handover-737` |
| Dev server | not started — docs only, no runtime surface |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner) / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | cf1d1fa0 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one file replaced, `docs/planner-handover.md`: edition `736` and its amendment superseded by edition `737`, a delta written at the setup of batch 3 as `CLAUDE.md` and the plan-day skill require**
- [x] Files/areas touched listed — `docs/planner-handover.md` (**191 added, 244 removed** by `git diff --numstat`, so it is shorter than its predecessor) and `docs/test-plans/planner-handover-737.md` (this file). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts.** `git ls-files --eol` reads `i/lf`, so the CRLF worktree has not turned the edit into something else
- [x] Cards affected identified — **none.** The file grants nothing, is read by no code, and has no card, page or activity attached to it. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **the plan itself.** `.plan-day.md` is gitignored and is not in this PR. So are the four backlog edits this plan made, which went to the `backlog` branch as the rules require: `#t48xh`'s title (`6daf2089`), `#w8k4p`'s wrong view (`42c5dab1`), `#t48xh`'s cutover finding (`4110a98a`) and its four-way slicing plus Lutan's phone-language requirement (`7af3ae7b`, `1bc50a2e`), and `#t3n9r`'s retitle (`01139804`). **Also out of scope: batch 3's three streams**, briefed and handed over with no session opened, so none of their figures are in this edition and the edition says so in its opening lines. **And the two columns `worktree.mjs streams` still lacks** — named as owed, not fixed, because this PR touches no scripts

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `n/a: refused by design in a worktree`. The branch was cut from `origin/main` by `worktree.mjs new` minutes before the gates ran, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run in this worktree, in the background, output redirected to a file and then read back; pasted below exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 66s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 162s
=== gates: test — npm test
=== gates: test exited 0 after 24s
=== gates: build — npm run build
=== gates: build exited 0 after 146s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration.

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `--status` reviewed before applying — `n/a: no migration`
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly — `n/a: no migration, and no code reads this file`
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: no migration`

## 4. Functional checks

A handover has no runtime behaviour. It is prose read by one chat. **So the functional check is whether
its CLAIMS are true, and that is what was done.**

- [x] Happy path works end to end — **every figure in this edition was read from its source in this session, not recalled.** (a) **The six token figures** come from the `stream-usage:` comments on PRs #1453, #1454, #1455, #1458, #1459 and #1460, read with `gh pr view --json comments`. (b) **The floors** are `tokens − messages` computed from those six: 107,936 · 110,666 · 111,752 for batch 1 and 84,412 · 85,425 · 85,425 for batch 2 — **and the edition reports the 25k gap as unexplained rather than averaging it away.** (c) **The production figures** (281 residents not listed publicly; 0 running text-approved appeals) are this planner's own read-only runs of `node scripts/check-production.mjs --env production` from the main checkout. (d) **The refusal meter** (217 messages, 90 functions, 73 person-read English) is `node scripts/measure-sql-refusals.mjs` at the tip of `main`. (e) **`0347:9`'s "public_resident_cards is NOT changed"** and **`0347:13`'s `appeal_running`** were read in the migration file. (f) **The `general_bill` finding** was read at `src/app/bills/general/page.tsx:95` and `0306:60`, and dated with `git log` to `c0109335`. (g) **The cutover date** was read in `wrangler.jsonc`'s UAT comment
- [x] Data persists — reload the page and the change is still there — **`n/a: no page`, and the equivalent was done:** the file was written and read back, `wc -l` 224, and `git diff --numstat` confirms a whole-file replacement rather than a corrupted append
- [ ] Create / edit / delete all exercised — `n/a: no UI`
- [ ] Empty state renders sensibly — `n/a: no UI`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

`n/a`: the file is in the repository, which is public. It is not served by the app, has no route and no
card.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a — not served by the app | n/a | n/a: no route |
| exactly one card | n/a — not served by the app | n/a | n/a: no route |
| signed out | n/a — not served by the app | n/a | n/a: no route |

- [ ] Every login above tested — `n/a: the file has no route and no card; there is nothing to sign in to`
- [ ] A login that should not have access is blocked server-side — `n/a: no route`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: no nav entry; NavLinks.tsx is untouched`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: the manual is for shelter users; a planner handover is not a shelter-facing document`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — **`n/a: no pages`, and the gates in section 2 are the regression evidence for the repository as a whole** (typecheck, lint, test and a full build on a tree containing this change)
- [x] Any shared file touched — **none.** `docs/planner-handover.md` is read by no code and imported by nothing; the only references to it are prose, in `CLAUDE.md` and `docs/release-procedure.md`, neither of which parses it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` by `worktree.mjs new` immediately before the work, so it carries `main` as of 2026-11-10 and the gates ran on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a handover has no backlog item, and this PR deliberately touches no backlog file. This plan's five backlog edits went to the backlog branch, as the rules require`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: no design choice. The edition reports measurements and corrections; the decisions it refers to already have their own files, written by the streams`
- [x] `README.md` still accurate — **unchanged and unaffected**; it does not describe the handover
- [ ] **Release notes.** `n/a: nobody at the shelter would notice. The file is read by one chat and by nobody using the app`
- [x] Commit messages say why, not just what — the commit says what this edition supersedes, that batch 3's figures are deliberately absent, and which of its claims were measured rather than recalled
- [x] **Claims were measured, not reasoned.** **This is the line that matters most, because a handover is nothing but claims.** Section 4's happy-path entry lists each class of claim and the command that produced it. **Three things this edition deliberately does NOT assert:** the 25k floor gap between batches is reported as **unexplained**, not theorised; the replacement band for `control-drive-24-pages` is written as **a hypothesis for the next edition to check**, not as a corrected row; and the `230–290k` audit row is carried forward **still untested for the sixth edition running** rather than quietly dropped. **And what this planner did not read is said plainly in the edition itself:** batch 3's three PR bodies, because they do not exist yet

## 8. Pre-production gate

Nothing here is deployed by this PR. The file is not served, not bundled and not read at runtime, so
each gate below is `n/a` with its reason rather than `deferred:` — there is no deploy-time moment at
which it would become true.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a: nothing is deployed by this PR`
- [ ] Deployed SHA matches the tested SHA — `n/a: nothing is deployed by this PR`

### On the deployed build

- [ ] Deployed to test — `n/a: nothing is deployed by this PR`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: no runtime surface to smoke-test`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date logic. The dates in the file are prose`
- [ ] Boundary or banding change — both edges covered — `n/a: no boundary in code. The band figures are a record of past readings, not a threshold any code applies`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the run's own output file, read back and pasted, including its per-gate timings
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: no deploy`
- [ ] `strip-baked-env` line seen — `n/a: no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: none added`

### Migration ordering — *skip if no migration*

Skipped: no migration.

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Backup fresh for a destructive migration — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this commit restores edition `736` as amended**, which is a correct but superseded document; nothing breaks either way. Nothing is deployed, no schema changes, and no running system reads the file. **What a revert would NOT undo:** `0347` and `0350` are applied (dev and, for `0347`, production) and reverting prose does not un-apply them; **`0348` remains pending on production and is destructive**; this plan's five backlog edits are on the `backlog` branch; and batch 3's three worktrees are on disk, not in git

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **A STREAM'S BAND WAS WRONG BY A FACTOR, AND THE EDITION CAN ONLY SAY SO RATHER THAN FIX IT.** `read-opened-pages-drive` was banded 260–320k from the driven-walkthrough row and drove **2 pages of 26** for 171,388. The row's per-step figure does not survive contact with the browser pane | accepted and **escalated into the next batch as an experiment**: the replacement stream is banded 220–270k with the static read already done, and the edition says in terms that this is **a hypothesis for the next edition to check**, not a corrected row. **Nobody should price a page drive from that row until it is measured properly** |
| 2 | **medium** | **BATCH 2's THREE FLOORS ARE ~25k LOWER THAN BATCH 1's, SAME MODEL, SAME EFFORT, SAME DAY** (84.4–85.4k against 107.9–111.8k), and two of the three are identical to the digit | accepted and **reported as unexplained rather than averaged**. If it repeats, every band built on a ~108k floor is ~25k too high, so the edition tells the next planner to re-derive and say which way it went. **Deliberately not theorised** |
| 3 | low | **The file is 224 lines against the ~150 target `CLAUDE.md` sets** — the sixth edition running to exceed it | accepted, **and it is the first edition to get SHORTER** (`735` 211 then 272, `736` ~270, this 224; `git diff --numstat` reads 191 added against 244 removed). The remaining cut is still the band evidence, which is duplicated in `.plan-day.md` |
| 4 | low | **Batch 3's three PR bodies are unread**, because the streams have not been opened | accepted — this is structural, not a miss: `CLAUDE.md` requires the handover to be written at the setup of the last batch. The edition says so in its opening lines and tells the next chat to read them |
| 5 | **medium** | **He had to ask for his hand-over list twice more** (sixth and seventh instances), and the structural fix shipped in `736` did not prevent it | **not fixed, and deliberately not restated as a rule.** The edition identifies a different cause — the list cannot be printed until the last brief is written — and gives the next planner a concrete change of order to make instead. **A sixth restatement of "send the list first" would have been the wrong answer** |

## Left for manual verification

Empty. There is no surface a person needs to look at: the change is one prose file, read by the next
planner chat, with no page, no card and no deployed behaviour. **The next edition is itself the
correction mechanism** — `CLAUDE.md` says a wrong line in a handover *"is corrected by its successor
rather than by a reviewer"*, and Lutan has never reviewed one, which is the reasoning that put these
PRs on merge-on-green.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-10

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so nothing is being signed for

Manual verification by: n/a: nothing to look at — one prose file, no page, no card, no deployed behaviour

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **nothing in this PR reaches production.** But the edition carries two things the release manager must read, and they are in its OWED section: **`0348` is still pending on production and is destructive** (drops columns and a view; take a fresh backup; **pin any apply with `--upto`, because the bare runner applies every pending file and `0350` and `0351` now queue behind it**), and **`0347` is applied, with the production reading taken: 281 residents in an enclosure are not listed publicly and no animal is public through an appeal alone**

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR reaches production — the pending-`0348` warning is carried in the handover's own OWED section, which is where the release manager reads it
