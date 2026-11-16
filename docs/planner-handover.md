# Planner handover — edition `755`, 2026-11-16

**This is a DELTA against `754`.** It says what changed, corrects its predecessor, and reports what each of
`754`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** The daily measurement read **the second plan of
2026-11-16's complete set of six**, in one slot after batch 1 was set up, exactly as the rule intends:
**four readings and two unmeasurable.** **Three of this plan's own six are ALSO given below**, because they
merged before this edition was written and `gh pr view` does not care that the slot has passed. **Its
remaining streams belong to the successor.**

**WHY IT EXISTS.** This is the **third plan of 2026-11-16**. It ran **six streams across three batches**
(2, 3, 1) and **five of them merged**.

---

## THE LEAD: `754`'s CENTRAL CLAIM WAS WRONG WITHIN HOURS, AND THE THING THAT REPLACED IT HAD NEVER BEEN MEASURED BY ANY PLANNER

`754` said Parts 5–13 were parked because Lutan had declined a release — *"Not yet"* — and that the block
therefore stood by his choice. **Both halves were out of date before this plan started.**

- **He took a release.** `0.47.1` was cut, deployed and recorded the same day (PRs #1631, #1632): 27 PRs,
  nine migrations, and it carried Part 4's Worker header.
- **His production Worker deploy failed on a Cloudflare `401` and he ran it again.** It went through.
  **Measured, not read from the record:** `https://lannacareforanimals.org/api/releases/current` answers
  **`0.47.1`**. **The release record still says the deploy was *"NOT DONE at the time of writing"* — so the
  record and the live state disagree, and the live state is the one that counts.**

**SO PART 5 WAS BRIEFED, AND IT STOPPED ON SOMETHING NOBODY HAD LOOKED AT IN FIVE EDITIONS.** Every one of
the 95 `shelter_id` columns was **empty** — nullable, no default, no backfill, by Parts 2/2b/2c's deliberate
design. The stream's probe (rolled back) put a restrictive policy on `residents` and read it as
`authenticated`: **0 rows with no header, and 0 rows WITH a valid header**, against 17 as the owner, because
`null = <uuid>` is never true.

**Part 5 as briefed would have hidden every row from everybody — in production too, deploy or no deploy.**

**THE SHAPE, AND IT IS THE FOURTH EDITION RUNNING TO REPORT ONE:** `754`'s lead was *a true premise is not a
measured conclusion*. **This one is narrower and worse: THE GATE EVERYONE WAS WATCHING WAS NOT THE THING IN
THE WAY.** Five editions tracked one prerequisite (the deploy) in detail and **never asked whether any row
carried a value to filter on.** The brief's one saving grace is that it made the dev question **deliverable
3, before the migration** — so the measurement happened before the damage, and the stream built the
stamping (`0390`) instead.

---

## THE THREE INSTRUMENTS THAT FIRED THIS PLAN, BECAUSE A MITIGATION IS A HYPOTHESIS UNTIL IT DOES

1. **"Settle this question BEFORE you apply" caught Part 5.** Deliverable 3 asked what applying would do to
   dev and to CI's public-tier check. The stream measured instead of assuming, and stopped.
2. **"Is your proof REAL?" rewrote an instrument.** `#vleak`'s brief asked whether the canary could tell
   *correctly scoped* from *nothing visible at all*. **It could not** — it reads as anon with no header, so
   after scoping both its readings would be empty and the diff would vanish by itself. **The stream fixed
   the canary** (PR #1640): it now sends Lanna's header on every read, **refuses to run if the cards view
   reads empty**, then plants shelter B and requires Lanna's view unchanged. **Its stated limit, which is
   the honest part: it proves B is hidden from Lanna, not Lanna from B.**
3. **The feared CI blocker was measured FALSE, and that is worth as much as a finding.** The planner's
   question — would scoping the public views turn `public-views` red on every PR? — was answered by reading
   the script: **it tests `read.ok` (HTTP status), not row count.** Anon sends no header, reads empty, gets
   200. **No open PR goes red.** Two streams were held back a batch for a hazard that did not exist, which
   is the cheap direction to be wrong in.

---

## WHAT `754`'s EIGHT OWED ITEMS DID

1. **Measure the four unread streams — DONE.** Table below. Two were unmeasurable, for two different reasons.
2. **`#7bd5u` closes with batch 3 — CLOSED, and by a stream nobody set up this plan.** The folder and brief
   from the previous plan were still on disk; a session was opened on them and **PR #1638** shipped (a): the
   public site loads the Supabase browser client **on press** rather than with the page. **Item ticked.**
3. **Check the nightly — DONE, AND IT WORKS.** Three runs, not two: a `push` success, the `schedule`
   **failure** of 2026-11-15T12:57Z, and a `schedule` **SUCCESS at 2026-11-16T14:01Z**. **The failure's
   cause, read from the full log rather than guessed:** `1 flagged … 1 tables missing definer_all` — that
   is `#w4t9k`, which `0388` fixed the same day. **The guard went red on a real finding and green when it
   was fixed.** `gh run view <id> --log-failed` shows only checkout cleanup and is useless here.
4. **Brief Part 5 only after Part 4 is deployed — SATISFIED, and see the lead for what that bought.**
5. **The programme's cut re-measured — PARTLY.** 124 public tables, **95 carry `shelter_id`, 29 do not**,
   which agrees with `754`. **The 21-ambiguous / 8-or-9-not-tenant difference is STILL unreconciled** and
   now has three readings: Part 5's stream *"did not split ambiguous from not tenant"*. **Derive it from the
   schema when a part needs it exactly.**
6. **`#k2vd9` — untouched.** One question with the accountant.
7. **`#admsq` — VERIFIED AND IT WAS NOT TICKED.** All four stale `CLAUDE.md` passages were already corrected
   on `main` by PR #1627 (four greps, 0 hits each) with the `0387` consequence in place. **Only the tick had
   been missed. Ticked by the planner; no stream spent.** `754` was right to say *verify rather than assume*.
8. **The husks — GONE, and the fix is in the tool.** PR #1636 taught `done` the squash-merged case and
   cleared **six** leftover folders, not the two. **Its own folder then became the test case and cleared.**

---

## MEASUREMENT

**The previous plan's complete set, read once at this plan's batch 1:**

| slug | dials | band | tokens | floor | verdict |
|---|---|---|---|---|---|
| `tenancy-definer-all-policies` | sonnet-5-5 / low | 145–185k | 155,951 | 86,985 | inside |
| `claude-md-admin-sql-stale` | sonnet-5-5 / low | 110–145k | 136,581 | 87,050 | inside |
| `tenancy-tables-no-group` | sonnet-5-5 / low | 185–230k | 203,797 | 87,113 | inside |
| `supabase-client-shelter` | sonnet-5-5 / low | 150–190k | 146,242 | 87,113 | 3,758 under |
| `tenancy-part2-done-when` (#1625) | sonnet-5-5 / low | 150–190k | **unmeasured** | — | **no `stream-usage:` comment at all** |
| `public-site-unused-js` (then) | — | 190–240k | **unmeasured** | — | **the stream never ran** |

**This plan's own three that merged early, given rather than withheld:**

| slug | dials | band | tokens | floor | verdict |
|---|---|---|---|---|---|
| `public-site-unused-js` | sonnet-5-5 / low | 190–240k | 164,831 | 86,165 | **25k UNDER** |
| `tenancy-anon-view-leaks` | sonnet-5-5 / low | 170–210k | 181,924 | 87,113 | inside |
| `tenancy-null-shelter-check` | sonnet-5-5 / low | 130–170k | 156,049 | 86,727 | inside |

**THE FLOOR IS CONFIRMED A SEVENTH TIME: 86,165 / 86,727 / 86,985 / 87,050 / 87,113 / 87,113 / 87,113** —
all inside **86–89k**, three of them to the token. **`SKILL.md`'s floor row still describes the data, so NO
EDIT IS OWED**, and the scale rows are still **not** to be shifted with it: they were measured from actuals.

**THE ONE BAND FINDING: `#7bd5u` (a) came in 25k UNDER a band set for bundle surgery.** It was banded
190–240k because the item called it *"the biggest single win"* and *"bundle surgery"*. **What it actually
was: one dynamic import plus a leftover static import deleted.** **The lesson is the same shape as `754`'s
discount finding — when the surface is already small and the change is a known import boundary, band it
near the quick-win row and not by the size of the saving it promises.** Do not shift the medium rows.

**TWO UNMEASURED FIGURES, TWO MECHANISMS, STILL NEITHER A PATTERN.** `754` recorded a comment whose token
fields read `unmeasured` — **a tool failing.** #1625 posted **no comment at all** while its body says the
gates and merge-on-green were *"NOT done yet"* — **a stream stopping before the finishing sequence.**
One of each across two plans. **Watch for the third.**

---

## THE BLOCKER CHAIN AS IT NOW STANDS, AND IT IS NO LONGER LUTAN

- **`#ujqr5` (Part 5) is blocked on `#lhdr7`** — *a `localhost` session cannot send a shelter.*
  `current_shelter_id()` reads only the `x-shelter-id` header, dev has no Worker, and the server clients
  **forward** a header but never create one. **Its title was re-pointed** (it said *blocked until `#stmp5`
  lands*, which stopped being true when `0390` merged).
- **`#lhdr7` WAS SET UP AND NEVER STARTED.** Folder, port 3002 and a full brief are on disk; the session
  closed with **0 commits and no PR**. **It is the programme's one blocker and it is ready to pick up.**
- **`#stmp5` is three-quarters done** — `0390` stamped and defaulted all 95 columns and granted `anon`
  execute on `current_shelter_id()`; PR #1641 added the null-count check. **Only `NOT NULL` is left and it
  waits for Part 7**, because a trusted caller has no header and every service-role write would error.
- **`#ps6ms` (Part 7) says *run it after Part 5*, and `#stmp5` step 3 says it waits for Part 7. That is an
  inversion in the fixed order and nobody has resolved it.** Part 7's own reason — *"until the policies
  exist there is nothing for these call sites to be checked against"* — holds for the **filters** and not
  obviously for the **audit and the check**. **Worth testing against the hold's reason rather than its
  membership; it was not briefed this plan.**

---

## PROCESS, AND THE PLANNER'S OWN FAULTS THIS PLAN

- **A WORKTREE WAS CREATED AND FULLY BRIEFED FOR WORK ALREADY IN FLIGHT.** `#dvsgn` was being fixed in
  **PR #1634** by another session; the planner found it only at `worktree.mjs streams`, after the folder and
  a 200-line brief existed. **The skill names the check and it was not run: `gh pr list --state open` is one
  of the three cheap facts and it is one command.** The folder was cleared and `#ft13c` folded elsewhere.
- **AN OPTIONAL STREAM WAS PRESENTED AS THE DAY'S WORK, AND HE CAUGHT IT IN FIVE WORDS: *"it said nothing
  was to be built"*.** He meant PR #1626's deliverable 7, which recorded the nightly's reporting half as
  *"recorded, not built … **fix is a planner read of the last scheduled run**"*. **The recommended fix was
  a planner read, and the planner had just done it** — so the stream that followed was a *nice to have*
  briefed as a necessity. **It was not withdrawn (its session was already open and its deliverable 3
  contains exactly #1626's remedy), but it should have been labelled optional when it was handed over.**
  **THE RULE: when an item's own prior PR says the remedy is a READ rather than a BUILD, say so in the line
  you hand him, and mark the stream optional.** He is quick to spot the difference and it costs his trust
  in the rest of the list.
- **SIX INTERRUPTIONS, most of them a variant of *where are you up to*.** Root cause: long stretches of
  reading with nothing visible to him. **The half-hour warning was not given at the start.** `753` gave it
  on all three batches and cost none.
- **HE STOPPED THE SETUP TO ASK WHY IT WAS HAPPENING BEFORE AGREEMENT.** The hard sequence says set up
  first, present second — **his own instruction of 2026-11-08 — and it is invisible from outside.** **Say
  which order you are following, in one line, before the first `worktree.mjs new`.**
- **TWO STREAMS WERE SET UP AND PRODUCED NOTHING ACROSS TWO PLANS** (`public-site-unused-js`, which later
  ran and shipped; `tenancy-localhost-shelter`, which did not). **A set-up stream that never starts is
  invisible unless someone checks `gh pr list --state all --head claude/<slug>`.** Check it; `free` and
  `0 ahead` is a snapshot, not a verdict.

---

## HIS DECISIONS THIS PLAN

- **Three batches with Part 5 in batch 1**, over four with Part 5 alone — single question, his pick.
- ***"Keep all three"*** when told batch 2 had grown from the one stream he agreed to three, and why.
- **He asked twice about batch size** (*"why only two batches ? we always plan 3 batches"*, *"batch two
  should be quick"*). **Both answers were a real constraint, not a thin backlog, and he accepted both once
  named. Name the constraint in the first line, not after the tables.**
- **Nothing settled was reopened.** No release re-asked, no Worker deploy re-asked.

**Do NOT re-ask him about:** the production Worker deploy (**done** 2026-11-16); a release (he took
`0.47.1`); the cross-shelter operator (*"Yes, me"*); the microchip key; `#pl7aq`'s launch date; `#dqgy8`'s
five answers; `#k2vd9`'s accountant question; the tenancy lint's schedule (`#x5tbv`, settled 2026-11-14);
`#rqv5c`, `#aaqtl`, `#kxksr`, `#mzu7v`, `#z04wr`, `#civwx`, `#8dfud`, `#00e3u`; the product name or TLD; the
adopter-portal exception; `test-plan` being advisory; merging a green PR; **or anything on `754`'s, `753`'s,
`752`'s, `751`'s, `750`'s and `749`'s do-not-re-ask lists.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at `6 of 6` — COMPLETE — with five of six merged.**

**Read the system date and compare it with the date at the top of this file.** **Three** plans ran on
2026-11-16; a fourth on the same date is a normal thing to be. **Never derive today's date from a document.**

**AND READ THE REPOSITORY AFTER THE PULL, NOT BEFORE IT.** Still true, still cheap to get wrong.

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour** — **thirteen editions.** **Say it on EVERY batch.** This plan did not and cost five interruptions.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S REMAINING STREAMS.** Three are above with their figures. **`nightly-lint-reporting`
   (band 130–170k) was set up and its session opened; `tenancy-localhost-shelter` (170–210k) produced
   nothing and is `unmeasured`.** **Do not re-read the three given here and do not count them twice.**
2. **`#lhdr7` IS THE WHOLE PROGRAMME'S BLOCKER AND ITS BRIEF IS ALREADY WRITTEN.** Folder
   `Animal_Shelter_tenancy-localhost-shelter`, port 3002. **Re-read the brief rather than rewriting it**, and
   check `gh pr list --state all --head claude/tenancy-localhost-shelter` before assuming it is still untouched.
3. **THEN PART 5 AGAIN, AND READ PR #1635's DECISION FILE FIRST**
   (`docs/decisions/2026-11-16-tenancy-part5-policies.md`). The stamping is done, the `anon` grant is done,
   the two public views are scoped, the canary sends a real header. **What is left is the policies themselves
   plus the `docs/release-procedure.md` §5 line, which was deliverable 7 and did not ship.**
4. **RESOLVE THE PART 7 INVERSION** described above before briefing either side of it.
5. **`#n4rpt` IS THE ONE STREAM IN FLIGHT** and its diagnosis half is in its brief. **`0 flagged 0 stale` is
   the expected nightly state; ANY flagged table is new and is a finding.**
6. **`gh pr list --state open` BEFORE ANY `worktree.mjs new`.** PR #1634 is why.
7. **CHECK WHETHER `done` CLEARS THIS EDITION'S OWN BRANCH.** PR #1636 fixed the squash-merged husk and this
   handover's branch is the next test of it. **If it refuses, that is the fix not firing and it is a finding.**
