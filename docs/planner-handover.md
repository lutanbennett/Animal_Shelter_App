# Planner handover — edition `573`, 2026-11-02

**A delta over `564`, written the same day and deliberately early, because the counter changed.** It
carries **batch 2's results** — which `564` could not, having been written while batch 2 ran — and
batch 3's setup. Batch 1 is in `564`.

> **ONE PLAN IS ONE HANDOVER NOW. Lutan, 2026-11-02: *"can we sync these counters up to avoid
> confusion"*.** The counter no longer counts to nine on its own; it counts streams set up **in the
> current plan** and the edition is written when the plan's **last batch** is set up.

> **AND THE BAND LESSON OF THE ROUND: a brief that says "a recorded decision is a complete outcome"
> has REMOVED the expensive half — band it as an audit, not as the change it decided against.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `582`, due when the
next plan's last batch is set up.** **Batch 3's figures are not in this edition; `582` carries them.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: WHY THERE WERE TWO NINES, AND WHAT WAS DONE ABOUT IT

**The plan's shape is nine items in three batches of three. The handover counter counted streams since
the last handover and fired at nine — and it carried streams over from the previous plan, so the two
drifted.** By the end of 2026-11-02 the plan's nine were all set up while the counter read 3, and **the
planner told Lutan in one message that nine streams were done AND that no handover was due.** Both were
true, of different nines. He asked for them synced.

**The counter is now `Streams set up in this plan: <n> of <total>`, and the trigger is the plan's last
batch going up.** Usually still nine, but it cannot drift, because the boundary is the plan's own end.
**Changed in the skill: step 6's counter rule and step 8's trigger.**

**Why the plan boundary and not the other way round:** a plan is a meaningful unit — roughly one
release, one planning conversation — and a handover's job is to hand over a round. **An arbitrary ninth
stream is not a boundary of anything.**

**And the asymmetry it leaves, which is not new:** the edition is written at the last batch's **setup**,
so that batch's figures land in the next one. That was already true of any batch still running when an
edition was written — `546` and `564` both met it. **Say so in the edition rather than implying coverage
you do not have.** This one says it twice, above.

**This edition is itself the first application**, written early for that reason rather than appended to
`564` as an amendment. **An amendment that nearly doubles its edition is a new edition in substance**,
and treating it as one keeps both inside the length target.

## THE BAND FINDING, AND IT IS THE PLANNER'S OWN BRIEF WORDING THAT CAUSED IT

**All three of batch 2 came in under band, two of them badly — the band being wrong, not the work being
cheap.** Figures in `.plan-day.md`.

**A stream told that a recorded decision, or a tick with a reason, is a COMPLETE OUTCOME lands near the
floor, because the brief has removed the expensive half.** Two of the three were told exactly that, in
those words (*"do not go looking for something to edit in order to feel finished"*). One came in **25%
under** a band that had priced the possibility it would build something **which its own hard boundary
then forbade**. The brief and the band were written in the same sitting and disagreed with each other.

**So: when a brief's boundary says the deliverable is a decision, a report or a tick, band it as an
AUDIT.** Same axis as *do not band a stream for a proof it cannot run* — applied to a limit the planner
wrote rather than one the environment imposed.

**The third stream must not be folded into that**: it genuinely built, and still came in 18% under a
band carrying a browser-verification allowance **it did not spend**, reporting the drive as `pending`
for a person instead. **An allowance for a drive that does not happen is an over-band, and honest
reporting is what makes it visible.**

## WHAT `564`'s WARNINGS DID

- **Its lead — a refused session start is recoverable by a retry — HELD, AND HAS A CHEAPER POSITIVE
  FORM.** Batch 3 was **never refused**, because Lutan typed `/plan-day` **with "and start the streams"
  in the same message**, so the instruction was in his own words in the turn that acted on it. **The
  condition really is about the turn.** Tally: **six batches succeeded, four refusals, two of those
  recovered by a retry, one batch never refused.**
- **Its second finding — a stream may CLAIM a filing it did not make — ANSWERED, and the fix is
  mechanism.** The brief line added that morning fired on **all three** of batch 2 and is in batch 3's
  briefs: each wrote its finding into the PR body, said *"for the planner to file"*, and touched
  `docs/backlog.md` only to tick its own item.
- **The gates-wait block: TESTED AT LAST, AND IT FAILED.** `564` said it was untested on the case it was
  written for. **Five streams across two batches have now ended a turn waiting** — three on the gates,
  two on CI — **and all five needed a nudge.** Batch 3's briefs name both and tell the stream to poll CI
  itself. **If it fails a third time the brief is not the lever.**
- **And the red those two CI waits sat on was real:** both had left unfilled `<name>` and `<yyyy-mm-dd>`
  placeholders, having skipped the brief's own run-the-checker-first step. **A red `test-plan` is always
  a real mistake** — third round confirming it.
- **The hypothesis rule: fired again, and this time it caught the PLANNER'S reading.** A brief reasoned
  from its item's claim about which activity a screen asks, traced it into a card-derived gate, and
  concluded a swap would work — **marked in the brief as reasoned, not measured.** The item was wrong
  and so was the brief: the page checks Admin and nothing else. **An assertion would have been obeyed
  and a read narrowed for no reason.** Three rounds running; the cost is one sentence.
- **An open question in the numbered deliverables: fired, eleven rounds.** All six streams carried one.

## WHAT THE READ-EVERY-PR-BODY PASS BOUGHT — three filings, two of which changed an answer

Details in `.plan-day.md`; what they **mean** is this.

- **A fault a stream finds is often worse than the one it was sent for.** The Save button cannot succeed
  after a "can't tell": the request id is kept, so every press loops until the page is reloaded, and the
  old wording told people to press again. **The item leads with the trap, because the obvious fix is
  wrong** — clearing the id would run a write that may already have landed, the double write the whole
  failover programme exists to prevent. **This is the state a power cut produces**, so the one moment
  that machinery does its job is the moment the screen traps the person.
- **A finding can REORDER its own item.** The Thai check cannot usefully be extended until the API route
  bodies have keys and callers, because the largest cluster of untranslated English is there and returns
  fixed English — so the check would report a fault nobody could act on.
- **An activity carried by NO card is the MIRROR of the fault the rule is about, and nothing checks for
  it:** `role-cards-coverage` asks whether a card does nothing, not whether an activity can be granted.
  Two were found, so a screen is Admin-only **by omission rather than design.** **It carries a decision
  that is Lutan's, and the item says to ask rather than guess.**

## A TRAP THAT COST A WHOLE-FILE CONFLICT, NOW IN THE SKILL

`git merge backlog` returned **one conflict hunk covering the entire file.** Not content:
`core.autocrlf=true`, so git stores LF, and `main`'s blob for `docs/backlog.md` held CRLF while the
`backlog` branch's held LF. **The planner's own amendment scripts caused it by preserving whatever
endings they read** — right for the gitignored `.plan-day.md`, wrong for anything git tracks.

**The method is in the skill now** (promoted with this edition), because two obvious moves fail:
rewriting the working copy with CRLF changes nothing, and neither side can be taken wholesale — one
carried six items the other lacked, the other two ticks.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, and every batch's
  figures: `.plan-day.md`'s own blocks.
- **BATCH 3 IS RUNNING AND ITS RESULTS ARE IN NO EDITION YET.** Three streams, the last batch of its
  plan. **Read their `stream-usage:` comments and PR bodies at the next `/plan-day` before anything
  else**, and note two of its briefs deliberately forbid touching a thing another item owns.
- **ONE MIGRATION IS ON DEV AND NOT ON PRODUCTION**, filed under `## Deployment (before go-live)`.
  `scripts/deploy.mjs` refuses a production deploy until every migration on `main` is applied, so
  whoever cuts the next release meets it as an ordinary step. **Read `--status` first; the runner applies
  every pending file.**
- **THE PRODUCTION APPLY IS LUTAN'S.** The classifier refuses
  `apply-migrations.mjs --env production` as `[Production Deploy]`; he was asked and chose to run it
  himself. **Read the status and the dry run, then give him the command at the moment he needs it — never
  earlier.** It worked first time.
- **A release is the release manager's.** Lutan, 2026-11-01: *"I will get the release manager to do the
  release."* **Do not cut one, do not prepare one, do not put it to him as a decision he owes.** Major
  versus minor and the production Worker deploy remain his.
- **The Pi-failover sweep is finished at 149 of 149 addresses, and that is NOT the failover working end
  to end.** The fallback stops covering after about eleven seconds; it needs a repeat power-pull drill
  with `wrangler tail`, which needs Lutan at the Pi. **Not a stream. Do not brief one.**
- **Leftover worktrees accumulate fast.** `/clean-streams` does the round. **`ahead` is not the test; the
  PR is** — except where `list` says `UNMERGED WORK`, which is unsubmitted work and must not be touched.
- **Interruptions: two, both the planner's and both cheap** — a refused production apply and a refused
  session start. **Count them as briefing and setup costs, never as a stream's.** **A third was the
  planner's own confusion over the two nines**, which is what this edition's lead exists to prevent.
