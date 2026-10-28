# Planner handover — edition `438`, 2026-10-28

**A delta, twenty-first edition in this shape, and the longest day in the loop's history: SIXTEEN
streams, fifteen planned plus one unplanned, every one of them inside or under its band.** `429` was
an off-cadence edition covering batch 3 only; this covers everything after it. **Read `429` first for
the browser-pane findings; this does not repeat them.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `429` → this. **The next slug is `447`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

**Three durable facts were promoted out of this edition into the skill rather than recopied here:**
the audit/report band row, the item-TITLE check, and Lutan's usage conversion. Cited below, not
restated.

---

## WHAT `429` ASKED FOR, and what each warning did

- **"Promote the ~6k re-pass rate" — DO NOT, AND THIS IS THE CORRECTION THAT MATTERS.** Two more
  readings landed: 6,722 a step (17 steps) and **7,365 a step (15 steps)**. `429` wanted a single
  number promoted on seven readings; it has now moved **three times** and the single-number version
  is disproven twice — #989's reconciliation pass at 11,223 and today's 7,365. **The axis, not the
  number, is the durable thing: a re-pass costs what it costs to CONFIRM OR CONTRADICT the prior
  rows, not to drive the steps.** Today's 7,365 group had **four** behaviour changes to check against
  (`0276`, `0277`, `0278`, #1032); the 6.0–6.8k readings had one or two. **Band from how much prior
  state the pass must settle. Nothing was promoted, deliberately.**
- **"`0276` is not on production." NO LONGER TRUE — all THREE went on at 04:56Z today**, a minute
  after `0.40.9` merged (`0276`, `0277`, `0278`; production reads 279 applied, 0 pending). This line
  read STILL TRUE when written and went stale inside the hour, which is why it carried its own
  re-read instruction. **It worked: a planner who re-read `--status --env production` found the
  truth. Keep writing release state that way.** What is still owed is the **release note for
  `0276`'s READ half**: `0.40.9` told users that *filing* into Medical needs its own permission and
  said nothing about *viewing* it. `0275`'s is fairly `n/a` (a column, nothing a user sees).
  **The live card position — derived from `card_includes`/`card_grants`, NOT proven by a query as
  those logins:** three cards reach the new read through `card_closure()` — Manage medical, Book
  clinic visits, Run appeals — so **Management can see medical photos and Head of Medical cannot**,
  though she holds Add medical photos and files them there. **Both halves are deliberate and were
  written down in advance:** `0276` note 4 withholds the read from Add medical photos on Lutan's
  "decrease to just what is required" ruling, and note 2 says the two including cards read Medical
  photos too — "that is what 'includes' means and is recorded, not widened." **So there is nothing
  here to file as a fault; the only open question is whether Lutan WANTS that shape**, which is a
  Settings answer, raised 2026-10-28.
  **Re-read `--status --env production` and `role-cards`; never quote any of this.**
- **"Ten card re-passes owing." CLOSED — the whole fourteen-card programme is done** (#1026, #1035).
- **"Buttons slices 5 and 6." BOTH DONE; the six-slice sweep is complete** (#1027, #1030). Slice 5
  also settled the question its predecessor handed forward: **a suggestion is gated when it names one
  specific action whose activity is missing; free-text hints are not.** That rule binds later work.
- **"The `CLAUDE.md` pane entry." DONE (#1024), and the expensive half EVAPORATED.** The marking pass
  found **no row in the fault log is a pane artefact**: 12 rows matched (not 14 — `429`'s count came
  from a looser grep), and **all 12 fell to reading alone.** Every hit was "dead" meaning a dead-end
  page, or "pane" meaning a panel or a file-picker limit. **A whole feared clean-up was a negative
  result, which is the cheapest kind of good news.**
- **"Policy triage 2 — band it as a report." HELD, and it was the round's best estimate:** all ten
  tables deliberate, **144,682 against 145–185k.**
- **"Sixteen-plus worktrees. Stop asking." HELD.** Not raised once.

## THE ROUND'S BIGGEST FINDING: A MERGED STREAM LEAVES ITS ITEM'S *TITLE* LYING, AND IT HAPPENED FOUR TIMES

Four times in one day, each in a different way, and **one of them put already-finished work into this
plan's own batch 3**:

1. **#1024 never touched `docs/backlog.md` at all.** All three deliverables shipped — verified in the
   tree — and **two items still read OPEN**, one of which this plan had scheduled.
2. **#1029 shipped `0278` but left its item's head reading "(schema PR, then the app)"**, as though
   both halves were open.
3. **The tiles item read *"what is left is Lutan choosing which role to flip first"*** — which is why
   the planner put it to him as a decision. **His correction: *"this is driven by the UI in who does
   what, it doesn't need a decision here."*** Not a decision, not a blocker, self-service.
4. **#1026 got it right**, and the difference is instructive: its brief told it **not** to tick, and
   to strike only the three cards it drove.

**The skill already says a merged PR is not proof its item is closed. What it did not say, and now
does: after every batch, re-read the TITLE of each item a stream touched, not just its tick.** A
stale title is worse than an open one because nobody re-reads a ticked or answered item. **Promoted
into the skill; not restated here.**

## BAND WORK: THE MORNING'S CORRECTION HELD, AND A NEW ROW EARNED ITSELF

- **Audits banded as REPORTS landed at the BOTTOM EDGE instead of 20% under.** The morning's three
  errors were one error — pricing a *reading* of a surface as a *build* on it (43%, 21%, 17% under).
  The test — **if everything here turns out to be FINE, what work is left?** — was applied to both of
  the round's audits: `policy-triage-2` 144,682 against 145–185k, `buttons-sweep-5` 151,124 against
  150–190k. **Promoted into the skill's band table.**
- **NEW, one reading, kept here rather than promoted: scope a triage job READ-FIRST, DRIVE-SECOND and
  it lands near the floor.** `fault-log-marking-pass` was briefed to settle each row from its own
  source before touching a browser; **all 12 settled by reading, no page re-driven, 142,111 against
  170–215k — 16% under.** Same axis as *a hypothesis killed by reading is not an investigation*,
  applied to a per-row job. **Ask of any marking or triage brief: which rows could reading settle?**
- **The floor moved again inside one day: ~95.7k → ~97.4k**, and it is **memory files** growing
  (18,453 → 19,626). **Re-measure it from a stream's own non-`Messages` categories every round.** The
  whole per-step rate is computed above it, so carrying a stale floor corrupts the rate.

## WHAT THE PLANNER GOT WRONG, AND ONE OF THEM IS THE RULE I BRIEF OTHERS ON

- **I left my own branch pushed with NO PR, and did not notice until Lutan said "everything is
  merged."** That is the finish-line rule — the one at the top of every brief I write — failing on
  the author. The gates genuinely had to finish before the test plan could carry their real output,
  **but that is a reason to SAY it is still open, not to leave it looking done.** **The finish-line
  block applies to the planner's own PRs.**
- **I read a path as a file.** Checking the PDF toolchain, I printed what `chromium.executablePath()`
  *would* return and reported the toolchain present. **No browser was installed.** Same shape as
  quoting a document instead of reading the code — one `existsSync` would have settled it. Used the
  system Chrome instead of downloading one.
- **I told another role its gate had a hole. It did not.** I warned the release manager that the
  per-PR migration-ordering gate could not catch `0278`, because the migration (#1029) and its reader
  (#1032) were in different PRs. **The mechanism was right and it verified it independently** — but
  the protection was never that gate: `docs/release-procedure.md` §5 puts migrations before **any**
  deploy unconditionally, **and both deploy paths refuse a commit whose database lacks a migration on
  `main`.** So it was already blocked. **Before telling another role their gate has a gap, read their
  runbook.** The warning still earned its place — it named which failure to expect if the order
  slipped, and went into the cut plan with the file references.

## THE BACKLOG RAN OUT OF BUILDABLE WORK, AND THAT IS THE REAL STATE TO HAND OVER

**Lutan asked for three more batches. There were about five buildable items.** All open items were
read: the rest are waiting on him, waiting on the Director, parked by him, blocked on a date, or
gated behind his fault-log review. **The only thing available in volume is harness triage** — and the
item itself warns many are red *because their fixtures lean on roles being deliberately removed*, so
making them green can mean **adding back** hidden security.

**He was offered the choice and chose: one batch, then the release.** **This is what "nine is a target
and not a quota" looks like in practice — do not pad a plan with harness triage to reach nine.**

## WHAT UNBLOCKS THE NEXT PLAN

1. **141 fault-log rows still say "not established"** — over half the log. **This is the planner's to
   settle, not the reviewer's:** only the main checkout reads production, and most rows name the check
   they need. Two such reads today closed one root cause and confirmed another **in minutes**. **Until
   they are settled, a row saying only *not established* is not a finding to rule on.** Best single
   candidate for the next round, and it is a stream.
2. **His fault-log review (gate 3)** still releases four items plus **Card review 2**, the largest
   blocked thing on the board. The log is now materially easier to read: no pane artefacts, and the
   live rows carry dated production readings.
3. **`0.40.9` is being cut by the release manager.** Two of my PRs are **deliberately held** at its
   request — keeping the cut-to-deploy window empty removes the "which SHA did the Worker build
   from" question that cost `0.40.8` real time. **Open them once the cut merges:**
   `claude/fault-log-production-readings` and this edition's own branch.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage** — and **convert
  before forecasting**, now in the skill: three streams ≈ 2% of the weekly allowance. The planner
  read 91% and warned a batch might not fit; **sixteen streams moved it 91% → 94%.**
- **A measurement has a timestamp; a fact does not.**
- **`check-who-does-what` and `check-menu-coverage` are red ON PURPOSE.**
- **Lutan's decisions this round, so nobody re-asks:** run the marking pass; **deleting a maintenance
  job is an Admin duty, not the card's** (own item, and both obvious implementations break his own
  rules — the item says why); the tiles switch is not a decision.
- **Watch across releases, not within one: test plans signed `pending: a person` reached 15 of 29**,
  against a trend of 5, 5, 13, 7, 13, 15. He was asked and chose to ship with it recorded. **It is a
  trend for the record, not an incident, and not a decision he owes again.**
