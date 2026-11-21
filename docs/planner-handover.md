# Planner handover — edition `769`, 2026-11-21

**This is a DELTA against `768`.** It says what changed, corrects its predecessor, and reports what `768`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS ELEVEN MERGED STREAMS, AND ELEVEN IS NOT A MISCOUNT.** The trigger is nine, and the ninth
(#1793) merged within four minutes of #1794 and #1795 in the same batch. **Splitting a batch to make the
arithmetic tidy would have orphaned two streams from the record**, so this edition takes all eleven and
the counter resets to 0 when its PR merges.

**The eleven:** #1784, #1785, #1786 (twelfth plan, batch 1), #1788, #1789 (batch 2), #1790, #1791
(batch 3), #1792 (batch 4), **#1793, #1794, #1795** (thirteenth plan, batch 1). **Every one has a figure
and every one is a valid reading** — dials matched the brief, `compacted=no`, `rescoped=no`,
`finished=yes`, eleven for eleven. That has not happened before.

**TWO PRs ARE DELIBERATELY NOT COUNTED, ON HIS OWN RULING:** #1783 and #1787 were one unplanned session
with two PRs, and *"anything outside of your plan does not count"* (below).

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, 250 lines, and the only record of the thirteenth plan's
   batch tables, actuals and reasoning.
2. **TWO SESSIONS ARE LIVE, batch 2 of the thirteenth plan.** `public-views-shelter-scope` on
   **port 3005** (`#pvws4`, migration `0433`, 190-230k) and `shelter-logo-proof` on **port 3006**
   (`#shlog`, no migration, 145-180k). **Do not plan into their files:** `scripts/check-public-views.mjs`,
   the `public_*` views, `src/app/adopt/PublicHeader.tsx`, `src/app/api/photos/`, `src/lib/mirror-read.ts`.
3. **BATCH 1'S THREE WORKTREES ARE STILL HELD** by their own sessions (ports 3001-3003). All three PRs are
   merged and **all three usage comments were read before any clearing was attempted**, so nothing is at
   risk. `done` them once he closes those sessions; **do not force it.**
4. **The release window is still shut, by his answer, not by an oversight.** He chose *"streams first,
   release later"* on 2026-11-21. Batch 1 drained but batch 2 went live in the same turn, so the clean
   moment is **after batch 2 merges.** Flag it in one line then. Do not nag.
5. **The Lanna logo upload is HIS, AFTER the release, and he set that timing himself** (*"After the
   release"*, 2026-11-20). Admin → Website → Home tab → Shelter logo → Upload logo,
   `public/lca-logo-transparent.png`. **It must not appear on a "waiting on Lutan" list before the
   release ships.**

## THE LESSON OF THE DAY: THE INSTRUMENT THAT COST TWO STREAMS NOW EXISTS — STOP BRIEFING THE OLD WAY

**On 2026-11-20 two streams hit the same wall on the same afternoon and only one got past it.**
`shelter-logo-upload` (#1790) wrote *"NOT DONE … the driven browser proofs. My dev sign-in kept
expiring"* and left its item open; `console-enquiry-queue` (#1791) got through with `playwright-core` and
**overran its band by 15k doing it.** Same root cause, two different prices, and **neither was written
down anywhere a brief would find it.**

**`#bprf7` (#1795) measured the cause and it was never expiry.** The paste snippet is ~2.7 KB of base64;
one paste lost 180 characters (2,689 against 2,509), the app read the broken cookie as no session, and
showed `/login?error=expired` about two minutes after signing in. **A model retyping 2.7 KB of base64
drops characters — that is the whole fault.**

**So the instrument now exists and `CLAUDE.md` names it:** `scripts/lib/driven-session.mjs`'s
`signedInPage`, documented with a copy-paste snippet at **`CLAUDE.md:582-600`**. It runs `dev-signin.mjs`
and loads the cookies straight into headless Chrome, **so nothing is retyped**. `playwright-core` is
already in `node_modules`; no install, no dependency.

**WHAT THIS CHANGES FOR YOU, CONCRETELY:**

- **Stop writing "paste the snippet into the pane" into a brief that asks a stream to PRESS something.**
  The pane is for reading a page. A proof that presses is driven.
- **A driven proof is now ~30k of apparatus you can price with confidence**, instead of each stream
  inventing a method at an unpredictable cost. The `+30k for real browser verification` row is now
  **buying a known instrument** rather than a gamble.
- **It has been driven exactly ONCE, by the stream that wrote it.** `shelter-logo-proof` on port 3006 is
  its second user and is explicitly asked whether the snippet worked as written. **Read that answer** —
  an instrument with one user is not yet proven.
- **The pane's own fault was NOT fixed, and that was a judged call**, recorded in
  `docs/decisions/2026-11-21-driving-a-browser-proof.md`: a relay would be a second instrument. Residual
  unknowns are stated there honestly — whether #1790's session broke the same way, and whether a faithful
  paste holds the full 50 minutes.

## A SECOND LESSON, AND IT IS WHY `768`'S COUNT WAS WRONG: A BRANCH IS NOT A STREAM

**The planner told him nine streams had merged. He said *"no it hasn't been 9 streams yet"*, and he was
right.** #1783 and #1787 were counted as two. They are **one session**: both usage comments report the
same session start (`13:51:15Z`), and #1787 changed only #1783's own test plan.

**The unit is the SESSION, not the branch and not the slug.** A slug is only what a session called
itself. **One stream, one count, however many PRs it opened** — the skill already said so and the planner
still miscounted, because a branch list looks exactly like a stream list.

**Then he settled the harder half himself:** *"no it's 9 streams that you plan, anything outside of your
plan does not count"*. **Both of those PRs count for nothing at all**, planned or not. `SKILL.md` step 7
now carries it with the superseded clause struck in place, so a successor meeting the old wording can see
which way it went (#1792).

**The practical consequence for you: `gh pr list` cannot tell planned from unplanned.** Recover the count
from **this document's covered list**, never from a PR listing.

## FIGURES — ELEVEN READINGS, ALL VALID: SIX INSIDE, THREE OVER, TWO UNDER

| PR | slug | band | tokens | floor | verdict |
|---|---|---|---|---|---|
| #1784 | `dev-signin-shelter-default` | 143-170k | 149,533 | 88,248 | inside |
| #1785 | `platform-product-page` | 150-195k | 159,793 | 87,525 | inside |
| #1786 | `shelter-state-schema` | 175-215k | 195,500 | 91,573 | inside |
| #1788 | `shelter-logo-schema` | 140-160k | **209,262** | 87,251 | **OVER by 49k** |
| #1789 | `console-cards-redesign` | 185-225k | **263,451** | 90,085 | **OVER by 38k** |
| #1790 | `shelter-logo-upload` | 170-210k | 181,323 | 88,198 | inside |
| #1791 | `console-enquiry-queue` | 175-205k | **220,368** | 88,263 | **OVER by 15k** |
| #1792 | `plan-day-skill-edits` | 143-170k | 138,327 | 87,974 | **under by 5k** |
| #1793 | `hero-photo-shelter-scope` | 175-215k | 153,973 | 87,540 | **under by 21k** |
| #1794 | `closed-shelter-jobs` | 145-190k | 154,934 | 87,974 | inside |
| #1795 | `browser-proof-instrument` | 145-185k | 162,417 | 88,263 | inside |

**ALL THREE OVERRUNS WERE THE PLANNER'S, AND ALL THREE HAVE THE SAME SHAPE: a band that priced the code
and not the FINDING OUT.** #1788 had to establish how an existing mechanism behaved; #1789 crossed a
layer the band never priced; #1791 had to invent a browser proof with no instrument. **Read your own band
paragraph back: if it names an unknown, the band must contain it.** Naming a risk is not pricing it.

**#1788's 49k overrun bought two findings and a migration** (`0430`, plus `#pvws4` and `#h3ro9`), so it
was a cheap overrun — but it was not forecast, and that is the defect.

### THE DISCOUNT FOR HANDING EVERYTHING OVER IS NOW MEASURED AT ABOUT 21k

**`hero-photo-shelter-scope` (#1793) came in 21k under a band built on `#1786`'s own 195,500 for the same
shape** — a definer function, a harness, a registry declaration. **The difference was the brief**: it
handed over the cause, the decision AND the written fix, quoting `0431:22` by line, and the stream copied
it rather than deriving it.

**DO NOT PUSH THIS INTO THE TABLE.** It is a discount on a brief that hands everything over, not a
correction to the schema rows — **exactly the inference the floor row's own warning forbids.** `#pvws4`
was deliberately left at 190-230k for that reason: nothing is written for it, the surface is twenty-three
views rather than one function, and it also changes an instrument. **If it lands near #1793's figure,
THAT is the second reading that justifies revising the schema rows. One is not.**

### THE FLOOR — ELEVEN READINGS, AND NOW FOUR EXACT REPEATS

**87.3–91.6k**, from `tokens − messages` across all eleven. Essentially identical to `768`'s 87.2–91.6k
from seven. **Four exact repeats now:** `87,974` twice (#1792, #1794) and `88,263` twice (#1791, #1795).
**Record the repeats; offer no cause.** Nine of the eleven sit between 87.2k and 88.3k.

## HIS DECISIONS OF THE DAY — SETTLED, DO NOT RE-OPEN

- **Only streams a plan created count toward a handover** (above). *"Anything outside of your plan does
  not count."*
- **Streams first, release later** (2026-11-21), asked directly with the cost stated — one note in
  `unreleased`, nothing in flight, and the Lanna logo upload waiting behind it. **He chose the streams.**
- **The Lanna logo upload waits for the release** (*"After the release"*). His timing, his hands.
- **He took all three of batch 1 as offered**, in one `AskUserQuestion` that also carried the release
  decision. **One question, two answers, no interruptions all day.**

## FILED, TICKED AND CORRECTED

- **Ticked by their streams:** `#h3ro9`, `#clsjb`, `#bprf7`, and `#shlog` retitled rather than ticked
  (#1790 was honest that its proofs were undriven — **that honesty is why `#bprf7` exists at all**).
- **FILED BY THE PLANNER — `#swout`** (Architecture): `check-scheduled-writers.mjs` cannot catch the next
  job that runs for a closed shelter, because it has no way to say a job **acts outside the database**.
  **#1794 handed this back explicitly** and it is the distinction it had to draw by hand — a sweep that
  tidies rows is harmless for a closed shelter, **a job that SENDS something on its behalf is a different
  class of wrong.**
- **#1793's sweep found a SECOND wrong function** nobody briefed it for, `approve_website_draft` (`0315`),
  and `0432` fixed both. **The class-not-the-instance brief shape has now paid twice in two days.**
- **FOUND BY THE PLANNER WHILE BRIEFING, so a stream did not have to:** the photo proxy's non-webp path
  ends `.jpeg({ quality: 82 })` (`src/lib/mirror-read.ts:152`), **and JPEG has no alpha channel** — so a
  transparent logo IS flattened on that path. It was handed to `shelter-logo-proof` **as evidence to test
  rather than as a conclusion**, with a warning that the item's guess of a *white* box is probably wrong
  (sharp's default flatten is black) and that **two serving paths exist**, so measuring one proves
  nothing about the other.

## STILL OWED — ONE ITEM, AND IT IS THE SAME ONE

**`768`'s list is otherwise closed by #1792.** What remains:

- **STILL OPEN, conditional:** lowering *"Reads very widely and edits many call sites"* (185-250k) toward
  the audit row. **Still only one reading** (`silent-empty-reads`, 133,986, older floor and dials), which
  is not enough. **Needs readings at current dials.** `#pvws4` is not one — it is a schema row.
- **CONFIRMED STRUCK, AND `768` HAD IT RIGHT:** the *"two bottoms nearer 135k"* and *"the +10k for
  looking"* edits never existed in the skill files. **The planner re-proved this with `git log -S` before
  reading `768`'s own entry**, which is wasted work and worth avoiding: **read the predecessor's owed list
  before re-deriving its contents.**

## PROCESS NOTES

- **The hard sequence was kept at both of today's setups.** Sync, `new` per stream, briefs, `streams`,
  then the list. **Nothing was cleared and no PR body was read before the list went out** — the usage
  comments and PR bodies were read in (e), after.
- **THE BRIEF HEADER MUST BE THE LITERAL FIRST LINE, and this cost a fix this morning.**
  `worktree.mjs streams` matches `/^<!--\s*stream:/` **on line 1 only** (`scripts/worktree.mjs:637`) and
  otherwise reports *"no metadata line"* for every brief. The assembler now lifts the header out of the
  middle and prepends it to the whole document, with a guard that throws if the output does not start
  with it. **Keep that guard.**
- **The briefs are still ASSEMBLED BY SCRIPT** from `brief-blocks.md`'s nine fenced blocks, with the
  byte-identical guard on all eight verbatim blocks. **Five briefs written today, no block drift.**
- **A plain recursive `grep -rl` over this repo TIMED OUT at 120 seconds.** The Grep tool (ripgrep)
  answered the same question immediately. **Do not run a recursive shell grep here.**
- **The backlog pre-commit hook refuses a commit message that does not name the changed item ids.** Write
  `Backlog: file #swout — …`, not `Backlog: file a finding`.
- **A push was rejected mid-sync yesterday** (*"cannot lock ref refs/heads/main"*) because a PR merged
  between the pull and the hook's push. **`git fetch` + `git pull` and carry on — it is a race, not a
  broken hook.**
- **Every usage comment was read BEFORE any worktree was cleared**, as the 2026-11-17 decision requires.
  **Eleven for eleven; none had to be recovered from a transcript.**

## INTERRUPTIONS

**ZERO DEFECTS, AND ONE CORRECTION THAT WAS HIS TO MAKE.** His messages today were his own decisions
being taken — batch 1 plus the release timing in one answer, and *"Yes, write 769"*.

**The one exception is instructive and is the planner's fault, not his:** he had to correct the stream
count **twice in one turn**, first on the arithmetic (*"no it hasn't been 9 streams yet"*) and then on the
rule (*"anything outside of your plan does not count"*). **Both corrections were cheap for him and both
were avoidable by reading the usage comments' session starts before believing a branch list.**
