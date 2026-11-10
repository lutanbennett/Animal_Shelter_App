# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `736`, **AMENDED** — six passages corrected in place, each marked `AMENDED`: batch 3's three streams had all MERGED before the edition claimed they were "briefed and handed over with no session opened"; `0347` was applied to production and `#7aev4` ticked; `appeal-override` was found stale and filed as `#v6r4m`; and the printer the edition's lead fix called for had landed but was missing a column |
| Backlog item | `docs/backlog.md` → none. A handover is process bookkeeping, not a backlog item; `CLAUDE.md` names `docs/planner-handover.md` as one of the two documents whose PR merges on green |
| Branch / worktree | `claude/handover-736-amend` @ `C:\Development\Animal_Shelter_handover-736-amend` |
| Dev server | not started — docs only, no runtime surface |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner) / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 422909a2 |

**WHO FINISHED THIS, AND IT MATTERS FOR READING THE REST.** The amendment's content was written by the
**previous** planner session (Remote Control), which went offline leaving **one commit, no PR, and an
unfilled copy of the template as its test plan**. **A later planner session finished it:** fetched and
merged `origin/main`, re-verified every figure in the amendment against its source, fixed one
placeholder timestamp, filled in this plan, ran the gates, and opened and merged the PR. **Every tick
below was earned by the finishing session, not inherited** — and where it did not verify something, it
says so rather than ticking it.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one file amended, `docs/planner-handover.md`: six passages of edition `736` corrected in place, each marked `AMENDED`, because two of the three batch-3 streams it described as handed-over-and-unstarted had already merged when it was written (#1448 at 00:33Z and #1447 at 04:03Z, against the handover's own merge at 06:36Z)**
- [x] Files/areas touched listed — `docs/planner-handover.md` (amended) and `docs/test-plans/planner-handover-736-amend.md` (this file). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts.** The diff is targeted, not a whole-file rewrite — `git diff --numstat` is pasted in section 6, and `git ls-files --eol` reads `i/lf` for the handover, so the CRLF worktree has not turned the edit into a whole-file change
- [x] Cards affected identified — **none.** The file grants nothing, is read by no code, and has no card, page or activity attached to it. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **the next plan.** `.plan-day.md` is gitignored and is not in this PR. So are the two backlog corrections the finishing session made the same day (`#t48xh`'s title at `6daf2089`, `#w8k4p`'s wrong view at `42c5dab1`), which went to the `backlog` branch as the rules require. **Also out of scope: the column `worktree.mjs streams` still lacks, and its table-versus-plain-lines output** — the amendment names both as owed and deliberately does not fix them, because that is a script change and this PR touches no scripts. **And the `0348` production apply**, which is Lutan's and destructive

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `n/a: refused by design in a worktree`. `git fetch origin && git merge origin/main` was run in its place and made a real merge commit (`docs/backlog.md`, 6 insertions, 3 deletions), so this branch carries `origin/main` as of 2026-11-10
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run in this worktree, in the background, output redirected to a file and then read back; pasted below exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 36s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 356s
=== gates: test — npm test
=== gates: test exited 0 after 74s
=== gates: build — npm run build
=== gates: build exited 0 after 191s
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

A handover has no runtime behaviour. It is prose read by one chat. **So the functional check for this
PR is whether its CLAIMS are true, and that is what was actually done.**

- [x] Happy path works end to end — **every factual claim in the amendment was re-verified against its source by the finishing session, not taken on trust.** (a) **The three merge times:** `gh pr list --state all --head claude/<slug>` for all three batch-3 slugs — #1448 merged `2026-11-10T00:33:01Z`, #1447 `2026-11-10T04:03:20Z`, #1451 `2026-11-10T06:53:03Z`. **So the amendment's core claim is confirmed: two of the three merged hours before `736` merged at 06:36Z, and the third 17 minutes after.** (b) **The three token figures:** read from the `stream-usage:` comments with `gh pr view <n> --json comments` — `brief-block-timeout` 153,300, `unruled-activities-sheets` 183,793, `refusal-keys-photos` 155,958, **each matching the amendment exactly.** (c) **The floors:** `tokens − messages` = 107,840 · 106,753 · 107,838, which is the amendment's "106.8–107.8k". (d) **The two SQL rules:** `private.appeal_running` read at `supabase/migrations/0347_public_website_gate.sql:13` — `coalesce(p_published,false) and p_status in ('live','funded')`, as the amendment states — and the stale `status <> 'draft'` read in the `appeal-override` entry of `scripts/lib/readonly-checks.mjs`, as it states
- [x] Data persists — reload the page and the change is still there — **`n/a: no page`, and the equivalent was done:** the amended file was read back from disk after the timestamp fix, and the fix script anchored on the exact text it replaced and would have exited non-zero on a missing anchor
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

- [x] The pages nearest the change still work — **`n/a: no pages`, and the gates in section 2 are the regression evidence for the repository as a whole** (typecheck, lint, test and a full build on a tree containing this change and `origin/main`)
- [x] Any shared file touched — **none.** `docs/planner-handover.md` is read by no code and imported by nothing; the only references to it are prose, in `CLAUDE.md` and `docs/release-procedure.md`, neither of which parses it. **Diff size:** `git diff --numstat origin/main...HEAD -- docs/planner-handover.md` is pasted in the PR body
- [x] Nothing merged from `main` during `sync` was broken by this branch — `origin/main` was fetched and merged **before** the gates ran, so the gates ran on the merged tree, not on the branch alone

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a handover has no backlog item, and this PR deliberately touches no backlog file. The two backlog corrections made the same day went to the backlog branch, as the rules require`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: no design choice. The amendment is a report of measurements, and the decisions it refers to already have their own files`
- [x] `README.md` still accurate — **unchanged and unaffected**; it does not describe the handover
- [ ] **Release notes.** `n/a: nobody at the shelter would notice. The file is read by one chat and by nobody using the app`
- [x] Commit messages say why, not just what — the amendment's own commit says which statements went stale and why; the finishing commit says the branch was stranded by an offline session, what was verified before merging, and that this is the `708` failure repeating
- [x] **Claims were measured, not reasoned.** **This is the line that matters most, because a handover is nothing but claims.** Section 4's happy-path entry lists each claim and the command that confirmed it. **One claim was found WRONG and corrected rather than ticked:** the amendment carried `AMENDED 07:0xZ`, a literal placeholder, replaced with `07:31Z` after reading the amend commit's own timestamp (`git log -1 --format=%cI` → `2026-11-10T14:31:20+07:00`). **And where the finishing session did NOT verify something, it says so:** it did not read the four unplanned PRs the edition names, and it has not independently confirmed that #1451's two skipped proofs are still outstanding beyond reading that PR's own test plan

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
- [ ] Timezone-sensitive behaviour proved — `n/a: no date logic. The dates and times in the file are prose, and the one that was wrong was corrected by reading the commit's own timestamp`
- [ ] Boundary or banding change — both edges covered — `n/a: no boundary in code. The band figures in the file are a record of past readings, not a threshold any code applies`
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

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of these commits restores edition `736` as first merged, which is the stale version**, so a revert would reinstate the six wrong statements rather than fix anything. That is the whole of it: nothing is deployed, no schema changes, and no running system reads the file. **What a revert would NOT undo, and it is worth naming:** `0347` is already applied to production and reverting prose does not un-apply it; `0348` remains pending there and is destructive; the two backlog corrections are on the `backlog` branch; and the next plan's three worktrees are on disk, not in git

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **THE AMENDMENT EXISTS BECAUSE EDITION `736` COMMITTED THE FAULT `735` WAS AMENDED FOR — THE THIRD EDITION RUNNING.** It described a batch's state from what the planner had DONE to it rather than what had HAPPENED to it since, and two of three streams had merged hours earlier. **Lutan found it, by asking whether the handover was done and up to date** | **fixed in the record, and the rule is written into the amendment's own banner as one command:** before writing a handover, run `gh pr list --state all --head claude/<slug>` for **every stream the edition mentions, including the batch being handed over.** Whether it holds is the next edition's only test of it |
| 2 | **medium** | **THE BRANCH WAS STRANDED: one commit, pushed, no PR, test plan unfilled, and its session offline.** This is exactly the `708` failure that `736` and `CLAUDE.md` both warn about — *written, pushed, never PR'd, so `main` read the old edition for a day* — **repeating inside the very document that warns about it** | **fixed:** found by a later planner reading `worktree.mjs list` for `ahead` and `held` before creating worktrees, then verified, finished, PR'd and merged. **The general lesson, already in `CLAUDE.md`: a branch ahead of `main` with no PR is unsubmitted work, and reading the `ahead` column at step 2 of `/plan-day` is what catches it** |
| 3 | low | **The amendment carried a literal placeholder, `AMENDED 07:0xZ`,** into a committed file | **fixed** by reading the amend commit's own timestamp and writing `07:31Z` |
| 4 | low | **The file is now well over the ~150-line target `CLAUDE.md` sets** — the fifth edition running to exceed it (`717` 174, `726` 195, `735` 211 then 272, `736` now longer still) | accepted, **and escalated for the second edition running**: the next editor should cut it to target as its own piece of work. The obvious cut is still the band evidence, which is duplicated in `.plan-day.md` |
| 5 | low | **Four unplanned PRs named in `736` are still not reported on**, and the finishing session did not read them either | accepted and **said out loud rather than quietly ticked** — see section 7's last line. Filing from them is the next planner's work |

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
- [x] Handed to the production release manager — **nothing in this PR reaches production.** But the amendment carries one thing the release manager must read, and it is part of why this PR should not sit: **`0347` IS APPLIED to production and `0348` IS NOT.** `0348` drops columns and a view, PR #1444 says take a fresh backup first, and **the bare runner applies every pending file — so any future apply must be pinned with `--upto`.** The amendment's OWED section says so, which is where the release manager reads it

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR reaches production — the pending-`0348` warning above is carried in the handover's own OWED section, which is where the release manager reads it
