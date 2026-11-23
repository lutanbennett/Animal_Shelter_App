# Planner handover — edition `772`, 2026-11-23

**This is a DELTA against `771`.** It says what changed, corrects its predecessor, and reports what `771`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THIRTEEN STREAMS AND IS FOUR OVERDUE, WHICH IS ITS OWN FINDING.** #1827, #1828, #1829, #1830,
#1831, #1832+#1835 (one stream, two PRs, one count), #1833, #1839 (seventeenth plan); #1840, #1841, #1842,
#1845, #1846 (eighteenth plan). **Ten of the thirteen are usable readings**; three are marked out below.

**THE COUNT ROSE TWICE WHILE THIS DOCUMENT WAS BEING WRITTEN, AND THAT IS THE POINT.** The trigger is nine
and there is no credit for overshooting. Batch 1 of the eighteenth plan merged inside the hour and took the
count from 8 straight past 9 to 11; #1845 made 12 while the figures were being read; #1846 made 13 while
this paragraph's predecessor said twelve, and was found only because a `worktree.mjs sync` pulled in a
decision file that should not have existed yet. **`#thpfx` (PR #1847) is OPEN at writing, so the next
edition opens at 1, not 0, and #1847's figure is read next morning.** **If a batch can merge in under
twenty minutes, the counter must be read at the END of a turn and never carried across one.** The counter
resets to 0 when this PR merges.

**NOT COUNTED, EACH CHECKED RATHER THAN ASSUMED** (no `stream-usage:` comment on any of them): #1824
(edition `771`'s own PR), #1825 `record-test-worker`, #1826 `canary-production-attempt`, #1834
`cut-release-0-48-0`, #1836/#1837 the `0.48.0` record, #1838 `canary-production-run`, and **#1843 + #1844,
which the Backlog manager opened** — only a stream a plan created counts (his ruling, 2026-11-20).

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, ~390 lines, and the only record of the eighteenth plan's
   reasoning and the corrections made during it.
2. **Check what is in flight before you believe anything here.** At writing: **PR #1847 (`#thpfx`, 3007) is
   OPEN**; `#calsc` (#1845) and `#rlbat` (#1846) are merged. **The eighteenth plan's whole second batch went
   from setup to merged in under half an hour**, so anything this document says about what is running was
   probably untrue before you read it. **Run `gh pr list --state open` first.**
3. **FIVE MERGED WORKTREES NEED CLEARING** once he closes their sessions: `product-site-pages` (3001),
   `deploy-secrets-registry` (3002), `worktree-reserved` (3003), `calendar-narrow-scope` (3006) and
   `reels-batch-upload` (3008). **All PRs merged and all five figures already read and recorded**, so nothing is lost by waiting. **`done`
   them; do not force**, and do not touch `Animal_Shelter_backlog-names-signoff` — the Backlog manager's.
4. **`0.48.0` SHIPPED 2026-11-22.** The release manager cut it; the planner did not.
5. **BATCH 3 IS NOT QUEUEABLE AND THE PREVIOUS PLAN HAD THIS WRONG.** `#drvcl` was lined up as batch 3
   because ticking `#83137` looked like it cleared the queue. **It did not.** `#drvcl`'s own tail: *"What
   is left before the consent is one command of Lutan's"* — production's `DRIVE_CREDENTIALS_KEY` onto the
   production Worker with `wrangler secret bulk`. **A worktree cannot do it and neither can the planning
   session**, which is refused `wrangler`.

## THE LESSON OF THE DAY: A `SUPERSEDED` MARKER IS READ BY WHOEVER STARTS AT THE TOP, AND NOBODY STARTS AT THE TOP

**Two sessions made the identical mistake from the same backlog item within one day, independently.** Both
read `#u2bo6` as waiting on a deploy of Lutan's. **It is not, and has not been since 2026-11-06.** That
item's head says in terms:

> *"So 'Lutan deploys and confirms Workers AI' is DONE for dev/test (the cron ships with every Worker
> deploy). NOT READ: production. LEFT: the two managers compare two models … **Everything below that says
> the deploy is still to do is SUPERSEDED.**"*

The contradicting *"Still to do: Lutan deploys to test and production"* line is the **STATUS 2026-10-21**
block, sitting below that sentence — exactly what the sentence names. **The guard is correct and both
readers walked past it.**

**THE MECHANISM, AND IT IMPLICATES THIS SKILL'S OWN INSTRUCTION.** `plan-day/SKILL.md:251` says *"Read the
WHOLE item, tail included"* and hands you the command: `sed -n '<n>p' docs/backlog.md | tail -c 900`. For a
7 KB item line that is a sensible habit — **and it is structurally guaranteed to land you BELOW the guard
sentence while never showing it to you.** The habit and the item shape combine into a reliable wrong
answer. **The convention is to read the tail; the guard only protects a reader who starts at the head.**

**WHAT TO DO ABOUT IT, which is the Backlog manager's addition and is better than merely being careful:**
`CLAUDE.md` already requires an item to read correctly *without* its last paragraph. **This is the same
requirement one level up and in the other direction: a superseded lower half should be CUT, not MARKED**,
because a marker only works for a reader who will never reach what it guards. **If cutting in bulk is too
destructive, the cheap version is to quote the superseded block's own first words, dated, inside the head's
sentence** — then a tail-reader who greps for the status line sees it quoted above and knows.

**WHY IT MATTERS MORE THAN A MISREAD ROW:** the wrong answer put a finished job back onto Lutan's list.
**That is the one error his own rule says never gets caught**, because nobody re-asks a question they
believe is already with him — `assistant-retention` sat parked for nine days exactly that way. It reached
his Desktop sheet and was removed within the hour only because two sessions disagreed in writing.

## WHAT `771` LEFT OWED — ALL FOUR ANSWERED

1. **`#9l7xf`'s production read** — `771` already recorded this closed. **Unchanged.**
2. **`#drvcl`'s first Google consent is HIS.** **Still true and now narrower:** the calendar half closed
   with #1845, and `.env.deploy.uat` has gained the connect secret, so **production alone is unconfigured**
   and what is left is one `wrangler secret bulk`. `#drvcl` is tagged `lutan`.
3. **`#cjred`'s last clause** needs a signed-in login that is not a product administrator. **Unchanged,
   still his.**
4. **The `scheduled_writer_runs` read, unfiled.** **STILL UNFILED. `772` inherits it.**

## THE PLANNER'S OWN DEFECTS — FOUR, AND ALL FOUR ARE ONE FAULT

**Reasoning about a file instead of opening it.** Each was caught by someone else, which is the only reason
they are here rather than in the repository.

1. **`git commit -am` in the shared `Animal_Shelter_Backlog` worktree** swept up another session's
   uncommitted `backlog-names.json`. **The pre-commit hook refused it.**
2. **Then advising that session to drop its uncommitted change and fast-forward.** It checked the commit
   instead of taking the summary: `git grep -c "Use yours" ec2263dd3` returns **0**. That advice would have
   discarded **a decision Lutan gave that morning** (`#psubp`'s address) and a title correction.
3. **Recommending hook-side JSON validation** for the names file. The Backlog manager measured the hook and
   found the recommendation aimed at the wrong layer: the guard already covered both files and the script
   already enforced the shape, while the real hole was `[ "$rc" -eq 3 ] && return 1` refusing only on exit
   3 when an unreadable names file exits **1**. **The recommendation would have duplicated a check and left
   the hole open.**
4. **Telling a stream that `#drvcl`'s queue was clear because `#83137` was ticked**, and **copying forward
   `#u2bo6`'s superseded reading** — both from notes rather than from the item.

**THE RULE EARNED: the `Backlog` worktree is shared. Announce before editing it, never `git commit -am` in
it, and read what is in a change before advising anyone to discard it.** Announcing first worked: the second
round of edits was cleared in one message and collided with nothing.

**AND THE ONE THAT WENT RIGHT, WORTH COPYING:** a guarded script refused its own edit — *"REFUSED: the
#drvcl note is already there"* — because `#drvcl` already recorded the `GOOGLE_CONNECT_*` precondition in
more detail than the handover being carried. **Write the guard, then let it tell you.**

## HIS DECISIONS OF THE DAY — SETTLED, DO NOT RE-OPEN

- **The `backlog` branch may also commit `docs/backlog-names.json`, with its shape asserted.** Asked as one
  question; answered *"Allow it, with a check"*. Shipped as #1843 + #1844. **What he approved is the
  GUARANTEE, not its location** — the mechanism built differs from the one he was shown, and he was
  deliberately **not** re-asked.
- **`#rlbat`'s batch metadata: "Per clip after upload".** Upload the clips first, then type each one's
  description, date and tags on a list afterwards. **He overruled the planner's recommendation** (one date
  and one tag set for the batch, a description per clip). **That makes it a second surface rather than three
  fields, so its band was raised 175-205k → 210-250k before the session opened.**
- **Setting up a batch MOVES its items' waiting tag to `stream`.** The planner's call, made because the
  Backlog manager asked rather than fixed. **The planner is the only party who knows a worktree was just
  created, so it is the planner's edit at setup.**

## A BLOCKING CI CHECK WAS RED ON `main` BEFORE ANY STREAM PUSHED

`check-backlog-waiting.mjs` — shipped by `#bkwai` the previous day — **exited 3 on `main`**, and runs at
`ci.yml:199` (the `script-integrity` job) **with no `continue-on-error`**. Three items filed overnight had
no tag and no name, so **every PR opened that day would have gone red on a check about items none of those
streams filed.**

**It was found by curiosity, not by process**, and the deadlock underneath it was worse: the check demanded
a name in `docs/backlog-names.json` while the `backlog` branch's hook forbade that file, **so the backlog
branch could not satisfy a check that gated its own commits.** Folded into a stream as a numbered
deliverable 0, landed within minutes, and closed properly by #1843.

**Filed as `#ckcia`:** nothing re-asks whether a newly shipped blocking check passes on `main`. **The
cheapest shape is probably `check-planner-preflight.mjs` growing one question**, since it already runs at
the top of every plan.

## THE `stream` TAG DECISION HAD A TAIL, AND IT COST THREE MORE TAGS

**Deciding what `stream` MEANS retrospectively edited every tag that already held it.** Three predated the
decision and read as *somebody is building this* when nobody was: `#u2bo6` → `person`, `#drvcl` → `lutan`,
`#cjseo` → `buildable`. **Each went a different way, read off the item's own tail, so no blanket rule would
have worked.**

**THE GENERAL LESSON, IN BOTH DIRECTIONS.** A decision about what a state means is followed, **in the same
turn**, by a sweep of every tag that already holds it — **and** by a sweep of every piece of **wording**
that straddled the two states. The Backlog manager's generator had `"A stream"` satisfying a `stream` tag
*and* `"A stream (on it now)"` satisfying a `buildable` tag; it found the second only because a tag moved
back. **Anything keyed on these states can be reading pre-decision tags with post-decision meaning.**

## FIGURES — TWELVE STREAMS, NINE USABLE READINGS

| PR | slug | band | tokens | messages | floor | verdict |
|---|---|---|---|---|---|---|
| #1827 | `test-deploy-token-file` | 145-175k | 163,393 | 75,119 | 88,274 | in band |
| #1828 | `writer-outcome-read` | 145-180k | 160,256 | 70,697 | 89,559 | in band |
| #1829 | `cooperjaidee-product-page` | 250-310k | 222,765 | 133,544 | 89,221 | **UNDER by ~27k** |
| #1830 | `drive-alert-honesty` | 145-175k | 156,832 | 67,835 | 88,997 | in band |
| #1831 | `tenancy-canary-production-flag` | 150-185k | 190,398 | 97,852 | 92,546 | **OVER by 5.4k** |
| #1835 | `shelter-drive-move` | 220-280k | 233,393 | 144,404 | 88,989 | `finished=blocked` — **not a reading** |
| #1833 | `platform-search-register` | 150-185k | 161,687 | 72,466 | 89,221 | in band |
| #1839 | `backlog-waiting-state` | 190-240k | 115,931 | 26,703 | 89,228 | `compacted=yes` — **not a reading** |
| #1840 | `worktree-reserved` | 143-170k | 158,559 | 66,763 | 91,796 | in band |
| #1841 | `deploy-secrets-registry` | 146-175k | 205,874 | 116,871 | 89,003 | **OVER by 31k (~18%)** |
| #1842 | `product-site-pages` | 300-380k | 235,616 | 145,890 | 89,726 | `rescoped=yes` — **not a reading** |
| #1845 | `calendar-narrow-scope` | 185-230k | 164,195 | 75,125 | 89,070 | **UNDER by ~21k** |
| #1846 | `reels-batch-upload` | 210-250k (its comment says 175-205k) | 164,312 | 74,295 | 90,017 | **band does not apply — see below** |

**Ten usable: five in band, two under, two over, and #1846's band does not apply.** Dials matched the brief
on all thirteen, so every floor is comparable.

**#1846 QUOTED A BAND THE BRIEF NO LONGER HELD, AND THAT IS EVIDENCE ABOUT THE PLANNER, NOT THE STREAM.**
Its comment says `band=175-205k`; the brief said `210-250k` when checked after the patch, confirmed through
`worktree.mjs streams`. **So the stream was working from the brief as it stood before the patch** — which is
the mechanism behind the far more serious finding below. Per the reading rule, a figure whose header does not
match its brief is **printed, never counted as a variance**: 164,312 is recorded, and no band is revised from
it.

### THE FLOOR — ELEVEN READINGS, 88.3k TO 92.5k

`88,274 · 88,989 · 88,997 · 89,003 · 89,070 · 89,221 · 89,221 · 89,559 · 89,726 · 91,796 · 92,546`
(the compacted one excluded). **Nine of eleven sit inside 88.3-89.8k; `91,796` and `92,546` are the two
highs.** `89,221` appears twice again for two unrelated streams — **the exact repeat now recurring for a
fourth consecutive day. Record it; offer no cause.** Re-derive from the next complete set; never carry
forward. **The scale rows were measured from actuals, not derived from the floor — do not shift them.**

### THE ONE PATTERN IN THE TWO UNDERS, AND IT IS THE PLANNER'S TO FIX

**`#1829` came in 27k under and `#1845` 21k under, for the same reason: the brief had already answered the
expensive question, and the band was priced as though it had not.** `#1845`'s band included a migration
decision the brief itself had already settled, by reading its own open question back against the schema and
finding `calendar_id` and `calendar_account_email` already distinct. **A brief that answers the dear
question discounts its own band. Price what the stream must still FIND OUT, not what the item asked.**

**`#1841`'s 31k overrun is a BRIEF defect, not a band to raise.** It was priced as the ordinary stream
because the expensive measurement was handed over. **What it shipped was larger than what it was priced
for:** the Pi lists were not hand-written name by name as the item asked but **re-derived as filters over
one catalogue**, which is a better answer and a bigger job. **A stream that improves on its brief overruns
its band, and that is the brief's cost.**

## THE SAME QUESTION WAS ASKED TWICE BY TWO SESSIONS AND GOT TWO DIFFERENT ANSWERS — READ THIS BEFORE YOU PATCH A BRIEF

**`#rlbat`'s metadata question has two answers on record, hours apart on the same day, and the shipped code
follows the second.**

- **To the planner, in the planning chat:** asked with four options, he chose **"Per clip after upload"** —
  upload the clips, then type each one's description, date and tags on a list **inside the flow**.
- **To the stream, in its own session:** its decision file says *"asked which of three options he wanted …
  he chose **Blank, edit later**"*, and that is what merged: each clip becomes a reel with today's date, no
  description and no tags, **to be edited afterwards in the library.**

**BOTH ARE HIS AND NEITHER SESSION DID ANYTHING WRONG.** He was asked twice, minutes apart, with differently
worded option sets — four options from the planner, three from the stream. **It is on the planner that he was
asked at all.**

**THE MECHANISM, WHICH IS THE REUSABLE PART: A BRIEF IS READ ONCE, AT SESSION START, AND PATCHING IT
AFTERWARDS REACHES NOBODY.** The planner answered the question into the brief — his words, the band raised
175-205k → 210-250k, and a deliverable telling the stream not to re-open it — and **verified the patch had
landed.** It had. **The session had already opened.** The brief on disk and the brief in the session were
different documents from that moment on, and nothing says so: `worktree.mjs streams` reads the file, not the
session. **The stale `band=` in the usage comment is the only visible trace, and it is visible only after
the fact.**

**THE RULE: once a session may have opened, a brief is frozen. Send the correction to the SESSION**
(`SendMessage` to its `local_…` id), **or do not make it.** A patch to a brief is only safe before the
session exists. **And do not congratulate yourself for verifying the file** — the planner did exactly that
and it proved the wrong thing.

**WHAT IS OWED ON IT: his choice, put to him once, plainly.** What shipped is the cheapest option and it
works; what he told the planner costs a list in the flow and means a batch gets described in one sitting
rather than needing a trip back through the library. **Do not rebuild it on a guess, and do not ask him to
re-choose between four options again** — show him the difference and ask whether to keep what shipped.

## FILED, TICKED AND CORRECTED

- **`#83137` ticked** — its stream judged the Done-when met but **could not write the tick**, because the
  hook refused the file; it parked it in a stash and the item read open after the work shipped. **Verified
  in the shipped code before ticking, not taken from the PR body.** Two `SUPERSEDED` corrections folded into
  one block: the `DRIVE_CREDENTIALS_KEY` lead, and a stale citation of `#drvtk`'s revoked UAT token.
- **`#utcds` filed:** `check-backlog-waiting.mjs` compares `since:` against the **UTC** date, so for the
  first seven hours of a Thailand working day today's date reads as the future. **It has already cost two
  filings, backdated to get a commit through.** And it **cannot be reproduced during the working day** — a
  session trying at 14:00 concludes there is no fault. It needs a fixed instant injected.
- **`#ckcia` filed** (above). **`#calsc` retagged `lutan`** and annotated: built and merged, two steps left
  and both his, **neither provable from a listing.**
- **`#psubp`, `#fnbnd`, `#wtres` ticked by their own streams.** **`#cjseo` is NOT `PROOF OWED`** —
  `check-stale-titles.mjs` reports 0, and the item says *"NOTHING LEFT TO DECIDE; BUILDABLE NOW"*. The
  previous plan recorded it as proof owed and that note does not match the file. **Whether #1829 largely
  shipped it is NOT established and is worth one read before it is planned.**

## STILL OWED

1. **The `scheduled_writer_runs` read**, inherited unfiled from `770` and `771`. **Third edition.**
2. **His Cloud console look at `calendar.app.created`'s classification**, and an Admin pressing Connect on a
   real account. If it is **sensitive**, `#calsc` reopens its three routes rather than being forced.
3. **Production's `DRIVE_CREDENTIALS_KEY` onto the production Worker** — one command of his, and the only
   thing between `#drvcl` and its first consent.
4. **Clearing the five merged worktrees** once he closes their sessions.
5. **`#rlbat`'s metadata: his choice between what shipped and what he told the planner** (above). **`#rlbat`
   is NOT ticked** — its `DONE WHEN` needs a real three-clip upload from a phone, which the stream correctly
   recorded as `pending:` rather than proving something smaller.
6. **`#thpfx`'s figure**, from PR #1847, read next morning.

## PROCESS NOTES

- **A question put to him AFTER the list went out cost one patch to a brief no session had opened.** Asking
  first would have held his list behind a question. **Never hold the list for a question that can be
  answered into the brief.**
- **A peer that checks instead of complying is worth more than one that agrees.** Three of the four defects
  above were caught by the same session reading a file the planner had reasoned about. **Push back when the
  evidence is in the file, and read the file before you do.**
- **`#1832` and `#1835` are one stream with two PRs. One stream, one count.**

## INTERRUPTIONS

**None of the day's work was interrupted by a briefing defect.** The one correction landed in front of him —
a job put back on his list that was finished on 2026-11-06 — and it was removed within the hour. **Cost: one
message of his, and it was a message he should never have needed.**
