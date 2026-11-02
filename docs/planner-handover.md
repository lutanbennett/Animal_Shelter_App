# Planner handover — edition `591`, 2026-11-02

**A delta over `582`.** It carries that plan's batch 3 (merged and measured), **this plan's batches 1
and 2 in full**, and **batch 3's setup**.

> **THE LEAD, AND IT SUPERSEDES `582`'s: THE ONE-GO CHAIN IS ANSWERED. It works — and it refuses a named
> folder, which is exactly what our workflow needs.** `582` recorded it as an untested hypothesis and
> guessed the obstacle would be the turn type. **Three refusals, three DIFFERENT conditions, and the
> answer was the third:** on an app-continued turn a session may start **only in this project's folder**,
> with no `cwd`/`host`/`target`/`environment`/`preset`. Our streams live in sibling worktrees the planner
> pre-creates with their briefs. **So the chain and the workflow are incompatible by design, not broken.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `600`, due when the
next plan's last batch is set up.** **Batch 3's figures are NOT in this edition; `600` carries them.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE-GO CHAIN: WHAT TO DO ABOUT IT, AND IT IS LUTAN'S CALL

**Do not re-derive this; the full reasoning and the refusal text are in `.plan-day.md`.** The choice:

1. **Keep asking for one typed message per batch.** Two interruptions a plan — the thing he asked to
   remove — but it works, every time, and costs nothing else.
2. **Stop pre-creating worktrees; let each session make its own** (`use_worktree: true`, no `cwd`, brief
   in the `prompt`). **This would make the chain work.** The price: `worktree.mjs new` is what assigns a
   free port, writes `.claude/launch.json` and runs `npm ci`, so all of that moves into the brief, and
   **port allocation would have to become race-safe across three simultaneous starts.**

**Option 1 was used today. Put option 2 to him as a question; do not rebuild the workflow on a planner's
own judgement.** He asked for fewer interruptions, not for the setup to move.

## THE FINDING OF THIS PLAN: CHECK AN ITEM'S *NEGATIVE* CLAIMS

**THREE OF SIX ITEMS CARRIED A FALSE PREMISE, AND ALL THREE WERE NEGATIVES.** The skill already says a
count without its database is not a reading, and that an item's conclusion ages in place. **It says
nothing about what an item claims is ABSENT, and that is what cost this plan.**

- *"No migration is needed for that half"* — **one was.** The activities were seeded by `0132` and the
  catalogue check requires code and database to match. The stream stopped and asked, nothing edited.
- *"The RPC returns no ids"* — **it had returned them since `0172`.** The caller was discarding them. No
  migration was needed at all.
- *"The speed score has fallen"* — **it had not.** See below.

**In every case the planner verified what the item said EXISTED — files, line numbers, call sites — and
never tested what it said did NOT.** For the RPC it read the call site and proved the return value was
discarded, and never read the function body, which is where the answer was. **One grep of
`supabase/migrations/` would have caught two of the three, in under a minute.**

**The rule to apply: a claim about absence is still a claim, and it ages exactly like a count. Check it
in the place the thing would live** — for schema, `supabase/migrations/`, never `src/`.

**Why it was cheap anyway, and this is the transferable half: every one of those briefs carried the
planner's open questions AS questions**, with *"a grep that finds nothing is not proof of absence"* and
explicit NOT-ESTABLISHED lists. **All three streams tested the premise instead of building on it.**

## A BENCHMARK WITHOUT ITS MACHINE LOAD IS NOT A READING

**The public site's "speed regression" never existed. The site is 12–14 points FASTER than the October
baseline.** Measured on an idle machine, baseline/main/baseline back to back, 18 runs a figure.

**The cause was our own parallelism.** Lighthouse on this machine swings **12–17 points** on load. The
original finding, and the bisect's own first pass, were both measured while sibling streams were
building — in the bisect's case in chronological order, so **elapsed time and commit were perfectly
confounded** and the scores rose in exactly the order the machine got quieter.

**What it cost: a whole stream briefed to bisect a bug that was not there.** It came in under band and
produced the measurement rule, so the loss was small — **but nobody asked whether the environment could
support the MEASUREMENT.** The skill warns against charging a stream for a proof the environment cannot
run; **this is the same question one step earlier.**

**The measurement rule is on the rewritten backlog item and should move to `CLAUDE.md`:** never
benchmark while another stream is building, interleave rather than measuring in commit order, bracket
with the baseline twice so drift shows as the two baselines disagreeing, and record machine load beside
any figure.

## WHAT `582`'s WARNINGS DID

- **The numbered finishing deliverable: 8 OF 8 across three batches, and `582` asked for a second
  outing before promoting it. It has had a third. PROMOTE IT INTO THE SKILL'S BRIEF BLOCKS.** Every
  stream merged itself on green after checking `headSha`; the one that could not merge **said so plainly
  with the PR open and the branch named**, which is the block working.
- **Step zero: FIRED AGAIN, three times, and in the most valuable direction.** `582` recorded it 1 of 1
  on catching a stale item; this plan it caught three false premises instead. **It is now the
  highest-yielding block in the briefs.**
- **"Report, don't file": HELD on all six.** Every stream wrote findings into its PR body with *"for the
  planner to file"* and touched `docs/backlog.md` only for its own item. One went further and
  **deliberately did not tick**, naming what it had not reached. **Mechanism.**
- **The hypothesis rule: fired four times and the planner was wrong four times** — the migration
  negative, the Remote Control theory (twice), and a named candidate page that was not the page.
  **All four were marked as suspicions, so all four were cheap, and the stream corrected each one.**
  Sixteen rounds.
- **Ban the FILE, not the folder: PAID FOR THE FIRST TIME.** A stream needed
  `scripts/lib/permission-probes.mjs` and was free to edit it, where last plan's blanket `scripts/` ban
  cost #1197 a page-level permission check. **No crossing needed, because no boundary was in the way.**
- **The declared-crossing escape: fired twice**, and once found something the planner's own count had
  missed — a fifth quotation of a label in the manual, outside the stream's boundary, **crossed openly
  and fixed.**
- **Line endings: did NOT recur.** Writing LF for anything git tracks worked again.

## FOUR COSTS WORTH NOT REPEATING, ALL THE PLANNER'S

- **READ THE REFUSAL TEXT CLOSELY; DO NOT PATTERN-MATCH IT TO THE LAST ONE.** Three session-start
  refusals named three different conditions. The planner published **three** explanations before
  reading one field, then before asking one question. **Twice the refusal text was read as confirming a
  theory it did not mention** — its wording names a *remedy*, not the condition being tested.
- **`String.replace()` TREATS `$` SPECIALLY IN THE REPLACEMENT.** A plan-file amendment quoting a SQL
  `do $guard$` block silently ate part of the file and broke the next anchor. **Use
  `out.split(from).join(to)`, which is always literal.** **The per-anchor guard is what caught it** —
  without it the write would have reported success. Filed with two other skill fixes.
- **A BISECT LEAVES `next start` RUNNING AND BLOCKS THE GATES.** Cost two gates runs. **The signature is
  three gates green and only the build red: that means a stray process, not your diff.** Any
  build-heavy brief needs one line saying to stop each server before the next build.
- **EVERY ITEM THE PREVIOUS ROUND FILED FROM A PR BODY WENT INTO THE WRONG SECTION.** Two had to be
  moved; `check-backlog-sections.mjs` passes them because it tests POSITION only. **Both were appended
  at the end of whatever section the planner happened to be reading.** Watch it next round — the fix is
  a habit at filing time, not another checker.

## A SECOND `git merge backlog` CONFLICT SHAPE — the documented fix would have undone good work

The skill documents the conflict where *a PR ticks an item while the backlog branch rewords it*, and says
to keep `main`'s ticked line and drop the backlog branch's copy. **This plan produced a different shape
twice:** a PR ticked an item **in place** while the backlog branch had **MOVED that item into its correct
section.** **Keeping `main`'s line as written would have thrown the section fix away** and left the item
ticked where nobody reading the right section would see it.

**The resolution that keeps both: take the BACKLOG side of each hunk, stash `main`'s ticked line, and use
it to replace the un-ticked copy sitting in the right section.** Guard on: the hunk count, the stashed
tick count, each key matching exactly one un-ticked line, no markers left, and **the open-item arithmetic
(backlog's count minus the ticks)** — which is what proves nothing was lost or duplicated.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, every batch's
  figures and the full band reasoning: **`.plan-day.md`'s own blocks.**
- **BATCH 3 IS RUNNING AND ITS RESULTS ARE IN NO EDITION YET.** Three streams, the plan's last.
  **Read their `stream-usage:` comments and PR bodies at the next `/plan-day` before anything else.**
- **SIX OF THE NINE FIGURES ARE CLEAN BAND READINGS AND ALL SIX LANDED INSIDE. Three were
  `rescoped=yes` and are kept out of the bands.** **CORRECTED 2026-11-02, after this edition first
  merged saying *"only 3 of 9 … four were rescoped"* — both numbers were wrong.** That line was written
  at batch 3's setup, when only six figures existed: three clean and **three** rescoped. So it
  mis-stated the count even against what was then known, and its denominator implied all nine.
  **Batch 3 then came in 3 of 3 clean and 3 of 3 inside.** Figures: `.plan-day.md`.
- **THE RESCOPE RATE IS NOT NOISE ABOUT THE BANDS — IT IS THE FALSE-NEGATIVES FINDING, MEASURED.** All
  three rescopes had the same cause: a premise in the item that dissolved (a migration not needed, a
  migration needed after all, a regression that did not exist). **A brief whose premise dissolves is a
  rescope by definition, so fixing the negatives should raise the usable-reading count directly.**
- **Why this correction is its own PR rather than left to `600`:** a planner reading this tomorrow would
  band against a wrong rate, and **a wrong number carrying a document's authority is the expensive
  kind** — which is this plan's own lesson, so the edition should not be the thing that breaks it.
- **THE AUDIT ROW HELD A FOURTH TIME and its caveat is STILL untested.** A sweep that must **REPAIR**
  what it finds has never been measured, because four sweeps running have found almost nothing to repair.
  **Leave the caveat standing, worded as repair.**
- **A DECISION IS WAITING: the `website.content` card label.** It opens the desexing-drives page, which
  lists **who signed up**. Either the label widens, or the sign-up list becomes its own activity — and
  that second option is a permissions change, **so it is his to be shown, not a stream's to choose.**
- **ANSWERED THIS PLAN:** `#tags` on the public `/adopt` page → **strip tags from public output**, render
  a plain name. Recorded on the item with the question marked superseded in place.
- **MIGRATIONS ON DEV AND NOT ON PRODUCTION** are listed under `## Deployment (before go-live)` — read
  `--status` rather than this sentence. **THE PRODUCTION APPLY IS LUTAN'S**; give him the command at the
  moment he needs it, never earlier.
- **A release is the release manager's.** Lutan, 2026-11-01. **Do not cut one, do not prepare one, do not
  put it to him as a decision he owes.**
- **The Pi-failover drill and the `cloudflared` boot race need Lutan at the Pi.** Not streams.
- **One leftover worktree is HELD by an idle session** and he has been asked twice without answering.
  **Do not tear it down.** `/clean-streams` does the round; **`ahead` is not the test, the PR is** —
  a squash-merged branch stays ahead for ever.
- **Interruptions: THREE, all the planner's** — a migration a brief got backwards, and two session-start
  refusals that better reading would have avoided. **`CLAUDE.md` counts a third touch as a fault to write
  down; the same arithmetic applies to a batch.**
