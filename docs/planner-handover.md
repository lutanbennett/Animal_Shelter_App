# Planner handover — edition `330`, 2026-10-24

**A delta, ninth edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `339`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `321` asked for, and what happened

- **"The card walkthrough is HELD; do not plan the three run groups without re-reading the item."
  HELD, and it did its job** — none of `cards-run-money`, `-contacts-and-comms` or `-content` was
  planned. Still held behind the card simplification. **Keep this warning; it is the one that stops
  a whole batch of wasted work.**
- **"The feature list, then the card proposal, is what unblocks them." HALF MOVED.** Step 1 shipped
  (#878) before this round began. **Step 2 still waits on Lutan's mark-up**, and it is still the
  highest-leverage thing on the board. Unchanged in nine streams.
- **"The recurring-jobs page is the most user-visible thing filed." DONE, and see the finding
  below** — it is the reason this edition exists.
- **"The two shared reads, and maintenance-job deletes." STILL HELD** with the rebuild. Not
  re-offered, correctly.
- **"The run-stream rate (floor + ~9.8k per step)." NOT EXERCISED.** No run streams ran, because
  the walkthrough is held. **The rate is untested since it was promoted into the skill — say so
  rather than treating three readings as settled.**
- **"The Next advisories belong to one stream; do not escalate." NEVER TESTED AGAIN, so the claim
  is now DROPPED**, exactly as `321` said to do if this round did not test it. `audit` stayed green.
- **"Do NOT run `dev-signin.mjs --remove`." VINDICATED, then RETIRED.** It turns out `--remove` was
  genuinely broken — the item proved it in code — so the warning had been right for a reason nobody
  knew. #886 then fixed the script at root. **Drop the warning; the bug is gone.**
- **STEP ZERO: HELD, fifth round.** Nothing already-built was offered.
- **The `cat <scratch> > file` trick: HELD for an eleventh edition.** `rm` is still refused.

---

## THE DEFINING FINDING: a performance item's stated cause is a HYPOTHESIS, and briefing a stream to adopt it is a planning error

**Promoted into the skill**, so no future edition carries it.

`recurring-jobs-slow`'s item blamed per-row next-date work across 24+ jobs. **Measured, the date
function is cheap.** The real cost was **`role_can()` called 627 times in one request** — 33 pages ×
19 roles, through `loadEligibility` — and the `TypeError: fetch failed` was the same burst exhausting
sockets. **21–32 s became ~4 s** (#887, `docs/decisions/2026-10-23-recurring-jobs-slow.md`, which
opens by saying the item's guess was wrong — the most useful line in it).

**The brief is why it was found.** It said *confirm or refute rather than adopt*. Had it said "fix
the date calculations", the stream would have optimised something already cheap and reported
success.

**So every performance brief now carries that wording, and the planner must not pre-commit a cause
it has not measured.** `stock-pages-slow` was briefed the same way, with the `role_can` burst
offered explicitly as **a lead, not a diagnosis**, because its symptom differed (server ~3 s, screen
blank 60–70 s). It found its own cause.

**And the planner's own half: I checked whether that burst existed elsewhere, and it did not.**
`loadEligibility` is confined to recurring-jobs; `my-tasks/recurring.ts` already asks only about the
reader's own role. **Recorded as a dead end so nobody re-derives it** — testing the claim beats
grepping for a line that agrees with it.

## THE OTHER FINDING: a filed item said "Production: NOT ESTABLISHED" and named the command. I ran it

`check-scripts-doctor-triage` (#890) found **two genuine permission faults** — a doctor able to book
at any clinic and to read and write every clinic visit's attachments, **bills included**, against
`0220`'s own header saying a doctor never reads a bill. **`0230` is applied to production, so it was
LIVE**, and that turned a filed item into batch 3's first stream within the hour. `0253` closes it.

**Promoted into the skill** (the planner-touches-production rules) so no future edition carries it: a
stream in a worktree cannot read production and is right to say so; **the planner can, and must.**

## The diets ruling was never an eight-line ask — PROMOTED into the skill, step 3

The item said eight lines were out of proportion and each was his call. **Production had one.** He
answered it in a single message and a re-run returned zero, so **the diets forecast migration is now
unblocked** and, because the check passes, **it changes no production figure.** The durable rule —
*when an item quotes a count, ask which database it came from* — is in the skill now. **Its title also
had to be rewritten**, because it still read as though a ruling were owed, which is the false-block
shape that cost him being asked three times over `assistant-retention`.

## Backlog hygiene — PROMOTED into the skill, step 3

**Three faults in one round, all of which `check-backlog-sections.mjs` PASSED**: two items filed in
the wrong section, one fault recorded on two different items, and 47 harnesses left with no item
after their parent was ticked wholesale. All three fixed. **The checker tests position, not subject
fit, and nothing tests whether a finding was filed on the right item** — so the skill now carries the
three questions to ask of every item a stream touched. **Do not re-derive this here.**

## Eight measured: six inside, two over, worst +8%

`.plan-day.md` carries the table. **All eight ran `claude-sonnet-5-5` / `low`, matching the
recommendation every time** — the second round running. **Still no model finding, and I have stopped
implying one is coming.** The two unplanned streams that shipped before this round (#878, #881/#882)
are **`unmeasured`**: archived with their worktrees reused before a figure could be read.

**Two band corrections, both mine, both now PROMOTED into the skill's band table** — a new surface
that **also deletes what it replaces** is 260–330k (not 200–270k), and **"nothing left to discover"
does not cover "must prove it broke nothing"**: a permissions schema PR carries about +30k of proof,
and a schema PR still lands mid-band when it must DECIDE things even with its files fixed and its
columns handed to it. **Cited, not restated.**

## My own mitigations — fired, held, or to be dropped

- **"Carry the `dev-signin` workaround in the brief." FIRED, and it closed a diagnosis I had got
  wrong.** On 2026-10-22 I diagnosed a briefing gap and wrote a sign-in block into briefs; the next
  stream failed identically, because the cause was structural. This round both briefs carried the
  **specific** workaround, **neither stream wrote `pending: no signed-in session`**, and #886 fixed
  the bug at root. **The difference was finding the cause in the code rather than guessing at it.**
- **"Cap the half with a genuine unknown." FIRED.** #886's brief told it to report rather than grow
  if `--remove` needed more than a contained fix. It did exactly that.
- **"Count the actual steps before banding a run group." UNTESTED this round** — no run streams.
- **NEW, to check next round:** every performance brief now says *confirm or refute rather than
  adopt*, and names any offered cause as a lead. **Check whether the next performance stream still
  adopts the item's framing anyway.**

## For the release manager

- **`0.40.0` is CUT (#894) and NOT deployed.** `unreleased` is emptied into it — **re-read the
  entry; do not take a count from here.**
- **TWO migrations are pending on production, and the order matters:**
  - **`0252`** (units of measure) **must be applied BEFORE the app deploy** — #891 shipped code that
    reads the `units` table, and the Units screen and both the ingredient and medicine forms hit a
    missing table otherwise. Same trap as `0251`. The file carries a consumer header, so
    `apply-migrations` warns.
  - **`0253`** is the **live security fix**. Until it is applied, a doctor can write outside their own
    clinic on production. **It is database-only — no Worker deploy needed to close it.**
- **By this project's own numbering a middle-number bump is a MAJOR release**, which mails every
  admin and cannot be undone. **That decision is Lutan's, not the release manager's** — confirm he
  made it rather than inferring it from the version.
- **Nine PRs in this release.** Confirm by hand that each has a completed checklist.

## Rulings worth not re-deriving — cited, not summarised

- **The card walkthrough is HELD behind card simplification** — Lutan, 2026-10-23. Still the most
  consequential ruling on the board, and still waiting on his mark-up.
- **Kidney Support: 1 can per serving, servings 0.5 / 1 / 1.5** — Lutan, 2026-10-23. **A large dog
  therefore gets 1.5 cans a day where the old columns said 2**; he was told, in case he meant only to
  clear the warning.
- **A serving is ONE DAY's food; no rounding rule** — Lutan, 2026-10-22. Built and summing.
- **`test-plan` is ADVISORY permanently.** Do not raise it; do not list it as a decision he owes.

## Next round's candidates

The next chat plans; this is only where the board points.

1. **The diets forecast migration (`0254`)** — **now fully unblocked**, and lower-risk than it reads:
   because the proportion check passes, it **changes no production figure**. Then the cleanup
   migration dropping `qty_small/medium/large` and `0250`'s bridge.
2. **Group Who does what's Available cards by feature, features as data** — Lutan filed it himself
   on 2026-10-24. Schema then app, **and it carries one question for him**: build on today's 13
   feature names, or wait for his mark-up.
3. **The feature-list mark-up → step 2** — his, and still the biggest lever.
4. **The 47 red harnesses** — a decision about how to sweep them, not a stream.
5. **Raise HSTS to a year** — one line, **not before 2026-11-08**.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup, however often it is
re-planned. Branch, worktree, test plan, PR, then **merge it yourself on green CI** — never a gate.
This one is `claude/planner-handover-330`, after #876 (`321`) and #863.

**What could go next time:** the `--remove` warning and the Next-advisories claim are both gone and
should stay gone. **Keep the backlog-conflict lesson** from `321` — it was not tested this round
either, so it has not yet earned removal. **Keep the two band corrections above until a second
reading confirms each.**
