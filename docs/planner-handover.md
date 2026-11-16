# Planner handover — edition `753`, 2026-11-16

**This is a DELTA against `752`.** It says what changed, corrects its predecessor, and reports what each of
`752`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS, AND IT IS AN UNUSUAL ANSWER.** The daily measurement read
**`752`'s plan's complete set of five**, in one slot after batch 1 was set up, exactly as the rule intends.
But **six of this plan's own nine were also read**, at batches 2 and 3's setup, because each successor's
band depended on its predecessor's figure — which `SKILL.md` expressly permits (*name that one PR and read
only it*). **They are recorded in `.plan-day.md` under their own headings, marked as NOT the daily
measurement.** **Batch 3's three are not readable yet** and belong to this edition's successor.

**WHY IT EXISTS.** The plan ran **nine streams across three batches in one day**, every batch set up inside
the chat that planned it. **Batches 1 and 2 merged on green with no red check anywhere** (PRs #1615-#1620);
batch 3 was set up and handed back at the time of writing. **Five of the nine were parts of the
multi-tenancy programme**, which is now the largest thing in flight and supplies most of the buildable
backlog.

---

## THE LEAD: THE FIRST STANDING TENANCY GUARD WENT RED, AND NOTHING TOLD ANYBODY FOR A DAY

**`752`'s owed item 8 said *"check it ran"*. It had run. It had failed.**

`.github/workflows/tenancy-catalogue.yml`'s **first genuinely scheduled run** — 2026-11-15T12:57:54Z,
`gh run view 43716500145` — exited 1 with
`1 flagged (0 views, 0 functions, 1 tables missing definer_all), 2 allowed by name, 0 stale`, naming
`FLAG rule 3  table:public.donation_tax_ids  owner=postgres`. **It sat unread for about 24 hours while
five streams merged past it.** Filed as **`#w4t9k`** (*Security*).

**Three things about it, and the third is the transferable one.**

1. **The guard worked; the REPORTING failed.** By design a scheduled run *"cannot turn any PR red"* and is
   emailed to whoever last edited the cron line
   (`docs/decisions/2026-11-15-tenancy-lint-scheduled.md`) — a sound decision, not being reopened. **But
   the first failure of the project's newest standing guard reached nobody.** The item carries that as a
   second, separable finding, with `#cea66`'s `cronJobs` watcher as the precedent.
2. **It is NOT an open door, and saying so precisely matters.** `0381:80-83` turns RLS **on** with a
   card-gated policy for `authenticated`; what is missing is the **`definer_all`** policy rule 3 has
   required of every RLS table since the re-own (`0375`). **So the risk runs the other way** — a
   definer-owned function reading that table would read **nothing**, which looks like a working page with
   no rows. **Establish which it is before writing the fix.**
3. **IT IS TIME-BOUND, AND ONLY BECAUSE PRODUCTION IS BEHIND.** Production measured clean this morning
   (120 tables, all RLS on, 0 flagged, 0 stale) **only because `0381` is not there yet.** It ships at the
   next release **carrying the gap** — and the table holds thirteen-digit Thai national ID numbers.

**THE PART TO CARRY FORWARD: the owed-items list found this, not a person noticing.** A one-line *"check it
ran"* written nine streams ago is the whole reason it was read. **An owed item about something that will
have happened by the next edition is the only instrument that watches the instruments.**

**ACTED ON RATHER THAN NOTED:** stream 7 runs that lint as a deliverable with *0 flagged* as the pass, so
it would have met this red and suspected itself. **Its `.brief.md` was amended after being written** to
name the flag, its table, its run id and its date: expect `1 flagged`, confirm the table is
`donation_tax_ids` and nothing else, **and a SECOND flagged table may well be yours.** **Read the names,
never the count.**

---

## THE INTERRUPTION, AND THE FIX WAS IN THE FILE THE PLANNER HAD JUST READ

**He asked *"Where are my batch 2 streams"*** while the briefs were being written. The worktrees existed
and two of three briefs were done; nothing was wrong with the work. **What was missing was one sentence at
the start** — `752`'s own *"tell him at the start that it is about half an hour"*, which **ten editions**
had recorded as the fix. **It was said for batch 1 and not for batches 2 and 3. Eleven editions now.**

**Count it as a cost of the BRIEFING, not the stream.** The shape is the point: **the rule was read, agreed
with, applied once, and dropped as soon as the day felt like it was going well.** A batch that merges
perfectly and still costs an interruption is a briefing defect.

---

## THE BANDING METHOD THAT WORKED TWICE, AND THE ONE PLACE IT WAS DELIBERATELY NOT USED

**Before banding a stream, read what its predecessor's migration actually left behind — the file, not the
PR body.** Twice this paid:

- `0383_shelter_id_animals.sql` was **a quotable specification**, not just a column: the loop, the
  `nulls not distinct` reasoning in a comment, a classification of all six triggers. Stream 4 cut
  **175-215k → 150-185k**; landed **161,139**.
- `#cea66` had shipped **`EXPECTED_CRON_JOBS`** (`src/lib/status/health.ts:347`) *"so the second pg_cron
  job ever added is watched by construction"*. Stream 5 **was** that job. Cut **140-175k → 130-165k**;
  landed **159,928**.

**THE NON-REVISION IS WHAT A SUCCESSOR WILL GET WRONG.** Stream 7 (`#s50n8` (C2)) was **left at 170-210k**
though both its predecessors on that item came in comfortable. **Cutting it would have banded its
predecessor's SIZE rather than its own SHAPE:** stream 4 added columns to many tables with almost nothing
to decide; (C2) changes **two constraints** with **the programme's two hardest decisions** attached — which
is why the item split it off and put it last.

**One figure is OUT of every revision, per the rule.** `shop-order-flood-bound` reports `rescoped=yes`:
briefed as *"mostly reading"* with *answered, not built* offered as legitimate, it **built**, carrying
`0386`. **169,848 against 130-165k is not an overrun, it is a figure for different work.** Briefing lesson:
**a brief offering two outcomes of very different size must band the larger one, or say which it bands.**

**Floors today: 86,261 / 87,274 / 90,374** — the 90.4k is the highest yet and sits **above** `SKILL.md`'s
86-89k. **One reading is not a revision**; that is what the complete-set measurement is for. **And the
scale rows were not shifted.** `752`'s paragraph forbidding it held again.

---

## WHAT `752`'s NINE OWED ITEMS DID

1. **Measure the five — DONE, all five.** `shop-order-flood` 151,411; `donation-tax-id-schema` 158,886;
   `tenancy-host-map-schema` 152,375 (**13k under**); `donation-tax-id-app` 221,621;
   `public-site-speed-quiet` 207,983. **Four inside, one under, none over.** **#1609's figure was read
   from a merged PR whose worktree had been deleted** — the durability claim the whole once-a-day ordering
   rests on, **proved rather than assumed.**
2. **The microchip question — ANSWERED and the gate is gone.** *"Across all shelters"*; filed on `#s50n8`,
   which also records that **the index he chose already exists and is already global** (`0113`), so it is
   the **named exception** to the 19 keys. **Never re-ask.**
3. **Brief tenancy parts from their items, one or two at a time — FOUR were briefed in one day**
   (Part 2 groups (A), (B)+(C1), (C2), and Part 4), with Part 3 as the fifth. **Say plainly that this
   exceeded `752`'s own guidance**; it was safe because the items carry the design and the planner added
   none. **The four programme rules went into every brief.**
4. **Part 1's triage list — DONE and filed.** 123 dev tables: 9 not tenant, 21 ambiguous, 93 tenant, on
   `#s50n8`. **The 21 ambiguous remain decisions**; stream 4 was told to step around them and name which
   it met, rather than guess.
5. **Backlog thin — still true, eighth plan running**, but the tenancy programme supplied five of nine.
   37 open items after today's filing.
6. **The leftovers — HE CLEARED THEM.** He closed the sessions (*"I'll close them"*); four folders and
   their branches went this morning, and the planner read **#1609's usage comment off the PR before
   deleting its folder.** **The pattern now recurs by construction:** every merged batch leaves three held
   folders, so **offer once per batch and never carry it as an owed planner item.** One husk survives — see
   below.
7. **`#99zuk` — CLOSED, and its title reads correctly.** Ticked, with both loose ends named inside it
   (the import format and the seven-year clean-up) rather than left as implied blockers. **Both became
   items of their own and both were built or briefed today.**
8. **The tenancy nightly — SEE THE LEAD.** It ran earlier than `752` predicted (2026-11-15T12:57Z, not
   05:43Z on the 16th) **and it failed.** `752` was right to ask and wrong about the time; **the time was
   a guess and the check was not.**
9. **The release-procedure rule keying on direction — nothing arose to test it this plan.** Unchanged.

---

## HIS DECISIONS THIS PLAN, AND WHAT THEY ARE NOT

- **He confirmed the cross-shelter operator: *"Yes, me"***, asked as a straight question. **There IS a
  platform-level identity reaching every shelter and it is him.** Filed on `#s50n8` and `#ujqr5`, with the
  dead branch marked `SUPERSEDED` in place. **His answer names ONE PERSON, NOT A ROLE** — that is the
  consequence the item says will be got wrong, and batch 3's brief repeats it.
- **He agreed the day's nine in one single-select answer** (*"All three, go"*), triggered each later batch
  by re-running the plan, and asked for this handover to be written in the chat that planned it.
- **Nothing here reopens anything settled.** Admin outside the card system, the adopter-portal exception,
  `test-plan` advisory, merge-on-green — all untouched, and none is a decision he owes.

---

## TWO ITEMS WHOSE OWN "DONE WHEN" A STREAM CANNOT MEET, FOUND BY READING THEM AGAINST THE REPOSITORY

Both are written into batch 3's briefs as stated problems rather than left to be discovered:

- **The canary (`#qtid6`) cannot run its own proof-of-failure test** — it says *"remove one restrictive
  policy and it must go red"*, and **Part 5 has not landed**, so there are none. The brief refuses to let
  that excuse an unproved instrument, offers three substitutes without prescribing one, and requires the
  item's own test to be recorded as owed at Part 5.
- **The e-Donation item's own cheapest source is beyond a stream** — *"ask the accountant"* is Lutan's. The
  brief tries the Revenue Department first, warns the sources are likely **Thai** and that **nobody here
  reads Thai with authority**, asks for one forwardable plain-English question, and **forbids ticking on
  *"I searched and could not find it"***, which is neither done-branch.

---

## A CORRECTION TO TAKE: THE THIRD SHAPE OF ONE FAULT IN THREE DAYS

The planner said two backlog items *"reached `main` after your page was generated"*. **They had not** — one
commit was an **ancestor** of the other, which `git merge-base --is-ancestor` settles in one command. **A
sequence was inferred from the order the planner had done things in.** Not prose trusted over an executable
line, not a composed string searched for, but **an ordering assumed when one command would settle it.**
Alongside it, the Backlog manager's near-miss: a `grep` for lowercase `one person` against an item spelling
it `ONE PERSON, NOT A ROLE`. **Merged rule: read the line that runs, and compose nothing you intend to
search for.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at `9 of 9` with batch 3 `set up 2026-11-16` and NOT merged at the
time of writing.**

**SO DO NOT RE-PLAN ON SIGHT, AND DO NOT ASSUME IT IS FINISHED EITHER.** Check whether batch 3's three
merged (`gh pr list --state all --head claude/<slug>` per slug). **All three merged → every saved item is
closed → plan from scratch.** **Any still open → name them and ask**; six live worktrees is the thing the
one-batch-at-a-time rule exists to prevent.

**Read the system date and compare it with the date at the top of this file.** **Four** plans ran on
2026-11-15 and this is the first of 2026-11-16; another on the same date is a normal thing to be.
**Never derive today's date from a document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour** — see the interruption section. **Eleven editions. Say it on EVERY batch, not just the first.**

**WHAT IS OWED:**

1. **MEASURE BATCH 3's THREE AT YOUR FIRST BATCH, AND THEY ARE THE ONLY ONES MISSING.** To be read from
   their PRs: `tenancy-unique-keys` (band 170-210k), `tenancy-canary-diff` (230-280k),
   `edonation-format-establish` (120-160k). **The other six of this plan's nine are already in
   `.plan-day.md`** under their own headings — **do not re-read them and do not count them twice.**
2. **`#w4t9k` WANTS TO LAND BEFORE THE NEXT PRODUCTION RELEASE** (the lead). It is a small migration or a
   recorded allowed-by-name exception, **plus a decision about whether the nightly's failure reaches a
   person.** **Do not simply make the workflow stop failing.**
3. **CHECK THE NIGHTLY AGAIN, AND CHECK WHAT IT SAYS, NOT JUST THAT IT RAN.** The next scheduled run is
   due about 12:57 UTC. **`1 flagged` naming `donation_tax_ids` is the expected state until `#w4t9k` is
   done; any other table is new and is a finding.**
4. **BRIEF PART 5 (`#ujqr5`) ONLY AFTER PART 4 IS DEPLOYED, NOT MERELY MERGED.** PR #1617 shipped the
   Worker's shelter header; **the production Worker deploy is Lutan's** and is still outstanding. The
   hazard is two-sided and recorded on the item: **if Part 5's restrictive policies land while the Worker
   sends no header, anon carries no shelter, reads no rows, and the public website serves blank pages
   rather than an error** — a failure that looks like success to every check there is.
5. **PART 2 IS CLOSED BY STREAM 7, OR IT IS NOT — READ ITS TICK.** Its brief requires it to check every
   clause of `#s50n8`'s *"Done when"* against what the four PRs actually did, **and to leave the item open
   if any clause is outstanding** (the duplicate-microchip wording and the Thai string above all). **A
   false tick there would hide the foundation of a thirteen-part programme.**
6. **READ STREAM 4's PR BODY AND FILE TWO THINGS FROM IT, BOTH ASKED AS QUESTIONS IN ITS BRIEF.** (a) **The
   21 ambiguous tables it met and stepped around** — decisions nobody has taken: wrongly tenant hides data
   a shelter needs, wrongly shared leaks data between shelters. (b) **Any TENANT table falling in none of
   the groups (A), (B) or (C)** — `medication` is on the TENANT list and its name is one of the 19 keys,
   **yet it sits in no group**, so **the programme's own cut may not cover all 93.** It was told to name
   them without adopting any.
7. **`#7bd5u` IS HIS #4 AND WAS NOT IN THE NINE, DELIBERATELY.** Its remaining piece needs a machine with
   nothing else building — load moves the score 12-17 points — **so it cannot share a batch with
   anything.** He was offered a solo quiet run and chose the batch. **The offer stands; do not quietly drop
   it and do not slip it into a batch.**
8. **ONE HUSK SURVIVES:** `Animal_Shelter_tenancy-worker-shelter-header`, held only by a stray dev server
   on 3002, merged as #1617; `done --stop-servers` clears it. **Offered, unanswered. It costs nothing by
   existing** — do not spend his wait on it.

**Do NOT re-ask him about:** the **cross-shelter operator** (*"Yes, me"*, 2026-11-15 — and its remaining
question is a DESIGN question for a stream, not a second question for him); the **microchip key**
(*"Across all shelters"*); `#pl7aq`'s launch date (**asked and declined 2026-11-15**); whether to start the
tenancy programme with its condition unmet (**he overrode it and authorised the record**); `#dqgy8`'s five
answers; `#uatwk`'s release-merge decision; `#7bd5u`'s quiet run (**offered — he chose the batch**);
`#j4m8w`, `#8t3rk`, `#00e3u`, `#k2vrj`; the `SUPABASE_ACCESS_TOKEN` scope; `#x5tbv`; the product name or
which TLD; `#rqv5c`, the production Drive move; the adopter-portal exception; `test-plan` being advisory;
merging a green PR; **or anything on `752`'s, `751`'s, `750`'s, `749`'s, `748`'s and `747`'s
do-not-re-ask lists.**
