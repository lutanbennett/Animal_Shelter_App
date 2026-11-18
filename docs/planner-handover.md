# Planner handover — edition `762`, 2026-11-18

**This is a DELTA against `761`.** It says what changed, corrects its predecessor, corrects itself, and
reports what `761` left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE EIGHT STREAMS MERGED SINCE `761`, AND ALL EIGHT HAVE FIGURES:** #1698, #1699, #1700,
#1701, #1702, #1703, #1704, #1705. **Three more were set up and had not merged when this was written** —
`shelter-management-app`, `canary-isolates-protection`, `writer-runs-lint-flag` — **so their figures
belong to `763`.** **It was written at 8 of 9 rather than 9, because Lutan asked for it early.**

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** It is gitignored and holds the seventh plan of the day in full.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **`node scripts/worktree.mjs list` will show THREE HELD FOLDERS** (`tenancy-canary-red`,
   `shelter-management-schema`, `onboarding-runbook-steps`) **plus the live ones.** The held three are
   finished, merged and measured; **their sessions are open, so `done` refuses them and `--stop-servers`
   will not help.** Closing those sessions is Lutan's; then one `done` each, or `/clean-streams`.
4. **Read the repository AFTER the pull, not before.**
5. **THE HANDOVER CADENCE CHANGED TODAY AND IT IS THE FIRST THING TO UNDERSTAND** — next section.

## THE CADENCE IS NOW NINE MERGED STREAMS, NOT ONE PER PLAN

**Lutan, 2026-11-18:** *"this process is getting ridiculuous, why would we want to write a handover after
just one stream. we should have 3 batches of 3 streams between handovers"*, then, asked whether the unit
is streams or batches: *"so the rule is 9 streams irrelevent of batches"*.

**Shipped as PR #1702.** `SKILL.md` now carries **two counters** — the plan's own progress, and
`Streams merged since handover <slug>: <n> of 9` — and **a plan finishing is no longer a trigger.** One
stream, one PR, one count; an unplanned stream that shipped a PR counts in; a stream counts even if its
figure is `unmeasured` or excluded. A release's own two PRs, the handover's PR and bot PRs do not.

**WHY THE OLD RULE WAS A DEFECT AND NOT A PREFERENCE, AND IT IS THE PART WORTH KEEPING:** *"One plan is
one handover"* fought rule 7 (*"Nine is a target, not a quota"*) — a thin backlog makes a small plan, and
a small plan then demanded a handover. **The cadence has only ever been sane because HE SUPPRESSED IT BY
HAND:** `761` covered two plans and twelve streams because he answered *"Not yet"* twice. **A process
that depends on the user declining it is broken.** Counting batches would have been the same mistake in
another unit: a batch has been anything from one stream to three.

**A FRESH CHAT RECOVERS THE COUNT FROM THIS SECTION:** the eight PRs named in the opening lines are
covered; count merged stream PRs after them with `gh pr list`.

## THE ONE FAULT THAT HAPPENED THREE TIMES TODAY, AND ALL THREE WERE THE PLANNER'S

**Lutan caught two of them:** *"Try again"* when the open-item count rose after an item was ticked, and
*"you are making false claiims again without checking the status"*.

**THE SHAPE, STATED ONCE PROPERLY: an instrument answered honestly and its answer was read as being
about something else.**

1. **`check-backlog-sections.mjs` with no argument reads `../docs/backlog.md` RESOLVED FROM THE SCRIPT'S
   OWN LOCATION** — the main checkout. **Run from the backlog worktree it validates a file you did not
   edit.** Three runs were read as confirming an edit they never saw. **`CLAUDE.md` says so in brackets
   and it was read past three times.** **Pass the path, or `--staged`.**
2. **The canary's HEADER COMMENT** (*"the item's own proof … is owed at Part 5"*) was read as the current
   state — **six lines below a usage line advertising `--prove-red`, which exists, is implemented, and
   had been run red on 2026-11-16.** `#cnred` was filed on that misreading and corrected by its own filer
   before a stream read it.
3. **The skill file on disk was read as proof that a PR had merged**, instead of asking `gh`. The
   inference happened to be right, **which is what makes it dangerous: a method that is wrong but lucky
   teaches nothing.**

**AND A FOURTH OF THE SAME FAMILY: THE PLANNER'S OWN ARITHMETIC IS NOT EVIDENCE.** The open-item count
was reconciled by reasoning three times and was wrong three times; **one `comm` of the two id lists
settled it immediately.** **Extend the project's own rule — *a count without its database is not a
reading* — to: a check is not a check unless you know which file it read, and a comment is not a
status.**

## THE LEAK CANARY RAN FOR THE FIRST TIME, AND THEN TOLD US WHAT IT DOES NOT PROVE

**`#ntrun` IS DONE.** Lutan created a **scoped** Supabase token (dev project only, Database read-write,
nothing else) as `SUPABASE_CANARY_TOKEN`; the planner confirmed the name, dispatched the workflow and
read the log. **Run 44269601418, success, 08:44 UTC — the first successful run it has ever had.** It did
not pass vacuously: it planted a second shelter's `residents` and `attachments` rows, read **23
anon-reachable objects** as `anon`, made one cross-tenant call, found **`0 new leak finding(s)`**, and
rolled back. **One scheduled 06:11 UTC run is still unproven** — this was a `workflow_dispatch` — so if a
nightly run is red while the dispatch was green, **the fault is the schedule, not the token.**

**THEN PR #1703 ADDED `--prove-red drop-restrictive`, PROVED IT RED (`residents … 19 -> 20`), AND
REPORTED SOMETHING IT WAS NOT ASKED FOR:** *"`leak-table` (restrictive policy left in) also exits 1, so
the canary session likely passes `is_trusted_caller()` and this run does not isolate the restrictive
policy as the protection."* **`0392`'s policies read `is_trusted_caller() or shelter_id =
current_shelter_id()`, so a trusted caller is let through whether or not the per-shelter clause works.**

**SO THE INSTRUMENT IS PROVED SENSITIVE AND NOT PROVED TO BE TESTING WHAT WE THINK IT TESTS.** Filed as
**`#cniso`** and briefed. **Its `drop-restrictive` mode also has to grant `anon` SELECT and add a
permissive policy, because `anon` holds no grant on `residents`** — so even that proof reads *"dropped
AND grant present"*, and the stream said so rather than claiming more. **That honesty is the most
valuable thing any stream produced today.**

## FIGURES — EIGHT, AND NOT ONE OVERRAN

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `calendar-per-shelter-readers` | #1698 | 160-200k | **218,782** | **NOT A BAND READING — `rescoped=yes`** |
| `next-security-upgrade` | #1699 | 145-185k | **142,142** | **under by 2,858** |
| `scheduled-writers-classify` | #1700 | 145-175k | **147,705** | **inside** |
| `plan-day-band-floors` | #1701 | 145-165k | **137,674** | **under by 7,326** |
| `plan-day-handover-cadence` | #1702 | 130-165k | **138,025** | **inside** |
| `tenancy-canary-red` | #1703 | 140-170k | **143,116** | **inside** |
| `shelter-management-schema` | #1704 | 170-210k | **166,033** | **under by 3,967** |
| `onboarding-runbook-steps` | #1705 | 160-200k | **189,723** | **inside** |

**Seven valid readings: four inside, three under, NONE over.** Contrast `761`, where five of twelve
overran. **#1698 is excluded on its own report (`rescoped=yes`), and nothing in the planner's record says
what the rescope was** — worth one question if anyone talks to that session, not worth guessing.

**ONE READING NUANCE THAT WOULD OTHERWISE LOSE FIGURES: the comment prints `model=claude-sonnet-5-5`
while the band says `@sonnet-5-5`.** That is the full model id against the short name, **not a dials
mismatch.** The figures count.

**THE FLOOR, EIGHT FIGURES: 86,514 · 86,738 · 86,759 · 86,983 · 87,238 · 87,462 · 87,771 · 90,127.**
**`SKILL.md`'s `~86–90k` row still describes the data**, with a new low at 86,514 and the top edge at
90,127. **No edit owed, and the scale rows are still not to be shifted with it.**

## THE BAND TABLE WAS CHANGED ONCE TODAY AND IS STILL WRONG AT THE BOTTOM

**PR #1701 raised `Quick win` to 143-170k and `Schema PR, nothing left to discover` to 143-165k**, on
sixteen figures and sound reasoning: nothing had ever come in under 143,281, and the basis is one bullet
in `reference.md` with `SKILL.md` gaining zero lines.

**AND THEN ITS OWN FIGURE CAME IN AT 137,674 — THE LOWEST OF THE DAY — AND TWO MORE FOLLOWED BELOW
143k:** #1702 at 138,025 and #1699 at 142,142. **The claim that *"a real PR's floor plus its own
bookkeeping costs about 145-155k before the work starts"* is false as a lower bound**, and it was built
from streams doing more substantive work than these three.

**THE RECOMMENDATION, AND IT IS DELIBERATELY NOT AN EDIT: those two bottoms belong nearer 135k.** It was
not edited **because two changes to the same two rows in one day is thrashing**, and the second would be
made from the same kind of reasoning that produced the first. **Three readings against sixteen; weigh it,
do not assume it.**

**AND ONE PREMIUM NEEDS RESTATING RATHER THAN SHAVING.** #1704 came in **under** a band carrying the
*"+30k of proof"* a permissions schema PR is charged. **The proof was cheap because the access design was
settled by him in two sentences before the brief was written.** **So that premium is about UNSETTLED
permissions, not about permissions.**

## PART 12: ROUTE (b) IS DEAD, ESTABLISHED WITHOUT TOUCHING CLOUDFLARE

**Lutan agreed to the throwaway `workers.dev` probe. Reading the render path first ruled it out, and
nothing was created in his account.** Three independent reasons, all on `#egq18`:

1. **`worker/shelter.mjs`'s `resolveShelter` needs `SUPABASE_SERVICE_ROLE_KEY`**, so a secret-less Worker
   sends **no `x-shelter-id`** — and `#ykefa`'s own hazard note says what follows: *"anon carries no
   shelter, reads no rows, and the public website serves blank pages"*. **A page that reads no rows is
   not the page whose cost we want.**
2. **It would also need a `shelter_hosts` row for the probe host**, written into dev — so *"touches
   nothing shared"* is gone.
3. **`/privacy` is NOT static text**, although `src/lib/public-paths.ts:16` says so: its page calls
   `createClient()` and `loadSiteContent()` twice, and `loadSiteContent` returns **`null` on a failed
   read rather than throwing**, so a credential-less probe renders it with no data and reports a
   **flatteringly low** number.

**Route (a) — the test Worker once the outside tester has finished — is the only route to a real figure,
and when is his.** **Cheaper than the item says:** `wrangler tail --format json` gives `cpuTime` per
invocation with no new credential, and `wrangler.jsonc`'s top level declares no Durable Object, R2 or KV
bindings. **Two traps for whoever runs it:** the edge cache (600 s) means every probe request needs a
cache-busting URL, and **local machine load cannot contaminate this reading** because the CPU time is
counted inside Cloudflare's isolate — the Lighthouse rule does **not** apply.

## MULTI-TENANCY: ELEVEN OF THIRTEEN, AND THE MANAGEMENT SCREEN IS IN FLIGHT

**Lutan asked where the remaining programme work was, and he was right to: this edition's predecessor had
folded it into a list of exclusions.** The audit, from `#ykefa`'s own parts list: **Parts 1-11 all
ticked** (`#mz75e`, `#s50n8`, `#qtid6`, `#v0302`, `#ujqr5`, `#bncd0`, `#ps6ms`, `#b4cmn`, `#o2iyh`,
`#omt6u`, `#sxyw3`). **Open: `#egq18` Part 12 and `#34a30` Part 13 only.**

**THE PRESENTATION LESSON: when a programme he tracks has items left, NAME IT AND COUNT ITS PARTS**, even
when every remaining part is somebody else's. *"Eleven of thirteen done, two left, here is who owns
each"* costs one line. **A correct list of exclusions is not an answer to "where is the big thing".**

**`#shmgt` AND `#onbrb` WERE FILED BY THE BACKLOG MANAGER SESSION MID-CONVERSATION**, both asked for by
him today, and they are where the afternoon's work came from. **The backlog can move under a conversation
without the planner doing anything** — notice it rather than re-deriving the open count. **`#shmgt`'s
schema half shipped (`0411`, `0412`) with a real specification, and he settled where the screen lives:
INSIDE the app's admin area**, chosen from three shapes. **The app half is in flight.**

## FILED, TICKED AND CORRECTED

**Ticked:** `#ntrun`, `#k2vd9`, `#ukncl`, `#nxsec`, `#cnred`, `#calsh`.
**Filed:** `#cniso`, `#swrun`, `#dcmds`, and `#shmgt`/`#onbrb` by the Backlog manager.
**Corrected before briefing, each caught by opening a file rather than by a check:** `#cnred` (the
planner's own wrong headline), `#onbrb` (the Drive step CAN be documented —
`scripts/connect-shelter-drive.mjs` shipped), `#nxsec` (named `scripts/check-no-cache-apis.mjs`; the real
guard is `scripts/check-next-cache-apis.mjs`).

**`#k2vd9` CLOSED BY HIS ANSWER WITH NO CODE CHANGE, AND IT IS THE DAY'S CHEAPEST WIN.** Asked what the
accountant uploads: ***"they are entered one at a time"***. **So there is no machine format to
establish**, which is the item's own second done-branch — and **the shipped screens already say *"The
full ID is shown here so it can be typed in"***. The Excel template behind the e-Donation login **exists
but she does not use it**, so nobody chases it and the Thai read of manual v2 is no longer owed.

**`#swrun`: TWO STREAMS REPORTED `1 flagged` INDEPENDENTLY** while both were told to expect 0 —
`scheduled_writer_runs`, rule 3 (missing `definer_all`), from `0408`. **`0388` is the precedent that
fixed exactly this for two other tables.** Briefed.

## WHAT IS LEFT FOR CLAUDE AT ALL

**In flight:** `#shmgt` app half, `#cniso`, `#swrun`. **Buildable next:** `#dcmds` (XS — fold it with
`#onbrb`'s second half rather than spending a stream floor on two lines), and whatever the three in
flight report. **Blocked on his second Google account (`#cn7gk`), which now unlocks TWO things:** the
two-account Drive proof and `#onbrb`'s deferred half. **`#onbrb`'s own PR listed what it could not
write:** creating the shelter and host rows, names (`0400`), receipt series (`0395`), the bill-kinds,
frequencies and group-origins screens, and removing a shelter after export — **those gaps may deserve
items once the screen lands.**

**Everything else is his hands** (`#pirow`, `#rqv5c`, `#civwx`, `#kxksr`, `#gvnrr`, `#aaqtl`, `#mzu7v`,
`#z04wr`, `#chpap`, `#uao7r`, `#8dfud`, `#z7d6h`, `#egq18`'s route (a), `#cn7gk`), **parked by his own
answer** (`#00e3u`, `#vkswg`, `#el9zw`), **waiting on a person** (`#y1dqu`, `#u2bo6`, `#s0jgi`,
`#1o5tk`), **waiting on data** (`#9b0vq`), **blocked** (`#34a30`) or **frozen** (`#3qmzt`).
**`#pl7aq`, the public launch, is a date he names: not to be re-asked.**

## PROCESS NOTES

- **THE AGENT BUILD HALT IS DEAD AT ITS CAUSE.** PR #1699 took Next `16.4.2` → `16.4.6` by an explicit
  pinned install; **five streams since have reported `build=0` with no `SecurityFatalError`.**
  **`brief-blocks.md` still describes the halt as live and should be rewritten** — but on more than
  today's readings.
- **AND THE FINDING THAT CAME WITH IT: `next upgrade --agent=security` LAUNCHES AN AI AGENT**, runs
  `@next/codemod` and asks it to set `experimental.agentUpgrade` — **the flag already assessed and
  rejected as dishonest.** The stream read the command before running it and chose the explicit install:
  *"smaller, easier to revert"*. **A tool's suggested remedy is not advice**, and this is the clearest
  instance the project has.
- **A TICK IS NOT A TITLE REWRITE, AND THIS HAPPENED THREE TIMES TODAY** (`#nxsec`, `#cnred` and one
  more), each leaving a ticked item whose title said the opposite of what happened, each fixed by the
  planner behind the stream. **Every brief now says it and it has not taken.** **Consider moving the
  instruction into `brief-blocks.md`.**
- **`worktree.mjs new` FAILED TWICE WHEN RUN IN A LOOP, with stderr redirected away so the reason was
  invisible.** Run them **one at a time with visible output**: three for three afterwards, and three for
  three again next plan. **The redirect was the real fault.**
- **PRODUCTION WAS READ ONCE, READ-ONLY, FROM THE MAIN CHECKOUT BARE** —
  `check-scheduled-writers.mjs --env production`. It closed `#ukncl`'s second database
  (**`purge-write-requests` now reads `[DELETEONLY]`**, with three functions still honestly `CANNOT BE
  DETERMINED`) and one of `#pirow`'s two done-when clauses (**all three production cron jobs classified,
  none sending no shelter**). **Twelve definer functions print `SENDS NO SHELTER`, none called by a cron
  job** — a hazard only for a service-role caller with no `scriptShelterHeaders`, **which is what the Pi
  might be.**
- **THE ID CHECKER CAUGHT THE PLANNER.** `#dcmd` was four characters; the pre-commit hook refused the
  commit because ids are `[a-z0-9]{5}`. **An instrument catching the planner is the right way round.**

## INTERRUPTIONS

**THREE, ALL COSTS OF THE BRIEFING PROCESS AND NONE OF ANY STREAM.** (1) *"Why don't we have any of the
remaining multi tennancy work in here"* — a presentation fault, fixed above. (2) *"Try again"* on the
open-item count — uncovered the `check-backlog-sections` directory fault. (3) *"you are making false
claiims again without checking the status"* — the inference about a merge. **No stream was corrected,
rescoped or stopped, and every state in the seventh plan was read from `gh`, `list_sessions` or a file
passed by path.**
