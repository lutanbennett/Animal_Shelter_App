# Planner handover — edition `582`, 2026-11-02

**A delta over `573`.** It carries the **previous plan's batch 3** (which `573` could not, having been
written while that batch ran), **this plan's batches 1 and 2 in full**, and **batch 3's setup**.

> **THE LEAD: ONE GO FOR ALL NINE. Lutan, 2026-11-02: *"can we set it up so I give you a single go for
> all 9 streams and you sequence them in the correct order rather than me having to start you off for
> each batch"*.** Written into the skill (step 7, *ONE GO FOR ALL NINE*). **It changes only who pulls
> the trigger** — not the sequencing, not the cap of three live worktrees, not the batches.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `591`, due when the
next plan's last batch is set up.** **Batch 3's figures are NOT in this edition; `591` carries them.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE GO: HOW IT IS MEANT TO WORK, AND THE ONE THING THAT COULD STOP IT

**A plan of nine used to cost him three goes, and the second and third were ceremony** — the plan was
already decided and he was only supplying a trigger. The skill now says: he triggers the **plan**, the
planner sequences the **batches**.

**The mechanism, and read the skill rather than re-deriving it:** a batch finishing reaches the planner
as a `<side-sessions-event>`, which is normally a refused shape for starting a session — **but there is a
carve-out for a `<side-sessions-event>` turn that follows the user's own turn, or another such turn.** A
chain of them traces back to his single go.

**TREAT IT AS A HYPOTHESIS. Nobody has started a batch that way yet**, and this file's own rule — a
mitigation is a hypothesis until it fires — applies to the planner's own process as much as to a brief's.
**The fallback is exactly what he has today** (say so in one line, ask, retry the identical call, which
has worked both times), **so the downside is zero and the upside is two fewer interruptions a plan.**

**WHAT MUST STILL STOP THE CHAIN: a decision that is his.** One go is a trigger, not a mandate to drive
through a blocker. **Right now there is a live example** — see the `/adopt` decision below.

## THE BAND FINDINGS, BOTH PROMOTED INTO THE SKILL RATHER THAN CARRIED HERE

**Two overruns in one plan, both the planner's own mis-sizing, and neither a stream's fault.**

- **NAMING A RISK IS NOT PRICING IT.** `resident-tags-schema` went **+24%**, and `.plan-day.md` had
  predicted it *in words* while banding against it: *"the genuine unknown is deliverable 5 … design work
  the planner deliberately did not do."* It was then banded as a schema PR with nothing left to discover.
  **The general rule, now in the skill: a question whose answer is STRUCTURE — a table, a trigger, a
  function — is a BUILD, not a judgement.** The test: can it be answered in a sentence in the decision
  file, or only by adding something to the database?
- **A NEW TYPING SURFACE REPLICATED ACROSS N EXISTING FORMS IS N× THE WIRING.** `resident-tags-app` went
  **+32%** on the *creates a new surface* row, which was measured on **one** new form. It built one picker
  and wired it into **nine** existing note boxes and their nine save actions. **New row in the skill: the
  surface once, then ~15–20k per existing form.** The planner had the number — its own brief listed the
  eleven boxes in a table — and banded that table as one surface.
- **AND THE AUDIT ROW HELD A THIRD TIME, against a deliberate over-band.** `control-listing-sweep-2` was
  given 160–200k *because its list was long* and came in at 138,872, under even the audit row's floor.
  **So the length of the list does not move that row either.** The honest caveat is in the skill: all
  three sweeps found almost nothing, so **an audit that finds real repairs is still untested.**

## THE PLANNER BRIEFED A STREAM FOR WORK THAT HAD MERGED SIX HOURS EARLIER

**`website-editor-canedit` built nothing, opened no PR, and that was the correct outcome.** PR #1182 had
already fixed it at **00:19Z**, as read-only fields in `SitePageForm.tsx`, with its own decision file.

**Two causes, both repeatable, and the second is the one to fix:**

1. **The planner grepped the WRONG FILE** — `canEdit` in `PageEditPanel.tsx`, when the item says *the
   form*, which is `SitePageForm.tsx`. **A grep of the wrong file is not a grep**, and it returned the
   empty result that felt like proof.
2. **It did not run the two commands its own rule requires** — `ls docs/decisions/ | grep -i <subject>`
   and `git log -S`. **Either names #1182 at once.** They were written into the stream's step zero and
   **not executed by the planner itself. Writing a check into a brief is not running it.**

**Cost: ~12k and one `npm ci`.** That stream's whole session was 115,689 with **12,197 `Messages`** — about
12k above its floor to establish the work existed and stop. **Against a 110–140k build and a second
implementation of a solved problem, that is the step-zero block's clearest payout yet.** It is 1 of 1 on
catching a stale item. **Batch 3's three items each got both commands before a word was written**, and
that caught two live scope changes (see `.plan-day.md`).

## WHAT `573`'s WARNINGS DID

- **The gates/CI-wait block: CLOSED, and not by rewording.** `573` said *"if it fails a third time the
  brief is not the lever"* — it had failed five times. **It was replaced with a numbered final
  deliverable** (*gates green, pushed, PR open, CI green on my own head commit, usage comment posted,
  merged*), which makes an unfinished finish an **unreported deliverable** that the
  report-every-deliverable block already catches. **Batch 2: 3 of 3 unaided**, including one that reported
  mid-wait and then merged itself. **Three rewordings went 4 of 10; one numbered deliverable went 3 of 3.**
  In batch 3's briefs too — **check it a second time before promoting it.**
- **The refused session start: HELD, and never fired.** Three batches in a row, his own message carried
  the instruction. **Tally: nine batches succeeded, four refusals, two recovered by a verbatim retry, three
  batches never refused.** The single-go mode above is the next test of the same condition.
- **"A stream may claim a filing it did not make": HELD on all six streams.** Every one wrote its findings
  into its PR body with *"for the planner to file"* and touched `docs/backlog.md` only to tick its own item.
  **Treat it as mechanism.**
- **The hypothesis rule: fired twice, and BOTH TIMES THE PLANNER WAS WRONG AND SAID SO FIRST.** It guessed
  a second migration was the enum two-file rule (it was a trigger fix to an already-applied file) and
  guessed a level bug in the website editor (`can()` defaults to `edit`, so there was none). **Both were
  marked as reasoning rather than findings, so both were cheap.** Twelve rounds.
- **An open question in the numbered deliverables: fired, thirteen rounds.** All six streams carried one,
  and #1191's answer **changed its own deliverable**.
- **The line-endings whole-file conflict: did NOT recur.** Writing **LF for anything git tracks** worked.
  `git merge backlog` conflicted once all day, on content, and resolved the documented way.

## THREE NEW COSTS WORTH NOT REPEATING

- **BOTH OF THE PLANNER'S MID-FLIGHT MESSAGES WERE STALE.** After #1193 merged, both live streams were
  told to `sync` before pushing; **both had already synced and both said so.** The serial-sync rule is
  right, but **a stream about to push has already done it.** `worktree.mjs list`'s `unpushed` and `behind`
  columns answer that *before* the message is written. **Two interruptions of working sessions, bought
  nothing.**
- **A TOO-WIDE BAN COST A PAGE-LEVEL PERMISSION CHECK, for the second time in three weeks.** #1197 needed
  a page-level `can(resident.record, "read")`, found `check-permission-catalogue.mjs` pins each page's
  activity list, and **could not update it because its brief banned all of `scripts/`.** It dropped the
  check and declared the crossing. **The escape worked; the boundary was still wrong. Ban the FILE.**
  Filed as its own `## Security` item.
- **A STREAM TICKED AN ITEM THAT WAS 9 OF 11 DONE, and the planner UN-TICKED it.** *"Every free-text note
  box on a resident"* is what the item and Lutan both say. **A ticked item whose work is part done reads as
  finished and nobody re-reads it** — the invisibility fault that costs most.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, and every batch's
  figures: `.plan-day.md`'s own blocks.
- **BATCH 3 IS RUNNING AND ITS RESULTS ARE IN NO EDITION YET.** Three streams, the plan's last.
  **Read their `stream-usage:` comments and PR bodies at the next `/plan-day` before anything else.**
- **A DECISION IS WAITING ON LUTAN AND IT BLOCKS WORK: `temperament_notes` and `past_story_notes` ARE
  SHOWN ON THE PUBLIC `/adopt` PAGE**, so a `#Name` typed in one appears as text on the public site naming
  another resident. Strip tags from public output, render them as plain names, or forbid tags in those two
  boxes. **Asked, not answered. Nothing else on that item should be wired until it is settled**, and it is
  the live example of what pauses the single-go chain.
- **THREE MIGRATIONS ARE ON DEV AND NOT ON PRODUCTION** (`0298`, `0299`, `0300`), under
  `## Deployment (before go-live)`. `scripts/deploy.mjs` refuses a production deploy until every migration
  on `main` is applied. **Read `--status` first; the runner applies every pending file. THE PRODUCTION
  APPLY IS LUTAN'S** — the classifier refuses it as `[Production Deploy]` — so read the status and the dry
  run, then give him the command **at the moment he needs it, never earlier.**
- **A release is the release manager's.** Lutan, 2026-11-01: *"I will get the release manager to do the
  release."* **Do not cut one, do not prepare one, do not put it to him as a decision he owes.** Major
  versus minor and the production Worker deploy remain his.
- **FIVE BATCHES OF UNREVIEWED THAI now queue behind one bilingual read**, the newest being wording a
  worker meets *while typing*. **That accumulation is itself the argument for the item's own durable half:**
  whether new Thai strings should queue somewhere a Thai reader sees them.
- **The Pi-failover sweep is finished at 149 of 149 addresses, and that is NOT the failover working end to
  end.** The fallback stops covering after about eleven seconds; it needs a repeat power-pull drill with
  `wrangler tail`, which needs Lutan at the Pi. **Not a stream. Do not brief one.**
- **Leftover worktrees accumulate fast and were cleared twice today.** `/clean-streams` does the round.
  **`ahead` is not the test; the PR is** — except where `list` says `UNMERGED WORK`. **A stream can merge
  DURING a cleanup round**, so the re-list at the end is what catches it, not bookkeeping.
- **Interruptions: ZERO across batches 1 and 2** — no refused start, no refused command, nothing a brief
  should have settled. **The two stale sync messages were the planner interrupting the STREAMS**, which is
  the same defect pointing the other way, and it belongs in the count.
