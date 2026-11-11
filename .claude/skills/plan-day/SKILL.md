---
name: plan-day
description: Plan the backlog as three sequential batches of three workstreams, then set up one batch at a time — sync main, read the backlog, order nine items, create the current batch's worktrees, and remember the plan so the next run resumes instead of re-planning. Use when the user asks to plan the day, pick workstreams, start or set up the next batch, or "what should we work on".
---

# Plan the day's workstreams

You are the integrator. Order the backlog into batches that can be built without colliding, set up one
batch at a time, and hand the folders back. Lutan opens one session per workstream himself.

**Nine items, three batches of three, built in order. Only one batch's worktrees exist at a time.**

## THE ONE RULE: THE LIST COMES FIRST

**Lutan, 2026-11-08, after asking three times in one day where his plan was:** *"You haven't given me the
batch 2 list yet - why are we having so many issues with the process"*, and the answer he accepted:
**the planner had been satisfying this document instead of delivering to him.**

**So the FIRST thing in your reply — before actuals, findings, bands or prose — is the list he copies
from: per stream, the folder, the port, and the model and effort to set.** It reads each `.port` and each
brief's first line, so nothing is quoted from memory. Never write "the list is above": give it again.

**IT IS A HARD SEQUENCE OF TOOL CALLS, NOT A RULE ABOUT YOUR PROSE** — broken three times in four plans
by planners who read it, agreed with it, and did the reading first anyway (`reference.md` §1). **Steps 0
and 1 of this file happen first as written** (resume-or-plan, then the sync); the sequence governs
everything after them, and is lettered so it cannot be confused with this file's own numbered steps:

- **(a)** `worktree.mjs new` for every stream in the batch.
- **(b)** Every `.brief.md` written.
- **(c)** `node scripts/worktree.mjs streams`, **the moment the last brief is written and before any
  other tool call.**
- **(d)** The list, first in your reply.
- **(e)** **Only now**: the PR bodies, the backlog filing, the bands, `.plan-day.md`, **and clearing
  the finished worktrees of the batch that just merged** — and, **on the day's FIRST batch only, the
  measurement of the previous day's streams** (step 3).

**BETWEEN THE SYNC AND (a), THE ONLY READS ALLOWED ARE THREE CHEAP FACTS:** has the current batch merged
(`gh pr list --state open`, and `--state all --head claude/<slug>` per slug); is the migration slot free;
and does a brief you are about to write need to QUOTE a merged PR, in which case **name that one PR and
read only it.** Nothing else. **A PR body you read "while you are there" is paperwork, and it goes after
the list.**

**AND CLEARING LAST BATCH'S WORKTREES IS NOT ONE OF THE THREE — IT GOES IN (e), AFTER THE LIST. HIS
INSTRUCTION, 2026-11-11:** *"Can you change the skill instruction to put removing streams after setup of
streams please"*, asked while he was waiting for the list. **A leftover costs nothing by existing; his
list costs him the wait**, and one `worktree.mjs done` can spend minutes deleting `node_modules` while
`worktree.mjs new` waits behind it. **Reading `list` before (a) is allowed and expected; acting on it is
not** (`reference.md` §1).

**Cut from 2,176 lines on his instruction, 2026-11-08.** Evidence, incidents and superseded trials live in
**`reference.md`**; the verbatim brief blocks in **`brief-blocks.md`**. **Cite them; do not copy them back
in here. If you add to this file, something else comes out.**

## HIS DECISIONS — SETTLED, DO NOT RE-OPEN OR PUT TO HIM AGAIN

- **Do not start sessions for streams.** Create the worktree and brief, hand back folder + port + dials,
  stop. (2026-11-03: *"My usage is not based on Tokens, it's based on turns"* — Max plan.)
- **Keep recommending `low`.** Band at `low`; state the +25% adjusted figure beside it when he sets
  `medium`. The dials are his and a `medium` he sets is a choice, not a deviation to flag. (2026-11-08.)
- **Never block his paid usage.** Warn, advise, forecast; never gate, never refuse to start, never put a
  numeric stop threshold in a brief. (2026-10-14: *"it's actually unethical for you to block the usage I
  paid for."*) **Convert before forecasting: three streams ≈ 2% of the weekly allowance, nine ≈ 6%.**
- **Never nine worktrees.** Two or three live, because merging is the bottleneck.
- **Stick to the agreed plan.** Once he has agreed the day's nine, **do not re-check the next batch
  against the backlog** — a change comes from him. (2026-11-11: *"I will request a change to the daily
  plan if it's required otherwise you stick to the daily plan"*.) Step 0 has what this does not remove.
- **`test-plan` is advisory, permanently** (2026-10-20), and **every PR merges on green with no approval
  round-trip**, feature PRs included. Both are in `CLAUDE.md` in full; neither is a decision he owes.
- **All analysis is by CARD, never by role.** Roles are a transient grouping and will be rebuilt. Before
  you write any band, brief or finding: would this sentence still be true after the card assignments are
  rebuilt? If not, name the card instead. (2026-10-28, said twice in one day.)
- **The handover is a DELTA**, target ~150 lines, and covers only `docs/planner-handover.md` and
  `docs/release-handover.md`. (2026-10-20.)

## 0. Resume, or plan from scratch?

Read `C:/Development/Animal_Shelter_App/.plan-day.md`. In a fresh chat read `docs/planner-handover.md`
first.

**If it holds a batch not yet set up, resume — do not re-plan.** Do step 1, then check the current batch
has actually landed (if streams are still open, name them and ask), and go to step 2.

**STICK TO THE AGREED PLAN. DO NOT RE-CHECK THE NEXT BATCH AGAINST THE BACKLOG AT THE END OF EACH
BATCH.** Lutan, 2026-11-11: *"I will request a change to the daily plan if it's required otherwise you
stick to the daily plan"*, and *"So no rechecking at the end of each batch"*. **A change to the day's nine
comes from him.**

**Two things this does NOT remove.** **(1) Checking the current batch actually MERGED** — that is not a
re-check of the plan, it is what stops six worktrees being live at once. **(2) Every brief's STEP ZERO**,
which is why dropping the re-check is safe: the stream proves the gap is still there and stops if it has
already shipped. The re-check was a dearer copy of that guard, paid for in his waiting rather than in a
stream's turn.

**BUT A SAVED PLAN IS NOT AN AGREED PLAN. If a DIFFERENT conversation wrote `.plan-day.md`, present the
batch before you set it up** — he cannot see that file, so to him nothing was ever proposed. This cost
him two interruptions and an apology on 2026-11-08, when two resumes in a row set up batches he had never
been shown. A resume by the same conversation that planned it may go straight to step 2.

**Re-plan from scratch ONLY when he asks, or when the saved items are all closed.** "The backlog has
moved under the plan" is no longer a reason — that is the re-check he removed on 2026-11-11.

## 1. Sync `main`

Must be on `main` and clean; if not, stop and report — he decides. Then:

```
git -C C:/Development/Animal_Shelter_App checkout main
git -C C:/Development/Animal_Shelter_App pull
git -C C:/Development/Animal_Shelter_App merge backlog
node C:/Development/Animal_Shelter_App/scripts/check-backlog-sections.mjs   # stop here if it fails
git -C C:/Development/Animal_Shelter_App push
git -C C:/Development/Animal_Shelter_Backlog merge --ff-only main
git -C C:/Development/Animal_Shelter_Backlog push
node C:/Development/Animal_Shelter_App/scripts/guarded-install.mjs          # npm ci; refuses while a build holds the checkout
node C:/Development/Animal_Shelter_App/scripts/worktree.mjs clean           # prunes Turbopack cache over 3 GB
node C:/Development/Animal_Shelter_App/scripts/check-planner-preflight.mjs  # what can this session REACH?
```

**`git merge backlog` conflicts most days and that is normal** — one item per long line, reworded on both
sides. **Resolve it item by item, taking each from its NEWER side, and guard that nothing is lost.** Do
not assume `main` is newer: on 2026-11-08 two items were newer on `main` and one was newer on `backlog`,
because the planner had filed his answer there that morning. Compare the two texts, keep the one carrying
the later content, and have your script exit non-zero if an anchor is missing.

**The preflight is last:** say in the plan what you cannot reach, and **never ask him to check something
you have merely lost the ability to read** (`reference.md` §2).

## 2. Set up — the current batch only

**Read `node scripts/worktree.mjs list` for `held` and `ahead` first:** a held folder, or a branch ahead
with no PR, is not a slot to reuse. **Read it, and remove nothing yet** — clearing a merged batch's
leftovers is (e), after the list. Then per stream, in sequence:

1. `node C:/Development/Animal_Shelter_App/scripts/worktree.mjs new <slug>`
2. Write `C:/Development/Animal_Shelter_<slug>/.brief.md` (gitignored) — **the blocks every brief carries
   are in `brief-blocks.md`; assemble from there rather than retyping.** Add the task half: the item
   verbatim, **a first line `<!-- stream: slug=<slug> port=<port> model=<model> effort=<effort> band=<lo-hi>k migration=<none|n> -->` (`worktree.mjs streams` reads it)**, the branch, the port, which half of a schema-first item this is, the numbered deliverables,
   what the stream does NOT own and who owns it this batch, and the banding note.
3. Then steps 3 and 4 of the hard sequence above. **Do not start sessions.**

### Writing a brief: the five rules that earn their space

- **Write your own evidence in, with its source and its timestamp.** A stream that starts from facts does
  not spend its turns re-deriving them. State evidence AS evidence so it can be tested.
- **Never convert an item's open question into a finding, and write your own open questions in AS
  questions — in the NUMBERED DELIVERABLES, never in step zero.** A question in step zero is context, and
  context is not reported on. *"A brief that says what the planner has not established gets corrected;
  one that asserts gets obeyed."*
- **Open anything you assert, price or forbid**, and prefer the narrowest prohibition. A folder name is
  not a manifest and a `grep -l` is not a definition. Where a ban might be too wide, add: *"if a numbered
  deliverable genuinely needs a file I have forbidden, do it and say so in your PR."*
- **Name the instruments, not just the rules** — the helper, script, fixture or decision file that
  already does the job, by path. The rules say how to behave; the instruments say what not to rebuild.
- **Every brief needs a hard deliverable boundary**, and every conditional permission needs its expiry
  written in: *"…and when that blocker clears, this fallback is void: finish the work."*

**A mitigation you write into a brief is a HYPOTHESIS. Check next round whether it FIRED, and write down
which way it went.** Never write the fix up as settled in the same breath as finding the fault.

## 3. Measure the previous day's streams — ONCE A DAY, after batch 1 is set up

**His decision, 2026-11-11:** *"can we save measuring the streams for the end of batch 3 … I'm thinking
measurement should occur at the beginning of the day for the previous days streams. That way we always
have a complete set"*, and on where it sits: *"it's step is after we agree the days plan and setup batch
1"*.

**So measurement happens EXACTLY ONCE A DAY, and this is its slot:** the day's plan is agreed, batch 1's
worktrees and briefs exist, the list has gone to him — **and then** you read the **complete set of the
previous day's streams**, all nine of them together.

- **DO NOT measure per batch.** On a resume that sets up batch 2 or batch 3, **skip this step
  entirely.** There is nothing to read: yesterday's set was read this morning and today's streams are
  not finished.
- **You always get a complete set, which is the point.** Three batches of three measured piecemeal gave
  a planner three partial pictures and a floor re-derived three times; nine read together give one.
- **IT IS SAFE TO WAIT, AND HERE IS WHY — the figures cannot expire.** Each stream posts one
  `stream-usage:` comment on its own PR immediately before merging, and `gh pr view <n> --json comments`
  reads it from a merged PR whose branch and worktree are long gone. **Proven 2026-11-11:** batch 1's
  three were read after their worktrees had been cleared. **This is the whole reason his ordering works**
  — contrast the live reading, where an archived session reports `unavailable` and the figure is lost
  for good (`reference.md` §7).
- **ONE CONSEQUENCE, STATED RATHER THAN GLOSSED: the day's FIRST batch is banded before you have
  yesterday's figures.** Its bands come from the handover instead. Batches 2 and 3 are banded at their
  own setup, by which time you have read the complete set, so **only batch 1 lags.** Measuring earlier
  would fix that and would be paperwork ahead of his list, which is the trade he made.

**Then, in the same step: what is already in flight.** `node scripts/worktree.mjs list`, then
`gh pr list --state open` and **name every open PR this session did not open** (a Dependabot bump above all — no stream owns it, so nothing else will look;
`CLAUDE.md` says whether it is merged or read first).

- **Read the `state` column before believing the `ahead` column.** A squash-merged branch stays ahead for
  ever and its deleted origin branch makes every commit read as unpushed. `list` says
  `squash-merged (PR #n)` when that is what it is, and `UNMERGED WORK` when more was built after the
  merge — which is **never** a candidate to clear.
- **`free` / `0 ahead` / `nothing beyond main` is a SNAPSHOT, not a verdict.** Settle it with
  `gh pr list --state all --head claude/<slug>`: **no PR ever** is a stream that never started (or
  unsubmitted work, if ahead), which is a different thing from a merged PR. Never widen a destructive
  step past what he named.

**Actuals come from the PR, not a live process** — see the durability note above. **The floor is
`tokens − messages`, re-derived ONCE A DAY from the complete set and never carried forward.** Nine
figures read together is a better floor than three sets of three. Release-manager and handover PRs post
none.

**Four ways a figure is NOT a band reading — record it, mark it, keep it out:** `finished=blocked`;
`compacted=yes` or a floor-sized `messages` on a long session (the window was reset, so the figure is a
remainder); `rescoped=yes` (you corrected the brief mid-flight); and a dead process with no comment,
which is `unmeasured`, never a guess and never a neighbour's figure.

**Read every merged PR body for findings outside its deliverable list. A stream can report; only you can
file.** That is where the next batch's best stream comes from. Fallback live reading, and the
`session_id` trap that silently returns your own window: `reference.md`.

## 4. Read the backlog

**His Customer priorities list first — it outranks file position:**

```
ArtifactData  action "get"  collection "priorities"  doc_id "ranking"
              url https://claude.ai/artifact/9em8tWXwDHNeEjFuCrFKCN
```

Top first. An item named there is planned before anything that is not. **`No document` or an empty
`order` is ordinary and means he has picked nothing** — fall through to backlog order and say nothing.
**An id matching no open item is never silently dropped:** ids derive from titles and titles get
rewritten, so use the `titles` map to name what he meant and put it in step 6's question. **Never write
to this document.** It is a steer, not a licence to break the sequencing rules — where it and a rule
disagree, follow the rule and say so.

**Then `docs/backlog.md`, open items only.** Section and item order are his priority for everything
unranked. Per candidate:

- **Read the WHOLE item, tail included.** Answers, `SUPERSEDED` notes and *still open* lines are
  **appended**, not inserted. `sed -n '<n>p' docs/backlog.md | tail -c 900`.
- **Already done? Check this first and trust it over the item's prose.** `ls docs/decisions/ | grep -i
  <subject>`, `git log -S "<a distinctive symbol>"`, and for any "done" claim
  `git log -1 --name-only`. **A merged PR is not proof its item is closed** — read the commit. Ask
  whether the behaviour the item describes can still happen, not whether the code it names still exists.
- **After every batch, re-read the TITLE of every item a stream touched, alone**, and ask whether it
  still says what is open. A stale title is worse than an open one, because nobody re-reads a ticked
  item. This has caught six.
- **A count, a conclusion or a prior pass has a CLOCK on it.** Ask which database a count came from, what
  method counted it, and what had been read when a conclusion was written. *"Nothing to build"* and
  *"X is ruled out"* are findings with a date, not facts — and ruling out one mechanism is not ruling out
  a cause.
- **Check the SECTION, the ITEM and the TICK.** `check-backlog-sections.mjs` tests position only and
  will never catch a wrong section. Does the tick cover everything the item claimed?
- **A hold is a RULE, not a list.** Test every candidate against the hold's reason, not its membership.
- Note who does it (Claude-buildable or his hands), whether it is blocked, its area, whether it needs
  schema, what it depends on, and its size.

## 5. Choose

1. **His priorities list, then backlog order.** Depart only for the rules below, and say so.
2. **Disjoint within a batch; overlap across batches is fine.** Two streams that collide are one stream.
   **Files are not the only axis — the shared dev database and the check suite are the other.** Ask: does
   any stream here change what another's checks READ? If the other merely has to ignore a red, say so in
   its brief; if its deliverable IS the measurement, move one. **Intersect the actual file lists before
   moving anything** — a shared directory is not a collision, a shared file is.
3. **At most one migration-carrying stream per batch.** Two in one batch means one schema PR or one moves.
   **An answer of his can create a migration out of nothing**, so where an open question of his could
   need the database to change, the slot is provisional until he answers — say so.
4. **Schema-first items span adjacent batches** — schema in batch N, app in N+1, never together.
   **The exception is structural: a NEW CARD cannot be split**, because `check-cards-count` asserts an
   exact count from `cards.ts` and `check-card-grants` proves the database against it, so both halves
   must land in one change. A card item is one stream carrying its own migration.
5. **Dependencies flow forwards.**
6. **Mix sizes** — one quick win per batch keeps the merge train moving.
7. **Nine is a target, not a quota.** Plan fewer and say why rather than padding with his own hands.
8. **Fold small items into one stream, but only work of the SAME KIND** — every stream pays a floor.
   Process docs beside code get their own PR, even a one-paragraph one. **Also fold an item whose
   correctness depends on what a neighbour changes:** would its deliverable still be right if the
   neighbour merged first?

**When an instruction of his is absolute, brief the whole job as ONE stream. Do not slice it and do not
offer him an order** — offering a choice feels like deference and reads as delay. And **measure a job
before pricing it as a programme**: an hour of reading has twice turned three planned batches into one PR.

## 6. Present

Three tables, one per batch: `#`, slug, the item's bold title, area, migration yes/no, **model and
effort** (never blank — name the default), the band, and one line on why now. A line per batch saying
what makes it a batch. Under them: *token figures are context-window size, a measure of scale, not a
bill.* Then **Not today** — his own hands, and anything blocked with the reason.

Then **one** `AskUserQuestion`. **Confirming a batch is SINGLE-select — "all three" or "I want a swap".**
A multi-select was used on 2026-11-11 and he unticked two options meaning only to confirm; the planner set
up one stream and he asked *"is there only one stream for batch 1"*. **Unticking is indistinguishable from
not meaning to tick.** Bundle any decision he owes into the same question.

## 7. Save the plan

Write `C:/Development/Animal_Shelter_App/.plan-day.md` (gitignored, and it stays that way).

**To overwrite it: Write to your scratchpad, then `cat <scratch> > .plan-day.md`.** Amend with a node
script run by path, `out.split(from).join(to)` — **never `replace()`**, which reads `$` specially —
**with a guard that exits non-zero when an anchor is missing**, and normalise `\r\n` first. Why each of
those, and the line-ending trap: `reference.md` §6.

It holds the date, and per batch a status (`pending` / `set up <when>` / `merged`) with each item's slug,
title, area, migration flag and one-line why, plus any dependency that fixed the ordering. Keep statuses
current. Keep a `slug | model | effort | scale | estimated | actual` table, and record the dials the
stream **actually ran on**, never what you recommended.

**Counter: `Streams set up in this plan: <n> of <total> (last handover <slug>, <date>)`.** It counts
streams set up **in the current plan**, added **at setup, once each**, however often the batch is
re-planned. An unplanned stream that shipped a PR counts in; a release's own two PRs do not. **One plan
is one handover**, written when the plan's LAST batch is set up.

**Count interruptions as a cost of the BRIEF, not the stream**, and record them here. A batch that cost
an unplanned interruption is a briefing defect even when every check is green.

## 8. Finish

One line that running `/plan-day` again after these merge sets up the next batch. **Then stop.** (The
list itself is step 4 of the hard sequence above; this is the third place it used to be restated, and
restating it three times is what let the sequence be broken.)

**When the plan's LAST batch is set up:** offer to update `docs/planner-handover.md` now, in this chat,
while the context exists; then he starts a fresh chat. Reset the counter once it is written.

**The handover is not written until its PR is MERGED.** On 2026-11-08 edition `708` was written, pushed
and never PR'd, so `main` read the previous edition for a day. Its test plan is part of it. It merges on
green like everything else. **Write it at setup of the last batch.**

**SINCE 2026-11-11 THE FIGURES LAG ONE PLAN, AND THE HANDOVER MUST SAY SO.** Measurement moved to once a
day (step 3), so a handover written at batch 3's setup carries **no figures from its own plan at all** —
its own nine are read the next morning and reported by its successor. **That is the delta model working
as intended, not a gap:** each edition reports the previous plan's complete set. **Say in each edition
which plan's figures it is reporting**, so nobody reads a missing set as a lost one. The old wording —
*"say that that batch's figures are not in it"* — described the per-batch world and is superseded.

## Bands — provisional, revise from the actuals

**He pays in turns, not tokens.** These measure **scale**, and they cannot see the planner's own cost at
all. **Band by what the stream must FIND OUT, never by the size of the surface it touches.** Give a band,
never a figure.

| scale | band |
|---|---|
| Floor, before any work | **~107–111k on 2026-11-08** — re-measure, never carry forward |
| **Ordinary well-briefed stream — the default** | **120–145k** |
| Quick win (1–3 files, answer already on the item) | 110–170k |
| Routing into surfaces that already exist | 120–165k |
| Schema PR, single file | 140–155k |
| Schema PR, nothing left to discover (`src/` forbidden, columns handed over) | 110–140k |
| A new integration on existing machinery | 145–180k |
| **An AUDIT or REPORT over a wide but shallow surface** | **145–190k** — the length of the list does not move this |
| Wording that must be SEEN ON SCREEN in two languages and chased through other documents | 150–195k |
| Replacing an existing screen | 155–200k |
| Schema PR with code: a view/function rewrite plus a named handful of readers | 160–185k |
| Medium (5–15 files, browser checks, both dictionaries) | 170–290k |
| Reads very widely and edits many call sites | 185–250k |
| **Creates one new surface people submit data through** | **200–270k** |
| Schema PR with code: permissions across many call sites | 230–285k |
| A new surface that also DELETES what it replaces | 260–330k |
| One new surface replicated across N existing forms | the new-surface row + ~15–20k per form |
| Builds an instrument or transport path from nothing | 250–320k |
| Large (rebuilt pages, whole-system read) | 340–460k |
| Harness triage | ~floor + 20k per harness diagnosed · ~7k per restate-or-retire · ~3.6k per guard read |
| A driven card walkthrough | floor + ~6.3k per step; **11k per step only if it must ADJUDICATE disputed rows** |

**The questions that move a band, in order:** must it **build an instrument** to measure with (dear)?
how many **live interactions** must it drive (dearest, and it scales with the row count)? must it merely
**read a lot** (cheap — do not widen)? And three more that have each cost a miss:

- **Does the environment hold what the proof needs?** If the stream must stand up the apparatus first,
  that is an instrument at instrument prices.
- **Who can actually run the proof?** A worktree cannot read production, deploy a Worker or touch the Pi.
  A production proof is the planner's time, not the stream's band.
- **An open question whose answer is a TABLE, TRIGGER or FUNCTION bands as the shape PLUS that
  structure.** One it can settle in a sentence bands near the ordinary stream. **Read your own band
  paragraph back: if it names an unknown, the band must contain it.** Naming a risk is not pricing it.

**Discounts and premiums that are real:** a brief handing over the cause, the decision AND the shape of
the fix lands near the floor. A schema half that wrote the app half a **specification** (not just a
column) discounts it to the bottom of its row — and quoting that specification into the brief is the
planner's job. A permissions schema PR carries **+30k of proof**. Asking for real browser verification
adds **~30k** whatever the code shape. *"Modelled on an existing screen"* is not a discount until you
list what that screen does **not** do. Reconciling two sources of truth bands on the harder side.

**`medium`: band at `low` and state the +25% adjusted figure beside it.** Never quote a `low` band at a
`medium` stream without saying so — it manufactures a false overrun, which is how a good band gets
corrected into a bad one. **Never raise effort to fix an overrun**; the cure is a tighter brief.
**Recommend, never plan around a dial** — he sets them, and no model finding is drawable from a dial you
recommended. Evidence behind every row: `reference.md`.

## Where the detail went

- **`brief-blocks.md`** — the verbatim blocks every brief carries, to assemble from.
- **`reference.md`** — the incidents each rule came from, the measured band readings, the superseded
  trials (the planner starting sessions; one-go-for-all-nine), the production-handling rules, the
  `.plan-day.md` editing traps, and the fallback usage reading.
- **`CLAUDE.md`** — worktrees, the merge train, migrations, testing, the card rules, the dev sign-in.
- **`git log`** — the 2,176-line edition, if a rule here reads as too thin.
