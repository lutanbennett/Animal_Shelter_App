# Planner handover — edition `761`, 2026-11-18

**This is a DELTA against `760`.** It says what changed, corrects its predecessor, corrects itself, and
reports what `760` left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS TWO PLANS, THE THIRD AND FOURTH OF 2026-11-18, BECAUSE IT WAS OFFERED TWICE AND DECLINED
TWICE** (*"Not yet"*). `760` covered two plans for a different reason — one had been set up without a
handover at all. **Here nothing was lost: both plans are in `.plan-day.md`, every figure is on a merged
PR, and this edition reports all fifteen.**

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** It is gitignored, 310 lines, and holds both plans, every figure, every
   correction and the three near-misses below.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **`node scripts/worktree.mjs list` will show you NINE HELD FOLDERS.** They are finished, merged
   streams whose Claude sessions are still open. **Do not force them.** Closing those sessions is
   Lutan's; then one `done` each, or `/clean-streams`.
4. **Read the repository AFTER the pull, not before.**
5. **`#ntrun` is the line to read first, and the next section says why.**

## READ THIS FIRST: THE SAFETY NET OF THE WHOLE TENANCY PROGRAMME HAS NEVER RUN

**`tenancy-canary.yml` has fired twice, ever, and both runs failed before reading anything.** It plants a
second shelter's rows inside a transaction, reads what `anon` can reach and rolls back — the one
instrument that can see a leak the catalogue lint cannot. **Every night since it was wired up it has
checked nothing.**

**TWO SESSIONS FILED THIS WITHIN AN HOUR AND BOTH NAMED THE WRONG SECRET.** `#ntrun` and `#cnrnt` each
said to set `SUPABASE_ACCESS_TOKEN`. Read before believing them:

- **That secret exists and works.** `gh secret list`: created 2026-11-15T01:21:11Z, and the shared-tables
  nightly read it **green** today (run 44217829035).
- **The workflow reads a different one.** `.github/workflows/tenancy-canary.yml` line 36:
  `SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_CANARY_TOKEN }}`, and **no `SUPABASE_CANARY_TOKEN`
  exists**, so it interpolates to empty and the script correctly refuses.
- **It cannot be the read-only one.** The workflow's own header: the canary *"must WRITE to plant, so it
  needs a Management API token that can write to the DEV project only… not the read-only
  `SUPABASE_ACCESS_TOKEN` the catalogue lint uses"*, and it is off the PR path because the repository is
  public. **Setting the existing secret would move the refusal to the planting step, not fix it.**

**THE JOB, AND IT IS HIS, ABOUT FIVE MINUTES:** a Management API token that **can write**, scoped to
**dev `qxkmhwybjggxvsfxsxbd` only**, added as the repository secret **`SUPABASE_CANARY_TOKEN`**, then one
06:11 UTC run confirmed green. **`#cnrnt` is closed as a duplicate POINTER, not as work done**, so its id
still resolves — he had ranked it seventh on his priorities list.

## THE BAND FINDING, AND IT IS THE MOST USEFUL THING IN THIS EDITION

**TWELVE STREAMS MERGED TODAY ACROSS TWO PLANS. NOT ONE CAME IN UNDER 143k.** In order: 143,281 ·
146,673 · 146,719 · 148,976 · 149,997 · 154,869 · 160,170 · 173,744 · 186,724 · 204,314 · 220,028 ·
281,551.

**EVERY BAND WHOSE BOTTOM WAS SET BELOW 145k OVERRAN — all four of them** (110-140k, 110-145k, 115-145k,
115-150k). **Every band whose bottom was 120k or above held.**

**THE RECOMMENDATION, AND IT IS DELIBERATELY NOT AN EDIT: raise the bottoms of `Quick win (110-170k)` and
`Schema PR, nothing left to discover (110-140k)` to about 145k.** A real PR's floor plus its own
bookkeeping — test plan, decision file, gates, backlog tick, usage comment, the branch dance — **costs
about 145-155k before the work starts.** **Not edited into `SKILL.md` here**, because that file is
explicit that the floor row and the scale rows are independent measurements and that correcting one does
not imply correcting the other. **Twelve readings is enough to weigh it; it is the next planner's call.**

**AND THE OTHER HALF OF THE LESSON, WHICH IS NOT "EVERY BAND IS TOO LOW":** the one band narrowed on
**something read** came good. `calendar-connect-screen` was cut from 210-265k to 170-215k because the
planner opened `scripts/connect-shelter-drive.mjs` and found the Drive is connected by a **script**, not
a screen; the stream independently chose the same shape — *"a script, not a screen, following the
Drive"* — and landed at **173,744, inside and near the bottom.** **Narrowing on a fact you opened is
sound; a bottom below the cost of the paperwork is arithmetic that cannot be met.**

## FIGURES — the three `760` owed, then today's twelve

**The three `760` said belonged here** (read at that plan's pre-clearing check):

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `card-catalogue-writes` | #1676 | 150-180k | **167,847** | **inside** |
| `dictionary-shelter-prose` | #1677 | 175-220k | **195,320** | **inside** |
| `shelter-drive-connect` | #1678 | 200-250k | **210,727** | **inside** |

**The third plan's six:**

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `scheduled-writer-visibility` | #1687 | 190-240k | **281,551** | **over by 41,551** |
| `security-check-coverage` | #1686 | 185-230k | **220,028** | **inside** |
| `calendar-per-shelter-schema` | #1684 | 150-185k | **204,314** | **over by 19,314** |
| `calendar-per-shelter-app` | #1690 | 170-215k | **186,724** | **inside** |
| `part5-closing-pass` | #1689 | 110-140k | **146,673** | **over by 6,673** |
| `release-order-measures-worker` | #1688 | 120-160k | **143,281** | **inside** |

**The fourth plan's six:**

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `cron-watch-purge-requests` | #1693 | 110-145k | **148,976** | **over by 3,976** |
| `advisory-glob-judged` | #1691 | 125-165k | **149,997** | **inside** |
| `calendar-status-rpc` | #1692 | 115-145k | **154,869** | **over by 9,869** |
| `migration-check-not-checked` | #1694 | 115-150k | **160,170** | **over by 10,170** |
| `calendar-connect-screen` | #1695 | 170-215k | **173,744** | **inside** |
| `worker-writer-runs-adopt` | #1696 | 140-180k | **146,719** | **inside** |

**All fifteen are valid readings** — dials matching their bands, `compacted=no`, `rescoped=no`,
`finished=yes`. **Two misses have causes worth keeping:** #1687 was banded for a fix and delivered an
instrument (new table, Worker file, check script, and a break-it-on-purpose proof driven on dev);
**#1684's overrun is the BRIEFING's fault, not the stream's** — it lost turns to the migration-number
block, and the planner had put two migration carriers in one batch without saying which opens its PR
first. **That is now a named defect: when two carriers share a batch, name the order in both briefs.**

**THE FLOOR, TWELVE FIGURES: 86,693 (×2) / 86,758 / 86,760 / 86,982 / 87,482 / 89,302 / 89,595 / 89,793 /
90,091 / 90,093 / 90,806.** **`SKILL.md`'s `~86–90k` row still describes the data, with its top edge
measured at 90,806 today.** **No edit owed, and the scale rows are still not to be shifted with it.**

## THE PROGRAMME — PART 5 IS DONE, AND WITH IT THE BIGGEST THING ON THE BOARD

- **`#ujqr5` PART 5 IS TICKED (PR #1689).** `0392`'s per-shelter restrictive policies and `0397`'s
  `NOT NULL` reached production in `0.47.2`; the release-order guard answered ok for both guarded
  environments; the strict tenancy lint is **125 of 125**; and the `public_*` views clause — the one thing
  the stream was told to test rather than accept — is scoped by `0391` with the canary clean on dev.
  **`#ykefa`'s index is updated.** Evidence: `docs/decisions/2026-11-18-part5-closing-pass.md`.
- **DONE: Parts 1, 2, 3, 4b, 5, 6, 7, 8, 9, 10, 11.** **`#egq18` Part 12 is HELD AT HIS WORD** (*"Hold it
  for now"*), and **Part 13 (`#34a30`) stays blocked on Part 12's number.**
- **`#shtci` CLOSED (PR #1683), and the distinction is worth keeping:** the parked production nightly
  merged once `0.47.2`'s **apply** — not its cut — removed the reason it would be red nightly. **Run by
  hand on the branch BEFORE merging** (run 44216214331) and again on `main` after (44217829035).
  **A correction found in its own control run: the hold had TWO causes.** The dev job had failed that day
  as well, on seven STALE registry records, since trimmed from 19 to 12.
- **`#calsh` — the last known cross-shelter leak — is closed in substance, and only its read side is in
  flight.** Shipped today: `0409` (the credentials table), the sweep per shelter with a refusal rather
  than a fallback (#1690), `0410`'s `shelter_calendar_status()` for Admin (#1692), and
  `scripts/connect-shelter-calendar.mjs` with a test proving a second shelter cannot be pointed at
  Lanna's calendar (#1695). **Piece 3 (`calendar-per-shelter-readers`, port 3011) is set up and is the
  stream that can tick the item.**
- **`#cn7gk` still needs him to create a second Google account.** Expect it to stay open.

## FILED, TICKED AND CORRECTED

**Ticked today:** `#shtci`, `#lblcr`, `#ccwnx`, `#srreg`, `#ujqr5`, `#wr9qd`, `#globh`, `#mnchk`,
`#rpwrt`. **Filed:** `#wr9qd`, `#rpwrt`, `#mnchk` (from #1687's report), `#ukncl` (from #1693's).
**Amended:** `#calsh` with its three remaining pieces as one consolidated block and a title that says
what is open; `#ntrun` with the corrected remedy; `#cnrnt` closed as a duplicate pointer.

**TWO ITEMS WERE WRONG ABOUT THE ENVIRONMENT, AND BOTH WERE CAUGHT BY READING RATHER THAN BY A CHECK:**

1. **`#wr9qd` said adding the cron job *"turns production red until it has `0292`"*.**
   `check-scheduled-writers.mjs --env production`: **three jobs, all active, `purge-write-requests` among
   them**, and the same on dev; `--status` shows production at 408 applied with only `0408`/`0409`
   pending, so **`0292` is there.** The caveat was void in both databases, the band came down on the
   strength of it, and the stream ticked the item with the correction.
2. **`#ntrun`/`#cnrnt` named the wrong secret** — above.

**A THIRD, filed as `#ukncl`:** `check-scheduled-writers.mjs` lists `security definer` and trigger
functions only, so `purge-write-requests` reads `[UNKNOWN]` on both databases although #1693 established
it is `SECURITY INVOKER` and delete-only. **The output that found `#lblcr` now carries a permanent false
alarm**, which is how a real silent writer would survive the next sweep.

## THE SKILL GAINED AN AGREEMENT GATE, AND IT FIRED THE SAME DAY

**Lutan, 2026-11-18:** *"We seem to have missed agreeing to the daily plan and you didn't provide the
links when they were created to the streams."* Asked whether to fix the skill or merely record it, he
answered **"Yes, fix the skill"**. Shipped as PR #1685:

- **`(a0)`: no worktree is created until the batch has been agreed in that conversation, in an answer to
  a question naming those items.** A quoted agreement from an earlier plan agrees to that plan's items,
  and **`.plan-day.md` saying he agreed is not an agreement, because he cannot see that file.** Where the
  go-ahead is already in his message, **that IS the agreement and the planner does not ask twice** — the
  rule must not become a second gate on work he has just asked for.
- **`(d)`: the list carries a clickable `[slug](#local_…)` session link** for every stream whose session
  is open, read from `list_sessions`. **A path is not a link.**
- **Step 8 hands the links back the moment the sessions exist.**

**IT FIRED ON THE NEXT PLAN: presented first, answered *"Yes, all three batches"*, and only then was
anything created.** **One bullet was compressed to pay for the space**, because the file says anything
added comes out of something else.

## THREE NEAR-MISSES OF THE PLANNER'S OWN, RECORDED BECAUSE NONE WAS CAUGHT BY AN INSTRUMENT

1. **A ONE-LINE TAIL PRODUCED A FALSE CLAIM IN THE PLANNER'S OWN RECORD.** `worktree.mjs done` was read
   with `| tail -1`, which showed only its generic hint about dev servers, and *"worktrees cleared: all
   three"* was written into `.plan-day.md`. **They were not cleared: their Claude sessions were open, and
   the full output names the pid.** Corrected in place. **Read the whole output, not its last line** —
   the same rule the briefs carry about check scripts, now earned on the planner's own side for the
   second day running.
2. **A GREP HIT WAS NEARLY WRITTEN INTO A BRIEF AS A CORRECTION.** `0396_tenancy_unscoped_tables.sql`
   lists `calendar_sync_state` as a *"sync cursor"* among unscoped tables, and the planner was about to
   tell a stream *"the item is wrong; there is no `shelter_id` column"*. **Reading the file showed the
   opposite: `0396` ADDS the column** to all ten, with a `current_shelter_id()` default and a Lanna
   backfill. **The item was right.** **A grep hit is not a reading.**
3. **`free` PLUS "NO PR EVER" WAS REPORTED AS A VERDICT.** Three streams were described as *"never
   started"* minutes after he had opened all three sessions. **The columns were right and the conclusion
   was wrong**; it is now in the skill.

## PROCESS NOTES

- **A NETWORK WINDOW BROKE THREE UNRELATED THINGS INSIDE AN HOUR** (~01:15–02:10 UTC): `gh`'s GraphQL
  API, the Supabase Management API and a Google Fonts fetch inside a build. **One of them produced the
  day's worst near-accident:** `check-migration-numbers.mjs` lost its open-PR half to a TLS timeout,
  **printed its excuse in its first line and a verdict in its last**, and offered a `git mv` that would
  have collided with a sibling's live dev row and orphaned an applied `0409`. **Filed as `#mnchk` and
  fixed the same day (PR #1694): the skipped case now answers NOT CHECKED and offers no rename.** Every
  brief since says to treat a single red as suspect until re-run.
- **FOR THE NEXT RELEASE: apply `0408` to production BEFORE the Worker deploy.** Its `-- consumer:`
  header names `worker/translations.mjs`, `worker/index.mjs` and `src/lib/status/health.ts`; deployed
  first, production's Scheduled jobs tile reads red. **`0409` and `0410` are additive and empty on
  purpose.** The Pi and `--env production` remain his (`#pirow`).
- **MECHANISM A HAS NOT RECURRED. All fifteen streams posted their usage comments.** Two unexplained
  occurrences remain (#1636, #1647). **Do not re-investigate without a new occurrence.**
- **THE USAGE-COMMENT PRESENCE CHECK IS NOW 42 OF 42 AND HAS CAUGHT NOTHING. UNTESTED, NEVER WORKING.**
- **PREFLIGHT: everything a planner needs is reachable. Production was read twice, read-only** (migration
  status and the live cron catalogue), and both readings are quoted into the items they corrected.

## WHAT IS LEFT FOR CLAUDE AT ALL

**Thinner than this morning, because Part 5 closed and six instrument items were filed, four of which
shipped.** Open and buildable: **`#calsh` piece 3** (set up, port 3011), **`#ukncl`**, and whatever the
readers stream reports. **Everything else is his hands** (`#rqv5c`, `#civwx`, `#kxksr`, `#gvnrr`,
`#aaqtl`, `#mzu7v`, `#z04wr`, `#chpap`, `#s0jgi`, `#1o5tk`, the three go-live website steps, `#ntrun`'s
secret, `#cn7gk`'s second account, `#pirow`'s Pi), **parked by his own answer** (`#00e3u`, `#vkswg`,
`#el9zw`), **waiting on data** (`#9b0vq`), **held** (`#egq18`), **blocked** (`#34a30`) or **frozen**
(`#3qmzt`). **`#pl7aq`, the public launch, is a date he names: offered once, not chosen, and not to be
re-asked.**

## INTERRUPTIONS

**THREE, all costs of the briefing process and none of any stream.** (1) His two process faults, raised
in one answer and fixed in the skill. (2) *"can you help calendar per shelter schema, it is stuck with
migration numbers"* — a stream blocked by an instrument, and the planner's own two-carriers-no-order
defect is why. (3) *"where are we up to"*, mid-task. **No stream was corrected, rescoped or stopped.**
