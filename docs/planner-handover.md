# Planner handover — edition `609`, 2026-11-03

**A delta over `600`.** It carries this plan's **batches 1 and 2 in full** and **batch 3's setup**.

> **THE LEAD, AND IT IS A BRIEF-AUTHORING RULE: AN ANSWER CARRIED FORWARD FROM A SIBLING STREAM IS ONLY
> AS WIDE AS WHAT THAT SIBLING COULD SEE.** #1229 (schema) answered *"does the video route have the same
> public path as the photo proxy?"* — **true, at the database level, and it quoted the two call sites.**
> The planner wrote it into #1233's brief as **settled, with "do not re-investigate it"**. **The
> app-level answer was NO:** `/api/videos/` was absent from `src/lib/public-paths.ts`, so a signed-out
> visitor was redirected to `/login` and **no public video could have played at all.** #1233 found it
> anyway and fixed it. **A schema stream reads SQL; it cannot tell you whether a route is in a
> middleware allow-list. SAY AT WHICH LAYER AN ANSWER WAS ESTABLISHED, and never pair a
> carried-forward answer with a blanket "do not re-investigate".**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `618`, due when the
next plan's last batch is set up.** **BATCH 3's FIGURES ARE NOT IN THIS EDITION; `618` carries them.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## "REPORT, DON'T FILE" FOUND A LIVE PRIVACY LEAK, AND THE BRIEF THAT SAID *REPORT, DO NOT CHANGE* IS WHY

**The best work of this plan was again on no item.** Three faults, all from streams told to report:

- **A REAL LEAK, MEASURED.** `record_attachment` makes a resident's **first** file their profile
  picture, and a profile picture is public — so a video on an update **nobody had shared** became that
  resident's public profile picture and was served to signed-out visitors. #1233 measured **206 before
  its fix, 404 after.** Fixed app-side; **filed because that is a courtesy, not a guard** — every other
  caller can still do it.
- **THE AUTO-APPROVAL, AND THE BRIEF'S WORDING IS THE WHOLE LESSON.** #1233's deliverable 8 said
  *"REPORT, do not change"*, because nobody had established whether auto-approving adoption-update files
  was intended. It reported; the planner **verified it on `main`** (`0217_photo_approval.sql:82`); Lutan
  was asked and said **it should be approved.** **So a line that had looked like a design for weeks is a
  fault, and it only surfaced because a stream was forbidden from fixing it.**
- **A THIRD SITE of the insert-as-caller doctor fault** (changing a visit's clinic), found by #1232 while
  diagnosing a harness red. **The existing item was WIDENED from "a second instance" to the class rather
  than filed again** — recording one fault twice is its own failure mode and the duplicate usually
  carries the better diagnosis.

## WHAT `600`'s WARNINGS DID

- **The gates as a NUMBERED deliverable with its own read step — `600`'s prescription — WORKED: 9 of 9.**
  Not one stream ended a turn waiting to be notified. **Promote it into the skill's brief blocks** (#1228
  did exactly that this plan, so **it is now the skill's own block** — check next round that planners stop
  hand-writing it).
- **The usage comment: 9 of 9, against 4 of 6 last plan.** The sentence that did it is *"once your process
  exits that figure cannot be recovered by anyone"* plus naming both calls. **Keep it verbatim.**
- **Report-every-deliverable: 9 of 9, so 18 of 18 across two plans.** Treat as mechanism. Three streams
  reported a deliverable they deliberately did **not** do.
- **Step zero fired on a NEGATIVE again:** #1228 was told claim (1) was *probably already satisfied, establish
  it, do not invent work* — and it **closed the claim and edited nothing.** Two plans running.
- **Filing into the right SECTION: held, 8 items filed, none misfiled.** Also matched `Next up`'s own
  convention (home-section notes) after forgetting it once.
- **Re-reading the TITLE of every item a stream touched: PAID BIGGEST YET — 3 of 4 in batch 1 alone were
  ticked under titles still reading as live faults**, one of them *"…IS OFFERED A FREE-TEXT DOCTOR NAME, AND
  THE DATABASE REFUSES THE SAVE"*. **Only 1 in 4 streams retitled unprompted.** The briefs now ask for it;
  **check whether that fired.**

## A TURN ENDING WITH THE PR OPEN AND CI RUNNING IS **CORRECT** — AND THE NUDGE MUST GO TO THE SESSION

**#1231 and #1233 both stopped with the PR open, CI pending, nothing merged, and said so plainly.** That
looks like `600`'s lead finding and **is the opposite of it**: those streams believed a notification was
coming; these named what was outstanding, which is exactly what `CLAUDE.md` asks. **Do not reword the
briefs for this.** Plan for it: **a stream that finishes while a ~4-minute check runs will stop, and the
planner then reads `gh pr checks` and nudges.**

**AND IT MUST BE A MESSAGE, NOT A MERGE DONE FOR THEM, FOR ONE CONCRETE REASON: the `stream-usage:`
figure can only be read from the stream's own live process.** Merging #1231 from the planner session
would have saved a message and **lost the figure for ever.** That is now the standing reason.

## FOUR COSTS, ALL THE PLANNER'S

- **A PATH GREP COUNTS COMMENTS.** The planner "corrected" an item from five importers to **ten** off
  `grep -rln "clinics/scope" src/`; #1232 read the files — **eight real importers, two comment-only.**
  Committed while correcting exactly that class of error. **Read the import line.**
- **IN ONE AMENDMENT SCRIPT, RUN INSERTS AND BODY EDITS BEFORE TITLE EDITS**, and anchor every edit on a
  phrase **no edit in that script rewrites**. The planner's script **refused twice in one session** for
  this — a title edit removes the text a later `findIndex` searches for. **Both refusals were free: the
  per-anchor guard wrote nothing.** Third and fourth time in two plans the guard has paid.
- **I CALLED THE FLOOR BIMODAL ON SIX READINGS AND THE NEXT TWO FILLED THE GAP.** Eight stream readings:
  103,744 · 105,592 · 105,689 · 105,904 · 105,934 · 107,581 · 109,004 · 110,677. **A smooth ~7k spread,
  not two clusters.** The claim is withdrawn in `.plan-day.md`. **What survives: re-derive the floor every
  batch; 7% on a tight band changes a verdict.**
- **An item filed on `backlog` mid-plan is invisible to a stream briefed on it** (`600`'s warning). Handled
  by merging `backlog` into `main` at each batch setup — **cheap, and it closed the fault.** One
  whole-file-conflict resolution was needed and the documented method worked: keep `main`'s ticks, take the
  backlog branch's rewritten titles, **guard that every item line survives** (917 both sides).

## BANDS: SEVEN READINGS, FOUR INSIDE AND THREE OVER BY 4–9%

Figures and reasoning: **`.plan-day.md`.** Three method corrections worth carrying:

- **A PROCESS-DOC STREAM CARRYING A REAL JUDGEMENT IS NOT A QUICK WIN.** #1228 was banded 115–150k as
  three documentation edits and came in **156,907**, because one numbered deliverable asked it to *decide*
  whether the test-plan matrix should name cards — and answering meant **restructuring the matrix.**
  **The moment a deliverable asks a stream to DECIDE, it is an ordinary stream plus the decision,
  whatever the file type.** The planner had even written the risk into `.plan-day.md` and banded against
  it anyway.
- **"FIX THE REPORTING BUG" ACROSS SEVERAL FILES THAT SHARE IT IS AN INSTRUMENT, NOT A REPAIR.** #1232
  (+6%) fixed *"prints HARNESS-OK as an error"* by writing `scripts/lib/rollback-harness.mjs` for all
  three harnesses — the honest fix, and above a repair's price.
- **A STREAM THAT FINDS AND FIXES UNPLANNED FAULTS ON THE WAY WILL RUN OVER, AND THAT IS MONEY WELL
  SPENT.** #1233 (+9%) delivered all fourteen deliverables **and** found the two faults above.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, every batch's figures
  and the full band reasoning: **`.plan-day.md`'s own blocks.**
- **BATCH 3 IS RUNNING AND ITS RESULTS ARE IN NO EDITION.** Three streams, the plan's last. **Read their
  `stream-usage:` comments and PR bodies at the next `/plan-day` before anything else.**
- **ANSWERED THIS PLAN, five of them, all recorded on their items with the questions marked superseded in
  place:** a deceased resident's intake date **is** correctable under the existing card; a release note
  **gets** an explicit `admin: true` flag (read through `perms.isAdmin`, **Admin still holds no card**);
  the four sites he will **type in himself**, so no seed and no hard-coded count; invoice kinds are
  **extend-and-catch-all with an `Other`**, which forces every kind-implied FK to be **optional**; and
  adoption-update files **must be approved** before the public sees them.
- **`591`'s ONE-GO QUESTION IS CLOSED: keep one typed word per batch.** Put to him with the honest
  trade-off — his single go saved two *words*, not two *decisions*, and the alternative needs race-safe
  port allocation. **He chose to keep it. Never put it to him again.** Three batches then started on his
  own typed messages with **no refusal and no retry**, because the round was sequenced so nothing needed
  sat behind a background command. **That sequencing is the method, not a precaution.**
- **NOTHING IS WAITING ON A DECISION OF HIS** at the time of writing. The two bills questions he answered
  mid-plan were the last.
- **THE BILLS INTERFACE HALF IS THE NEXT PLAN'S FIRST STREAM**, by his choice — the kind dropdown (copy
  `photoCategoriesFor(perms)`, already card-derived), the tailored form, the sites settings screen, the
  presentation tweaks. **It needs #7's schema merged and applied to dev first.** Do not re-choose it.
- **MIGRATIONS ON DEV AND NOT ON PRODUCTION** are listed under `## Deployment (before go-live)` — read
  `--status` rather than this sentence. **THE PRODUCTION APPLY IS LUTAN'S**; he was offered it on
  2026-11-03 and said **not now**, so **do not raise it again unprompted and do not show the command until
  he asks.** `0303` has since merged, so the pending count will have grown.
- **A release is the release manager's.** Lutan, 2026-11-01. **Do not cut one, do not prepare one, do not
  put it to him as a decision he owes.**
- **The Pi-failover drill, the `cloudflared` boot race and the Worker fallback that stops covering after
  ~11 seconds all need Lutan at the Pi** with `wrangler tail`. Not streams. The fallback one is the
  serious one: 44 seconds of 503s carrying none of our Worker's own header.
- **Interruptions: ONE, and it was not a briefing defect.** He asked mid-round why nothing had moved into
  `## Next up` and withdrew the question himself. **Another session — the Backlog Manager — was doing
  exactly that and committed it minutes later**, which also moved the planner's anchors and made its
  amendment script refuse. **Worth one line to him next round: say who is grooming the backlog.**
- **A SECOND SESSION'S INDEPENDENT ORDERING AGREED WITH THE PLAN ON SEVEN OF NINE ITEMS.** The Backlog
  Manager stocked `Next up` from the same board without seeing the plan. **That is the strongest
  cross-check on a selection available without running it, and it is free — look at `Next up` before
  committing to an order.**
