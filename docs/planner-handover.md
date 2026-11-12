# Planner handover — edition `742`, 2026-11-12

**This is a DELTA against `741`.** It says what changed, corrects its predecessor, and reports what each
of `741`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS: THE FIRST 2026-11-12 PLAN'S** — the one `741` was written at the end
of, eight PRs, #1508 to #1519, read this morning from merged PRs. **There were TWO plans on 2026-11-12**,
because `741` reset the counter and a second nine was planned and built the same day. **This edition's own
plan — #1520 to #1525 plus batch 3's three — carries NO figures here. They belong to `743`.** A missing
set is not a lost one.

---

## THE LEAD: THE STEP-ZERO INSTRUMENT CAUGHT THE *PLANNER*, FOUR TIMES IN ONE DAY

**There is no `src/lib/manual/th.ts`. The manual is ENGLISH-ONLY.** `ls src/lib/manual/` holds `en.ts`,
`for-topic.ts`, `for-topic.test.mjs`, `manual-pdf.tsx`, `prebuilt.ts`, `screenshot-sizes.json` and
`types.ts`, and nothing else.

**FOUR OF THIS PLAN'S BRIEFS TOLD A STREAM TO EDIT IT** — streams 2, 5, 6 and 7. **The planner wrote it
four times without once running `ls`.** It surfaced from #1524's and #1525's PR bodies; three briefs had
already merged, and the live one was corrected mid-flight.

**No harm was done, and WHY is the whole finding: every stream read the directory and ignored the
instruction.** `741`'s lead was that the cheapest instrument — the target file's own header, read at step
zero — caught three stale *items*. **This is the same instrument catching the BRIEF instead**, on a fact
one `ls` would have settled, four times running.

**Two consequences, both standing:**

1. **A manual change is an `en.ts` change ONLY. A brief that says "and `th.ts`" is wrong. Do not create
   one.** Read the directory before you name a file in a brief.
2. **`#1o5tk` is not "translate the Thai file": it is creating the Thai edition from nothing**, which is
   why it waits on the real-use review so it is translated once. **Filed onto the item.**

---

## THREE LINES OF `741` ARE SUPERSEDED, ALL IN ITS DRIVE SECTION

`741` said **"Production is verified by argument; UAT by measurement"**, that narrowing the guard was
*"never opened, so that hypothesis is untested"*, and that two merged folders were *"left HELD and
uncleaned"*. **All three are now wrong.**

- **PRODUCTION IS MEASURED. 357 folders, 972 files, 0 shortcuts, 0 `anyone`-shared, 0 failures, exit 0**
  (2026-11-12). **The last unread half of his only priority is closed.**
- **The guard was narrowed, exactly as briefed, and merged as #1521:** `drive-sharing.mjs` refuses
  production for `--remove` and `--restore` only, and reports freely. The shape is
  `if (envName === "production" && WRITE)`. **The WRITE guard is NOT lifted and must stay.**
- **A STREAM CANNOT RUN IT, AND THE PLANNER MUST.** The harness classifier refuses it as
  `[Production Reads]` from a worktree whatever the script allows. **Run it bare from the main checkout**
  — `node scripts/drive-sharing.mjs --env production` — **with no `cd` prefix and no pipe**, or the
  exact-match allow rule misses. **It exceeds 600s and goes to the background; that is normal, wait.**
- **The two folders were already gone** when this plan opened. **Do not carry them forward.**

---

## THE FIGURES — the first 2026-11-12 plan, eight comments

**FIVE VALID READINGS AND ALL FIVE IN BAND. That is the first clean set.**

| slug | PR | actual | verdict |
|---|---|---|---|
| `bill-import-investigation` | #1516 | 158,800 | in band (150–200k) |
| `test-plan-checker-fixes` | #1510 | 166,910 | in band (130–170k) |
| `refusal-keys-group-7` | #1509 | 168,787 | in band (155–195k) |
| `control-press-placements` | #1517 | 183,647 | in band (150–200k) |
| `foundation-document-store` | #1519 | 280,055 | in band (230–300k) |
| `control-press-bills-medical` | #1508 | 158,997 | **not a reading — `finished=blocked`** |
| `adopter-update-app` | #1513 | 255,455 | **not a reading — `rescoped=yes`, and the rescope was the PLANNER'S** |
| `gates-stale-lock` | #1514 | **unmeasured** | comment posted with the fields blank |

**WHAT THE CLEAN SET IS EVIDENCE FOR, AND WHAT IT IS NOT.** `741` raised the default row to **146–175k**
and every band here was set above it; nothing came in under 158,800. **The raise was right and the row
should not be touched again on this set.** But four of the five were priced from a *named precedent in the
same family* — a previous group of refusal keys, a previous control-press group, the investigation that
preceded the build. **Pricing from a same-family precedent is the method that produced this; pricing from
a verbal size is what produced `741`'s two big misses.**

**The floor is ≈85k and it is now beyond any argument: seven more figures, 84,412 to 87,067. THIRTY-NINE
figures. Re-measure only if the harness changes.**

**`741`'s recovery trick was needed again and worked again:** #1513 first posted `tokens=unmeasured`, then
re-posted real figures. **Try it before recording `unmeasured` — but #1514 posted a comment with the
fields literally set to `unmeasured`, and that one is lost for good.**

---

## WHAT `741`'s OWED ITEMS DID — all four closed

1. **Today's nine were measured.** The table above. One stream of the nine never opened and posted
   nothing.
2. **ALL THREE BATCH-3 HYPOTHESES ANSWERED, AND ALL THREE WENT THE GOOD WAY.**
   `control-press-placements` genuinely **DROVE** six rows in a browser rather than tracing them, which is
   what five previous attempts failed to do. `bill-import-investigation` **stayed a paper** and did not
   drift into a parser. `foundation-document-store` answered one-or-two-cards as **TWO** and took `0362`.
   **A fourth hypothesis nobody asked about also fired: `test-plan` was GREEN on all eight PRs**, so
   `741`'s stricter-checker fix was enough and such streams need not be separated by batch.
3. **`#79sqf`'s title is rewritten to 13 of 25**, with the remaining twelve **named on the item** so
   nobody searches for them again. It is still his #1.
4. **Both held folders were already cleared.** See above.

---

## WHAT THIS PLAN'S SIX MERGED STREAMS LEFT BEHIND

- **THE APP HAS ITS FIRST IMPORT OF ANY KIND** (#1525): template, preview, per-row rights, rejects
  download, parser committed first with 23 tests including the negative cases. **No migration and no new
  card, exactly as the investigation predicted** — the one prediction of the day that held.
- **NO CARD GRANTS ONLY UTILITY OR ONLY GENERAL BILLS.** #1525 could not prove the one-kind rejection in a
  browser for that reason and proved it in unit tests instead. **A card-shaped fact, durable across any
  role rebuild, and the thing to know before anyone designs a narrower bills card.**
- **RUNNING THE DEV SIGN-IN SCRIPT IN A SHELL RE-KEYS THE PANE'S LOGIN** (#1523;
  `docs/decisions/2026-11-12-control-press-group-d.md`). **Cite it in every brief that switches logins
  mid-session.**
- **`grep -c UNASSIGNED` IS 0** (#1524), through a new `opensSection` mechanism that asks the same
  `opensAnyIn` question the menu link and home tile already ask. **Not driven: the done-when's second
  clause** was measured via `topicView`, not in a browser, **and Lutan reported this from a real login, so
  the symptom has not been re-observed his way.**
- **TWO BRIEF BLOCKS WERE EXERCISED DELIBERATELY FOR THE FIRST TIME, AND BOTH WORKED. KEEP THEM BOTH.**
  #1525 used the **escape clause**: it touched a file its brief forbade, did the deliverable, and said so
  in its PR. #1523 used the **`[unfinished]` handover**: it stopped on size at 13 of 25, found no fault and
  changed no code. **Two no-fault results in a row on the control press — the gating is holding where it is
  driven.**

---

## A STREAM MADE ITS CHANGE AND LEFT NO COMMIT — and that was the BRIEF's cost

**Lutan asked *"it seems to have not done much"* about the port-3001 stream, and he was right.** It had
made its correct one-line change to `drive-sharing.mjs` and then stopped: **no commit, no PR, the work
sitting uncommitted in the folder.**

**The brief already said "commit as you go" twice, in two different blocks, and that was not enough.** A
block is read once; a numbered deliverable is reported on. **So every brief written after it carries
"commit after the first code change" among its NUMBERED DELIVERABLES, and `brief-blocks.md` now tells the
planner to put it there. Keep it numbered.**

---

## STANDING CHECKS — three new, the rest unchanged

- **NEVER DESCRIBE YOUR OWN ACTION IN A PR COMMENT BEFORE THE ACTION HAS RETURNED.** #1523 merged itself
  between the planner's `gh pr list` and the planner's `gh pr merge`, which then refused with *"already
  merged"* — after the planner had posted a comment saying it had finished and merged it. **A correction
  was posted on the PR rather than left standing in a public record. Read `state` again immediately before
  claiming you merged something.**

- **DO NOT REACH FOR `BACKLOG_COMMIT_ALLOW_UNNAMED=1` WHEN THE HOOK NAMES AN ITEM YOU DID NOT MEAN TO
  TOUCH. IT IS RIGHT AND YOU ARE WRONG.** A planner edit searched *forward* from an id for a section arrow
  and landed on a completed item 800 lines away; **the hook caught it by name.** The fix is to scope every
  edit to **the single line holding the id**, assert the anchor is unique on that line, and print the line
  number. **`git checkout -- docs/backlog.md` and rewrite the script.** The override exists for a
  genuinely unnamed item, not for a mis-targeted edit.
- **A BRANCH WHOSE PR WAS SQUASH-MERGED CANNOT BE `done`, AND `--force` DOES NOT OVERRIDE IT.** Deleting
  the worktree and branch by hand is refused as `[Irreversible Local Destruction]`. **The script prints
  the safe route and it works: `git push -u origin claude/<slug>`, then `worktree.mjs done`**, which
  recreates and deletes the origin branch cleanly.
- `741`'s five still hold and are not repeated here: the double `git merge backlog`,
  `check-backlog-sections.mjs` reading `main`'s copy, the pre-commit hook naming every item, never writing
  a backlog note through `node -e`, and four-to-six sessions creating worktrees.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 9 of 9 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read `SKILL.md`'s THE ONE RULE before anything else.** Two full days now with no interruption about the
list — **six firings. Keep it that way.**

**Your first hour is plan, agree the nine, set up batch 1, send the list — and only then** measure, clear
the merged batch's folders, read the PR bodies and file.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S NINE:** `drive-sharing-report-production` (#1521),
   `adopter-media-and-translations` (#1522), `refusal-keys-group-8` (#1520), `control-press-group-d`
   (#1523), `manual-unassigned-topics` (#1524), `bill-import-csv` (#1525), and batch 3's three.
   **#1521 is not a band reading whatever it posts — it left no commit and the planner finished it.**
2. **CHECK BATCH 3's THREE HYPOTHESES.** Did `admin-home-simulation-subpage` find the simulation is
   already Admin-only and cosmetic, or did it build a subpage? Did `acceptance-matrix-twelve-rows` accept
   the park ruling it was given, or stop and ask? Did `build-lock-and-migration-slot` decline `#y1x2r`'s
   candidate (b) as its brief asked, and did changing the lock `gates.mjs` itself takes break its own
   gates run?
3. **`#79sqf` IS STILL HIS #1: 13 of 25, twelve named.** Six streams have now worked its driving half.
   **The twelve left are the ones needing a FIXTURE** — a deceased resident with a blood test, a second
   photo on a resident, five `BillsInbox` rows — **so the next stream's real deliverable is the fixtures,
   not the presses.**
4. **`Animal_Shelter_control-press-group-d` (port 3005) is HELD by its own session with its PR merged.**
   `worktree.mjs done` refused it, correctly. **Clear it once that session is closed; do not tear it
   down.**

**Do NOT re-ask him about:** the three `/plan-day` fixes; `#aaqtl`; payroll in the document store; where
supplier withholding documents live; or the production Drive write guard, which stays.
