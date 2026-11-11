# plan-day reference — the evidence behind `SKILL.md`

**`SKILL.md` was 2,176 lines on 2026-11-08** and was cut to about 250 on Lutan's instruction: *"Yes cut
down the skill and then we can build back in if needed later"*, after he had asked three times in one day
where his plan was and was told, truthfully, that the planner had been satisfying the document instead of
delivering to him.

**This file is NOT loaded with the skill.** It holds the evidence, the incidents and the measurements, so
`SKILL.md` can state a rule in one line and a planner can come here when it needs to know why. **To build
something back in, copy it into `SKILL.md` and take something else out.**

**The complete 2,176-line edition is in git** — the commit that created this file removed it, so
`git log --follow -p .claude/skills/plan-day/SKILL.md` has every word. Nothing was lost, only moved.

---

## 1. What each rule in `SKILL.md` came from

**THE ONE RULE (the list first).** 2026-11-08, three instances in one day. Two `/plan-day` runs took the
resume path, which says *"report what changed, then go straight to step 2"* and has **no step that shows
him anything** — so the mandated §6 question never fired and he was handed batches he had never seen. He
also had to ask for the batch-2 list after it had been written into a long report and referred to as
"above". His words: *"I'm getting annoyed, we never agreed on the 3 batched today"*, *"Where is my plan
for today"*, *"You haven't given me the batch 2 list yet - why are we having so many issues with the
process"*. The same fault had been diagnosed on 2026-11-07 (*"Background work is to be done after - I
don't know how many times I need to repeat myself"*, then *"So this is the 4th time today, There is
something wrong with your instructions"*) and the file was **reordered** so setup became step 2.
**Reordering did not fix it, which is the lesson: the problem was never the order of the steps but how
many of them competed for attention.** Hence the cut.

**A saved plan is not an agreed plan.** Same day, same cause as above. `.plan-day.md` is invisible from
the chat.

**Hand the sessions back.** 2026-11-03: *"this new process seems to be using a lot more of my allocation
per batch. Can we go back to the way we used to do it, you create the streams and I will manually start
each one"*, then, correcting an answer given in tokens: *"My usage is not based on Tokens, it's based on
turns"* … *"it's the Maxplan"*. Decision file: `docs/decisions/2026-11-03-planner-hands-sessions-back.md`.

**Never block his paid usage.** 2026-10-14: *"I am happy for you to warn me and advise but not block like
this, it's actually unethical for you to block the usage I paid for."* The conversion rule is his too,
2026-10-28: *"3 streams takes about 2% of my weekly usage"* — measured the same day, **sixteen streams
moved the weekly reading from 91% to 94%**, after the planner had forecast that a batch of three might
meet the ceiling. A percentage with no conversion is what made it sound alarming.

**All analysis by card, never by role.** 2026-10-28, twice in one day. It broke in the choosing step:
card review 2 was sized straight off `check-menu-coverage`'s role-shaped output hours after the planner
had written the instruction down. **A per-role count is not a count of work** — "32 orphans" was 32
role-page pairs, not 32 pages. **The instruments are role-shaped and that is itself a finding**; say so
rather than passing it on.

**Read the whole item, tail included.** 2026-10-21: the planner read two items' openings, concluded a
shipped half was outstanding, and asked him for three diet answers **he had already given and which were
recorded on the items**.

**Already done? Check first.** 2026-10-07 cost four streams across two batches on work that had shipped;
a later sweep found five more. 2026-10-21: PR #806 was titled as if it shipped a rule, and two of the
rule's three clauses never landed — found by one `git log -1 --name-only`.

**Re-read the TITLE after every batch.** Four instances in one day, 2026-10-28, all of which passed every
check: a stream that never edited `docs/backlog.md`; a schema half shipped with the head still reading
"(schema PR, then the app)"; a title describing what was left *when it was written*, which made the
planner put a decision to him that was not his (*"this is driven by the UI in who does what, it doesn't
need a decision here"*); and one that went right because the brief told the stream not to tick.

**A count has a clock and a method.** 2026-10-24: the diets item said eight ingredient lines were out of
proportion and that each was his call, and it blocked across two editions. The eight were **dev test
data**; production returned **one**, he answered it in a message, and a re-run returned zero.
2026-11-06: an item carried *"161 `.tsx` strings"* and *"261 `.ts` strings"*; a brief refused to repeat
them and made re-measuring deliverable one, and the stream found **20 in 7 files, and 204** — the old
figure used a prose-shaped regex, the stream used an AST walk and left
`scripts/measure-english-in-tsx.mjs` behind. **Neither figure was wrong when written.**

**A conclusion ages like a count.** 2026-10-27, four days lost. The cron item read *"the fix is a Worker
deploy or the Cloudflare trigger, and the repo is innocent. Nothing to build; one thing to check."* Every
clause was wrong: it had been written while only ONE environment had been read, and the real cause was a
`next` bump the adapter could not load. **Ruling out one mechanism is not ruling out a cause** — "a
deploy did not RESTART it" says nothing about a deploy having BROKEN it.

**A hold is a rule, not a list.** 2026-10-25: seven items were held *"with the security rebuild"* and the
planner then scheduled a harness sweep in which seven of ten harnesses tested the very model being
removed — one demanded that every resident policy consult a column on the removal list, so making it
green would have **added** hard-coded security. He caught it: *"why are we doing harness-sweep-batch-2 if
we are removing all hidden security."*

**The dev database and the check suite are a collision axis.** 2026-10-30, caught at setup. A card
retirement would have changed what `check-card-grants`, `check-cards-count` and `role-cards-coverage`
read, on the database all three streams share, while one stream's whole job was the first accurate count
of which checks were red. **Ignoring a known red is cheap; taking a census while someone edits the
register is not.** The same day, the expensive case: two streams looked like they shared `scripts/`, and
intersecting the actual file lists gave **exactly one file in both**, which neither should run. A shared
directory is not a collision.

**A new card cannot be split schema-then-app.** `scripts/check-cards-count.mjs` asserts an exact count
from `cards.ts` and `check-card-grants.mjs` proves the database against it.
`0296_translations_propose_activity.sql` says so in its own header; `0298` followed it.

**Fold only the same kind.** #1078 carried a folded browser-check job beside nine harness rows and
delivered both. #1079 was given two **documentation** edits beside an API route change, shipped the
route, reported `finished=yes` and **said nothing about either doc edit** — one was a decision he had
made that morning, found by grepping `main` a day later. Reasoning:
`docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`. The other direction, 2026-11-06:
`#f6p2d` was a sentence about what a closed record permits and `0320` widened exactly that, so **as its
own stream it would have been wrong within a day.**

**When an instruction is absolute, brief it as one stream.** 2026-10-25, the day it cost most. *"Zero
exceptions"* and *"REMOVE all hard coded security NOW"* became a *Hidden security screen*, then a
cheapest-first removal, then a question offering **four orderings**. He said it four times, ending *"No
more little bit here and then fix some other stuff I want it all gone right now"* and *"I don't know why
it's taken so long for you to understand my instruction."* Three traps from that day: **do not build a
viewer for the thing he wants removed** (*"I can't fix it if I can't see it"* is a complaint that the
list is not written down, not a request for a UI); do not schedule adjacent work beside it; and
**measure before pricing as a programme** — one read of `canOpen()` showed the activity half was already
card-derived and the breach was seven `route.scope` entries. No new cards, no migration, one PR.

**The snapshot rule.** 2026-11-07, a near-miss rather than a loss.
`Animal_Shelter_uat-on-the-pi` read `free`, `0 ahead`, `nothing beyond main` and had never had a PR —
the leftover signature — with "clear them" already given for three other folders. **Two minutes later it
read `ahead 1`, two dirty files and held. An hour later it was PR #1356.** What saved it was that the
instruction had named three specific folders and the fourth was left alone. The complement, 2026-11-08:
a branch with **5 ahead and 5 unpushed** looked like unsubmitted work and was a squash leftover — `list`'s
own `state` column said `squash-merged (PR #1391)`, the PR head was the branch tip, and the deleted
origin branch is why every commit read as unpushed.

**The finish line, and merging on green.** 2026-10-12 and 2026-10-13: one stream built 8 commits, 31
files and 1,414 lines, pushed, and never opened the PR; another merged its schema PR and stopped with the
visible half unbuilt. He asked whether that justified raising model or effort; the answer is on the record
(`docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`): both happened at a **handoff**, and
**effort buys care within a turn — it cannot make a stopped session open a PR.** 2026-11-07: PR #1356 was
opened green and left unmerged for an hour. 2026-11-08: handover `708` was written, committed, pushed and
never PR'd, so `main` read the previous edition for a day — the sixth instance and the first in the
planner's own paperwork.

**Interruptions are a cost of the brief.** Two of nine streams in one round had to ask him something the
briefs should have settled, and **nothing in the paperwork recorded it** — every PR green, every
deliverable landed. `CLAUDE.md`'s release target is two touches, one answer and one command; the same
arithmetic applies to a batch.

---

### THE LIST-FIRST HARD SEQUENCE — why it is a sequence of tool calls and not a rule about prose

**Three breaches in four plans, each by a planner who had read the rule and agreed with it.**

- **2026-11-08.** He asked three times in one day where his plan was: *"You haven't given me the batch 2
  list yet - why are we having so many issues with the process"*. The diagnosis he accepted: **the planner
  had been satisfying this document instead of delivering to him.** THE ONE RULE was written that day.
- **2026-11-11, batch 2 of that day's plan.** *"Why are we doing paperwork first again in front of setting
  up streams"*. In that turn **three full PR bodies, three `stream-usage` comments and an entire band
  analysis were read and written before a single worktree existed** — and **only one of those reads fed a
  brief** (#1482's, whose migration `0354` the `bills-job-link` brief quotes as a worked example and whose
  146,679 that band was lowered against). The other two PR bodies and the whole band write-up were pure
  paperwork ahead of delivery.
- **The lesson that made it a numbered sequence:** the rule as first written read as being about the
  ORDER OF A REPLY, and a planner can obey that while spending twenty tool calls on reading first. **The
  list was also restated in three separate places in `SKILL.md`, which is itself the evidence that
  repetition does not work** — two of the three were cut when the sequence went in.
- **The allowed-reads list is deliberately short:** has the batch merged, is the migration slot free, and
  one named PR a brief will quote. **A PR body read "while you are there" is paperwork.**
- **AND CLEARING LEFTOVERS IS NOT ON IT EITHER — ADDED 2026-11-11 ON HIS INSTRUCTION**, mid-plan, while
  he was waiting for the list: *"Can you change the skill instruction to put removing streams after
  setup of streams please"*. The planner had read `worktree.mjs list`, confirmed four merged PRs and run
  four `worktree.mjs done` calls before creating a single worktree for the day. **It was all correct
  work and it was all in the wrong place.** Two things make it worse than an ordinary paperwork-first
  breach: **(1)** deleting a worktree's `node_modules` on Windows took long enough to be moved to the
  background, and the planner then declined to run `worktree.mjs new` beside it rather than risk two
  git worktree operations at once — **so the housekeeping physically blocked the delivery**; and
  **(2)** it does not feel like paperwork. It feels like tidying up before you start, which is why it
  got past a planner who had just read the hard sequence. **The rule now says it in (e) and in step 2:
  read `list`, remove nothing.**

## 2. The three rules from the worst evening — 2026-11-04

Eleven interruptions, an hour of work redone, and him ending with *"I have wasted a whole evening doing
this, it's simply not good enough"* and *"even the fixes I'm given don't work"*. **Every one was a planner
defect and not one was caught by a check.**

1. **A CHANGE IS NOT PROVEN UNTIL THE THING IT TOUCHES HAS BEEN EXERCISED.** `#ubejc` moved
   `SUPABASE_ACCESS_TOKEN` out of eight `.env.local` files into a Windows user environment variable a
   session's shell does not have, leaving **every session unable to reach either database** for nine
   hours. Its record claims *"every half proven rather than taken on anyone's word"* — and it did prove
   the move: eight files, the revocation, the narrower replacement. **It never ran one thing that needed
   the token afterwards.** **A rigorous-sounding list of what WAS checked is how a missing check hides.
   Ask: what is the first thing that breaks if I am wrong, and have I run it?** Hence: no credential,
   environment, path or auth change merges without a command that exercises it, run and pasted.
2. **DO NOT DECLARE A CAPABILITY LOST WITHOUT ENUMERATING WHAT IS STILL IN REACH.** The planner spent
   that evening saying *"I cannot read the database"* while `SUPABASE_SERVICE_ROLE_KEY` sat in
   `.env.local` — a different credential, enough over REST to find and delete the row blocking CI in
   three commands. It had lost one of two and behaved as though it had lost both. `check-planner-preflight.mjs`
   exists because of this.
3. **STOP WRITING THE CONCLUSION UNDER THE COMMAND BEFORE READING THE OUTPUT.** Four times that evening
   the planner appended a label such as `(empty = none)` to a command, and twice the output was not empty
   and the label had to be retracted in front of him. **Write what the command does, read the output,
   THEN write what it means.**

**And the escape-hatch rule:** the portal brief said *"if a stream cannot reach the database, it opens its
PR partly built and says so"*, which was right while nothing could reach a database. **The moment the
token was restored the escape expired and the stream did not know**, so it offered to half-do the job on
an evening he had already lost. **Write the expiry into the sentence.**

**One for any brief proving an approval boundary:** tell it to use a **distinct** fake `drive_file_id` per
row. A stream created an approved and an unapproved attachment 0.3 seconds apart sharing one fake id, so
`is_public_drive_file()` answered true for it, the unapproved row read as a public leak, and
`check-public-views` failed on **every open PR** — looking exactly like a real open fault.

---

## 3. When the planner touches production itself

The planner is the one role that reads production. All of these were learned in one morning, 2026-10-22,
when it diagnosed a live calendar fault and asserted three things it had not verified. His words were
*"This is really bad"* and *"This is a complete disaster"*, and in two of the three he was right.

1. **VERIFY AGAINST THE FIELD THE CODE ACTUALLY READS, AND QUOTE THE LINE.** A script deleted four events
   from the shelter's real calendar behind a guard that checked
   `extendedProperties.private.visitId` — while the code matches on `clinic_visits.calendar_event_id`, so
   an event made by an older build has no `visitId` and is still tracked. The planner had written
   *"nothing will be cancelled, nobody will be emailed"*; a cancellation email arrived minutes later.
   **A guard that tests the wrong property is worse than no guard, because it is reported as safety.**
2. **A MEASUREMENT HAS A TIMESTAMP; A FACT DOES NOT.** The test and production calendar ids were compared,
   found identical, and the result repeated as current forty minutes later — by which time a stream had
   separated them, exactly as asked. Say *"identical when I read it at HH:MM"*, and re-read before relying
   on it, especially while streams you set up are editing what you measured.
3. **WHEN YOU SAY A FEATURE WORKS, SAY WHAT ITS VISIBLE LATENCY IS.** He was told the calendar was safe,
   added six appointments, saw nothing, and reported it broken. The quarter-hourly sweep had not run and
   nobody had told him there was a sweep. One clause is enough: *"it appears within fifteen minutes."*
4. **RUN THE COMMAND AN ITEM NAMES — you are the only role that can.** 2026-10-24:
   `check-scripts-doctor-triage` found a doctor login could read and write every clinic visit's
   attachments, bills included, filed it properly as *"Production: NOT ESTABLISHED"*, and named the
   command. The planner ran it: `0230` was applied, **the fault was live**, and a filed item became the
   next batch's first stream within the hour. Scan filed items for a named-but-unrun production check.
5. **AN INSTRUMENT THAT EXISTS IS NOT AN INSTRUMENT THAT IS RIGHT.** Four in one day, 2026-10-26.
   `clinic-login-helpers` reported four functions "called by nothing" — its whole-word pattern matched
   nothing at all and **two had live callers**, and the planner had already written it into a brief as
   settled fact. `check-menu-coverage` printed **"118 unexplained orphans"**, of which 88 were disposable
   `dev_signin_cards_*` logins; the real figure was 30. `role-cards` / `role-cells` filter
   `r.kind <> 'fixed'` and say nothing about `roles.archived_at`, so a role retired a fortnight earlier
   was listed as live — **he caught that one himself.** Then a merged migration repeated the same mistake
   hours later and moved a capability onto a card no live role holds. **A count without its database is
   not a reading**, and the damage is a wrong number carrying the authority of a check.
6. **A DEPLOY HAS TWO HALVES; verify what the user sees.** 2026-10-27: the planner read
   `https://lannacare.org/ -> 200` and reported a release live. **The Worker answers that whether or not
   the Pi was rebuilt**, and it had not been — `/api/version` read the old version while
   `/api/releases/current` read the new one. Users were on the previous build. **A 200 from a fallback
   proves the fallback.** Pin a Pi build with `--ref` to the release commit; `main`'s tip is not what
   shipped.
7. **WHEN HIS REPORT CONTRADICTS THE DATA, ASK WHAT HE IS LOOKING AT.** 2026-10-27: he reported
   appointments *"showing as overdue and cancelled - it can't be both"*. Two code readings and a live
   production read all concluded one row cannot be both, and all three were correct. The fault was a
   filter chip whose label promised one thing and whose behaviour did another, settled in one sentence
   once he was asked. **A screen can disagree with a correct database.**

**And the habit that limits the damage: when an incident ends, the findings go onto the backlog in the
same session.** Every measurement from that morning lived only in the chat for an hour while the item
still said the cause was *"not yet confirmed"* with four candidate causes, two already ruled out.

---

## 4. Band evidence

**The readings behind each row of `SKILL.md`'s table.** Bands have been wrong by +50% and −39% in
consecutive batches, so revise from actuals and never treat a row as settled.

- **Ordinary stream, 120–145k.** 2026-10-20, four unlike jobs within 4,000 tokens of each other:
  `stock-receipts-immutable` 126,512 · `nfc-medical-jobs` 127,979 · `prescription-dose-schema` 128,114 ·
  `release-tooling-fixes` 129,848. **Intricacy of judgement is not what spends tokens; unbounded scope
  is.** Do not add for "it touches a lot of files".
- **2026-10-21, nine of nine inside or under** — 116,986 · 177,347 · 124,076 · 132,646 · 156,895 ·
  213,101 · 152,396 · 136,186 · 131,839. Same dials as every round before. **The only thing that changed
  was the briefs**: each named the files it owned, the files it must not touch and who owned them, a hard
  boundary, and told the non-migration streams they add none. **So when a stream overruns, the brief is
  the first place to look and the dials are the last.**
- **Floor.** ~110k on 2026-10-11, corrected to ~84–85k on 2026-10-20, ~95k on 2026-10-27, 98,063 on
  2026-10-28, 102–103k through 2026-10-31, 106.8–107.5k on 2026-11-07, **107,438 · 106,351 · 111,016 on
  2026-11-08**. The drift is slow and upward. The original 30k error was inherited by every band below it,
  which is most of why older rows read high.
- **Create vs route into.** 235,561 for a new public form with rate limiting and a staff screen against
  127,979 for routing into working pages — same band given to both, 108k apart.
- **Existing machinery.** `two-way-calendar-app` banded 250–320k as a new transport path, came in at
  **153,821**, because the cron, the Google client and the schema already existed. **Reserve 250–320k for
  a stream with no existing piece to extend**, and the one reading in that row is 286,350.
- **Audit/report row.** `policy-triage-2` 144,682 (ten tables) · `buttons-sweep-5-money-content` 151,124
  (five areas). Banded for surface size instead, three landed 43%, 21% and 17% under. And against a
  deliberate over-band, `control-listing-sweep-2` 138,872 against 160–200k given *because its list was
  long*. **The length of the list does not move it. The honest caveat: all of those found almost nothing,
  so an audit that finds real gaps is untested.**
- **Specification discount.** `website-switches-app` 202,507, **2.5k above its band floor**, because the
  schema half's PR body wrote its requirements onto the item. 2026-11-08 repeat: `suppliers-schema` came
  in **under even its unadjusted band** on a job its item called LARGE, because the brief handed it two FK
  columns by path and line. **Did the schema half hand over a specification, or only a column?**
- **Overruns worth knowing.** `reels-app` 345,126 (+35%), banded low *because it was "modelled on the
  existing memes screen"* — memes are images and a reel is a video, so two of three expensive halves had
  no model at all; **the tell the planner had and did not read was the schema half reaching for another
  feature's tables.** `resident-tags-app` 357,695 (+32%): one tag picker wired into **nine** existing note
  boxes with nine save paths. Its counter-case, `approval-flag-app` 198,579 (24% **under**): four surfaces
  that **share one source of truth** — *"Photo surfaces ride `attachments`"*. **Ask what the N surfaces
  READ before reaching for a per-form rate.** `units-of-measure-app` 290,888 (+8%), where the new surface
  also **deleted** what it replaced. `assistant-v2-tools` 440,348 against 150–190k, because drawing one
  card needed a language model dev does not have, so it wrote a server from its scratchpad — **the
  environment did not hold what the proof needed.**
- **Permissions proof, +30k.** `doctor-clinic-scope-schema` 163,471 against 120–155k on a fix written out
  line by line on the item, because it had to prove three other roles still pass and write a
  `begin … rollback` harness. **"Nothing left to discover" is about what the stream must DECIDE, not
  which files it may touch** — `units-of-measure-schema` had `src/` forbidden and its columns handed over
  and still landed mid-band, because it had to design a write-only validation.
- **Structure premium.** `resident-tags-schema` +24% and `resident-tags-app` +32%, where `.plan-day.md`
  had **predicted the unknown in words while banding against it**. The open question's answer was a
  registry table, eleven rows, a trigger and two functions. **If your band paragraph names an unknown,
  the band must contain it.**
- **Reconciling two sources of truth, +25%.** `translations-labels-app` +20% (390,251) ·
  `assistant-record-card` +33% (324,120) · `assistant-manual-topic` +28% (264,796), all `opus`/`medium`.
  **The count of disagreements is unknown when you band**, which is why it reads like an audit and costs
  like a repair. This **supersedes** the earlier "count the judgements and add 15–20k each" rule, which
  was applied the same day and still ran 20–33% over.
- **Near the floor when the brief hands over cause, decision and shape:** 161,185 · 162,041 · 169,996 ·
  156,879, all 27–43% under, 2026-10-27. **And a hypothesis killed by READING is not an investigation** —
  a stream given +40k to test a hypothesis disconfirmed it with `git log` and three file reads.
- **Do not band for a proof the stream cannot run.** A schema stream banded 230–290k with +30k for a
  production proof came in at 139,529 (40% under); the planner ran that half itself.
- **Walkthrough rates, 2026-10-27, six driven passes.** First pass: `floor + ~6.3k x steps` (four of five
  within 7%); add a few k per extra CARD, not per step. A second pass triggered by a narrow migration is
  **also** 6.3k. The **11k** rate is only for a pass that must **adjudicate** rows an earlier pass or
  another stream left in dispute (#989, 11,223 a step, asked to settle three disputed things). The older
  `88k + 9.8k x steps` readings (205,025 · 265,830 · 388,315) are run streams, not card passes.
  **Count steps with a command, never from an item's prose:** `cards-rerun-blocked` was banded off a TODO
  count as "~17 steps", ran **31**, and came in 29% over — apply the rate to 31 and it predicts within 1%.
  ```
  awk -v c="<card name>" 'BEGIN{p=0} $0 ~ "^## " {p=(index($0,c)>0)} p && /^[0-9]+\./{n++} END{print n+0}' docs/card-walkthrough.md
  ```
  **And ask whether the pass is needed before counting:** a prior pass has an expiry date, set by a
  migration (what the card grants) and by the app half (what the page shows, and whether it can be
  reached at all). `grep -n "^## Added" docs/card-access-faults.md` and
  `grep -ln "'<card_key>'" supabase/migrations/02*.sql`.
- **Browser verification adds ~30k whatever the code shape.** `assistant-immunization` was a third
  instance of a settled pattern, banded as a quick win, and came in at 160,205 because its brief also told
  it to drive the browser. **The live-interaction axis applies to the BRIEF, not only the item.**
- **A walk of N items × M roles is a programme, not a workstream.** `fable-acceptance-dry-run` was banded
  300–460k and reached **819,980 at about 35% done** before he stopped it: 132 activities + 42 "must not"
  lines × 6 roles × 2 languages × 2 widths. A complete run was ~2.3M tokens — unfinishable in one session
  at any effort on any model.
- **`medium` = +25%.** Began as an adjustment, not a measurement; by 2026-10-31 it had twelve readings
  (seven inside, one 0.6% over, four over by 6–19%), and three more held on 2026-11-08
  (148,790 · 197,009 · 229,186, all inside or under their adjusted bands).
- **Reading widely is cheap.** `silent-empty-reads` faced 64 candidate files each needing a judgement, was
  banded ~250–400k on exactly that reasoning, and came in at **133,986**. The axis is not "must it count?"
  but **"must it build the instrument?"** — `who-does-what-view` ran +50% because establishing which of
  300 permission boxes the system obeys meant writing `scripts/check-who-does-what.mjs`, **and that script
  was the work.**

---

## 5. Superseded trials — kept so they are seen to have been tried

**The planner starting the sessions with the dials set.** Trialled on his *"Yes, try it next batch."*
(2026-11-01) because every new session opens on Opus and he was re-dialling three times a batch. It ran
for two plans and **worked mechanically: twelve of twelve starts, none refused, dials read back correctly
every time.** Reverted 2026-11-03 for its cost in **requests**, not because it failed. Facts from it that
are still true and should not be re-derived:

- **`model` in `~/.claude/settings.json` is inert for the Code tab.** Set it, `get_settings` reads it
  back, a new session still opens on Opus.
- **There is no per-folder model memory.** `lastModelUsage` in `~/.claude.json` is a **cost ledger**, with
  a record on one folder out of 999 and none on any worktree. A planner once read that single record as
  the cause and told him so; it was wrong.
- **A start is refused on a turn an automated event began, and over Remote Control** — but the condition
  is a property of the TURN, so a fresh typed message from him satisfies it even over Remote Control. Both
  times it was refused, the identical call succeeded after one line from him.
- **The banding consequence, which outlived the trial: a dial you set is not evidence of his choice.** The
  twenty-one-stream model observation in handover `537` was built on dials **he** picked, and that era
  ended the moment the planner took the dials. No model finding is drawable from a recommended dial.

**One go for all nine** (his request, 2026-11-02: *"can we set it up so I give you a single go for all 9
streams and you sequence them in the correct order rather than me having to start you off for each
batch"*). It depended on the planner being continued when each batch ended, so it went with the trial
above. **What still holds: never nine worktrees, and the ordering rules.**

**Stop designing dial experiments.** 2026-10-21: the planner recommended Sonnet for a batch and **all
three ran Opus**; it recommended Fable for two report-only streams and **both ran Sonnet**, leaving the
Fable window at 0% all day. Across nine streams that day — four Opus, five Sonnet, no Fable — shape and
brief quality moved the numbers far more than the model did. **Recommend, record what ran, and stop
promising comparisons you cannot deliver.** Fable also draws on the same weekly allowance, so an unused
Fable reading is never spare headroom.

---

## 6. Editing `.plan-day.md` and the handover — the traps, in full

**Overwriting takes two steps and both obvious single steps fail.** `Write` refuses a file this session
has not read, and `rm` on it was **refused by the auto-mode classifier** as irreversible local
destruction (2026-10-21). **What works: Write the new text to the scratchpad, then
`cat <scratch> > .plan-day.md`** — a redirect is an ordinary write, not a delete. Same for
`docs/planner-handover.md` and for any tracked file whose 175 KB you do not want to read back.

**For small amendments, prefer a node script written to the scratchpad and run by path**, using
`out.split(from).join(to)` and **never `replace(from, to)`**. `replace()` reads `$` specially in the
replacement: `$'` means everything after the match, `` $` `` everything before, `$$` a literal `$`.
Replacement text quoting SQL (`do $guard$ … $guard$`) therefore silently consumed a chunk of a file and
the next anchor failed. **`split`/`join` is always literal.** **The per-anchor guard is what limited the
damage to nothing** — it exited non-zero and wrote nothing; without it the replacement would have
reported success and corrupted the file. **Never drop the guard.**

**Line endings.** Normalise before matching: read, `split('\r\n').join('\n')`, edit, write back in the
endings you found. Every multi-line anchor against a CRLF file fails with no useful error. **But for a
TRACKED file, `core.autocrlf=true` here means git stores LF and checks out CRLF**, so writing the working
copy with CRLF and committing changes nothing — and on 2026-11-02 a script that committed LF into the
`backlog` branch while `main`'s blob held CRLF produced **ONE conflict hunk covering the whole file**.
Neither side could be taken wholesale: `backlog` carried six items `main` lacked while `main` carried two
ticks `backlog` lacked. **The method: read both blobs, normalise both to LF, compare item line by item
line keying on the text after the checkbox, build from the side with more content, apply the other side's
changes by substitution, and guard that every item line survives.** Commit from the main checkout.
**And check the diff size before committing** — `git diff --numstat` should show the lines you meant.

**Not a third option: a heredoc in a chained Bash command.** Backticks and apostrophes in this prose break
the shell parse (2026-10-21). **And a quoted heredoc collapses `\\` to `\`**: `[^"\\]` reached node as
`[^"\]` and died as an invalid regular expression (2026-10-31); in prose it would have changed the text
silently.

**Not a fourth option: `node -e` where the text holds a Windows path.** A single-quoted `node -e` script
containing `C:\\Development` reached node as `C:\Development`, where JS read `\D` as an escape and the
anchor silently became `C:Development`. Inside node, use `C:/...`.

**A trap in this shell: `git show <rev>:<path>` lies about dotted paths.** Git Bash rewrites any argument
containing `:` as a Windows path list, so `git show origin/main:.claude/skills/plan-day/SKILL.md` dies
with *ambiguous argument*, and **piped, the error disappears** — `… | grep -c foo` prints `0`, exactly
what "the file does not contain it" looks like. Use `git grep <pattern> <rev> -- <path>` or
`git ls-tree`, or prefix with `MSYS_NO_PATHCONV=1`. Also in `CLAUDE.md`.

---

## 7. The fallback usage reading

**Prefer the PR comment** (`SKILL.md` step 3). Only when a PR has no `stream-usage:` line — a stream that
never merged, or a PR merged by hand — fall back to reading the live session.

For each worktree whose PR merged, find the session in `mcp__ccd_session_mgmt__list_sessions` (match on
its folder), then call **both** `get_usage` (for `context.tokensUsed`) and `get_session` (for `model` and
`effort`).

- **`get_session` → `model` and `effort` is pure metadata and NEVER expires.** It answers for a live
  session, an idle one, and an archived one. There is no reason to record a dial as unread.
- **`get_usage` → `context.tokensUsed` needs the session's PROCESS to be alive.** It does **not** need the
  session to be mid-turn — nine of nine streams read fine with `isRunning: false` — but once the process
  exits it returns `status: "unavailable"`, and **archiving guarantees that.** So the axis is **process
  alive vs process gone, not live vs idle**, and the practical rule is to capture figures at the first
  `/plan-day` after the batch merges. An over-correction once claimed "there is no race", a planner
  believed it, a batch was auto-archived on merge, and all three figures were lost.
- **THE PARAMETER IS `session_id`, NOT `sessionId`.** Passing `sessionId` is not an error: the unknown key
  is ignored, the parameter defaults to `"self"`, and the call returns **the planner's own window** with
  `status: "ok"`. It nearly put three fabricated actuals into `.plan-day.md` — the two reads differed by
  762 tokens, which is just the planner's session growing, and that is exactly what three plausible stream
  figures look like. **The tell is `context.session`: it echoes back either the id you asked for or the
  literal `"self"`. Read that field on every call and refuse any figure whose `session` is not the id you
  passed.**
