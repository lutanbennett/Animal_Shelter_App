# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `737`, **AMENDED** — a banner correcting its claim that batch 3 was unstarted (all three had merged before this edition did), and a closing section carrying batch 3's three figures and findings, including the answers to the two questions `737` left open: the floor, and whether page-driving is worth buying |
| Backlog item | `docs/backlog.md` → none. A handover is process bookkeeping, not a backlog item; `CLAUDE.md` names `docs/planner-handover.md` as one of the two documents whose PR merges on green |
| Branch / worktree | `claude/handover-737-amend` @ `C:\Development\Animal_Shelter_handover-737-amend` |
| Dev server | not started — docs only, no runtime surface |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner) / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 2b75bbbd |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one file amended, `docs/planner-handover.md`: a banner at the top correcting the stale batch-3 statement, and a closing `AMENDED` section with batch 3's figures and findings. `git diff --numstat` reads 97 added, 0 removed**, so nothing in the merged edition was rewritten — it is purely additive, which is what lets a reader see what was corrected rather than only the corrected text
- [x] Files/areas touched listed — `docs/planner-handover.md` and `docs/test-plans/planner-handover-737-amend.md` (this file). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts**
- [x] Cards affected identified — **none.** The file grants nothing, is read by no code, and has no card, page or activity attached to it. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **the next plan.** `.plan-day.md` is gitignored and is not in this PR. So is the backlog item this batch's findings produced, `#p3q7m`, which went to the `backlog` branch as `aa02b4bc`. **And the band table itself is NOT rewritten:** the amendment says the floor is ≈85k and that every floor-derived row is ~23k too high, **but it does not edit those rows**, because revising a band table from six readings is the next planner's work and doing it inside a correction would bury it

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `n/a: refused by design in a worktree`. The branch was cut from `origin/main` by `worktree.mjs new` minutes before the work, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **run TWICE, and only the second run counts.** The first was started before the amendment was applied (the edit script had failed on a line-ending mismatch), so it would have tested the unamended tree. **It was discarded and the gates re-run on the tree being shipped.** Output of that second run, pasted exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 53s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 144s
=== gates: test — npm test
=== gates: test exited 0 after 26s
=== gates: build — npm run build
=== gates: build exited 0 after 170s
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
- [ ] Production apply plan stated — `n/a: no migration in THIS PR. The amendment does record that 0351 must reach production and now queues behind the destructive 0348 along with 0350, and that any apply must be pinned with --upto`

## 4. Functional checks

A handover has no runtime behaviour. It is prose read by one chat. **So the functional check is whether
its claims are true.**

- [x] Happy path works end to end — **every figure was read from its source in this session.** (a) **The three merge times**, which are the whole basis of the correction: `gh pr list --state all --head claude/<slug>` — #1462 `2026-11-10T12:04:52Z`, #1463 `12:06:19Z`, #1464 `12:11:14Z`, against #1465's own `12:27:11Z` read with `gh pr view`. **So the correction's central claim is confirmed: all three merged before the edition did.** (b) **The three token figures** from the PRs' own `stream-usage:` comments. (c) **The floors**, computed: 158,821−73,461 = 85,360; 158,923−73,563 = 85,360; 187,159−101,734 = 85,425. (d) **The method claim** — that `control-drive-24-pages` used `curl` and server-rendered HTML rather than the pane — is quoted from #1464's own body, *"it shows what the login is offered; it does not press anything"*. (e) **The Thai figures** (892 / 25 / 699 / 168 in 47 areas) and the **refusal meter** (11 functions / 21 keyed, 68 English) are from #1462's and #1463's bodies
- [x] Data persists — reload the page and the change is still there — **`n/a: no page`, and the equivalent was done:** the amendment was applied by a script that **anchors on the file's exact first heading and exits non-zero if it is missing — which it did, on the first attempt, because the working copy is CRLF and the anchor was LF.** That failure is the guard working; the script was fixed to normalise line endings and re-run, and `git diff --numstat` then read 97/0, confirming a targeted addition rather than a whole-file rewrite
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

- [x] The pages nearest the change still work — **`n/a: no pages`, and the gates in section 2 are the regression evidence for the repository as a whole**
- [x] Any shared file touched — **none.** `docs/planner-handover.md` is read by no code and imported by nothing; the only references to it are prose, in `CLAUDE.md` and `docs/release-procedure.md`, neither of which parses it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` immediately before the work, after batch 3's three PRs had merged, so it carries them and the gates ran on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a handover has no backlog item, and this PR deliberately touches no backlog file. The item this batch produced, #p3q7m, went to the backlog branch as aa02b4bc`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: no design choice. The amendment reports measurements; the three streams wrote their own decision files`
- [x] `README.md` still accurate — **unchanged and unaffected**
- [ ] **Release notes.** `n/a: nobody at the shelter would notice. The file is read by one chat and by nobody using the app`
- [x] Commit messages say why, not just what — the commit says that the edition's own claim went stale between writing and merging, how the rule is narrowed as a result, and which of batch 3's findings the amendment carries
- [x] **Claims were measured, not reasoned.** **This is the line that matters most, because a handover is nothing but claims.** Section 4 lists each class of claim and the command behind it. **Two things the amendment deliberately does NOT do:** it does not theorise why batch 1's floors were ~23k heavier — it says *"do not invent a reason"* — and it does not rewrite the band table it has just undermined, leaving that to the next planner with the reason stated. **And one claim is deliberately softened rather than reported as a pass:** the fallback proof is recorded as *"safe but generic"*, because `dbRefusal` sends an unknown key to a generic message rather than widening to the raw sentence as the brief assumed, **and the amendment says plainly that whether generic is good enough is a question nobody has asked**

## 8. Pre-production gate

Nothing here is deployed by this PR. The file is not served, not bundled and not read at runtime, so
each gate below is `n/a` with its reason rather than `deferred:`.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a: nothing is deployed by this PR`
- [ ] Deployed SHA matches the tested SHA — `n/a: nothing is deployed by this PR`

### On the deployed build

- [ ] Deployed to test — `n/a: nothing is deployed by this PR`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: no runtime surface to smoke-test`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date logic. The times in the file are prose, and the four that matter were read from GitHub rather than recalled`
- [ ] Boundary or banding change — both edges covered — `n/a: no boundary in code. The band figures are a record of past readings, not a threshold any code applies`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the second run's own output file, read back and pasted
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: no deploy`
- [ ] `strip-baked-env` line seen — `n/a: no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: none added`

### Migration ordering — *skip if no migration*

Skipped: no migration in this PR.

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Backup fresh for a destructive migration — `n/a: no migration here, but the amendment records that 0348 is destructive and still pending on production`
- [ ] Apply plan stated — `n/a: no migration here; the amendment states the production order and the --upto requirement`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this commit restores edition `737` as first merged, which is the version containing the stale batch-3 statement**, so a revert would reinstate the wrong claim rather than fix anything. Nothing is deployed, no schema changes, and no running system reads the file. **What a revert would NOT undo:** `0351` is applied to dev and **`0348`, `0350` and `0351` are all pending on production**; `#p3q7m` is on the `backlog` branch; and batch 3's three worktrees are on disk, not in git

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **THE EDITION CLAIMED A CHECK IT HAD RUN TWENTY MINUTES EARLIER AS THOUGH IT WERE CURRENT, AND ALL THREE STREAMS MERGED IN BETWEEN.** Third edition running to misstate a batch's state; `736` was amended for the same shape | **fixed in the record, and the rule narrowed rather than restated:** run the head check **in the same turn as the writing, and again immediately before `gh pr merge`**. The amendment says in terms that *"checked before writing" is not a property of the document unless the check is the last thing that happens*. **Whether that holds is the next edition's only test of it** |
| 2 | **medium** | **THE BAND TABLE IN THE MERGED EDITION IS NOW KNOWN TO BE ~23k TOO HIGH WHEREVER IT IS FLOOR-DERIVED**, because six of nine floors sit at ≈85k and only batch 1's three at ≈108–112k | accepted and **deliberately not fixed in this PR.** Revising a band table from six readings is the next planner's work; doing it inside a correction would bury it. **The amendment states the finding, the arithmetic and the instruction, and refuses to guess why batch 1 was heavy** |
| 3 | low | **The gates were run once against the wrong tree** — started before the edit script had succeeded | **fixed:** discarded and re-run on the tree being shipped, and section 2 says so rather than quietly pasting the second run |
| 4 | low | **The file is now 321 lines against the ~150 target `CLAUDE.md` sets**, undoing `737`'s improvement | accepted. **An amendment is additive by design** — it is 97 added and 0 removed, so the reader can see what was corrected. The cut remains the next editor's, and the band evidence is still the obvious place |
| 5 | low | **`control-drive-24-pages`'s figure is still not a clean band reading** (`finished=blocked`), so the drive/render row is informed but not settled | accepted and **marked as such in the amendment**, which prices the next one as a render pass while saying the figure is not a reading |

## Left for manual verification

Empty. There is no surface a person needs to look at: the change is one prose file, read by the next
planner chat, with no page, no card and no deployed behaviour. **The next edition is itself the
correction mechanism** — `CLAUDE.md` says a wrong line in a handover *"is corrected by its successor
rather than by a reviewer"*.

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
- [x] Handed to the production release manager — **nothing in this PR reaches production**, but the amendment adds one thing to what the release manager must read: **`0351` joins `0348` and `0350` as pending on production.** `0348` is destructive (drops columns and a view; fresh backup first), and **the bare runner applies every pending file, so any apply must be pinned with `--upto`.** `0351` also changes two caller behaviours a user can meet: `shelter_photo_folder` key errors now answer with their own wording (403) instead of *"resident not found"*, and a previously ignored error from `set_shelter_photo_folder` is now returned

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR reaches production — the three pending migrations and the two caller behaviour changes are carried in the handover's own OWED section, which is where the release manager reads it
