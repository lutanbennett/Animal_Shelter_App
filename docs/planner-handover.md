# Planner handover — edition `510`, 2026-10-30

**A delta, twenty-ninth edition in this shape. Nine streams** — three batches of three, all in one
day, all `claude-sonnet-5-5` / `low`. **Six are measured; batch 3 was set up at the end and its
figures belong to you.** `501`'s subject was *a prohibition is a claim about the repo, and it ages
and misleads like any other*. **All five of its promotions fired or held.** This round's subject is
that same sentence with one word changed, because the most expensive thing that happened was a
claim nobody checked: **a PR BODY is a claim about the repo too.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `501` → this. **The next slug is `519`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: A PR BODY IS A CLAIM ABOUT THE REPO, AND EVERY INSTRUMENT WE HAVE WILL AGREE WITH IT

#1113's PR body says, as its own numbered deliverable 3: *"`audit.ts` writes both — done."*
**It was never written.** `src/lib/assistant/audit.ts` is 50 lines, its `AssistantActionLog` type has
no `model` or `exchange` field, its insert sends neither key, and `git log -- src/lib/assistant/audit.ts`
shows it last changed in `0b87dad2`, a **version 1** commit. `docs/decisions/2026-10-30-assistant-v2-schema.md`
line 12 repeats the claim, and `0289`'s own `-- consumer:` header names that file. So a merged
migration points at a consumer that does not consume it.

**Everything that should have caught this reported green:** CI, the test plan, the backlog tick, the
usage comment — **and the report-every-deliverable block, which the stream followed to the letter.**
That block asks a stream to *account for* each deliverable. It does not ask it to *re-read the file*
before writing "done", and this stream did not.

**So the fix is one clause, and I put it in all three of batch 3's briefs: _before you write "done"
against a deliverable, open the file and look._** Check next round whether it fired; it is a
hypothesis, not a fix.

**Two things follow that are worth more than the fix.** First, **this is `501`'s lesson one role
over** — it warned the planner not to assert about files it had not opened, and the same fault
appeared in a stream's own prose about its own work. **The generalisation is the thing to carry:
prohibition, count, prior pass, instrument, conclusion, PR body — all claims, all with a clock.**
Second, **I found it only because I re-read a deliverable list from a batch that had already
merged.** Nothing routine would have surfaced it.

## AND THE OTHER HALF: A STREAM CAN **REPORT**; ONLY THE PLANNER CAN **FILE**

#1118 did everything right. Its PR body said, outside its deliverable list: *"Worker cannot reach
localhost/LAN (reasoned, not tested); shape is a Cloudflare tunnel like the Pi's. Not built."* and
*"the replay stream's files were not in this branch, so the meeting point is unchecked."*

**Both are real, neither was on any backlog item, and both would have gone with the PR.** The
report-every-deliverable block worked exactly as designed — and **saying something in a PR body is
not filing it.** A stream has no mandate to create backlog items and should not; the planner is the
only role that reads every PR and every item.

So, every round: **read each merged PR body for findings OUTSIDE the deliverable list, and file
them before you brief anything.** I filed these as one item (`181dd4f2`) and it became batch 3's
stream 8 — a whole stream that existed only because someone read a PR body.

## WHAT `501` ASKED FOR, and what each promotion did

- **Ban the FILE, not the folder, and open anything you assert or forbid. FIRED, TWICE, AND THE
  SECOND IS THE INTERESTING ONE.** Every brief this round named `scripts/lib/exit.mjs` rather than
  banning `scripts/lib/`, and named the one carve-out (`acceptance-matrix-entries.mjs`) in both
  briefs that could collide over it. **Interruptions: zero across nine streams**, against two the
  round before. **The second firing is that the rule caught ME** — see the section above; the fault
  moved from my prohibitions to a stream's PR body, which is the same rule needing a wider name.
- **"If a numbered deliverable needs a file I have forbidden, say so in your PR and do it." HELD,
  and it is now load-bearing.** #1118 declared four crossings (`llm.ts` error kinds,
  `runtime-config.mjs`, `.env.example`, the security registry) and asked nobody. **A declared
  crossing is the output you want; an interruption is the one you do not.**
- **An open question belongs in the NUMBERED DELIVERABLES, not step zero. FIRED, AND IT CLOSED ITS
  OWN FAILURE.** `501` recorded missing the `shop.manage` probe question by putting it in step zero.
  I moved it into shop's numbered deliverables; that stream is live, so **you confirm it.**
- **Count interruptions as a cost of the brief. HELD at zero, with one exception that is not a
  briefing defect:** the classifier refused `gh pr merge` on the release record PR (#1112) as "merge
  without review", exactly as memory `merge-without-review-block` predicts. **Lutan had to ask for
  it in chat.** Nothing in the repo fixes that; report it and retry on his word.
- **Report every deliverable. HELD on six of six, and FAILED ONCE on truthfulness** — see the top.
  **It is settled mechanism for coverage and not for accuracy.** Say it that way from now on.

## THE BAND MISS, AND WHY IT WAS MY OWN SCALE COLUMN TELLING ME

**`assistant-llm-adapter`: banded 145–185k, came in at 239,092 — 29% over, the round's only miss.**
I used *a new integration on existing machinery*. **There was no existing machinery**: it was the
first LLM code in the repo, so it wrote the interface, a Claude implementation, the tool derivation,
mocked tests **and a new CI check**, and had to move `zod` for a high advisory. The skill says
reserve 250–320k for a stream with no existing piece to extend. **The giveaway was in the scale
column of my own measurement table — "first LLM code in the repo" — which I wrote and did not read.**

**The counterweight, and it is a deliberate reading worth banking:** when Lutan cancelled the Claude
prototype mid-round I re-banded `assistant-openai-compatible` from 145–185k to **170–215k for BRIEF
CONTENT, not code shape** — a runbook written for a non-developer, two open questions, a candidate
comparison. It landed at **166,230**, just under the new band and above the old one's midpoint.
**Widening for what you put in the brief works.** One reading; a second would promote it.

**Floor: ~102k**, from batch 2's own figures (101,932 · 102,268 · 102,366) — remarkably tight, down
from ~105k. Re-measure; never carry it forward.

## A MID-BATCH SWAP BEFORE ANY SESSION ATTACHES IS FREE, AND IT IS NOT A RESCOPE

Lutan changed the target mid-round (below). Batch 2 was already set up. **All three worktrees stood
at zero commits with no session attached**, so I removed one, created its replacement, and
**corrected the other two briefs on disk**. Nothing was lost and no stream saw a correction.

**The distinction matters for the bands:** the skill says a brief you corrected mid-flight corrupts
the figure. **A brief corrected before the session starts does not** — it is simply a different
brief. All three landed inside or under. **Check `worktree.mjs list` for `held` and `ahead` before
concluding a swap is expensive; usually it is not.**

## WHEN YOU RECORD HIS WORDS, PIN THE SCOPE — OR THE RECORD IS FALSE

Lutan said *"I would prefer to keep this 100% in house."* **Taken literally that is not true of this
app**, which runs on Cloudflare, stores data in Supabase and keeps files in Google Drive, none of
which he was asking to change. He meant the language model and the text typed at it.

I wrote the scope into the item in those words. **Without it, a future session reads "100% in house"
and opens an argument nobody wanted.** His words are the authority; the scope is the planner's job,
and it costs one sentence.

## HIS DECISIONS THIS ROUND — all recorded on the backlog; never re-ask

- **No Claude proof of concept, no Anthropic API key. Self-hosted from the start.** *"Let's not do
  the proof of concept, I'd prefer to look at the options we have to get this onto a self hosted
  model."* This **confirms** the item's 2026-09-22 hosting direction and cancels only the staging.
  **The eval set was never Claude's output** — it is the could-not-help log, labelled by hand.
- **The model runs on hardware he owns. A rented GPU and a hosted endpoint are both ruled out.**
- **He is buying a PC for his Quest 3**, so the GPU is paid for by the hobby. Advice given: a
  current-generation NVIDIA card with **16 GB** of its own memory. **The spare i7 laptop (16 GB,
  integrated graphics) is the build-and-measure box, not the host** — on a CPU the slow part is
  reading the prompt. Asked whether 32 GB would help, I advised measuring before buying: more RAM
  only admits a bigger, slower model.
- **What is still open and is his:** whether the PC stays on, wakes on demand, or is simply
  sometimes asleep — tolerable, because the keyword parser still answers. And **following the
  runbook**, which no session can do for him.

## STATE, RE-READ EVERY TIME

Everything factual is in `.plan-day.md` and the repo. Do not quote any of it from here.
Batch 3 is live on ports 3001–3003; its three figures are yours to capture **before those sessions
are archived**. `docs/self-hosted-model-runbook.md` is written and **not yet followed by anyone**.
