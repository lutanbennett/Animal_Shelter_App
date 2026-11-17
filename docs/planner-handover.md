# Planner handover — edition `759`, 2026-11-17

**This is a DELTA against `758`.** It says what changed, corrects its predecessor, corrects itself, and
reports what `758` left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS, AND 2026-11-17 HAD FOUR PLANS, NOT THREE.** `758` opened by
correcting `757`'s "two plans in one day" to three. **There were four.** Lutan ran `/plan-day` again
after `758` merged, a fourth plan of **six** streams was cut from scratch, agreed in one answer, and both
its batches were set up on the same day.

- **This edition reports the THIRD plan's complete set of nine** (#1659–#1666, #1668), read this
  afternoon. **`758` said they belonged to `759`. They are here.**
- **It reports NO figures from its own plan's six.** Batch 1's three (#1669, #1670, #1671) were read
  only because the pre-clearing check requires one read per merged PR; they are recorded in
  `.plan-day.md` and **belong to `760` with batch 2's three.** One of them is quoted below because it
  tests a correction made the same afternoon and **found it wrong**, which is worth more than tidiness.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** It is gitignored, so it is not in this file's history. It holds all
   four of today's plans, their statuses, the ACTUALS tables and every finding filed.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **Check whether batch 2's three merged, with `gh pr list --state all --head claude/<slug>` and NOT
   the worktree table** — `tenancy-part9-drive-app`, `shelter-export-proof`, `pi-scheduled-writers`.
   That rule has now answered eighteen stream states across two days and misreported none.
4. **Read the repository AFTER the pull, not before.**
5. **`#ctlg8` IS THE MOST IMPORTANT LINE ON THE BACKLOG, AND IT IS A CARD-RULE FINDING.** The next
   section says why.

## READ THIS FIRST: ANY SHELTER'S ADMIN CAN EDIT WHAT A CARD GRANTS FOR EVERY SHELTER

**`card_grants` and `card_includes` have write policies of `is_admin()`** — found by PR #1665 and
filed as **`#ctlg8`** by another session while the fourth plan was being cut. **So a second shelter's
Admin could change what a card grants for Lanna.** No screen writes those tables today, which is the
only reason it has not bitten.

**Why it matters out of proportion to its size:** the card catalogue is the one thing Lutan's rule says
must define access — *"the only thing that can give permissions to do something in the system has to be
a card"* — and the catalogue is **shared across shelters** while Admin is **per shelter** (`0387`: one
Admin per shelter). **Admin sitting outside the card system is deliberate and settled; Admin being able
to redefine the card system for everybody is not.** Multi-tenancy turned a safe hard-coded exception
into a cross-tenant hole, and nothing in the registry or the checks reads it as one.

**THE GENERAL LESSON, AND IT IS NEW: A SETTLED EXCEPTION CAN BECOME A LEAK WHEN THE SYSTEM AROUND IT
BECOMES MULTI-TENANT.** `is_admin()` was exactly right when there was one shelter. **Re-read every
standing exception against tenancy before the programme closes**, rather than trusting that it was
reasoned through once.

## THE CORRECTION AGAINST MYSELF, AND IT IS THE MOST USEFUL THING IN THIS EDITION

**`SKILL.md` says a brief handing over the cause, the decision AND the shape of the fix *"lands near the
floor"*. That is TRUE OF LARGE JOBS AND FALSE OF SMALL ONES, and it was proved against me inside one
afternoon.**

Three handovers in a row, `758` included, wrote *"apply that discount next time"* and did not. **I
applied it:** `build-halt-gates` was briefed with the halt mechanism read out of `node_modules` with
line numbers, the candidate fix named, and explicit permission to conclude that no honest fix existed.
I banded it **110-150k**, then widened it to **115-160k** after measuring the day's floor.

**It came in at 165,685 — over even the widened band.** Its usage comment quotes `band=110-150k`, the
header it read before I widened it.

**The synthesis, stated as a mechanism rather than a shrug:**

- **On LARGE jobs the discount is real and grows with size.** Five schema-with-code streams whose
  briefs handed over a finished worklist came in under by **18k, 32k, 37k, 51k and 79k** — #1664 and
  #1665 being the two newest and largest misses.
- **On SMALL jobs it is approximately ZERO**, because **the floor dominates.** The floor is 87-90k, and
  the irreducible work of *being* a stream — step zero, the gates, the test plan, the backlog tick, the
  PR body, the usage comment — costs roughly another **65-75k whatever the job is.** A brief cannot
  discount work that is not discovery.
- **FOUR READINGS NOW AGREE: 152,366 / 152,686 / 158,646 / 165,685. A well-briefed small stream costs
  150-170k.**
- **PRACTICAL RULE: apply the hands-over-everything discount above ~200k; do NOT apply it below ~175k.**

**AND I BROKE THE RULE `SKILL.md` STATES EXPLICITLY, TWICE, IN ONE AFTERNOON.** It says the scale rows
were measured from actuals and must not be narrowed without writing down why. **The published quick-win
row is 110-170k. I narrowed it to 110-150k, then to 115-160k. The actual landed inside the published row
and outside both of mine.** The row was right; I was not. **The previous planner did the same thing to
three briefs** (110-150k, 110-150k, 110-155k) and two of them then read as overruns having done nothing
wrong. **Narrowing a published row is how a good band gets corrected into a bad one.**

## WHAT `758` LEFT OWED, AND THE ONE LINE IT IS NOW STALE ON

**`758` owed the third plan's nine figures. They are in this edition and in `.plan-day.md`. Nothing was
lost.**

**BUT `758`'s "WHAT IS WAITING ON HIM" SECTION IS NOW WRONG, AND HE HAD TO SAY SO THREE TIMES.**
`SUPABASE_ACCESS_TOKEN_PROD` **exists** — created 2026-11-17T11:58:36Z, scoped to `dbkodyyxxhtygxcxmfcu`,
Database: Read. **He told the planner three times in three messages**, because the first reply, while it
did verify the secret, **also carried a wrong conclusion** — that it unblocked a stream that day.

**It did not, and this is the state to carry forward:**

- A stream had **already used it that morning** and run the production job for real, which is what
  proves the scope: a wrong-scope token exits **2** with `NOT CHECKED` rather than reporting tables.
- **The job is commit `1d974727f` on `claude/shared-tables-production`** — pushed, **no PR ever
  opened**, one commit `main` lacks. `worktree.mjs list` prints it as
  `NO MERGED PR … DO NOT TOUCH, unsubmitted work`. **It is not a leftover. Do not clear it.**
- **It is held because production is ELEVEN TENANCY MIGRATIONS BEHIND** (`0390`–`0400` pending), so the
  nightly job would be **red every night**, emailing whoever last edited the cron line, which is him.
- **So `#shtci` is blocked on the production RELEASE — not on him, and not on a stream.** Merge it in or
  straight after the release that applies `0390`–`0400`, then
  `gh workflow run tenancy-shared-tables.yml` to confirm green.

**NEVER ASK HIM FOR THAT TOKEN AGAIN.** And **the lesson is not "read more carefully"** — the first
reply did read correctly. **It is that a fact he gives you is not the same as the consequence you draw
from it. Verify the consequence against the item before stating it.**

## FIGURES — the third plan's complete set of nine

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `tenancy-part5-release-guard` | #1659 | 150-190k | **163,217** | **inside** |
| `tenancy-shared-tables-ci` | #1660 | 130-175k | **145,111** | **inside** |
| `status-card-admin-only` | #1661 | 150-185k | **201,207** | **over by 16,207** |
| `usage-chain-transcript-rule` | #1662 | 110-150k | **152,686** | over by 2,686 |
| `next-cache-api-guard` | #1663 | 110-155k | **152,366** | **inside**, at the top |
| `tenancy-part8-branding` | #1664 | 240-300k | **189,375** | **under by 50,625** |
| `tenancy-part10-shelter-roles` | #1665 | 250-310k | **171,059** | **under by 78,941** |
| `backlog-title-check` | #1666 | 110-150k | **158,646** | over by 8,646 |
| `tenancy-lookup-lists` | #1668 | 185-230k | **187,440** | `rescoped=yes` — **not a band reading** |

All nine ran `sonnet-5-5 / low`, dials matching their bands, `compacted=no`, `finished=yes`. **Eight are
valid readings.** All nine posted a `stream-usage:` comment — **9 of 9.**

**THE FLOOR: 86,693 (×4), 86,758, 87,417 (×2), 90,741 (×2)**, and batch 1's three added 87,482 / 89,302 /
90,091. **`SKILL.md`'s `~86–90k` row still describes the data, with the top edge now reaching 90,741.**
**No edit owed, and the scale rows are still not to be shifted with it.**

## THE PROGRAMME'S STATE, SO IT IS NOT RE-DERIVED

**The thirteen-part programme (`#ykefa`) is close to done on everything that is not a release.**

- **DONE:** Parts 1, 2, 3, 4b, 6, 7, 10, 11, and **Part 8 in full** — slice 3 shipped as #1670.
- **Part 9 (`#o2iyh`): schema DONE** (#1669, `0404_shelter_drive_credentials.sql`, a table of its own
  with explicit `0392`-shaped policies, the secrets held as ciphertext and Admin seeing status columns
  only). **The app half is in flight in batch 2**, and #1669 wrote it an eight-point specification,
  quoted verbatim into its brief.
- **Part 5 (`#ujqr5`): what remains is THE RELEASE ITSELF — Worker first, then `0392`, in two different
  releases.** It is the biggest thing on the board, it is his, and it unblocks `#shtci`. **He ranked it
  third on his own priorities list.**
- **Part 12 (`#egq18`) needs a test-Worker deploy** — no local CPU figure exists, because a local
  `workerd` records `cpu_time_ms` 0. **Part 13 (`#34a30`) is blocked on that number.**
- **Outside the programme there is almost nothing Claude-buildable left.** The fourth plan was **six
  streams, not nine, on purpose**: every remaining buildable item was in *Architecture*, and Quick wins,
  Mobile, Resident operations, Medical records and Facility have no open items at all. **Padding a plan
  with his own hands is worse than a short plan.** Ask him what comes after the programme.

## HIS DECISIONS TODAY, SO THEY ARE NOT RE-ASKED

- **A per-shelter export carries the shelter's DATA AND NOT ITS STAFF LOGINS** — *"No — data only"*,
  from three options. That settles `#expgp`'s gap one **as correct as built**; `auth.users` stays out on
  purpose. The item was **retitled and re-sized M → S**. **Never put it to him again.**
- **THE MICROCHIP REGISTER MOVES AS A GUIDED SESSION ON THE FIVE ANSWERS** — chosen over leaving it
  parked, having been ranked **second** on his priorities list that morning. **It is a guided session,
  not a document he works through alone**, and **it has not happened yet: it is the one thing this
  edition leaves owed to him.** The scoping paper still recommends not building, so "stays unbuilt" is a
  legitimate outcome of the session.
- **`system.status` is Admin only** — shipped as `0399`.

## FILED, AND ONE DELIBERATE NON-FILING

**Filed this plan:** `#expgp` retitled on his answer · `#dqgy8`'s guided-session route · **the `#b4cmn`
"32 files" correction** (below). **Filed by another session mid-plan:** `#ctlg8`, above.

**THE NON-FILING IS ALSO A RESULT: the third plan's nine PR bodies were read for findings outside their
deliverable lists and there was NOTHING LEFT TO FILE.** Every finding was already on the backlog —
#1659's *"the guard cannot observe the Worker"* on `#ujqr5`, #1661's broken card-grants check as
`#cgrnt`, #1662's *"transcript survival is not established"* on `#3qmzt`, #1660's token step now done,
and #1665's write-policy finding as `#ctlg8`. **A complete set read with nothing owed is not a set read
carelessly.**

### A WORKLIST SIZED FROM A COUNT, FOR THE SECOND DAY RUNNING

**`758` corrected itself for sizing a worklist from a `grep -l` hit count in the document that said a
`grep -l` is not a definition. `#b4cmn`'s own title did the same thing and nobody had noticed.** It says
*"THE DICTIONARIES' PROSE (32 FILES)"*. **That is the size of a registry.**
`docs/shelter-settings-registry.json` `lannaLiteralFiles` holds **34** entries, of which **30 are
recorded as deliberately left alone** — comments, placeholders, host and header names, the merch cart's
storage key, download file names, historical release-note text, the authenticator issuer, the backup
prefix. **The open worklist was FOUR FILES**, and they were handed to the stream by name with the
registry's own reasons.

**The instrument that caught it was reading the registry**, not any check — the fourth time this month
that a read has caught the planner rather than the item. **A number on an item's face is a claim with a
date on it. Open the thing it counts.**

## PROCESS NOTES THIS EDITION ADDS

- **THE `#cgrnt` MITIGATION FIRED FIRST TIME.** `758` ruled that after any migration adding a
  constraint, the checks CI cannot run must be run and said so in the PR. #1669 ran
  `check-card-grants.mjs` and `check-tenancy-shared-tables.mjs` and reported both. **1 of 1.** It also
  found that `check-tenancy-shared-tables.mjs` throws a **libuv assertion on Windows after printing its
  result** — a crash after the answer, not a failure of the check.
- **THE BUILD HALT IS A ONE-SHOT TOKEN, NOT A FIVE-MINUTE WINDOW, AND `gates.mjs` NOW RETRIES ITSELF.**
  PR #1671 measured four builds inside five minutes — **halt, pass, halt** — so the receipt is spent by
  the retry rather than silencing a window. `scripts/gates.mjs` now re-runs **the build gate only**,
  once, when it exits non-zero **and** printed `SecurityFatalError`. Proven both ways: a clean run gave
  `typecheck=0 lint=0 test=0 build=0`, and a deliberate type error gave `typecheck=2 … build=1`, exit 1,
  **no retry**. **Nothing was weakened, no environment variable was set and Next was not upgraded** —
  all three suppression candidates were assessed and rejected as dishonest
  (`docs/decisions/2026-11-17-build-halt-gates-retry.md`). **`brief-blocks.md` block G is corrected in
  this PR**, on that stream's own request. **It has ONE run behind it: record it as untested.**
- **A MITIGATION THAT HAS CAUGHT NOTHING IS STILL UNTESTED.** The usage-comment presence check has now
  gone **18 of 18 and caught nothing.** Its value showed anyway: clearing was decided **on the check**
  rather than on habit, and all nine were present.
- **MECHANISM A HAS NOT RECURRED IN EIGHTEEN CONSECUTIVE STREAMS.** Two unexplained occurrences remain
  (#1636, #1647), both undiagnosable with their sessions long gone. **Do not re-investigate without a
  new occurrence.**
- **A TRAP WORTH NOT RE-DISCOVERING, FOUND BY #1669: scripts using `scripts/lib/env.mjs` take
  `--env test` for the DEV database, and `--env dev` is REJECTED.** `loadEnv()` reads
  `.env.deploy.<env>` for every environment but `test` and **exits 2 when the file is missing**; those
  files exist only on his PC, which is why neither nightly workflow may pass `--env` at all.
- **AN ITEM COUNT CHANGED MID-PLAN AND IT WAS NOT A FAULT.** The backlog read 33 open items against
  `main`'s 32. Rather than assume, the id sets were diffed directly: **1,154 each, identical** — another
  session had filed `#ctlg8`. **The backlog moving under a plan is not a reason to re-plan**, and he was
  told it had arrived rather than asked about it.
- **FIVE WORKTREES CLEARED, FOUR LEFT ALONE.** `worker-free-plan-limits` refused clearing for the
  **third** time, **with the identical seven process ids** — nothing releases it but closing that
  session, and it has never been forced. Batch 1's three were still held by their own sessions.

## INTERRUPTIONS

**THREE MESSAGES FROM HIM, ALL THE SAME FACT, AND THE COST IS THE PLANNER'S.** He told the planner he
had created the production token, then twice more in different words. **The fact was registered and
verified on the first reply; the wrong CONCLUSION drawn from it was what needed correcting**, and it was
corrected in the same turn after reading `#shtci`'s body. **Counted as a cost of the BRIEFING, not of
any stream** — and the rule it produces is in the `758`-stale section above.
