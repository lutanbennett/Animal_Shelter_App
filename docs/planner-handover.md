# Planner handover — edition `770`, 2026-11-21

**This is a DELTA against `769`.** It says what changed, corrects its predecessor, and reports what `769`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS NINE STREAMS AND ALL NINE HAVE A VALID FIGURE:** #1796, #1798 (thirteenth plan, batch 2);
#1799, #1800, #1801 (fourteenth, batch 1); #1802 (fourteenth, batch 2); #1803, #1804 (fifteenth, batch 1);
#1805 (fifteenth, batch 2). **Dials matched the brief, `compacted=no`, `rescoped=no`, `finished=yes`, nine
for nine.** The counter resets to 0 when this PR merges.

**THREE PLANS IN ONE CALENDAR DAY, ALL IN ONE CHAT.** The thirteenth finished; he was then offered the
release or a new plan and **chose the plan three times running**. So `769`'s *"streams first, release
later"* decision has been exercised three times and still stands.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, 271 lines, and the only record of the fourteenth and
   fifteenth plans' batch tables, actuals and reasoning.
2. **NOTHING IS IN FLIGHT.** No open PRs, no live streams. **The release window is open and has been since
   #1805 merged at 08:00Z.** His timing, not yours — he was offered it and chose the handover.
3. **SEVEN MERGED WORKTREES ARE HELD** by their own sessions (ports 3001-3003, 3005-3007, and 3009 for
   this handover). `done` was refused on every one, repeatedly: *"Windows cannot delete a folder a process
   is sitting in"*. **All PRs merged and all figures read before any attempt**, so nothing is at risk.
   **`done` them once he closes those sessions. Do not force it.**
4. **TWO PRODUCTION READS ARE YOURS AND BOTH BLOCK SOMETHING:** (a) **`#9l7xf`** — does production's
   `lanna` row have an `is_primary` host? `my_shelters()` omits a shelter without one, and on dev that is
   the real Lanna row. **Nothing else in that item can start until this is answered.** (b) **`#1804`'s
   logo proof** — `curl -sI /api/photos/<logo id>` on production after the release, expecting `image/png`.
5. **THE LANNA LOGO UPLOAD IS STILL HIS, AFTER THE RELEASE, and he set that timing himself**
   (*"After the release"*, 2026-11-20). **Two things to tell him at that moment and not before:** the
   black square is **fixed on dev and unproven on the Worker and the Pi** (item 4b), and **`#oga26`** means
   a very large logo is now a slow public page, so a word about file size before he picks one.
   **It must not appear on a "waiting on Lutan" list before the release ships.**
6. **The allow rules for `remove-shelter.mjs` were OFFERED AND DECLINED** — he said *"Not yet"*. The script
   is merged and ready. **DO NOT ADD THEM OR RE-OFFER UNPROMPTED.**

## THE LESSON OF THE DAY: READ THE INSTRUMENTS, NOT JUST THE ITEM — IT FIRED FOUR TIMES

**Four items read as open, buildable and unstarted. Three were already built and the fourth was the wrong
shape, and every one was caught by the planner READING before briefing rather than by a stream.**

- **`#apxld`'s product page** had shipped hours earlier (#1785), **and the enquiry form with it**. Only
  the chooser was left — which became two streams and closed the item.
- **`#shfil`'s registry and check** had shipped in `6ed546721`. **A worktree was created for it and
  withdrawn**, which is the honest cost of finding out late.
- **`#m52yp`'s owner check largely EXISTED** — `scripts/lib/tenancy-catalogue.mjs:63` lints it and
  `.github/workflows/tenancy-catalogue.yml:34` runs it nightly, strict. **That turned a build into a
  diagnosis and moved the band 25k.**
- **`#swout` had sized itself *"S, one script"***; the checker reads only the database and **the three jobs
  it names are not in the database at all** (`worker/index.mjs`, calling out over HTTP). Rebanded
  160-200k; **it came in at 182,141, where the quick-win band would have read as a 12k overrun.**

**THE ORDERING FIX, AND IT IS THE WHOLE LESSON: READ THE TREE FOR EVERY CANDIDATE BEFORE THE QUESTION, NOT
BEFORE THE BRIEF.** The withdrawn worktree happened because the already-built check came after the
`AskUserQuestion`. **`check-stale-titles.mjs` caught `#shfil` and did NOT catch `#apxld`** — the heuristic
cannot see an item whose body never claimed to be done. **Reading the directory caught all four.**

## A SECOND LESSON, MEASURED THREE TIMES: WRITE YOUR OPEN QUESTIONS IN AS QUESTIONS

**The skill's rule paid three times in one day, and twice it was the PLANNER who was wrong.**

- **`#apxld`'s schema brief asserted that `shelter_hosts` had no primary-host flag.** It has one —
  `is_primary`, from `0428`. **Written as a numbered question, so the stream checked it and corrected it.**
- **`#m52yp`'s brief offered a restrictive-policy hypothesis** — that a policy naming only
  `anon, authenticated` might not apply to a query running as `rls_definer`. **It does apply.** Written as
  a question it cost one paragraph; **written as a finding it would have been built on.**
- **`#swout`'s brief told its stream to establish where scheduled jobs are declared** rather than asserting
  the item's answer. It found a **fifth** job nobody had named.

**"A brief that says what the planner has not established gets corrected; one that asserts gets obeyed."**
Three for three.

## AND THE PLANNER'S OWN DEFECT, WHICH A STREAM CAUGHT: TWO ITEM IDS SWAPPED

**`#m52yp` is the `public_*` view owner check. `#gyw6m` was the black logo.** The planner filed both and
then wrote them the other way round, in two briefs and in `.plan-day.md`. **The backlog was always right.**

**`claude/logo-alpha-serving` (#1804) caught it at step zero**, ticked the correct item and said so in its
PR. **The batch-2 brief was corrected before its session opened**, with a note naming both ids.

**THE CAUSE AND THE FIX, because it is one line:** `backlog-ids.mjs` assigns ids in **file order**, and the
planner read two ids out of one `grep` and paired them with the wrong items — Security sits at line 21 and
Public website at line 299, so **the first id printed was the owner check, not the logo.** **Read each id
back out of `docs/backlog.md` individually before using it in prose.**

## FIGURES — NINE READINGS, ALL VALID, AND NOT ONE OVERRUN

| PR | slug | band | tokens | floor | verdict |
|---|---|---|---|---|---|
| #1796 | `public-views-shelter-scope` | 190-230k | 184,179 | 88,823 | **under by 6k** |
| #1798 | `shelter-logo-proof` | 145-180k | 161,475 | 88,599 | inside |
| #1799 | `remove-one-shelter-script` | 150-185k | 161,422 | 87,876 | inside |
| #1800 | `scheduled-writer-outside-db` | 160-200k | 182,141 | 89,112 | inside |
| #1801 | `shelter-chooser-schema` | 150-180k | 166,543 | 88,823 | inside |
| #1802 | `shelter-chooser-page` | 165-205k | 183,017 | 88,888 | inside |
| #1803 | `translations-closed-shelter` | 145-175k | 155,707 | 88,100 | inside |
| #1804 | `logo-alpha-serving` | 175-220k | 163,509 | 87,876 | **under by 11.5k** |
| #1805 | `public-views-owner-check` | 185-235k | 182,612 | 91,209 | **under by 2.4k** |

**SEVEN INSIDE, TWO UNDER, NONE OVER — against `769`'s three overruns in eleven.** `769` diagnosed all
three of those as *"a band that priced the code and not the FINDING OUT"*. **This set is what happens when
the planner does the finding out first**, and the four catches above are the mechanism.

### THREE BAND LESSONS, AND ONE OF THEM IS HONESTLY INCONCLUSIVE

1. **THE SCHEMA-SPECIFICATION DISCOUNT IS CONDITIONAL, AND THIS IS THE READING THAT SHOWS IT.**
   `shelter-chooser-page` was handed `my_shelters()`'s full specification — name, signature, return
   columns, a worked call — and the hypothesis written down was *"this should land near 165k, the bottom of
   its band"*. **It landed at 183,017, mid-band**, because it still had to stand up a login holding roles
   at two shelters and drive a browser. **A specification does NOT pull a stream to the bottom of its row
   when it must still build apparatus. Do not apply that discount to a stream that needs a fixture.**
2. **WHEN THE PLANNER DOES THE FINDING OUT, CUT HARDER THAN FEELS SAFE.** `logo-alpha-serving`'s band was
   cut 185-235k to 175-220k on the strength of tracing the two resize mechanisms before briefing. **It came
   in 11.5k under the LOWERED band, so the trace was worth about 20k, not 10.** **One reading. A second
   would justify a row change; one does not.**
3. **`translations-closed-shelter` IS INCONCLUSIVE AND SAYING SO IS THE POINT.** Banded 145-175k as an
   ordinary stream rather than 143-170k as a quick win; **155,707 is inside both**, so the reading does not
   discriminate and **no lesson may be drawn either way.**

### THE FLOOR — NINE READINGS, TWO EXACT REPEATS AND ONE OUTLIER

**87.9k - 91.2k**, from `tokens − messages`. **Eight of the nine cluster at 87.9-89.1k**; #1805's
**91,209** is the outlier and sits at the very top of `769`'s 87.2-91.6k. **Two exact repeats, each across
different kinds of work:** `88,823` (#1796 a views audit, #1801 a schema function) and `87,876` (#1799 a
one-off script, #1804 two call sites). **Record the repeats and the outlier; offer no cause.**

## THE FINDING THAT MATTERS MOST: A MIGRATION WAS WRITTEN ON BAD EVIDENCE

**`#m52yp` (#1805) set out to explain why `public_site_content` leaked at #1788 while correctly owned. The
answer is that IT NEVER LEAKED TO ANON.**

Measured on dev inside a rolled-back transaction: an **untrusted** anon read of an `rls_definer`-owned view
returned **0 rows with no shelter header and 1 with one** (7 from a `postgres`-owned one), while a
**trusted** read — one carrying **no jwt claims at all** — saw **all 7 whatever the owner**. `0429`'s
harness and the Management API both send no claims, so `is_trusted_caller()` was true and every policy
correctly stood aside. **Ownership does scope these views. The six rows were an artefact of the
instrument.**

**SO `0430_public_site_content_scoped.sql` WAS WRITTEN TO FIX A LEAK ANON COULD NOT SEE.** It is **not**
being undone — scoping a public view explicitly is harmless and arguably better than relying on its owner —
**but a migration was written on bad evidence and nothing in the toolchain objected.** Filed as
**`#701vn`**: a `begin … rollback` harness that claims to prove scoping must set `request.jwt.claims` with
`role=anon`, or say in its own comment that it proves nothing about anon. **`CLAUDE.md`'s migration section
recommends that harness pattern without this caveat.**

**`#pvws4`'s tick HOLDS** — its verdict was right; only its stated *mechanism* (*"recreated as
`postgres`"*) was not what happened to that view. **The gap was still real, so #1805 built
`scripts/check-view-owners.mjs`** (plus lib and test) into `npm run lint`, proved red on fixtures: it
catches a **new view nobody re-owns** at the commit, where the nightly lint catches it the next morning.

## FILED, TICKED AND CORRECTED

- **FILED BY THE PLANNER — six items, five of them from a stream's hand-back:** **`#fu86i`** (the fifth
  scheduled job, `runTranslations`, exempted as *"NOT ESTABLISHED"*), **`#m52yp`** (now done),
  **`#gyw6m`** (now done), **`#oga26`** (the logo fix's bill: the original is served on every public page
  and uploads accept up to 15 MB, so a cap plus refusal wording in **both** dictionaries), **`#9l7xf`**
  (`my_shelters()` omits a shelter with no primary host) and **`#701vn`** (above).
- **EVERY ONE OF THE FIRST THREE FILINGS BECAME A STREAM WITHIN THE HOUR.** A stream reports, only the
  planner files, the next plan builds it — **and today that loop closed twice in one day.**
- **TITLES REWRITTEN BECAUSE THEY HAD GONE FALSE:** `#apxld` (the product page shipped) and `#shfil`
  (the code half shipped; what remains waits on `#gidty`'s Google account). Old wording kept as
  `SUPERSEDED`.
- **TICKED BY THEIR STREAMS:** `#swout`, `#fu86i`, `#gyw6m`, `#m52yp`, `#apxld`. **`#tstsh` was NOT
  ticked** — the script exists, the run is his.
- **THE DRIVEN-PROOF INSTRUMENT NOW HAS FOUR USERS AND ALL REPORT IT WORKING AS WRITTEN.** `769` asked
  for the second user's answer; it came back *"The `CLAUDE.md` snippet worked as written"*, and
  `shelter-chooser-page` and `logo-alpha-serving` drove it too. **An instrument with one user is no longer
  the risk `769` flagged.**

## HIS DECISIONS OF THE DAY — SETTLED, DO NOT RE-OPEN

- **The `test123` shelter goes by a ONE-OFF REMOVAL** (asked with the three shapes the item named). **The
  script is a stream's, the run is his**, and whether the console should ever remove a shelter was
  deliberately left with `#pacon`.
- **The allow rules for that script: *"Not yet"*.** Declined, recorded, **do not re-offer.**
- **Streams first, release later**, exercised three times — he chose a new plan over the release at every
  hand-back. **The window is open now and the timing is still his.**
- **The Lanna logo upload waits for the release.** His timing, his hands.

## STILL OWED — ONE ITEM, AND IT IS THE SAME ONE `769` LEFT

- **STILL OPEN, conditional:** lowering *"Reads very widely and edits many call sites"* (185-250k) toward
  the audit row. **Still only one reading** (`silent-empty-reads`, 133,986, older floor and dials).
  **Nothing in these nine was a second** — none of them reads widely and edits many call sites.
  **Needs readings at current dials.**
- **`769`'s list is otherwise closed.**

## PROCESS NOTES

- **The hard sequence was kept at all four of the day's setups.** Sync, merge check, `new` per stream,
  briefs, `streams`, then the list. **Nothing was cleared and no PR body was read before any list went
  out.** Seven briefs written, no block drift.
- **THE BRIEF ASSEMBLER IS WORTH KEEPING AND ITS GUARDS EARNED THEIR SPACE.** Nine fenced blocks from
  `brief-blocks.md`, byte-identical guard on the eight verbatim ones, per-stream fill of block D's three
  holes, **and a guard that line 1 is exactly the `<!-- stream: -->` header** (`worktree.mjs streams`
  matches it **on line 1 only**, `scripts/worktree.mjs:637`).
- **A GUARD THAT IS TOO STRICT REFUSES A CORRECT EDIT.** The first attempt at the id correction asserted
  *no* `#gyw6m` anywhere in the output — which the correction note itself legitimately mentions. **It
  exited non-zero and wrote nothing, which is the guard working.** **Write the guard against what the
  output should contain, not against a string being absent.**
- **TWO SHELL TRAPS, both cheap once known.** A `\|` inside a JSON string reached `node` as an invalid
  escape and `JSON.parse` refused the whole file — **reword to avoid the backslash.** And apostrophes
  inside a single-quoted `node -e` break Git Bash — **write the script to a file and run it by path**,
  which is what the skill already says for `.plan-day.md`.
- **A SECTION REGEX TRAP:** a lookahead ending `|\n*$` under the `m` flag matches at the end of the FIRST
  line, so every block came back empty. **Split on the heading rather than lookahead-bounding it.**
- **`worktree.mjs done` FAILED ONCE AND SUCCEEDED ON AN IMMEDIATE RETRY** (a file lock during folder
  removal, not a broken command). **Read the second run before reporting a failure.**
- **Every usage comment was read BEFORE any worktree was cleared or any clearing attempted.** Nine for
  nine; none had to be recovered from a transcript.
- **The backlog pre-commit hook refuses a commit message that does not name the changed item ids.** Four
  commits today named eight ids between them.
- **Do not run a plain recursive `grep -rl` here** — it timed out at 120 seconds. The Grep tool (ripgrep)
  answers at once.

## INTERRUPTIONS

**ZERO DEFECTS AND ZERO MID-TURN MESSAGES, across three plans and nine merged streams.** Every message of
his was a decision being taken: the plan over the release (three times), *"Yes, all three"*, *"I'll do a
one-off removal"*, *"Not yet"*, *"Yes, both"*, *"Yes, write 770"*.

**TWO SELF-INFLICTED COSTS, BOTH THE PLANNER'S AND NEITHER REACHING HIM:** the withdrawn `#shfil`
worktree, and the swapped item ids. **Both have a stated fix above, and both were caught inside the
system** — one by reading the tree, one by a stream at step zero.
