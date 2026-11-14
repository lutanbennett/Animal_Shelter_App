# Planner handover — edition `747`, 2026-11-14

**This is a DELTA against `746`.** It says what changed, corrects its predecessor, and reports what each of
`746`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS, AND IT IS TWO PLANS BECAUSE BOTH RAN TODAY.** `746` was written at the
setup of the 2026-11-13 plan's last batch; **that batch then merged within the hour**, and a second plan —
six streams in two batches — was planned from scratch and both its batches set up, all on 2026-11-14. **So
this edition carries the three figures `746` could not have (its own plan's batch 3) and the three from the
new plan's batch 1.** The new plan's batch 2 was set up at the same time as this was written and carries
none, as always.

---

## THE LEAD: `746` WAS ONE STREAM OUT OF DATE BEFORE ANYONE READ IT, AND THAT IS NOW A KNOWN COST

**`746` names `tenancy-reown` as the only unmeasured stream of its plan.** By the time it merged, Lutan had
added two more to that batch — `card-checks-report` and `thai-read-2` — so a planner following its "what is
owed" list would have measured one stream of three and never known the other two existed.

**Lutan caught it himself**, asking *"Is the handover done and merged"*; the amendment was offered and not
taken, because **this edition supersedes it rather than patching it.** All three figures are below.

**THE MECHANISM, because it will happen again: a handover is written at the setup of the plan's last batch,
and he may add a stream AFTER that.** The rule *"write it at setup of the last batch"* exists so the context
is still alive, and it is right. **So the guard is not to write it later — it is to say inside the edition
that its owed list is a snapshot of the batch as set up, and that a stream added afterwards will not be in
it.** This edition says so here, and its own owed list says the same.

---

## WHAT IN `746` IS SUPERSEDED

- **`746`'s owed item 1 is DONE, and it was bigger than the list it named.** All six figures are in this
  edition: its own plan's batch 3 (#1578–#1580) and the new plan's batch 1 (#1582–#1584).
- **`746`'s owed item 3 — "did `tenancy-reown` run the md5 regression proof?" — YES, and the hypothesis
  fired exactly as written.** It ran the proof twice (rolled-back harness and real apply): **90 objects, 61
  returning rows, 1,575 rows hashed, 0 differences.** It also caught one real object on the way —
  `label_translations()` reads `auth.users` and is now allow-listed by name. **And the question the brief
  could not settle is answered: `create role` WORKS on dev through the Management API**, so the ≈50-hour
  tenancy approach stands and the spike's 2026-10-09 success was the true reading, not the lint stream's
  `42501`.
- **`746`'s owed item 2 held:** the floor has not moved. **And it is now measured much more sharply — see
  the floor section below, which is the most useful single number in this edition.**
- **`746`'s owed items 4, 5 and 6 are all spent:** `#p8fwd` is batch 2's `merch-currency`; `#v3qlt` is batch
  2's `donations-read-level`, briefed as card work carrying its own migration exactly as `746` said; and
  `#n2bkc` and `#d6xhs` were folded into one stream, `wording-small-two`, which merged as #1582.
- **`746`'s owed item 7 is spent and the answer was "not yours".** `cut-release-0-46-0` had **two** merged
  PRs — #1576 the cut and **#1581 the record** — so 0.46.0 finished and its own session cleared the folder.
  Lutan had said *"Leave it"* and nothing in the planner's chain touched it. **A release worktree is still
  not a leftover to clear on sight.**

---

## THE FLOOR IS A CONSTANT OF THE HARNESS, NOT OF THE BRIEF — AND TWO STREAMS PROVED IT TO THE TOKEN

| PR | slug | tokens | messages | floor | band | verdict |
|---|---|---|---|---|---|---|
| #1579 | `card-checks-report` | 152,076 | 62,571 | **89,505** | 130–175k | within |
| #1580 | `tenancy-reown` | 175,428 | 85,923 | **89,505** | 220–280k | **UNDER by 44,572** |
| #1583 | `card-boxes-triage` | 218,409 | 131,678 | **86,731** | 170–220k | within, near the top |
| #1584 | `report-animal-photo` | 212,067 | 125,810 | *86,257* | 220–280k | `rescoped=yes` — kept out |
| #1582 | `wording-small-two` | unmeasured | unmeasured | — | 120–165k | unmeasured |
| #1578 | `thai-read-2` | **no usage comment** | — | — | 150–200k | unmeasured |

**#1579 and #1580 returned the SAME floor to the token — 89,505 — from different briefs, different bands
and different work.** `746` reported a control that disproved the brief-length hypothesis by showing three
near-identical briefs spreading 2,542 tokens. **This is the other half of the same proof, and it is
stronger: two very different briefs, one identical floor.** **The floor is set by the harness, not by what
the planner writes. Stop pricing briefs by length, and do not re-test it a third time.**

**THE BIG MISS IS MINE: `tenancy-reown` came in 44,572 UNDER a 220–280k band** — a sound figure, dials
matching, no compaction, no rescope. **The brief handed over the exact `--reown` SQL (recoverable at
`3761a29d`), the instrument (#1573's lint with a `--strict` mode built for it), and the proof method.** The
banding note said those were discounts and then **priced it as if they were not.** **The rule to apply next
time: a brief that hands over the cause, the decision AND the shape of the fix lands near the floor — and
"near the floor" now means about 90k plus the work, not the bottom of a 250–320k instrument row.**

**#1584 was kept out and the reason is mine too:** `rescoped=yes`, because I corrected that stream
mid-flight over a migration number. Counted in, it would have read as 7,933 under its band and applied a
false discount to the next upload stream.

---

## THE INCIDENT: BOTH BATCH-1 STREAMS TOOK 0376, AND MY FIX WAS HALF WRONG

**Lutan, twice: *"i have another conflict with migration numbers"*, then *"Migration number still failing on
Car[d] boxes triage"*.**

**Cause, and it is in the briefs:** `report-animal-photo`'s brief said **"you are the only migration carrier
in this batch"** while `card-boxes-triage`'s allowed one as *"expected none, may need one"*. **Both were
mine, written in the same hour, and they contradict each other.** `SKILL.md` rule 3 says *prefer one
migration-carrying stream per batch*; two were allowed and one was told it was alone.

**The check cannot settle it, and that is not a fault in the check.** `check-migration-numbers.mjs` is
symmetric — run in either worktree it names the other PR and says only *"whichever merges second must
renumber"*. **So the tiebreak has to come from outside the instrument, and it is the planner's to make.**

**MY FIX WAS HALF WRONG.** I told the stream keeping the number *"carry on and merge on green, do not
wait"*. **`migration-numbers` reads OPEN PRs, so while the other PR still held 0376 that stream's CI could
not go green whatever it did** — it was blocked on a neighbour's push, and "do not wait" sent it hunting for
a fault of its own. **It resolved on its own terms:** the other stream renumbered and merged **first**,
taking **0377**, so the free number moved and `card-boxes-triage` took **0378**. **Both streams cleared
their own stale dev rows with `--forget`** and dev holds no orphan.

**THE GUARD, BOTH HALVES, AND IT IS NOW IN `.plan-day.md`:** a batch's briefs may say *"expected none, may
need one"* **or** *"you are the only migration carrier"*, **never both**. If two streams may take a number,
**every brief in that batch names the tiebreak in advance — the lower PR number keeps it — AND says that the
stream keeping the number stays red until the other pushes, and that its number may move again if the other
merges first.** Batch 2's two carriers (`donations-read-level`, `merch-currency`) both carry that paragraph.
**Check next round whether it fired.**

---

## WHAT THE MERGED PRs REPORTED THAT ONLY A PLANNER CAN FILE

**Six items were filed from PR bodies across the two plans, all from streams that correctly did not file
them.** Two are now batch 2's streams. The four from this plan's batch 1 and the morning batch:

- **`#t4wqp`** — `check-who-does-what` ran for the first time ever and exited red: **385 boxes, 316 obeyed,
  3 wrong, 1 sticky, 61 inert, 9 probe faults.** Filed with the doctor `clinicRule` overlisting marked
  **EXPECTED** (it is the doctor-cells test state Lutan drives himself), which is what stops it being filed
  a fourth time. **`card-boxes-triage` then triaged it and ticked the item.**
- **`#h8rvk`** — the two holes `0375` left: nothing asserts an RLS table **has** its `definer_all` policy,
  and the strict lint is in neither CI nor the release procedure. **Batch 2's `tenancy-lint-holes`.**
- **`#v3qlt`**, **`#p8fwd`**, **`#n2bkc`**, **`#d6xhs`** — all four filed and all four now closed or
  briefed.

**THE STANDING CHECK THIS CONFIRMS: when a stream says *"for the planner to file"*, file it that setup.** A
finding that lives only in a merged PR body is invisible to every future plan, because nothing greps PR
bodies.

**AND ONE REPORTING GAP WORTH WATCHING: #1578 (`thai-read-2`) posted no usage comment and a three-line PR
body** that accounted for none of its thirteen numbered deliverables. Its substance was real — **25 new
strings read by a bilingual reader, none changed** — but a planner cannot tell from the PR whether the
reconciliation across 27 test plans happened or was skipped. **If a guided stream reports that thinly
again, the brief's "report every deliverable" block needs to be a numbered deliverable rather than a
block** — which is exactly what worked for the first commit and for the usage comment.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 6 of 6 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** Two plans ran on 2026-11-14;
a third on the same date is a normal thing to be. **Never derive today's date from a document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Five editions have recorded that as the fix for an interruption.

**WHAT IS OWED. This list is a snapshot of batch 2 AS SET UP — if he added a stream after that, it is not
here, and `.plan-day.md` is the authority, not this list.**

1. **MEASURE BATCH 2's THREE** from their merged PRs: `donations-read-level`, `tenancy-lint-holes`,
   `merch-currency`. **Re-derive the floor from the complete set and never carry it forward** — but note
   that the two identical 89,505 readings above make the floor the best-measured number in this file.
2. **CHECK BATCH 2's THREE HYPOTHESES.** (a) Did the pre-written migration tiebreak hold, or did the two
   carriers still need a planner? (b) Did `donations-read-level` decide to level `donation.receipt`, add a
   separate activity, or leave it — and did it add **probes**, since the activity has had none and
   `check-who-does-what` now works? (c) Did `tenancy-lint-holes` find its policy rule could run in **CI**,
   which would close its second hole far better than a line in a document?
3. **`0375` IS NOT ON PRODUCTION.** The re-own applied to dev only and said so. **A production apply that
   re-owns 90 objects is the release manager's, with the strict lint beside it** — which is what `#h8rvk`
   asks to be written into the release procedure. **Do not brief a stream to do it.**
4. **THE DICTIONARY OVERLAP IS A LIVE HYPOTHESIS.** Batch 1 had two streams touching `en.ts`/`th.ts` at
   once, which by the skill's own test is a collision; I kept them together because `CLAUDE.md` calls
   dictionary conflicts trivial, named the keys each owned and required a `sync` before the PR. **Both
   merged without incident, so it held once.** Batch 2 may do it again. **Record which way it goes rather
   than assuming it is settled.**
5. **`#y1dqu` IS STILL OPEN AND ITS OPEN HALF IS A PERSON.** Round 2 read 25 strings with a bilingual
   reader. **The item's own durable question — should new Thai queue somewhere a Thai reader sees it, rather
   than being filed by hand — was deliberately put to him at the END of the reading.** Read #1578's PR for
   his answer before briefing round 3; if the PR does not say, **ask him in one line rather than guessing.**
6. **THE PRODUCT NAME IS DECIDED, AND `#ykefa`'s BUILD HALF IS UNBLOCKED. Lutan, 2026-11-14, while this
   edition was being written: *"ok we will use cooperjaidee as the system name"*, then *"I will buy the domain
   tonight"*.** Three planner editions carried the name as the thing with him; **it is no longer.** Full
   reasoning in `docs/decisions/2026-11-14-product-name.md`, which ships in this same PR.
   **What this means for your first plan, and the restraint matters:** `#ykefa` is **≈50 hours (40–65)** and
   the re-own measured its object counts **40% larger** than the spike priced (53 owner-run views and 92
   definer functions, against 38 and 58). **It is a programme to SEQUENCE across days, not a stream to
   brief in one go**, and the first piece is a design: `shelter_id` across the tenant tables, the
   restrictive per-shelter policies, `current_shelter_id()` and `is_trusted_caller()`. **The permanent
   canary diff becomes possible for the first time**, because there is finally a shelter concept to plant a
   second shelter into. **The hardening already shipped** (#1573, #1580) and is not revisited.
   **Three things that are NOT unblocked and must not be assumed:** the domain **is registered** (`cooperjaidee.org`, 2026-11-14, confirmed by RDAP, expires 2028-11-14) **but points at nothing** — no DNS record, no Worker route, no Pages project — so **nothing deploys to it and no stream may assume it resolves**; **nothing in this repository is renamed**,
   because a rename of code, infrastructure or branding has not been asked for; and `lannacareforanimals.org`
   **remains production**, with `lannacare.org` still 301ing to it.

**Do NOT re-ask him about:** the anonymous photo upload (**he answered 2026-11-14: *"Yes, build it
properly"*** — a bucket the public can write but not read, limits, metadata stripped); the adopter-portal
exception (settled in writing, `745` has the scope); `test-plan` being advisory; merging a green PR; the
Thai read's cadence (weekly) or folding its three items (he said *"Leave them"*); or anything on `746`'s and
`745`'s do-not-re-ask lists.
