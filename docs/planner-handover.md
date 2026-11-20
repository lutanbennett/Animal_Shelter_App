# Planner handover — edition `768`, 2026-11-20

**This is a DELTA against `767`.** It says what changed, corrects its predecessor, and reports what `767`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**`767` AND `768` WERE BOTH WRITTEN ON 2026-11-20.** `767` was written in the morning after `0.47.6`;
this one after a second full day of streams and **two more releases**. If you are reading both, read this
one — and do not read a document's own date as proof it is fresh. **Read the system date and compare.**

**IT COVERS THE EIGHT STREAMS MERGED SINCE `767`:** #1770, #1771, #1773 (batch 1), #1777, #1778, #1779
(batch 2), plus **#1774** (the product icon) and **#1776** (the platform lockup), neither of them planned.
**A NINTH, `platform-drive-folder`, IS STILL RUNNING** — written in deliberately, at Lutan's instruction
to write this while the day's context existed. **Its figure is read next morning from its PR, which is
safe: a `stream-usage:` comment outlives the branch and the worktree.** The two releases' three PRs
(#1772, #1775 cuts, #1780 record) post no figures.

**SIX PLANNED STREAMS IN TWO BATCHES, ALL MERGED, FIVE BAND READINGS AND EVERY ONE INSIDE.** He agreed
batch 1 and chose option A for the Drive scope in the same message; batches 2 and 3 were set up without
asking, as step 8 requires.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, 358 lines, and the only record of today's batch tables and
   figures.
2. **A session is live on `C:\Development\Animal_Shelter_platform-drive-folder`** (port 3001,
   sonnet-5-5/low, `#shfil`). **Do not plan into its files** — `scripts/sync-home-icons.mjs`,
   `scripts/drive-partition-tree.mjs`, `scripts/lib/runtime-config.mjs`, `scripts/pi/`.
3. **Production is healthy on `0.47.8` and owes nothing.** All four hosts agree on **both** version
   endpoints. Production and UAT each hold 428 migrations, 0 pending, 0 drift.
4. **Twelve items on `0.47.8`'s record are `pending: Lutan`**, every one a press only a signed-in person
   on a deployed host can make. **The one worth asking for first is the release's own headline:** start
   from a link that bounces you to sign-in, sign in with Google, and land on the page you asked for.
5. **`#drvtk` still blocks every `--secrets` deploy.** Narrow and exact: this PC's `.env.deploy.uat`
   holds a **revoked** Drive refresh token. A plain Worker deploy is unaffected and **three were run
   today**.

## THE LESSON OF THE DAY: A VERSION NUMBER AGREEING EVERYWHERE IS NOT A DEPLOYED RELEASE

**`767`'s own instruction was "read BOTH endpoints on all four hosts", and the fault still happened** —
so the warning as written was not enough. Here is the sharper version, and it is the same class as `767`'s
nine-instance lesson: **the layer a reading covers is part of what the reading means.**

**`/api/version` is answered by the app on the Pi. `/api/releases/current` is answered by the Worker.** A
Pi build does **not** deploy the Worker, and the Worker holds the static assets. After the production
deploy and **three** Pi builds, all four hosts reported `0.47.8` on `/api/version` and the release looked
finished. **Test's Worker was still `0.47.6` and UAT's `0.47.7`.**

**THE CHEAPEST PROBE OF A WORKER'S AGE IS A NEW STATIC ASSET**, and this is the technique to copy:

```bash
curl -s -o /dev/null -w '%{http_code}' https://test.lannacare.org/icon-192.png   # 307 = stale Worker
```

**`/icon-192.png` answered 200 on production and 307 on test and UAT**, because a stale Worker does not
know the file exists. **It was caught while writing the record, by two numbers disagreeing — not by any
check. Nothing asserts that an environment's Worker and its Pi app are on the same release**, and that
guard is filed in `0.47.8`'s defect table.

### THE SAME SHAPE, CHEAPER: A GREP THAT MATCHES PART OF A DOCUMENT IS NOT A READING OF IT

A search for `Result: fail` across 17 test plans appeared to find a failing one. **It had matched the
template's own prose quoted inside the plan** — the line listing what makes the checker go red. Its
verdict was `pass`. **Read the sign-off section.**

**This is `767`'s `drive-scope-read` lesson in a second instrument:** there, a filename grep over 300
decision files **could not fail**; here, a content grep **could not help but match**. **Name the line to
open, not the pattern to search.**

## A RELEASE CUT AND A MERGING BATCH RACE, AND THE CUT LOSES — NEW PLANNING RULE

**It cost two cuts in one hour and one of Lutan's three touches.** `0.47.7` was cut to unblock UAT;
**#1774 then merged a release note between that cut and its production deploy, so the deploy refused**,
and `0.47.8` had to be cut. **No rule was broken by either side:** the stream was right to write a note,
and `deploy.mjs` was right to refuse rather than ship user-visible code with nothing written down.

**CUT AFTER A BATCH HAS DRAINED, NOT DURING IT.** And its two neighbours, both met today:

- **`deploy.mjs` refuses UAT and production while `unreleased` holds anything.** It is why a one-command
  UAT fix became a release cut. **Check `unreleased` before promising anyone a deploy.**
- **UAT also refuses while `main` and `origin/main` differ** (*"3 behind / 0 ahead"*). **Pull immediately
  before the deploy** — and know that pulling may bring in a new note, putting you back in the first trap.

## ONE SESSION OWNS A BRANCH; A SECOND SESSION ASKED TO HELP REPORTS RATHER THAN COMMITS

**From #1773's own usage comment, which is the most useful thing a stream has ever written for a planner.**
That branch cost **three full gates runs and four CI runs** because two sessions were driven on it at
once: the stream kept being asked for one more fix while the other session was mid-build, so each commit
landed underneath a run already in flight. **No commit was wrong and the stream flagged every one**, which
is why nothing stale shipped. **The waste was in the arrangement, not the conduct.** Lutan settled it with
*"You finish it"*.

**It is also why #1773's figure is not a reading** — see the table.

## FIGURES — EIGHT STREAMS, FIVE READINGS, THREE SET ASIDE, ALL FIVE INSIDE

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `shelter-enquiry-schema` | #1770 | 160-190k | **171,280** | inside |
| `callback-allowlist-check` | #1771 | 145-190k | **158,237** | inside |
| `login-next-callback` | #1773 | 150-185k | **184,132** | **NOT A READING — `rescoped=yes`, two sessions** |
| `product-icon` | #1774 | — | **414,500** | **NOT A READING — no band, `compacted=yes`, `rescoped=yes`, opus-5/medium** |
| `platform-lockup` | #1776 | — | **122,402** | **NOT A READING — unplanned, no band** |
| `worker-settings-registry` | #1777 | 150-190k | **168,556** | inside |
| `step-up-returns` | #1778 | 146-180k | **173,526** | inside |
| `shelter-enquiry-form` | #1779 | 200-250k | **205,343** | inside — **the specification discount's first verdict** |

**FIVE READINGS, FIVE INSIDE.** Thirty-two readings now stand across all editions and **nothing has ever
landed below 142,750.**

### THE SPECIFICATION DISCOUNT FIRED, AND THE HYPOTHESIS WAS WRITTEN DOWN BEFORE THE ANSWER WAS KNOWN

**The skill says a schema half that writes the app half a SPECIFICATION — not a column list — discounts
the app half to the bottom of its row.** `shelter-enquiry-form` is *"creates one new surface people submit
data through"* (200-270k) and was banded **200-250k** on that basis, at setup, in writing.

**It came in at 205,343: 5.3k above the bottom of the row and 65k below its top.** **The discount held.**

**One data point, but the mechanism is testable rather than lucky:** #1770's decision file named all ten
columns, the insert shape, the duplicate behaviour and the one-answer rule, and **that section was quoted
verbatim into the form stream's brief**, so the stream re-derived nothing. **Keep writing specifications
in schema halves and keep quoting them into briefs.** This is the first instrument in the band table with
evidence behind it rather than a guess.

**A second prediction held quietly:** #1778 and #1779 were each told `src/app/platform/page.tsx` was the
one file they might both need, and each was told to keep its edit small and name it. **Neither reported a
conflict.**

### `414,500` IS A SENTINEL, NOT A COST — CHECK IT BEFORE YOU QUOTE IT

**#1774 reports `tokens=414500`. So did #1765 in `767`'s table.** The same total to the digit, from two
unrelated streams; **both `compacted=yes`, both opus-5/medium, both long-lived.** A compacted window
reports a remainder, so neither figure measures its stream.

**OFFER NO CAUSE** — that instruction is about the planner, not the number, and `767` watched three
explanations of the floor die in a day. **What to DO: treat `414,500` as a tell that the window was reset,
and set the figure aside rather than reasoning from it.**

### THE FLOOR — SEVEN MORE READINGS, AND A SECOND EXACT REPEAT WITHIN ONE DAY

`tokens − messages`, today's eight: **91,573 · 88,248 · 88,748 · 94,625¹ · 87,525 · 88,175 · 87,525 ·
87,460** — ¹#1774, compacted, set aside.

**87,525 appeared TWICE today, to the token, from `step-up-returns` (#1778) and `platform-lockup`
(#1776)** — a planned batch-2 stream and an unplanned role-session stream, different work, different
branches. **88,248 recurred again** (#1771) and has now appeared on **three separate days**.

**Range across all editions: 87.2-91.6k.** The repeats are the durable finding; **every account of them so
far has been wrong, so record the range and the repeats and stop.**

## HIS DECISIONS OF THE DAY — SETTLED, DO NOT RE-OPEN

- **The Drive scope: OPTION A — two Google apps.** The existing Desktop client keeps full `drive` for
  internal tools; **a new Web client carries the narrow scope for the shelter-facing screen.** Recorded on
  `#drvcl`. Asked as one question alongside batch 1 and answered in the same breath: *"yes all three, and
  option A for the drive scope"*.
- **`0.47.7` and `0.47.8` are both PATCHES — neither mailed anybody.** Asked each time as *"should this
  release email you?"*, never as the two words. `majorReleasesSince("0.47.6")` was read directly as `[]`,
  with a control call still finding `0.47.0`, so the empty answer was the flag and not a broken function.
- **`#shfil` — the icon library moves to the platform folder too**, which is what made that item
  buildable rather than a question. Briefed as batch 3.

## FILED, TICKED AND CORRECTED

**`#hostx` IS CLOSED, AND A PRESS IS WHAT CLOSED IT.** `#uatsb` is its mirror, and together they are one
sentence you should not have to re-derive: **`#hostx` was the rows being missing; `#uatsb` was the Worker
not reading them.** A `resolve_shelter_site()` read **and** `check-deployed-hosts.mjs` both passed while
every UAT sign-in was still refused. **Only a pressed sign-in tells those apart** — *"I have successfully
logged in"*.

**It also answered a setting that cannot be read back.** `SUPABASE_SERVICE_ROLE_KEY` for `uat` was
unprovable; a **plain** deploy fixed sign-in, so it is set, and **no `--secrets` deploy is needed for it**.

**`#uatsb`'s registry half shipped as #1777** — `SUPABASE_URL` is now declared in
`scripts/lib/runtime-config.mjs` and the host check derives from it. **It merged AFTER `0.47.8`'s cut, so
it is not in that release.** The item's title was rewritten to name only what remains.

**Open and not planned:** `#drvtk`, `#tstsh` (the inert `test123` shelter on production; **asked once,
never answered, do not re-ask unprompted**), `#stpbk`, `#aucbk`, `#pacon` (his own direction, briefed from
his words), `#egq18` (needs a deploy, so not a worktree job — still the one real gap against his ranked
list) and `#34a30`. **`#shsup` is partly shipped**: #1770 and #1779 built the enquiry schema and form.
**42 open items on `main`.**

## STILL OWED — the skill-file edits, now a SIXTH edition

**Nothing in `.claude/skills/plan-day/` has been touched since 2026-11-19, so all of `767`'s list stands
unchanged.** Carried forward rather than reworded, because rewording it five times is how it became
invisible:

- **Narrow the floor row to ~87.2-91.6k**, note that **exact repeats recur across days, briefs and
  unrelated streams**, and **OFFER NO CAUSE.**
- **Drop the band-table note about two bottoms nearer 135k.** Nothing has landed below **142,750** in
  thirty-two readings.
- **Lower the edit-is-not-an-audit row back toward the audit row.**
- **The `+10k` for looking STILL has no verdict** — `drive-scope-read` was the test and its brief was
  corrected mid-flight. **The next looking-not-driving stream needs a brief nobody has to touch.**
- **NEW, AND THE ONE WITH EVIDENCE: the specification discount has its first verdict** (above). Write it
  into the band table as a measured instrument, with #1770 and #1779 named.

## PROCESS NOTES

- **The hard sequence was kept at both setups:** sync, `new` per stream, briefs, `streams`, then the list.
  **Nothing was cleared and no PR body was read before the list went out.**
- **The briefs were ASSEMBLED BY SCRIPT**, from `brief-blocks.md`'s nine fenced blocks, with guards that
  throw if a block is missing, if a middle lacks `STEP ZERO`, if `.port` disagrees with the band header, or
  **if any of the eight verbatim blocks is not byte-identical in the output.** That last guard is the
  Backlog manager's byte-identical principle from `767`, applied to the planner's own output. **Keep it.**
- **He had to ask twice for the links.** *"Where are the links to the streams"* — a folder path is not a
  link. **Give `[slug](#local_…)` from `list_sessions` the moment he says a session is open**, and say
  plainly at setup that there is no session yet because the planner does not start them.
- **Transient `git fetch` failures hit `worktree.mjs done` twice** and cleared on a plain retry. **One of
  them left a merged branch alive on `origin`** after its folder and local branch were gone: check
  `git ls-remote origin refs/heads/claude/<slug>` after a failed `done`, and confirm the commit is an
  ancestor of `origin/main` before deleting it.
- **Meshnet dropped mid-day and came back on its own.** Two SSH attempts timed out **while the Pi was
  serving happily**. **Do not diagnose the Pi from a failed ssh; check what it is serving first.**
- **Every usage comment was read BEFORE its worktree was cleared**, as the 2026-11-17 decision requires.
  Eight for eight; none had to be recovered from a transcript.

## INTERRUPTIONS

**NONE WERE DEFECTS, AND THAT IS THE CHANGE FROM `767`.** His four messages that redirected work were
**his own decisions being taken**: batch 1 plus the Drive scope, two release-email answers, and the
production go-ahead. **Three touches against a target of two, and the extra one was the cut/batch race's
fault, not his.**

**He asked for progress twice** (*"how are we tracking"*, *"where are the links"*), and the second was a
planner failure to hand over what step (d) requires.
