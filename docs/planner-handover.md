# Planner handover — edition `750`, 2026-11-15

**This is a DELTA against `749`.** It says what changed, corrects its predecessor, and reports what each of
`749`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** It reports **`749`'s plan's three measured streams**, read
this morning in one slot, and **carries NO figures from its own six** — those are read at the next plan's
first batch and reported by this edition's successor. **That is the delta model working as designed, not a gap.**
`749`'s plan had five streams but **only three ever ran** — its batch 2 was set up and never opened and
**became THIS plan's batch 1** — so **three rows is the complete set, not a short one.**

**WHY IT EXISTS.** `749`'s plan was complete at 5 of 5; this plan was built from scratch, agreed in one
answer (*"All five, as listed"*), **ran six streams rather than five**, and **both its batches plus an
unplanned fourth stream were set up inside one chat** — the third edition in a row written from the chat
that planned it.

---

## THE LEAD: THE PLANNER PASTED A STALE COUNT INTO A BRIEF FOR THE SECOND DAY RUNNING, AND STEP ZERO CAUGHT IT AGAIN

`749` recorded this as a one-off: a *"9 probe faults out of 385 boxes"* figure pasted into
`receipt-probe-fixture`'s brief hours after #1583 had cleared it. **It is not a one-off. It happened again
today, in a different brief, on a different kind of figure.**

`admin-nav-reachability`'s brief asserted **nine pages unreachable for Admin**. PR #1596's step zero
re-measured and found:

- **Seven of the nine really were unreachable.**
- **Two were not** — `/appointments` is in the nav pane, and `/suppliers`'s list is already a hub tile.
- **Two MORE existed that the brief never named** — `/memes` and `/reels`.

**The count was wrong in both directions.** Nine was right only by coincidence.

**What this says, and it is not "the planner is careless":** both defects are the same shape — **a count
read once, written into prose, and then pasted into a brief later as though it were a fact.**
`CLAUDE.md`'s rule already covers it (*"a count, a conclusion or a prior pass has a CLOCK on it"*), and
`749`'s owed item 7 restated it. **Restating it did not work. It was broken the next day.**

**The mitigation that DID work, both times, is step zero** — and in both cases the stream re-measured,
corrected the brief and carried on without asking anybody. **So the instrument is sound and the practice
is not.** The practical rule for your plan: **when a brief needs a count, re-run the thing that produces
it in the same turn you write the brief, or write "the planner has not re-measured this — establish it at
step zero" and say so plainly.** A figure with no timestamp beside it is the fault.

**AND THE STREAM BUILT THE INSTRUMENT THAT WOULD HAVE CAUGHT IT.** #1596 added
`scripts/check-section-hubs.mjs` — **10 missing before, 0 after** — and wired it into the blocking
`hard-coded-security` CI job. **Deliberately NOT a change to `check-menu-coverage.mjs`**, whose subject is
one card. **So this particular count is now machine-checked and must never be pasted from prose again.**

---

## THE FLOOR MOVED AGAIN, AND THE SKILL'S BAND TABLE IS NOW ~21k STALE

`749` corrected `747`'s *"the floor is a constant of the harness"* down to *"starting together buys the
same BAND of floor, roughly ±500, not the same figure"*. **That correction holds. What has changed is the
figure itself.**

| slug | model / effort | band | tokens | messages | floor | verdict |
|---|---|---|---|---|---|---|
| `domain-tenancy-hostnames` | sonnet-5-5 / low | 140-180k | 145,297 | 58,312 | **86,985** | inside, low end |
| `merch-photo-upload` | sonnet-5-5 / low | 170-215k | 183,854 | 97,528 | **86,326** | inside |
| `receipt-probe-fixture` | sonnet-5-5 / low | 110-150k | 145,264 | 59,226 | **86,038** | inside, near the top |

**All three are valid readings** — `compacted=no rescoped=no finished=yes`, and each one's `model=`/`effort=`
matches the `@dials` on its own `band=`. **Three for three inside band.**

**The floor is 86.0–87.0k, and the three readings span 947 tokens** — tight enough to be a real floor
rather than noise, and consistent with `749`'s ±500-per-cohort correction (these three started within a
minute of each other).

**`SKILL.md`'s band table still says *"~107–111k on 2026-11-08"*. That is ~21k above what was measured
today, and EVERY band in that table was built on it.** So every band is carrying about 21k of fat.

**Do NOT re-band off one day's reading** — one cohort is one cohort. **Re-derive the floor from your own
plan's complete set first; if it lands near 86–87k again, that is two sets agreeing and `SKILL.md` should
be edited** rather than noted in a tenth handover. **Recorded, not yet applied.**

---

## WHAT IN `749` IS SUPERSEDED, AND WHAT ITS OWED ITEMS DID

- **Owed 1 — production four migrations behind: UNCHANGED, and it got MORE consequential.** `0375`,
  `0377`, `0378`, `0379` are on dev and not on production. **`0377` creates the bucket that this plan's
  retention job needs**, so #1597's daily clean-up **cannot run on production at all** until it is applied
  and the Worker is deployed. **Still his and the release manager's. Never brief a feature stream to do
  it.** See the owed list below — it is still the most consequential line in this file.
- **Owed 2 — measure `749`'s streams: DONE**, and the three rows are above. Two of its five never ran and
  became this plan's batch 1, as explained at the top.
- **Owed 3 — put `#j4m8w`'s (a) to him: DONE, AND ANSWERED. SUPERSEDED.** He chose *"2 & 3 combined with 1
  available"*. `docs/decisions/2026-11-14-cooperjaidee-hostnames.md` was rewritten from RECOMMENDATION to
  DECIDED with its "why this is his" section marked superseded in place, `#j4m8w` is ticked and retitled,
  and **a note was added to `#ykefa`** so the tenancy build starts from the answer instead of rediscovering
  the question. PR #1594. **Do not put any part of (a) to him again.**
- **Owed 4 — `#x5tbv` waits on his secret: DONE, SHIPPED, AND THE ITEM IS CLOSED.** He added
  `SUPABASE_ACCESS_TOKEN` on 2026-11-15 and the stream shipped the same afternoon (PR #1598).
- **Owed 5 — three fresh items with evidence written in:** `#k7vnd` and (via this plan's batch 2)
  `#w9xpq` and `#8t3rk` are all now streams. `#k7vnd` is ticked.
- **Owed 6 — clear the leftovers: DONE**, including one by hand. `worktree.mjs done` refused
  `merch-photo-upload` with *"5 commit(s) that no branch on origin has"* and offered to push the branch
  back. **That remedy was not taken** — pushing would have re-created a branch GitHub had squash-merged
  and deleted. Instead: `git diff origin/main <branch> -- src worker supabase scripts` showed the only
  differences were two `scripts/` files where **`main` has MORE**, and `src/app/api/merch/photos/route.ts`
  is present on `origin/main`. Nothing unique was on the branch, so it went by hand. **Verify the same way
  before repeating this; the guard is right by default.**
- **Owed 7 — re-read any count before pasting it: BROKEN AGAIN.** See the lead.

---

## A MITIGATION WRITTEN AS A NUMBERED DELIVERABLE FIRED, AND THE ANSWER WAS "NOT NEEDED"

`749` left the rule that **a mitigation in a brief is a HYPOTHESIS, to be checked next round.** Two were
written into this plan's briefs as numbered deliverables rather than prose. **Both outcomes, because an
untested mitigation recorded as a success is the fault that rule exists for:**

1. **`tenancy-lint-schedule`'s `read_only` caveat — FIRED, AND DISPROVED THE RISK.** The brief warned that
   `check-tenancy-catalogue.mjs` POSTs its `select`s **without `read_only: true`**, that Supabase documents
   the endpoint as taking `database_read` **or** `database_write`, and that a Read-only token might
   therefore be refused — with the remedy (send the flag) and an explicit ban on asking Lutan to widen the
   token. **#1598 reports: `read_only` was NOT needed.** The run succeeded with the dev-only
   `Database: Read` token. **So record this as measured: a plain `select` through
   `/v1/projects/<ref>/database/query` is accepted by a `database_read`-scoped token with no flag.** Nobody
   needs to widen a token for the catalogue lint, and nobody needs to re-derive this.
2. **`places-probe-fixture`'s dated-figures warning — NOT EXERCISED.** #1595's step zero found the gap
   exactly as the brief described, so the warning had nothing to catch. **Not evidence it works: still a
   hypothesis.**

---

## WHAT THIS PLAN SHIPPED, IN ONE LINE EACH

Read the PR bodies for the detail; these are the lines a planner needs.

- **#1594** — his hostname decision recorded; `#j4m8w` closed.
- **#1595** (`#k7vnd`) — a `community_places` fixture row and a `community.outings` read probe. **392 boxes, 0 FAULT, probes 1630 → 1645.**
- **#1596** (`#fc7te`) — nine hub tiles, each gated `canOpen(perms, routeFor(path))`, **Admin given no cards**, plus the new `check-section-hubs.mjs` in the blocking CI job. **One-card login NOT driven — `pending` in its plan.**
- **#1597** (`#6rkux`) — a daily Worker job removing report photos expired (closed over 90 days, by `handled_at`) or orphaned, with a **one-hour grace**, bounded at 500 rows and 2,000 objects. Proved on dev. **No card, no policy, no new secret.** It rejected GitHub Actions (a production service-role key in a public repo) and `pg_cron` (migration plus Storage credentials) — **both judgements worth keeping.**
- **#1598** (`#x5tbv`) — `.github/workflows/tenancy-catalogue.yml`, daily **05:43 UTC**, strict, `--tenant-role rls_definer`. **0 flagged with the tenant role; 105 flagged and exit 1 without one**, which is how we know it can go red.

---

## FINDINGS FROM THE PR BODIES THAT NO ITEM OWNS — read these before you plan

**A stream can report; only the planner can file.** Three things came out of this plan's PRs and are
recorded here rather than filed, each with the reason:

1. **`handled_at` is reset by a database trigger on every status change** (#1597). So *"closed for 90
   days"* is measured from the **last change of status**, not from first closure — a report reopened and
   re-closed restarts the clock, and its photo is kept longer. The stream judged this *"nothing to file"*
   and that is defensible: it is arguably the correct behaviour. **It is written here because it is a
   semantic caveat on a retention promise, and the next person to reason about the 90 days should not have
   to find the trigger themselves.** **Decide whether it earns an item; do not assume the stream was
   wrong.**
2. **Two pre-existing non-clean probe results, identical before and after #1595**: one `WRONG` and one
   `STICKY`. **The PR names them by role, and that is not a finding in this project's terms** — all
   analysis is by CARD, because roles are a transient grouping that will be rebuilt. **Before filing
   anything, restate them as the CARD that carries the behaviour** (`suppliers.directory` and
   `recurring.do_own` are the activities). **A count per role measures nothing durable.**
3. **#1598's release-procedure overlap was left to you.** It kept `docs/release-procedure.md` §5's by-hand
   lint run and updated one clause, and says explicitly that whether the nightly makes the release step
   redundant is the planner's judgement. **The nightly proves dev; a release is deployed from a known
   commit. They are not the same proof.** My reading is that both stay — but it is yours to settle.

**AND ONE THING TO WATCH RATHER THAN FILE:** #1598's real run was proved with a **temporary push
trigger**, removed afterwards, because `workflow_dispatch` needs the file on `main`. **So the nightly's
first genuinely scheduled run is 05:43 UTC on 2026-11-16 and has not happened yet.** Check it ran.

---

## HIS DECISIONS TODAY, AND WHAT THEY ARE NOT

- **`#j4m8w` (a):** *"I'll go with your recommendation of 2 & 3 combined with 1 available"*. Recorded in
  three places.
- **`#k2vrj`:** *"Yes, show them"* — fostered residents' approved updates appear on the public website.
  **Today's behaviour is now the ruling**, `0343` stays as it is, and the item's view-change sketch is
  marked `SUPERSEDED` in place. **DO NOT ADD A PLACEMENT-TYPE CONDITION.**
- **`SUPABASE_ACCESS_TOKEN`:** added, and **scoped deliberately narrowly** — the one dev project
  (`qxkmhwybjggxvsfxsxbd`), `Database: Read`, all ten other database permissions at No access, and
  **organisation scope declined so it cannot see production.** **Never widen it, and never ask him to.**
  #1598 proved the narrow scope is sufficient.
- **A fourth live stream, mid-day:** asked whether `tenancy-lint-schedule` should go in now as a fourth or
  wait for batch 2, he said *"Set it up now"*. **Four at once is one more than `CLAUDE.md`'s two-or-three,
  and it was his call, not a drift.** All four merged the same day, so nothing was lost to it — **but the
  reason for the limit is unchanged: merging is the bottleneck.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 6 of 6 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** Plans have run two and three
to a date before; another on 2026-11-15 is a normal thing to be. **Never derive today's date from a
document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Eight editions have now recorded that as the fix for an interruption.

**WHAT IS OWED:**

1. **PRODUCTION IS FOUR MIGRATIONS BEHIND** — `#w2knt`, and it is still the most consequential line here.
   `0375` re-owns 90 objects and the failure mode is a **blank public website**. `0377` creates the
   report-photo bucket, **so this plan's daily retention job does not run on production at all** until it
   is applied and the Worker is deployed. **His and the release manager's. Never brief a feature stream to
   do it.**
2. **MEASURE THIS PLAN'S SIX AT YOUR FIRST BATCH, and they are not in this edition on purpose.** Read
   `stream-usage:` from **#1595, #1596, #1597, #1598** and batch 2's two PRs. **They cannot expire** —
   `gh pr view <n> --json comments` reads them from a merged PR whose worktree is long gone. **Then
   re-derive the floor, and see the band-table section above: if it lands near 86–87k again, revise
   `SKILL.md`.**
3. **BATCH 2 IS LIVE AS THIS IS WRITTEN:** `merch-photo-visibility` (3002, `#w9xpq`, carries one migration,
   gated on `merch.manage`) and `report-form-rate-limit` (3003, `#8t3rk`, mostly reading; its deliverable
   may legitimately be a recommendation for his own Cloudflare account). **Check whether they merged before
   you plan anything.**
4. **`#ykefa` IS HELD ON ITS OWN CONDITION, AND THAT IS THE NEW REASONING TO KEEP.** The item defers the
   tenancy programme *"until Lanna is live"*, and `#pl7aq` records that `lannacareforanimals.org` still
   shows "under construction" to the public. **The condition is unmet.** The hostnames piece shipped and
   closed. **Do not slice another piece off it without putting it to him:** ≈50 hours, with object counts
   **40% larger** than the spike priced.
5. **`#00e3u` IS HELD FOR THE ITEM'S OWN REASON, not the planner's.** It says what the accountant needs
   for Thai tax is **not established** and instructs *"Ask the Director and the accountant; do not infer it
   from the screens we happen to have."* `#99zuk` is that conversation and he is carrying it to Chiang Mai
   in person. **The receipt list is the part that looks buildable and is exactly the part the e-Donation
   question lands on.** It was 4th on his priorities list and still held — **say so when you present,
   rather than leaving it off.**
6. **RESTATE THE COUNT RULE AS AN INSTRUMENT, NOT A SENTENCE.** See the lead: it has now been written into
   two consecutive handovers and broken on both days. **The one count that mattered most is now
   machine-checked (`check-section-hubs.mjs`).** Prefer doing that to writing it a third time.
7. **CLEAR THE LEFTOVERS, AFTER YOUR LIST.** At this edition's writing, batch 1's four merged folders were
   being cleared: `admin-nav-reachability`, `places-probe-fixture`, `report-photo-retention`,
   `tenancy-lint-schedule`, plus `handover-750` once this merges. **Read the `state` column before
   believing `ahead`** — a squash-merged branch stays ahead for ever.
8. **`#7bd5u` STILL CANNOT BE MEASURED WHILE STREAMS BUILD.** Lighthouse moves 12–17 points with machine
   load on this machine. It needs a quiet window, which means it is never a parallel stream.

**Do NOT re-ask him about:** `#j4m8w`'s hostname meaning (answered today); `#k2vrj`'s fostered updates
(*"Yes, show them"*); the `SUPABASE_ACCESS_TOKEN` scope (set deliberately narrow, and proved sufficient);
`#x5tbv` (shipped); the product name or which TLD; the anonymous photo upload (*"Yes, build it
properly"*); whether staff may add a currency; `donation.receipt`'s shape (yes/no, #1585); the
adopter-portal exception; `test-plan` being advisory; merging a green PR; the Thai read's cadence; **the
90-day retention figure** (it is the decision file's own starting point, and a stream may change it with a
reason); or anything on `749`'s, `748`'s and `747`'s do-not-re-ask lists.
