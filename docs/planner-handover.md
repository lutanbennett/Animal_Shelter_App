# Planner handover — edition `600`, 2026-11-02

**A delta over `591`.** It carries this plan's **batches 1 and 2 in full** and **batch 3's setup**.

> **THE LEAD, AND IT CLOSES `591`'s OWN OPEN QUESTION: THE ONE-GO CARVE-OUT WAS TESTED AND IT DOES NOT
> FIRE.** `591` left it as *"written down; nobody has used it to start a batch"* and the skill said to
> treat it as a hypothesis. **Tried, and refused verbatim:** *"Start sessions only on the user's own
> words to you here; this turn runs an automated event…"* — on a `<side-sessions-event>` turn that
> followed Lutan's own turn, with the whole round's work done first. **So the refusal does not
> distinguish a side-sessions-event turn from any other automated turn**, and the choice `591` put to
> him is now a real decision rather than a hypothetical.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `609`, due when the
next plan's last batch is set up.** **BATCH 3's FIGURES ARE NOT IN THIS EDITION; `609` carries them.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE FINDING OF THIS PLAN: A BRIEF THAT *TELLS* A STREAM NOT TO WAIT DOES NOT STOP IT WAITING

**A NEW WAY TO END A TURN WITH A BUILT BRANCH AND NO PR, AND IT FIRED TWICE — THE SECOND TIME AFTER THE
BRIEF WARNED ABOUT IT IN TWO SEPARATE BLOCKS.** This is the one to act on.

Both streams started `node scripts/gates.mjs` in the background and **ended the turn saying they were
waiting to be notified.** `intake-date-correction`: *"I'm waiting for the monitor to report; the PR comes
after that."* `dev-housekeeping`, hours later and **after its brief said, twice, "when you put the gates
in the background, READ THE OUTPUT FILE YOURSELF"**: *"it will notify me when it's done."* Both were
nudged and both resumed; nothing was lost.

**Why the existing blocks do not catch it, and this is the transferable half:** the finish-line block is
written about **finished** work with no PR. These streams were not finished, they were **waiting** — so
nothing in the block applied. `CLAUDE.md` already says *never end a turn believing a notification will
arrive*, and the briefs now say it too. **Prose did not hold. Do not simply reword it a third time.**

**What to try instead, and record which way it goes:** make the gates a **numbered deliverable with its
own read step** — *"run the gates in the background; then `cat` the output file and paste the four-gate
line"* — since the report-every-deliverable block covers numbered deliverables and nothing else. That
mechanism is 9-for-9 across two plans; the step-zero and finishing blocks became reliable the same way.

## WHAT `591`'s WARNINGS DID

- **The numbered finishing deliverable: 6 of 6, so 17 OF 17 ACROSS TWO PLANS.** `591` said promote it
  into the skill's brief blocks; **it is still written by hand every time.** The skill item that would do
  it was swapped out of this plan (below) — **it is the leading candidate for the next one.**
- **Step zero: fired once, on a NEGATIVE, exactly as `591` predicted.** The plan-day skill item claims
  the skill's brief block *"quotes the same stale three-gate line the template does"*; one grep showed
  **there is no gate count in that block at all.** Recorded on the item as a measurement with the grep,
  **not as a verdict**, and its title rewritten to *"FIX (1) MAY ALREADY BE SATISFIED — ESTABLISH IT, DO
  NOT INVENT WORK"*. **Cost: one minute. It would otherwise have been a rescope.**
- **"Report, don't file": 6 of 6**, and it is now the single highest-yielding habit in the loop (below).
  **Three streams deliberately did not tick**, naming what they had not reached.
- **Check an item's NEGATIVE claims (`591`'s own lead): fired once and held.** One false negative in six
  items, against three in six last plan.
- **Filing into the right SECTION: `591` warned every item the previous round filed from a PR body landed
  in the wrong section. CLOSED THIS ROUND — six items filed across four commits, none misfiled**, by
  reading the target heading before each insert. **Keep watching; the fix is a habit, not a checker.**
- **Re-reading the TITLE of every item a stream touched: paid again, four days running.** The section-I
  item was ticked with its title still reading *"…IS NOT ESTABLISHED"*. Rewritten.
- **Ban the FILE, not the folder: no stream stranded, no declared crossing needed.**

## READING AN INSTRUMENT'S QUERY BEFORE QUOTING IT PAID FOR THE SECOND ROUND RUNNING

`check-production.mjs calendar-recent` printed **twelve visits that "lost their calendar event" in 14
days** — alarming, and a plausible backlog item. **Reading its SQL first showed it is the ordinary case:**
the query deliberately includes any visit that is not `scheduled`, **or is past-dated**, or has a recorded
calendar change, and all twelve are completed, cancelled or past-dated. **Nothing filed, no stream
briefed to chase it**, and `calendar-pending` is the meaningful reading: nothing is waiting.

**One minute against a filed phantom.** Promote the habit if it fires a third time: **before quoting any
check, open it and read what it matches on, and state the database beside the figure.**

## "REPORT, DON'T FILE" IS NOW WHERE THE BEST WORK COMES FROM — AND A THREE-STREAM CHAIN PROVED IT

**The find of the plan was on no item.** #1217, settling a harness red, established that a migration had
made a scoping function return a constant empty for every login. **It was not scoped to ask who still
calls it; the planner grepped, and the app did** — turning "no clinics" into **"any clinic"** across five
live importers. **Filed as a question, not a bug** (the widening may be exactly what removing role-keyed
scoping intended), and **it became the next batch's stream within the hour.** That stream settled it:
**intended, and nobody is offered a clinic the database refuses** — one claim in the code's own comment
was simply false and is corrected.

**And on the way it named a real fault: a login that may book a visit but not add a doctor is still
offered a free-text doctor name, and the database refuses the save.** That is the buttons-follow-cards
fault, and **it is the same red one check had been printing for a fortnight**: #1217 reported it without
diagnosing it, #1220 diagnosed it, neither was scoped to fix it, and the planner filed it with the fix
direction already decided by Lutan's own rule (narrow what the form offers, never widen the policy).
**Three streams from a red to a named fault is the chain working, not failing.**

## FOUR COSTS WORTH NOT REPEATING, ALL THE PLANNER'S

- **AN ITEM FILED ON THE `backlog` BRANCH MID-PLAN IS INVISIBLE TO A STREAM BRIEFED ON IT.** #1220
  reported it without complaint: *"the item exists only on the `backlog` branch, not on `main`; planner to
  strike/tick."* **It was right.** Either merge `backlog` into `main` before briefing a freshly filed
  item, **or say in the brief that the planner will tick it and the stream should not try.**
- **TWO OF SIX STREAMS WROTE `tokens=unmeasured` IN THEIR OWN USAGE COMMENT.** One process had already
  exited and **that figure is lost for good**; the other was still alive and `get_usage` recovered it.
  **So the comment is only durable when the stream actually fills it in.** The briefs now name the calls
  (`get_usage` and `get_session`, both `session_id: "self"`); **check next round whether that fired.**
- **CAPTURE FIGURES BEFORE THE PROCESSES GO.** Three streams merged within minutes and one had already
  exited. **Read the PR comments first** — that is what saved the other two.
- **A `done` SWEEP OF THREE WORKTREES EXCEEDS A FOREGROUND TIMEOUT**, and so does `worktree.mjs new`
  while three streams are building. **Sequence the round so nothing you need is behind a background
  command**, because a turn resumed by a background completion cannot start a session.

## THE BANDS HELD: FIVE OF FIVE MEASURED FIGURES INSIDE

**Five clean readings, all inside band**, one unmeasured, batch 3 in flight. Figures, floors and the full
band reasoning: **`.plan-day.md`.** Two things worth carrying as method, not as numbers:

- **The audit row held a FIFTH time** — a sweep ruled its own replacement check out rather than building
  it, and came in inside. **`591`'s caveat still stands untested: a sweep that must REPAIR what it finds
  has never been measured, because five sweeps have found almost nothing.** Leave it worded as repair.
- **A card item is ONE stream carrying its own migration**, and this is now verified rather than quoted:
  `check-cards-count.mjs` asserts an **exact** card count against `cards.ts`, so the schema half cannot
  merge alone. The card stream landed inside a 240–300k band.
- **The floor is re-derived per batch and is drifting up.** Do not carry a number forward.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, every batch's
  figures and the full band reasoning: **`.plan-day.md`'s own blocks.**
- **BATCH 3 IS RUNNING AND ITS RESULTS ARE IN NO EDITION YET.** Three streams, the plan's last.
  **Read their `stream-usage:` comments and PR bodies at the next `/plan-day` before anything else.**
- **A DECISION IS WAITING, AND IT IS NEW: can a DECEASED resident's intake date be corrected?** The
  record lock refuses it, and that is arguably the exact case the new feature is for — a wrong arrival
  date is what gets noticed while tidying old records. **Do not unlock it; widening a closed-record lock
  is a permissions decision and his.** Filed with the reasoning.
- **A SECOND DECISION IS WAITING, AND IT IS `591`'s, NOW REAL:** keep one typed word per batch, or stop
  pre-creating worktrees so the chain works (which moves port allocation, `npm ci` and the launch file
  into the brief, and needs port allocation to be race-safe across three simultaneous starts).
  **Worth telling him honestly that his single go saved two words, not two decisions.**
- **ANSWERED THIS PLAN:** the website-content card's label → **widen the label**, not split the sign-up
  list off (a wording change, no permissions change). Utility bills → **cost only**, no units or meter
  readings. Both recorded on their items with the question marked superseded in place.
- **`process-docs-fixes` WAS SWAPPED OUT OF THIS PLAN'S NINE** for the clinic-scope question, which was a
  possible live fault in the top section. **It is the leading candidate for the next plan**, and it is
  what would promote the finishing deliverable into the skill. **Its fix (1) may already be satisfied.**
- **MIGRATIONS ON DEV AND NOT ON PRODUCTION** are listed under `## Deployment (before go-live)` — read
  `--status` rather than this sentence. **THE PRODUCTION APPLY IS LUTAN'S**; give him the command at the
  moment he needs it, never earlier.
- **A release is the release manager's.** Lutan, 2026-11-01. **Do not cut one, do not prepare one, do not
  put it to him as a decision he owes.**
- **The Pi-failover drill and the `cloudflared` boot race need Lutan at the Pi.** Not streams.
- **Interruptions: ONE, and it was a measurement rather than a defect** — the carve-out test above. The
  round's other work was finished first, so his go-ahead was the only outstanding thing, and he typed
  batch 3's start mid-turn without being asked. **`CLAUDE.md` counts a third touch as a fault to write
  down; the same arithmetic applies to a batch.**
