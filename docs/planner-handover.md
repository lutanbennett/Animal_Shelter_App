# Planner handover — edition `741`, 2026-11-12

**This is a DELTA against `740`.** It says what changed, corrects its predecessor, and reports what each
of `740`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS: THE 2026-11-11 PLAN'S, ten streams, nine comments** — read this
morning from merged PRs whose worktrees had been cleared. **This edition's own plan carries none. Its
figures belong to `742`.** A missing set is not a lost one.

---

## THE LEAD: THREE OF THE DAY'S NINE WERE WRONG ABOUT THEMSELVES, AND THE CHEAPEST INSTRUMENT CAUGHT ALL THREE

**An item's title is a claim with a date on it, and three were stale in three different ways.** None cost
a stream, because each was caught by reading the target file before a line was written.

1. **`#aaqtl` WAS ALREADY BUILT while its title still said *"buildable now"*.** Its own target script's
   header said *"There is no hand-copied `--access-token` any more; copying one out of DevTools was the
   procedure this replaced"* (2026-11-01). **What is left is three steps of Lutan's**, now quoted onto the
   item. **A worktree was created and cleared; no brief was written and no stream's floor was spent.**
2. **`#9975c`'s TWO CANDIDATE FIXES WERE ALREADY IMPLEMENTED.** The item offered *"name the holding
   process"* or *"detect and clear a dead owner"*; `scripts/lib/tree-lock.mjs` does both. **The real gap
   was different** — a stream has no sanctioned way to end a build its own interrupted gates run
   orphaned — and the brief said so up front instead of asking for what existed. Merged as **#1514**.
3. **`#79sqf`'s driving half had `0 of 25` rows pressed, not eleven.** #1508 traced them statically and
   reported it plainly: *"a weaker instrument than the brief asked for."* **Honest, and still not the
   thing.** That was attempt five.

**THE GENERALISATION, AND IT IS CHEAP: the instrument that caught all three was the target file's own
header or body, read at step zero** — not the decision files, not `git log`, not the item.

---

## THE ONE RULE HELD, THREE TIMES, AND THAT IS NOW A RESULT

**`740` asked for exactly this: *"Two firings are not a result. Check it again."*** Checked.

**All three batches ran (a) worktrees, (b) briefs, (c) `streams`, (d) the list, (e) everything else — and
there was NOT ONE INTERRUPTION about the list all day.** Batch 1 is the strongest evidence: a merged
leftover (`cut-release-0-44-3`, PR #1506) sat free in the very first `worktree.mjs list` read and was
**deliberately left until step (e)** — the precise case that cost three interruptions on 2026-11-11.
**Five firings now, three with a visible leftover in hand. Treat #1494 as settled and stop re-testing
it.**

**THE THREE FIXES ARE STILL HIS AND STILL UNANSWERED. They were NOT re-asked and NOT built.** (i)
`worktree.mjs batch` printing the list; (ii) every record out of the planning turn; (iii) a hook.
**The `worktree.mjs streams` printer still has no `batch` column — SIXTH EDITION** — and fix (i) closes
it as a side effect, which remains the best argument for it.

---

## WHAT `740`'s OWED ITEMS DID

- **`#c4vn7` HAPPENED, AND NOT BY THE PLANNER.** `740` called it *"the oldest thing waiting"* and it was
  owed again this morning. **Another session closed it**: PR #1515, the last five activity rulings, with
  `stock.usage` carded and migration `0361`. **The planner never booked the session.** Two editions owed
  it and someone else did it; **do not carry it forward.**
- **`#up3vf` and `#yiozr` both closed in one stream (#1510)**, as one script, as planned. The checker is
  now **stricter about the template's own placeholder tokens**, which is why every later brief warns
  about `SHA_HERE` and `GATES_HERE`.
- **`#9975c` closed (#1514)**, with its item's diagnosis corrected — see the lead.
- **THE BANDS TABLE ROW IS NOW CHANGED IN `SKILL.md`, NOT JUST RECOMMENDED.** `740` found the *ordinary
  well-briefed stream* row of **120–145k** had not been hit once in ten. It has now gone **twenty**
  figures without being hit: the lowest valid reading across the last two complete sets is **146,479**.
  **Raised to 146–175k**, on the skill's own licence (*"Bands — provisional, revise from the actuals"*).
  **Stop banding under it.**
- **The floor is ≈85k and it is beyond argument: nine more figures, 84,412 to 87,969. THIRTY-TWO figures
  now. Re-measure only if the harness changes.**

---

## THE FIGURES — the 2026-11-11 plan, nine comments from ten streams

**Six valid band readings. Four excluded, each for a stated reason.**

| slug | PR | actual | verdict |
|---|---|---|---|
| `acceptance-matrix-corrections` | #1504 | 146,479 | in band (120–155k) |
| `refusal-keys-group-6` | #1502 | 157,456 | in band (150–180k) |
| `pi-build-lock` | #1495 | 157,484 | **12% OVER** (110–140k) |
| `resident-hub-phone-labels` | #1499 | 160,861 | in band (150–185k) |
| `login-inapp-browser` | #1500 | 163,831 | in band (135–170k) |
| `adoption-updates-schema` | #1498 | 170,103 | **not a reading — `finished=blocked`** |
| `drive-links-app-served` | #1497 | 196,345 | **not a reading — `rescoped=yes`** |
| `control-check-false-positives` | #1496 | 248,402 | **34% OVER** (150–185k) |
| `control-drive-pane` | #1505 | **unmeasured** | **posted no comment at all** |

**THE ONE BIG MISS IS WORTH MORE THAN THE FIVE HITS, AND IT IS A NEW BAND ROW.**
`control-check-false-positives` was priced as *"modify a 444-line instrument"*. **What it actually did was
TEACH AN AST-LEVEL CHECK THREE UNTRACED CODE PATTERNS** and build ten fixture tests with negative cases.
**So: teaching a static check a new pattern is instrument-BUILDING, at instrument prices (250–320k), not
instrument-modifying.** Editing a check's thresholds or messages is cheap; teaching it to understand a
code shape it could not see is not, because the cost is in the resolution logic and not in the diff.

**`pi-build-lock` at 157,484 against 110–140k is the same lesson in miniature** and agrees with the
raised row: **the quick-win and floor-adjacent rows are still priced too low.**

**THE TWO DELIBERATE BAND TESTS `740` ASKED ABOUT — ONE CONFIRMED, ONE LOST.**
**`login-inapp-browser`: CONFIRMED, and the method should be reused** — told which way to err on
user-agent detection and asked for **unit tests instead of a device**, keeping it off the ~30k browser
premium, and it came in at 163,831 against 135–170k. **Deciding a judgement call IN THE BRIEF is cheaper
than letting a stream price its own uncertainty.**
**`control-drive-pane`: LOST.** No `stream-usage:` comment, so the band that made *how many click-only
controls there are* a deliverable to count cannot be judged. **And `brief-blocks.md`'s claim that a
NUMBERED usage deliverable has gone "3 of 3" is no longer true — it is 8 of 9. Do not repeat it.**

---

## A SIGNED-IN LOGIN THAT HOLDS NO CARD HAS NO SLOT ANYWHERE — the day's biggest finding

**Found when PR #1513 went red, not reasoned in advance.** An adopter is signed in, identified, and holds
no card. **Three mechanisms each assume a writer is staff or Admin:** every `use server` file under
`src/app` must name an activity or an admin check; a **service-role writer must carry its own admin
check** (`ADMIN_CHECK` is only `requireAdminUser|assertAdminRole|hasAdminRole|refuseUnlessAdmin`, which an
adopter action cannot honestly match); and from `0262` **every policy must resolve through
`has_permission()` or `is_admin()`**. **An adopter satisfies none of the three.**

**The one precedent dodges the question rather than answering it:** `services/sterilisation/actions.ts`
is the public sign-up and is **signed out by definition** — anon role, insert-only column grants — and
that escape does not transfer to an identified adopter.

**LUTAN RULED, ASKED DIRECTLY: record the service call and keep it.** He chose that over moving the gate
into the database and over ruling non-staff logins outside the card system. **What makes it honest rather
than a fudge: `account/password/actions.ts` is ALREADY in both lists**, for the same shape — a signed-in
user acting on their **own** data through one narrow service-role call after a check the code performs.
**A second instance of an existing pattern, not a new bypass. "Zero exceptions" still has exactly one
exception, Admin.**

**AND THE RULING IS NARROW. `#d6wxo`, the portal, is MANY actions, where listing each as a named
exemption stops being a list and becomes the exception.** Filed there: **put the question to him BEFORE
briefing that item**, not in CI on a red check.

**ALSO A COST OF THE BRIEF, NOT THE STREAM:** the stream used the service role because `0357`'s own
caveat told it to, and **the planner quoted that caveat into the brief without checking it against the
guards.**

---

## THE PRODUCTION DRIVE LOCKDOWN: HIS, DONE EARLY, AND VERIFIED BY MEASUREMENT

**Lutan locked Production's Drive himself on 2026-11-12, a day before the Friday he had set**, mid-turn
and unprompted, having been offered three ways to do it. **So `scripts/drive-sharing.mjs`'s
`--env production` guard was NEVER LIFTED and must stay.**

**The verification half — which nobody had ever run — is now closed by measurement, on UAT.** Three files
were first proved private (`shared: false`, one `owner` permission, **zero** of type `anyone`), and the
tree measured **347 folders, 916 files, 0 shared, 0 failures**. Then all three of the app's Drive
operations were re-run read-only: **listing** (6 calls, 5 folders, 0 failures), **bytes** via
`files.get?alt=media` (3 of 3), **renditions** via `thumbnailLink` (3 of 3).

- **Listing was never at risk, and now we know why rather than hoping:** `listTree()` calls
  `getDriveClient()`, so it lists **as the app owner**, and the per-file filter is `can_see_drive_file()`
  — **a database check, not a Drive one.**
- **`drive.ts`'s claim that un-sharing closes off `drive.google.com/thumbnail` is CORRECT, tested not
  trusted:** that endpoint and `/uc` both answer **`text/html` beginning `<!`**, a sign-in page, on a
  private file. **Both returned HTTP 200, so a status-code check would have read as success — check the
  content type and the magic bytes on any Google endpoint.**
- **NOT ESTABLISHED, and do not overstate it: none of this was measured on PRODUCTION and cannot be from a
  session here.** Two independent mechanisms refuse it: the script's guard, and the harness classifier as
  **`[Production Reads]`**. **Production is verified by argument; UAT by measurement.** A stream was
  briefed (port 3001) to narrow the guard to report-mode-only, at his instruction — **and it was never
  opened, so that hypothesis is untested.**
- **`#98se8` is unblocked by the lockdown and he chose it for the ninth slot.** Its binding date is **not**
  December 2027: the monthly half must take a bank statement by **the end of January 2027**, and he has
  been told.

---

## THREE PROCESS FINDINGS WORTH MORE THAN THEY COST

- **THE MIGRATION SLOT CANNOT BE RESERVED ACROSS SESSIONS, so `/plan-day`'s "one migration per batch" is
  UNENFORCEABLE** (`#y1x2r`). Two branches held `0360` at once; the second came from a session outside the
  plan, created after the planner's `list` read. **`check-migration-numbers.mjs` caught it because it
  reads OPEN PRs; the planner's own check had compared only `main` against the branch.** It resolved free
  — the other stream renumbered to `0361` and dev was already written in that order. **The real risk is
  not the clash, which is caught: it is a stream obediently renumbering a migration it has ALREADY
  APPLIED, leaving its row behind as drift. #1513 was invited to do exactly that by the check's own
  message and had to be told to stop.**
- **KILLING A STALLED STREAM IS FINE; KILLING ITS BRANCH IS THE EXPENSIVE MISTAKE.** #1513 looked stalled
  twice and Lutan proposed replacing it with a new stream. Its branch held five commits and `0360` already
  applied to dev, so **a fresh branch would have duplicated the number and orphaned the applied row.**
  **The correct shape, if ever needed: stop the SESSION, keep the branch and PR, start a fresh session on
  the same folder with a continuation brief.** In the event neither was needed — **both apparent stalls
  were CI runs in progress**, and one nudge from him recovered it. **`check` runs lint and a full build
  and takes several minutes; tell him "waiting on CI" in those words so the quiet is not read as a
  stall.**
- **A stream's usage reading can be recovered from OUTSIDE.** #1513 posted `tokens=unmeasured`; the
  planner read 218,862 via `get_usage` with that session's id, and the stream later re-posted real figures
  (255,455 / 168,388). **Try that before recording `unmeasured`.**

---

## STANDING CHECKS — what held, and one number that is not a fault

- **`git merge backlog` ran TWICE in one sync, exactly as `740` predicted** — a backlog commit arrived
  between the merge and the fast-forward (another session ticking `#etr20`: HSTS is a year on production,
  measured after the deploy, which closes his #3). **Expect it.**
- **`check-backlog-sections.mjs` reads `main`'s copy, NOT the backlog worktree's**, so run from the backlog
  worktree mid-edit it reports a count one behind. It said 48 open while `backlog-ids.mjs` said 49.
  **Neither was wrong. Do not chase it.**
- **The pre-commit hook refuses a commit whose message does not NAME every item it changes** — including a
  brand-new item's freshly assigned id. **Let `backlog-ids.mjs` assign it, then read it back out of the
  file and name it.**
- **DO NOT WRITE A BACKLOG NOTE THROUGH `node -e` IN DOUBLE QUOTES.** Bash read every backticked
  identifier as command substitution and blanked it, leaving *"a table, a  case and a card"* on `#98se8`;
  it took a second commit to repair. **Write to a script file in the scratchpad and run it by path**, with
  a guard that refuses to run against an already-fixed note. **A quoted heredoc is not a safe substitute
  either — one failed to parse on this document.**
- **Four to six sessions now create worktrees** — the backlog manager, the release manager, and sessions
  Lutan starts himself. `worktree.mjs list` is **not** a registry of the planner's work; a folder the
  planner did not create is not an orphan, and **a folder HELD by its session is never cleared.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 9 of 9 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read `SKILL.md`'s THE ONE RULE before anything else.** It held three times today — five firings, and the
first full day with no interruption about the list. **Keep it that way.**

**Your first hour is plan, agree the nine, set up batch 1, send the list — and only then** measure, clear
the merged batch's folders, read the PR bodies and file.

**WHAT IS OWED:**

1. **MEASURE TODAY'S NINE.** `control-press-bills-medical` (#1508), `test-plan-checker-fixes` (#1510),
   `refusal-keys-group-7` (#1509), `adopter-update-app` (#1513), `gates-stale-lock` (#1514), batch 3's
   three, and the unopened port-3001 stream. **Read #1513's as `rescoped=yes` and keep it out of the
   bands: the rescope was the PLANNER'S**, not the stream's.
2. **CHECK BATCH 3's THREE HYPOTHESES.** Did `control-press-placements` actually DRIVE six rows, or trace
   them like its predecessor? Did `bill-import-investigation` stay a paper, or drift into a parser? Did
   `foundation-document-store` answer the one-or-two-cards question, and which migration number did it
   take?
3. **`#79sqf` IS STILL HIS #1 AND ITS TITLE IS STILL WRONG.** Rewrite it from whatever driven count batch
   3 reports. **Five streams worked its driving half and `0 of 25` were pressed before today.**
4. **Two merged folders were left HELD and uncleaned** — `adopter-update-app` and `refusal-keys-group-7`.
   **Clear them once their sessions are closed.**

**Do NOT re-ask him about:** the three `/plan-day` fixes; `#aaqtl`; payroll in the document store; where
supplier withholding documents live; or lifting the production Drive guard.
