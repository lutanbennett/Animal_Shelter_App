# Planner handover — edition `645`, 2026-11-04

**A delta over `636`.** It covers a plan of **nine streams in three batches** (#1276, #1278, #1279;
#1280, #1281, #1282; batch 3 set up) **plus two unplanned streams that shipped PRs** (#1274, #1277).

> **Written at batch 3's SETUP, as the rule requires, so batch 3's own figures are NOT in it.** They
> land in `654`. **Lutan asked for this edition** at the end of a bad night, with the words *"I expect
> lots of lessons"*. They are below, and they are not softened.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `654`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE LEAD: HE LOST OVER AN HOUR REDOING FINISHED WORK, AND EVERY CAUSE WAS ONE HABIT

**His words, across five messages in one evening:** *"Why was I told there was no further work
required"*; *"I wasted over an hour redoing work that I'd already done, then told there is nothing
more. But when I look on the backlog there is more to be done"*; *"It was all the google oauth checks
and the bitlocker"*; *"Which was all done weeks ago but got reprosicuted tonight as not done"*; *"I
have done r-0323 multiple times now and reported it done. Why do you keep losing this stuff"*.

**THE ONE HABIT BEHIND ALL OF IT: THE LOOP ASKS HIM TO CONFIRM THINGS IT COULD MEASURE, AND NEVER
WRITES DOWN THAT HE ANSWERED.** An item whose *Done when* is *"Lutan confirms X"* reads as **open**
until the confirmation is recorded **with its date**, so every sweep for *what still needs Lutan*
hands it back. Three items did exactly this:

- **BitLocker (`#ubejc`) — the THIRD time he was asked.** The item's own text said so in writing
  (*"confirmed by Lutan for the third time, 2026-11-04"*) and the loop still did not close.
- **The Google OAuth checks (`#ij9cm`)** — done weeks earlier, re-prosecuted the same night.
- **R-0323 (`#314hq`) — asked TWICE AFTER IT WAS ALREADY DONE.** The archive was written at
  **12:30:43** on 2026-11-04; the planner listed it as outstanding at least twice later that day.

**THE RULE, now written on all three items and in memory (`confirmations-already-given`):**
**a confirmation he has given is CLOSED the first time he gives it** — date it, tick it — **and
anything measurable is MEASURED, never asked.** If a later session doubts a state, it reads the record
or runs the check. `CLAUDE.md` already carried this for the backup key (*never raise it again, fix the
stale record instead*); **it is the same fault on three new subjects, so it is a pattern, not a slip.**

**AND THE SECOND HABIT, which made the first one worse: EXHAUSTIVE CLAIMS ASSEMBLED FROM A BATCH'S
NOTES.** The batch-1 hand-back said *"Two things still only you can do"*. True of that batch's
verification rows; **false as a statement of what was outstanding** — roughly twenty open items have a
part that is genuinely his, and he found that out by reading the backlog himself.
**Never write "two things" or "all that is left" unless it is the WHOLE list, re-read from the backlog
at that moment. Say "from this batch" when that is what you mean.** He plans his evening on it.

**AND THE THIRD: WORK PUT ON HIS LIST THAT WAS NEVER HIS.** The Pi rebuild was listed as his.
`docs/release-procedure.md:28-36` quotes his own instruction of 2026-10-02: *"Lutan has exactly one
job in a release: `node scripts/deploy.mjs --env production`. Everything else is Claude's … **both Pi
builds and both service restarts** …"*, and then *"If a step appears to need him for anything else,
that is a fault to fix, not a handover."* **Check whose job it is before putting anything on his list.**

## THE INSTRUMENT THAT SHOULD HAVE EXISTED, AND WHAT BUILDING IT EXPOSED

R-0323 was settled in the end by **measuring production**, not by asking a fourth time:
`scripts/check-deceased-archive-state.mjs` printed *`R-0323  Chao Guay (2) — died 2026-10-28, archived
2026-11-04 12:30:43, summary, index`*. **`#314hq` even named the column that settles it**
(`deceased_archived_at`) while also carrying the sentence *"nothing can confirm it afterwards"*, which
was **wrong**. A column the planner can read is never a question for a person.

**WRITING IT TOOK THREE WRONG GUESSES IN A ROW, ALL ASSERTED WITHOUT OPENING ANYTHING — on the very
night the planner was apologising for exactly that:** `process.exit()` after a `fetch` (the libuv trap
`scripts/lib/exit.mjs` exists for); `deceased_summary_file_id` when the column is
`deceased_summary_drive_file_id` (`0026:63-64`); and `residents.is_deceased` when `is_deceased` is a
column on the **view** `resident_current_state`, keyed by `resident_id` (`0001:254`). **Each failed in
front of him.** The skill's *open the thing before you assert it* is not advice about briefs only — it
is about every sentence the planner writes, including its own code.

**The script is UNCOMMITTED in the main checkout, so step 1's clean-tree check will stop.** Filed as a
quick win; it may also close part of `#36egc`.

## WHAT `636`'s MECHANISMS DID

- **Report-every-deliverable: 10 of 10 this plan.** Every finding filed this round came out of a PR
  body, including two *found, not fixed* sets. **Mechanism; stop checking.**
- **The usage comment: FIRING, BUT ITS FIGURES ARE DEGRADING — 3 of 10 wrote `tokens=unmeasured`**
  (#1276, #1280, #1274). All three were honest rather than guessed, which is the rule working. **But
  a third of the sample is now unusable, and nobody has established WHY the self-read fails.** Worth
  one look next round; the bands are built on these.
- **The finishing sequence with its own read step: 10 of 10. Seven plans running — stop checking.**
- **The advance-rescope flag: did not fire, correctly.** All ten reported `rescoped=no`.
- **Re-reading the TITLE of every item a stream touched: paid FOUR times** (`#314hq` still said *"PR
  OPEN/MERGING"*; `#tugyn` ticked but reading as a live fault; `#2zi2j` corrected by its own stream;
  `#r55fe` sending readers to a branch that does not exist). **Fifth consecutive plan it has found
  something.**

## BANDS: A BAND IS A CLAIM WITH A CLOCK ON IT

**New rule, from `appeals-campaigns-rename` (215,713 against 230–290k).** Its band priced a
two-sources-must-agree reconciliation; **that premise was disproved during setup and the clause was
struck from the item — and the band was not re-cut.** The figure was a clean reading of a job nobody
had banded.

**So: whenever a setup re-check strikes, corrects or supersedes a clause of an item, read the band
paragraph back and ask whether it priced that clause.** The machinery already existed and was used on
the other stream in the same batch (`build-install-collision-guard`, re-slugged and re-banded, landed
inside). Only the band was forgotten.

**THE FLOOR SPREAD BLEW OUT TO 26,515** (81,353 · 105,041 · 107,868), one batch after reading **zero**,
and `81,353` is **the lowest floor ever measured here**. Four batches now read 5,435 / 424 / 0 / 26,515.
**There is no near-constant floor. Re-derive it every batch and never carry a number forward.** The
81k reading is **unexplained**; it is recorded as measured, not theorised about. Figures and reasoning:
**`.plan-day.md`**.

## A DATED ITEM WRITTEN IN A HURRY IS THE LEAST TRUSTWORTHY THING ON THE BOARD

`#ki6cx` was dated and promoted to `Next up` mid-setup, and **three of its four checkable claims did
not survive a read**: the "two host lists" are already one list and already a setting
(`src/lib/site-hosts.ts`, asserted by `check-site-hosts.mjs`); the one-host shape is **already how
production runs**, not something the cutover creates; and the configuration is already staged. Only
"no host literals in `src/`/`worker/`" held.

**Being two days from a deadline is exactly when nobody re-reads the code.** One hour of reading turned
two planned streams into one and a programme into a runbook — and the stream that did it then found
what neither the item nor the planner had: **host literals in the deploy scripts that the cutover
commit must also edit.**

**AND THE RULE THAT CAME OUT OF IT, which is a planning rule rather than a reading one:** the one edit
genuinely left — production's `APP_HOST` — **cannot be a feature stream at all**, because merge-on-green
would put it on `main` before the DNS moves. **Ask of any change: what happens if this merges the
moment CI is green?** If the answer is an outage, it is a release step, not a stream.

## A BRIEF DEFECT THAT REACHED HIM, AND THE FIX IS OWED IN THE SKILL

**STEP ZERO says when to STOP and never says when to CARRY ON.** `website-approval-portal` reported a
clean step-zero result straight to Lutan and waited, asking whether it should build — on the same night
as everything above. **The stream did nothing wrong**; the block covers only the already-shipped case.

**Fixed on disk in all three of batch 3's briefs** (*"say so in one line and CARRY ON — do not wait for
anyone"*), **but the block is quoted verbatim into every brief from `.claude/skills/plan-day`, so a fix
in three briefs dies with them. PROMOTING IT INTO THE SKILL IS OWED and is the first job of the next
round.**

**Two things it got right, so do not weaken it while fixing it:** step zero correctly established the
work was not already built, and the stream **independently confirmed the planner's `0163` policy
reading** — the one unknown the portal's band was built on.

## STATE, RE-READ EVERY TIME

Everything repo-derived lives in **`.plan-day.md`** and is stale the moment it is written.

- **Batch 3's composition, bands, carve-outs and every figure: `.plan-day.md`'s own blocks.**
- **HIS PRIORITIES LIST REMAINS THE PLANNER'S FIRST READ.** Fifth plan with no orphans.
  **Never write to it.**
- **HIS RANK 1 IS FIXED AND WAITS ONLY ON HIS DEPLOY.** `#vib7j` was ours: the Worker's CSP
  `connect-src` never named `https://www.googleapis.com`, so every browser-to-Drive chunk was refused
  and the retry loop blamed the network. **It never worked once.** Deliberately not ticked.
- **INTERRUPTIONS: FIVE, ALL BRIEFING OR REPORTING DEFECTS.** `CLAUDE.md` says a release's target
  shape is two touches and that a third is a fault to write down. **The same arithmetic applies to a
  batch, and this plan failed it badly.** Count them; do not count them as his impatience.
- **OWED:** the step-zero fix in the skill; committing the archive check; and the role-shaped
  instruments (`check-menu-coverage`, most of `check-production`) still answer per role.
