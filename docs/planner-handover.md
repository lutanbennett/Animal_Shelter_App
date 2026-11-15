# Planner handover — edition `752`, 2026-11-15

**This is a DELTA against `751`.** It says what changed, corrects its predecessor, and reports what each of
`751`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** It reports **`751`'s plan's five streams — four measured,
one not yet readable** — read in one slot this morning, and **carries NO figures from its own four**. Those
are read at the next plan's first batch and reported by this edition's successor. **That is the delta model
working as designed, not a gap.**

**WHY IT EXISTS.** This is **the third plan of 2026-11-15** — `750` and `751` were both written and merged
earlier the same day. The plan ran **four streams across two batches**, both batches set up inside the chat
that planned them, and **one of the four was added by Lutan mid-presentation** rather than coming from the
backlog. It also started the multi-tenancy programme, which is now the largest thing in flight.

---

## THE LEAD: FIVE FALSE-ASSURANCE FAULTS IN ONE AFTERNOON, AND NOT ONE WAS CAUGHT BY WHOEVER MADE IT

Every one of these would have failed by **reporting success**, which is the only failure mode that gets
past CI, a test plan and a PR body all at once:

1. **A backlog item showing a question as open two days after he answered it** (`#00e3u`, below).
2. **A public website that would serve blank pages rather than errors** — the shop-order stream's finding.
3. **A safety net that would have run, passed and proved nothing** — the tenancy canary placed at position
   2, ahead of the part that adds `shelter_id`, so its first act (planting a second shelter's rows) would
   have had no column to plant them in.
4. **A warning that reassures its reader in the next breath** — `consumerReport()` prints *"That is the
   safe direction - nothing is blocked"*, which is backwards for a migration whose reader ships first.
5. **A rule written to fix fault 4 that would have written a second false assurance** — the planner
   proposed keying a release-procedure rule on *a migration whose `-- consumer:` names a file in
   `worker/`*. Of **255** consumer-declaring migrations exactly **one** does (`0236`), and it is in the
   ordinary safe direction, so the rule would have held it back for no reason while contradicting correct
   advice for it.

**WHAT ACTUALLY CAUGHT THEM, AND IT IS THE TRANSFERABLE PART: in every case the finder read the
REPOSITORY, and the proposer had reasoned from their own model.** The branch instead of a report. The
release procedure instead of an assumption about deploy order. `consumerReport()`'s *output* instead of
confirming the function exists. A `grep` for a proposed rule's existing members instead of its plausibility.
**Faults 4 and 5 were the planner's own, and both were found by the Backlog manager.**

**THE PLANNER'S HALF OF FAULT 4, STATED PLAINLY BECAUSE IT IS THE COMMONEST SHAPE:** it verified that the
mechanism *existed* and stopped there. **Verifying the part you were thinking about is not verifying the
thing** — which is Lutan's own standing instruction in `~/.claude/CLAUDE.md`, almost word for word.

**WHY THIS MATTERS MORE FROM HERE THAN IT DID TODAY.** Twelve of the thirteen tenancy parts remain, and
they all share the property: **a tenancy leak looks like a working page with one extra row on it.** Nothing
goes red. So brief every part to **prove rather than assert**, and have a second party check a cut against
the repository rather than against its author's reasoning. It worked five times in one afternoon.

---

## THE MULTI-TENANCY PROGRAMME IS LIVE WORK, ON HIS OVERRIDE, AND IT IS NOW THIRTEEN ITEMS

**`#ykefa` was deferred *"until Lanna is live and the product has a name"*. The name half is met; the live
half is not.** He asked *"What about the multi tennant work, can we add this in"*, **was told in one line
that the condition was unmet and that proceeding was his call**, and confirmed. In the same turn he
declined to set a launch date (*"Not deciding yet"*). **So the deferral text is void by his instruction —
do not park a part because the item still says to**, and his override is recorded in `#ykefa`'s own title.

**It is cut into thirteen items in a FIXED order**, agreed with the Backlog manager and filed on the items:

`1 #mz75e -> 2 #s50n8 -> 3 #qtid6 -> 4 #v0302 -> 5 #ujqr5 -> 6 #bncd0 -> 7 #ps6ms -> 8 #b4cmn -> 9 #o2iyh -> 10 #omt6u -> 11 #sxyw3 -> 12 #egq18 -> 13 #34a30`

**Part 1 is this plan's stream 4 and is set up.** Three things about the ordering that cost something to
establish and must not be re-derived:

- **The canary (`#qtid6`) sits at 3, AFTER the columns and BEFORE the policies, and both bounds matter.**
  The planner first wrote only *"canary before the policies"*, and the Backlog manager correctly placed it
  at 2 on that wording. At 2 it would have run, reported success and proved nothing. **A one-sided
  constraint is how a correct instruction produces a wrong plan.**
- **Part 1 carries the tenant-table triage**, because it is reading the schema anyway and it is the
  cheapest place in the programme to produce it. **Nothing can cut Part 2 honestly without that list** —
  the spike's figure of 63 tenant tables is one of four counts now known to be low.
- **No cut was offered for `#s50n8` or `#ps6ms` without measuring.** `#ps6ms` is 82 sites across 35 files
  and must be cut **by what the call site does**, not by file count. Both wait on real readings.

**WHAT IS OWED TO HIM BEFORE PART 2 CAN BE BRIEFED — ONE QUESTION, AND IT IS GENUINELY HIS:** is a
**microchip number unique across all shelters, or only within one?** It decides a constraint in Part 2's
migration, so it gates the **brief**, not the build. Useful context he should get with it, and which
narrows the answer: microchipping is **not routine in Thailand**, animals do not leave microchipped, and
the app **records** chips rather than fitting them — so the global version's value is narrow.
**It was put to him at the close of this plan.** If he has answered, send his words to the Backlog manager
to file on `#s50n8`; if not, **ask once before briefing it and do not brief around it.**

**AND NOTHING TOUCHES `cooperjaidee.org`.** It points at nothing on purpose, its DNS is in his own
Cloudflare account, nothing in the repository is renamed, and the production Worker deploy is his by
standing instruction of 2026-10-02. The three access shapes are **DECIDED** —
`docs/decisions/2026-11-14-cooperjaidee-hostnames.md`, in his words *"I'll go with your recommendation of
2 & 3 combined with 1 available"*. **Never put shape (a) to him again.**

---

## THE ONE FILING THIS PLAN MADE, AND WHY IT WAS THE MOST VALUABLE THING IN IT

**`#00e3u` had been parked by HIS OWN ANSWER of 2026-11-13, and that answer had never reached the item.**
It lived only in `docs/decisions/2026-11-13-answers-receipts-shop-payments.md`: *"Nothing else tax-shaped
is waiting. The item stays parked."* The item's title still said the question was out with **the Director
and the accountant**. So every planner since read a question apparently waiting on two people who had
already answered it, **and nobody re-asks a question they believe is already with the user, which is how a
false block stays silent.** It was **2nd on his priorities list**.

Filed on `backlog` as `5815a4be1`: the title now opens with **PARKED BY LUTAN'S OWN ANSWER OF 2026-11-13 —
NOTHING ELSE TAX-SHAPED IS WAITING, AND IT IS NOT BLOCKED ON THE DIRECTOR OR THE ACCOUNTANT**, plus one
consolidated note (not a sixth dated paragraph) marking the superseded passage in place.

**This is the third edition running whose lead is a stale statement reaching someone who had no way to
test it** — `750`'s was a stale assertion in a brief, `751`'s a stale omission in his hands, `752`'s a
stale question on an item. **`CLAUDE.md`'s *"Answering a decision on a backlog item"* exists for exactly
this and is not enough on its own.** The one check that keeps catching it: **when an item says it waits on
a person, grep the decision files for the SUBJECT before believing it.**

---

## WHAT `751`'s NINE OWED ITEMS DID

1. **Measure the five — DONE, four of five.** #1603 146,591 (band 150-200k, **under by 3.4k**); #1604
   172,084 (inside); #1605 176,042 (inside); #1607 148,130 (**under by 1.9k, BY DESIGN** — its deliverable
   came back "not free", exactly as `751` predicted in writing, and it was **not** fed into a revision).
   All four report `compacted=no rescoped=no finished=yes` and all four `model=`/`effort=` match their
   `band=` dials. **#1609 was still OPEN**, so its comment did not exist yet — **not lost, unwritten.**
2. **Did the speed stream's mitigation fire? IT FIRED AND IT WORKED.** Its deliverable 1 established the
   machine was quiet before any figure: **CPU 1-5% over five samples**, recorded before every run. Where
   later passes were noisy (**11-97%**, his own Chrome) it **said so and read them as such.** So holding
   the batch would not have been necessary. **The honest-noise reporting is the part to copy.**
3. **Re-derive the floor — DONE, and `SKILL.md` LEFT ALONE.** Four floors span **86,037-87,179** (1,142
   tokens). With the previous two sets that is **thirteen streams across three readings, all inside
   86-89k.** `751` said: if it lands there a third time, leave the file alone. **It did. No edit was made
   and none is owed.** **And the scale rows were not shifted** — `751`'s paragraph forbidding it held.
4. **The backlog is thin — CONFIRMED, seventh plan running.** Two of 25 open items Claude-buildable and
   unblocked. **Said plainly rather than padded**, and he added the third and fourth streams himself.
5. **`#pl7aq` put to him — ASKED AND DECLINED TODAY** (*"Not deciding yet"*). **Do not re-ask.**
6. **`#ykefa` not sliced without asking — HE ASKED FOR IT** (above), and was told its condition was unmet
   before he confirmed.
7. **Re-read `#00e3u`'s hold — DONE, and it was a false block** (above). This was the plan's one filing.
8. **Clear the leftovers — NOT CLEARED, AND NONE WAS MINE TO CLEAR** (below).
9. **`#7bd5u` could not be measured while streams build — it was measured correctly, before they did.**

---

## THE FOUR LEFTOVERS: ALL MERGED, ALL HELD BY THEIR OWN SESSIONS, SECOND PLAN RUNNING

`Animal_Shelter_donation-tax-id-schema` (3003), `Animal_Shelter_shop-order-flood` (3005),
`Animal_Shelter_public-site-speed-quiet` (3002, squash-merged PR #1609) and
`Animal_Shelter_worker-rate-limit-binding` (3001). All `nothing beyond main` or squash-merged. **All four
read `HELD — <session name>`, and `HELD` means ask, not tear down**; `worktree.mjs done` refuses a folder a
process has open anyway.

**This is not a planner's omission and it should stop being carried as one.** The fix is one press of his:
**close those four sessions, then any planner clears all four in about a minute.** It was raised once,
unanswered, and not raised again mid-work. **`#1609`'s folder must not be cleared before its
`stream-usage:` comment is read** — the comment survives the folder, but the folder is the reminder.

---

## HIS DECISIONS THIS PLAN, AND WHAT THEY ARE NOT

- **He added the tenancy work mid-presentation** (*"What about the multi tennant work, can we add this
  in"*), which made the day four streams across two batches instead of two in one. **His call.**
- **He declined the launch date** (*"Not deciding yet"*) **and asked for the tenancy work in the same
  turn**, overriding `#ykefa`'s own condition knowingly.
- **He authorised recording the override** (*"Yes, record it"*), which is why it is in the item's title
  rather than only in a chat.
- **He was given the risk analysis before deciding**, and it is worth not re-deriving: doing tenancy before
  go-live is **technically safer** (production is `PUBLIC_SITE: "locked"`, so a mistake is private, and the
  canary's planted shelter is harmless now), and the real costs are **not technical** — about 50 hours
  serving a shelter that does not exist, and a permanent tax on every later stream once the per-shelter
  rules land.
- **Nothing here reopens anything settled.** Admin outside the card system, the adopter-portal exception,
  `test-plan` advisory, merge-on-green — all untouched, and none is a decision he owes.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 4 of 4 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** **Three** plans ran on
2026-11-15; a fourth on the same date is a normal thing to be. **Never derive today's date from a
document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Ten editions have now recorded that as the fix for an interruption.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S FOUR AT YOUR FIRST BATCH, PLUS #1609, and none of them is in this edition on
   purpose.** Read `stream-usage:` from **#1610** (`shop-order-flood`, band 135-175k), **#1611**
   (`donation-tax-id-schema`, 155-190k), and the two batch-2 PRs (`donation-tax-id-app` 200-240k,
   `tenancy-host-map-schema` 165-200k). **#1609 (`public-site-speed-quiet`, 200-260k) is the one figure
   this plan could not take** — it was unmerged at measurement time and its comment is written immediately
   before `gh pr merge`. **It cannot expire.**
2. **THE MICROCHIP QUESTION GATES PART 2'S BRIEF** (above). Global or per-shelter unique. If he answered at
   the close of this plan, **send his words to the Backlog manager to file on `#s50n8`**. If not, ask once
   before briefing it.
3. **BRIEF TENANCY PARTS FROM THEIR ITEMS, IN THE FIXED ORDER, ONE OR TWO AT A TIME.** The items are the
   authority on scope; the planner holds no design of its own. **Carry the four programme rules into every
   brief** (his override, nothing renamed, nothing touches `cooperjaidee.org`, the shipped hardening is not
   revisited) and **brief each part to PROVE rather than assert** — see the lead.
4. **PART 1'S TRIAGE LIST IS WHAT UNLOCKS THE REST.** When `tenancy-host-map-schema`'s PR lands, read its
   body for the tenant / not-tenant / **ambiguous** groups and **send the list to the Backlog manager to
   file.** An **ambiguous** row is a decision to be taken, never a guess to be made — wrongly tenant hides
   data a shelter needs, wrongly shared leaks data between shelters.
5. **THE BACKLOG IS THIN FOR CLAUDE-BUILDABLE WORK, SEVENTH PLAN RUNNING.** The tenancy programme now
   supplies twelve items of real work, so this is less binding than it was — **but it is still no reason to
   pad with his own hands.** `SKILL.md` step 7 allows planning fewer.
6. **THE LEFTOVERS NEED HIM, NOT YOU** (above). Four folders, all HELD. Offer once; do not carry it as an
   owed planner item for a third edition.
7. **`#99zuk` SHOULD CLOSE THIS PLAN.** Batch 2's `donation-tax-id-app` is the half that ticks it. **Check
   the title it leaves behind** — the shop-income question is a separate item's business and must not read
   as this item's blocker.
8. **THE TENANCY-CATALOGUE NIGHTLY'S FIRST GENUINELY SCHEDULED RUN WAS 05:43 UTC ON 2026-11-16.** `751`
   flagged it as not yet happened. **Check it ran**, and that the strict run is still 0 flagged / 0 stale.
9. **THE RELEASE-PROCEDURE RULE EXISTS BECAUSE OF FAULT 5 IN THE LEAD, AND IT KEYS ON DIRECTION.** A
   migration whose **declared dependency direction** puts the reader ahead of the schema is the one that
   needs holding back. **It does NOT key on a path** — not `worker/`, not any folder. If you find yourself
   writing a rule keyed on a path, **grep for its existing members first**: there was exactly one, and it
   did not want the rule.

**Do NOT re-ask him about:** `#pl7aq`'s launch date (**asked and declined 2026-11-15**); `#j4m8w`'s
hostname meaning and the **three access shapes** (DECIDED, ticked — never put shape (a) again);
`#8t3rk`'s Cloudflare setting (impossible on the free plan, not pending); **`#00e3u`** (parked by his own
answer; not blocked on the Director or the accountant); whether to start the tenancy programme with its
condition unmet (**he overrode it and authorised the record**); `#k2vrj`'s fostered updates; the
`SUPABASE_ACCESS_TOKEN` scope; `#x5tbv`; the product name or which TLD; the anonymous photo upload;
whether staff may add a currency; `donation.receipt`'s shape (yes/no, #1585); the adopter-portal
exception; `test-plan` being advisory; merging a green PR; the Thai read's cadence; the 90-day retention
figure; **`#rqv5c`, the production Drive move** (in hand — not before the end of November); or anything on
`751`'s, `750`'s, `749`'s, `748`'s and `747`'s do-not-re-ask lists.
