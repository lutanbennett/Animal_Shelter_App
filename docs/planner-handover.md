# Planner handover — edition `321`, 2026-10-23

**A delta, eighth edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `330`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `312` asked for, and what happened

- **"Capture actuals before the sessions are archived." HELD — and this is the first round where
  ALL NINE were measured.** Read at the first `/plan-day` after each batch merged. The lost-figures
  problem is closed; the practice is in the skill's step 2 and needs no further defence.
- **"Drop the dial paragraph." DONE — it is gone from this edition.** Nine of nine ran
  `claude-sonnet-5-5` / `low` and matched the recommendation every time. **That is still not a model
  finding** and I have stopped implying one is coming.
- **"The sign-in and `audit` paragraphs are closed; delete them." DONE.** Neither returned.
- **"A blocked stream's figure is not a band reading." HELD, and it earned its place twice** —
  `cards-run-facility` and `cards-rerun-blocked` both overran, and in both cases I read the UAT
  record first to confirm they had **completed** before letting the figure near a band. Both had.
- **STEP ZERO: HELD, fourth round.** Nothing already-built was offered.
- **The `cat <scratch> > file` trick: HELD for a tenth edition.**

---

## THE DEFINING FINDING: the run-stream rate is solid, and I was feeding it the wrong number

**Promoted into the skill**, so no future edition carries it: a walkthrough run stream costs
**the ~88k floor plus ~9.8k per numbered step**, measured three times this round and agreeing to
within 2%.

The reason it matters is the failure attached to it. **`cards-rerun-blocked` was banded 230–300k and
came in at 388,315 — 29% over, the round's worst error.** I had banded it off the item's **TODO
count** ("`residents` 9, `medical_records` 8" → "~17 TODO-heavy steps"). **It ran 31 numbered
steps.** Apply the measured rate to 31 and it predicts **392k, within 1% of the truth.**

**So the estimator was never wrong. The input was.** A `TODO:` is one line inside one step, not a
step — and the one command that settles it is now written into the skill. The same command, run at
batch 2 setup, caught a six-card group at 25 steps (~335k), got it **split into two finishable
threes**, and both landed inside their bands. **It is the cheapest high-value command in the loop.**

**The general shape, and it is the third time in four editions:** when a stream overruns, the first
suspect is the brief or the planner's arithmetic, never the dials.

## Nine measured: six inside, three over, and the two other overruns explained

`.plan-day.md` carries the table. What it means:

- **`kitchen-batch-sheet` +11% (255,301 against 170–230k).** It shipped **14 files** — a page, two
  new library modules, a test, both dictionaries, the manual, routes, the acceptance matrix and a
  release note. That is an ordinary **medium** (170–290k), and 255,301 sits inside it. **I narrowed
  a band below the measured range for the shape**, which is a planner error and not a surprise
  about the work.
- **`cards-run-facility` +6%** was the first honest run-stream reading and is what produced the rate.

## A REAL CONFLICT, AND I NEARLY RESOLVED IT THE LAZY WAY

`git merge backlog` conflicted on `docs/backlog.md` for the first time in this loop. The PR side had
ticked three items as batch 3 merged; **the backlog side carried a ruling of Lutan's made after
those PRs opened** — the card walkthrough is now **HELD behind simplifying the card set** — plus the
new item that ruling refers to.

**Neither side had both, and `--ours` or `--theirs` would each have silently destroyed something
that matters:** the round's ticks, or a decision of his. Resolved by keeping all of it, with the
hold written into the walkthrough item's **title as well as its body** — the skill's "answering a
decision on a backlog item" rule, which exists because a false block is silent.

**The lesson worth carrying: a backlog conflict is a signal that Lutan changed his mind while the
streams were running, not a formatting nuisance.** Read both sides fully before resolving.

## WHAT THIS CHANGES FOR THE NEXT ROUND — read this before planning

**The card walkthrough is HELD** (Lutan, 2026-10-23): the card set is about to be simplified, so
walking a card that may be merged tests it twice. **Until the new set is chosen, walk only cards
unlikely to change**; after it, **re-generate `docs/card-walkthrough.md`** from the new set and walk
what changed.

**So the three run groups `.plan-day.md` lists as next round's candidates are mostly on hold**, and
the candidate list in it is stale on exactly this point. **Do not plan `cards-run-money`,
`cards-run-contacts-and-comms` or `cards-run-content` without re-reading the walkthrough item
first.** The new item above it — a plain list of every feature, then a card proposal he chooses from
— is the work that unblocks them, and its first step is Claude-buildable now.

## The re-run's verdict, because it is easy to misread as a failure

**The old blocker is gone on all three cards.** `/residents/<id>` no longer redirects a card login,
and everything the two earlier records could not reach now runs. `0249` plus #872 worked.

**And all three cards still FAIL on their own jobs** — 0 of 3 pass, 31 steps, 7 failures, 6 findings,
4 items filed. Two shared faults, both the same shape: **a read the card does not hold** (the clinic
list; the enclosures behind every lifecycle write). **That is a successful run**, and the item's
title should not be read as the fix having failed.

## My own mitigations — fired, held, or to be dropped

- **"The Next advisories belong to one stream; do not escalate." NEVER EXERCISED, and I am saying so
  rather than claiming a win.** `audit` went green the moment #869 merged, so no later stream met a
  red one. **Untested, not successful.** It costs nothing to keep; **drop the claim if the next round
  does not test it either.**
- **"Do NOT run `dev-signin.mjs --remove`." HELD across all six streams that used logins.** No
  sign-out interruption reported. Strong enough now to stop watching.
- **"Count the actual steps before banding a run group." FIRED, and then I failed to apply it to my
  own worst estimate.** Hence the promotion into the skill rather than a note here.
- **"Re-run `check-medical-role.mjs` before reasoning about it." FIRED, and it was right.** The
  recorded RED predated `0249`. The stream found **five** failures, not three, and **none was an app
  fault** — the resident reads were widened on purpose by `0249` and `0192`. The script is now
  **GREEN at 88 checks**, four checks were wired into CI, and the sweep is recorded. **A guess I
  refused to promote into a finding turned out to be the right call.**

## For the release manager

- **Nothing is cut yet, and this round's nine PRs (#867–#875) are all merged.** `unreleased` has
  gained lines from #871, #872 and #873. **Re-read it; do not take a count from here.**
- **Three user-visible changes to describe:** the Medical records card now opens a resident record,
  diets are entered as one amount per serving, and Operations has a **Feeding list** giving each
  zone's batch for a meal.
- **One thing to check by hand before any production deploy, per `CLAUDE.md`:** every PR in the
  release has a completed checklist. Nine PRs is more than usual.

## Rulings worth not re-deriving — cited, not summarised

- **The card walkthrough is HELD behind card simplification** — Lutan, 2026-10-23. On the item, in
  both title and body. **This is the newest and most consequential ruling on the board.**
- **The Medical records card opens the FULL resident page with the rest READ-ONLY** — Lutan,
  2026-10-22. **Now built end to end** and run.
- **A serving is ONE DAY's food; no rounding rule; keep the arithmetic exact to the total** —
  Lutan, 2026-10-22. **Now built end to end**, and the Feeding list sums on it.
- **`test-plan` is ADVISORY permanently.** Do not raise it; do not list it as a decision he owes.

## Next round's candidates

The next chat plans; this is only where the board points, and **the hold above reshapes it.**

1. **The feature list, then the card proposal** — the item the hold depends on. Step 1 is
   Claude-buildable now and unblocks everything else.
2. **The recurring-jobs page takes 35–54 s and shows `TypeError: fetch failed`** — the most
   user-visible thing this round filed.
3. **The two shared reads the re-run found** — the clinic list and the enclosures behind lifecycle
   writes. Both are permission work, both filed.
4. **Maintenance jobs cannot be deleted by anyone.**
5. **Raise HSTS to a year** — one line, **not before 2026-11-08**.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup. Branch, worktree, test
plan, PR, then **merge it yourself on green CI** — never a gate. This one is
`claude/planner-handover-321`, after #863 (`312`) and #848.

**What could go next time:** the dial paragraph is gone and should stay gone. The `--remove` warning
has held six times and can be dropped. **Keep the backlog-conflict lesson** until a second conflict
proves it understood.
