# Planner handover — edition `774`, 2026-11-26

**This is a DELTA against `773`.** It says what changed, corrects its predecessor, and reports what `773`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS TWENTY-FOUR STREAMS, NOT NINE, ACROSS FOUR DAYS AND FIVE PLANS — AND EVERY ONE HAS A FIGURE.**
`onboarding-runbook` (#1866), `product-console-build` (#1867), `product-pages-five` (#1868),
`shelter-name-columns` (#1869), `drive-reconnect-guard` (#1870), `proof-line-run` (#1871),
`platform-own-signin` (#1872), `console-shelter-access` (#1873), `console-host-live` (#1874),
`proof-line-who` (#1875), `audit-outsider-change` (#1876), `website-lock-truth` (#1879),
`tenancy-catalogue-seven` (#1880), `my-shelters-blank` (#1881), `migration-check-docs` (#1883),
`product-site-language` (#1884), `product-content-schema` (#1885), `product-content-console` (#1886),
`product-site-finish` (#1887), `platform-step-up` (#1888), `shelter-membership-schema` (#1889),
`tenancy-catalogue-gate` (#1891), `instrument-accuracy` (#1892), `shelter-membership-console` (#1893).

**WHY FIFTEEN OVERDUE, STATED PLAINLY RATHER THAN APOLOGISED FOR: Lutan was offered this edition three
times and said no each time, while mid-release or mid-batch.** He asked for it on the fourth. **The rule
is nine; the practice was his judgement, and his judgement cost nothing** — every figure survived on its
PR, which is exactly what that mechanism is for. **Do not read the backlog of editions as lost data.**
The counter resets to 0 when this PR merges.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, ~90 lines, the twenty-ninth plan. **All four of its streams
   are set up; three merged, one (`dev-migration-0422`, port 3001) is live.** When it merges, the next
   `/plan-day` re-plans from scratch — nothing is pending.
2. **`gh pr list --state open` BEFORE you believe anything here.** On 2026-11-26 three streams went from
   set up to merged in 72 minutes.
3. **THREE MERGED WORKTREES NEED CLEARING** (`tenancy-catalogue-gate`, `instrument-accuracy`,
   `shelter-membership-console`), all `HELD` by Lutan's own sessions — `done` refused all three, correctly.
   **773's fourteen are gone.** Every figure is read and recorded. **Ask; do not force.**
4. **`0.49.2` SHIPPED.** Production runs `0.49.2` @ `5344c037a`.
5. **PRODUCTION'S SIGN-IN NOW RESOLVES ON `cooperjaidee.org`**, not on a shelter's domain. Read below
   before telling anyone otherwise.

## THE BAND FINDING OF THESE FOUR DAYS, AND IT IS WORTH MORE THAN THE TABLE

**`product-console-build` (#1867) was banded 300–370k and came in at 195k — 105k under, the largest miss
ever recorded here. The cause is in its own PR body and it is not subtle: most of what the band priced
had already shipped.** Half its deliverables read *"already on main (#1789); not redone"*. **The planner
banded THE ITEM; the stream built THE GAP.**

**THE RULE THAT FALLS OUT OF IT, AND IT IS CHEAP TO OBEY: band what is MISSING, not what the item
describes, and the one-minute check is `git log` / `ls` on the surface the item names.** `773` already
recorded the mirror of this (*"check the SCHEMA before planning a schema stream"*, `#wbopn`); **this is
the same fault on a UI surface and it cost 105k of forecast.** The brief's own step zero caught it, which
is the system working — but a band that wrong makes every forecast built on it meaningless.

### The spread, 22 usable readings of 24

**14 inside · 6 over · 2 under.** Not readings: **#1872 `platform-own-signin` (`finished=blocked`)** and
**#1880 `tenancy-catalogue-seven` (`rescoped=yes`)**. Dials matched the brief on all 24.

**The six overs: `audit-outsider-change` +9k · `my-shelters-blank` +12k · `product-content-schema` +15k ·
`product-site-finish` +2k · `shelter-membership-schema` +10k · `onboarding-runbook` +0.8k (marginal).**
**The two unders: `product-console-build` -105k · `product-site-language` -0.7k (marginal).**

**A HYPOTHESIS WAS WRITTEN ON 2026-11-26 AND DID NOT FIRE THE SAME DAY. BOTH HALVES ARE RECORDED HERE
BECAUSE HALF OF THEM WOULD BE A LIE.** From the nine-stream set of 2026-11-25 (4 inside, 4 over, none
under) the planner wrote: *a band whose paragraph NAMES an open design question carries +10–15k, because
naming an unknown is not pricing it.* **Every one of those four overs fitted it.** **Then the next three
streams — two of them naming an open design question, none carrying the premium — all landed inside.**
**So: keep it as a hypothesis, apply it to nothing yet, and look again after the next complete set.**
Three streams is not a refutation of eight, and eight is not a law.

### The floor — 24 readings, 87.8k to 92.6k

Unchanged in place from `773`'s 89.4–93.5k, a little wider at the bottom. **FOUR exact repeats in one
set** — `89,422` (#1867, #1868), `88,522` (#1879, #1880), `90,886` (#1887, #1889), `91,048` (#1891,
#1893) — **the repeat phenomenon still recurring; `773` recorded it on its fifth day. Record it; offer no cause.** Re-derive from the
next complete set. **Do not shift the scale rows to match the floor** (the `773` and `772` warning
stands).

## WHAT `773` LEFT OWED — ALL FOUR SETTLED

1. **The `scheduled_writer_runs` read — RETIRED, 2026-11-26, after four editions.** `773` said *"file it
   or write down why not"*. **Nobody across four editions has been able to say what it was for, which is
   the answer.** It is not carried into `775`. **If it mattered, it will come back as a symptom; an
   instruction nobody understands is not a safeguard.**
2. **Clearing merged worktrees** — **DONE.** Fourteen cleared; three new ones now held (above).
3. **`#rlprg`'s drivable proofs** — not advanced; still owed, now by whoever plans `#rlprg` next.
4. **`#prvln`'s second half — BUILT, and `773` IS WRONG ON THIS PAGE.** `773` says it is *"PARKED — raise
   it once, when he is not mid-release"*. He was asked once, said **"Yes, into batch 2"**, and
   `proof-line-run` (#1871) shipped it the same afternoon. **A handover that tells you something is parked
   is a statement with a date on it.**

## THE GUIDED SESSION ON HIS OWN ITEMS — THREE ITEMS, AND TWO WERE NOT HIS

**This is `773`'s lesson (*"the item is not the record"*) paying for itself, with the measurement run
BEFORE he was asked each time.**

- **`#plsso` — DONE, the part that was his.** He changed production's Supabase Site URL to
  `https://cooperjaidee.org`; `check-deployed-hosts.mjs --env production` read it back live. **The risk
  the item named was measured first:** not one of production's own mailer templates uses `{{ .SiteURL }}`,
  so no shelter user's mail could be affected. **Still open: the UAT rehearsal with Lanna's host
  unreachable.**
- **`#rqv5c` — NOT HIS, AND THE ITEM WAS ASKING HIM FOR FINISHED WORK.** Its header listed a UAT rehearsal
  as owed; **that rehearsal ran on 2026-11-23, 912/912 files**, and the item's own body said so. **Worse,
  it never named the real blocker: `scripts/drive-move-to-shelter-account.mjs:92` REFUSES
  `--env production` outright, with no override.** His "production run" is **unbuilt work**, not a press.
- **`#hstau` — WAS HIS, IS NOW A STREAM'S.** He created the Cloudflare token; both UAT secrets
  (`CLOUDFLARE_WORKERS_DOMAIN_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are set and read back. **Retagged
  `buildable`.** **Half of what the item called missing was never missing** — `wrangler whoami` prints the
  account id, and nobody need be asked for it.

**THE PATTERN ACROSS ALL THREE: an item that says a step is his is a CLAIM, and two of three were false.**
`#prvln`'s proof lines exist precisely so this check is one command. **Run them. The cost of not running
one is an interruption; the cost of running one is a minute.**

## THREE LESSONS EARNED, EACH FROM A REAL COST

- **TELLING HIM WHERE TO CLICK FROM MEMORY IS GUESSING. OPEN THE PAGE.** A set of written directions for
  the Supabase dashboard drew *"your instructions are very poor, please be more precise"*. **Opening the
  page in his Chrome and describing what is actually on it took under a minute and ended the problem.**
  For any step of his that lives in a web page, **look at the page first and send him a picture of it.**
- **A COMMAND HANDED TO HIM IS PART OF THE DELIVERABLE, AND `npx` IS NOT `npx.cmd` ON THIS MACHINE.**
  PowerShell's execution policy refuses `npx`; the session memory already said so and the planner still
  wrote `npx`. **Read the command you are about to hand over as if you were the one typing it.**
- **A REFUSAL IS NOT ALWAYS A FAULT, AND SOMETIMES IT IS THE WHOLE FINDING.** `worktree.mjs done` refusing
  three held folders is correct behaviour. So is `drive-move-to-shelter-account.mjs` refusing production.
  **The second was mistaken for a waiting step for four days.**

## ONE BRIEF WORTH COPYING, AND WHY

**`dev-migration-0422` (live, port 3001) is briefed to DISAGREE with its own item.** `#d422o` says dev
carries an un-reverted migration from an abandoned branch and prescribes a down-migration. **It is a
renumbered file whose old row was left behind** — `0423_keep_an_admin_per_shelter.sql` is on `main` and
commit `fb16692ed` says *"Renumber the last-Admin guard fix to 0423: #1746 took 0422"*. **Following the
item would have dropped the last-Admin guard on dev and broken `dev-signin.mjs` for every other stream.**
The brief hands that over **as evidence to test, not as an instruction**, and tells the stream to stop and
say so if the database disagrees. **That framing is the point: a brief that asserts gets obeyed, including
when it is wrong.**

## STILL OWED

1. **Clearing three merged worktrees**, on his word.
2. **`#rqv5c`'s production path for the Drive move script** — buildable, unbriefed, and it blocks the
   Director's consent and his run.
3. **`#plsso`'s UAT rehearsal** — his environment, and the item's last clause.
4. **`#rlprg`'s two drivable proofs** and its phone clause.
5. **The release handover is STALE** — `check-release-handover.mjs` says it does not name `0.49.2`. **The
   release manager's, not the planner's.**
6. **One question of his, unanswered since 2026-11-25:** whether he wants to use a shelter as ordinary
   staff would, which today needs a separate login. **`shelter-membership-console` (#1893) has since
   merged — read what it built before putting it to him again.**
