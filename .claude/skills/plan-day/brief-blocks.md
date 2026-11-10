# The blocks every `.brief.md` carries

**Assemble a brief from this file rather than retyping these.** They are verbatim, each earned by a
real failure, and the planner's own notes on why are in `reference.md`. Add your own task half —
the item, the branch, the port, the numbered deliverables, what the stream does not own and who owns
it this batch, and the banding note — between blocks D and E.

**Do not water any of them down**, and do not change `scripts/check-test-plan.mjs` to be more
forgiving instead of carrying block E.

**One more block, not in this file because it is per-batch:** tell each stream to post its
`stream-usage:` comment immediately before `gh pr merge`, as a NUMBERED deliverable rather than a
closing paragraph — `CLAUDE.md`'s merge train has the exact one-line form, and both
`get_usage` and `get_session` need `session_id: "self"`. As prose in a closing paragraph it was
missed by the one stream that reached the merge by a different path; numbered, it has gone 3 of 3.

---

## A. TOP OF THE BRIEF — the finish line

Put this first, before the task. The finish line has to be read before the work, not after it. **For a stream that is two PRs (a schema half then an app half), add one line: this applies TWICE, because merging the schema PR is not finishing.**

```markdown
## WHERE YOUR FINISH LINE IS: an open PR, not working code

**You are not finished when the feature works. You are finished when the PR is open.** Working code
on a pushed branch with no PR is **invisible** — `gh pr list` shows nothing, the planner sees
nothing, and the next person cannot tell it from abandoned scratch.

**This has now happened twice in two days.** On 2026-10-12 a stream built an entire feature — 8
commits, 31 files, 1,414 lines — committed it, pushed it, and ended without opening the PR; it sat
unnoticed overnight and was nearly cleared away as a leftover. Another stream merged its schema PR
and stopped, leaving the half a user can see unbuilt, because its brief drew the line there.

So:

- **Commit and push as you go.** A commit is the only checkpoint that survives a session stopping.
- **If you must stop before the work is done, stop with words**: say plainly, in your last message,
  what is built, what is not, and what the next session should do. **Never end a turn with a built
  branch and no PR.**
- **If the work is done, open the PR before you report success** — then bind it with the `ccd_pr`
  tools, and treat the CI monitor as a nudge rather than a guarantee (`CLAUDE.md` says why).
- **"The code is written" is not a report of completion.** Say where the PR is.
- **AND A GREEN PR YOU DID NOT MERGE IS THE SAME FAULT ONE STEP LATER.** On 2026-11-07 PR #1356 was
  opened with every check green on its own head and its session ended without merging it; it sat
  `MERGEABLE` and invisible for an hour until the planner found it. **Opening the PR is the finish line;
  merging it on green is still yours** — `CLAUDE.md`, "Every PR merges on green": every PR, no approval
  round-trip, and you do not ask.
```

---

## B. Directly after it — the STOP rule

The ONE exception to block A, for a session that has already grown large. The two coexist; do not let this cancel A.

```markdown
## IF YOU ARE TOLD TO STOP, STOP — and do not tidy up from a large session

**"Stop" means stop the work itself, at once.** Do not finish the current unit, do not go back for
rows or files you listed earlier as not done, and do not start anything new. Then:

1. **Commit what you have.** Always. A commit is the only checkpoint that survives.
2. **Say in your last message** what is done, what is not, and what the next session should do.
3. **Then judge the size of this session.** If it has grown large — you have been running a long
   time, or your context is well past halfway — **STOP THERE.** Do **not** merge `origin/main`, do
   **not** fill in a test plan, and do **not** open the PR. Say plainly: *"the PR is still to
   open"*, and name the branch.

**Why, and it is not a detail:** every turn re-sends your whole context as input, so the cost of a
turn is the size of the session, not the size of the work. At 800k, writing one short test plan
costs as much as an hour of early work. A session that has already run long is the most expensive
possible place to do bookkeeping. **The planner will open the PR from a fresh session for a
fraction of the cost.**

**This is the ONE exception to the finish-line block above.** Everywhere else, and in every
ordinary-sized session, that block governs: never end with a built branch and no PR. Here, saying
clearly that the PR is still to open *is* the handover.
```

---

## C. Then — what goes to him, and nothing else

Added after three streams in one evening asked for permission they already had. Do not soften this into "use your judgement": what those streams lacked was a written statement that proceeding WAS the careful option.

```markdown
## WHAT GOES TO LUTAN — AND NOTHING ELSE DOES

**You have authority to do everything in this brief. Three things, and only these three, go to him:**

1. **A decision that is genuinely his** — a choice the brief names as his, or one that changes what the
   shelter does rather than how this code works.
2. **A step only he can perform** — his one production deploy command, a press inside the running app,
   a code from his authenticator.
3. **A blocker you have ESTABLISHED and cannot pass** — established by reading or running something,
   not suspected. Say what you tried.

**Everything else: proceed, and report it in your PR body.** Your step-zero result, a design judgement
this brief asked you to settle, an unexpected finding, a deliverable you chose not to do — **all PR-body
material, none of it a question to him.**

**AND A CONDITIONAL PERMISSION DIES WITH ITS CONDITION.** If this brief lets you do something lesser
*because* of a blocker — open the PR partly built, skip a proof — **that permission is void the moment
the blocker clears.** Do not come back and ask whether it still applies. **Re-read the condition; if it
is gone, so is the permission.**
```

---

## D. Then — STEP ZERO

Fill in the greps for THIS stream, and paste what the planner already verified, with its timestamp. Keep the last paragraph: step zero catches the rare already-shipped case, it does not make a stream seek permission.

```markdown
## STEP ZERO, BEFORE ANY CODE: prove this is not already built

Five items were offered as workstreams on 2026-10-21 and **all five were already shipped**, because
the planner trusted the items' prose over the decision files and the commits. Do not repeat it.
Before writing anything:

1. <the one grep that tests THIS stream's premise>
2. `ls docs/decisions/ | grep -i <subject>` and `git log -S "<a distinctive symbol>" --oneline | head`
3. Read the file the work lands in and confirm with your own eyes that the gap is still there.

**What the planner already verified, so you start from evidence rather than from scratch:** <paste it>

**If your checks show it has already landed, STOP and say so** in your last message, with the commit
or decision file that did it. Do not build it again, and do not open a PR. **That is a successful
outcome for this stream, not a failure.**

**AND IF YOUR CHECKS SHOW THE GAP IS STILL THERE — WHICH IS THE ORDINARY CASE — SAY SO IN ONE LINE AND
CARRY ON. DO NOT STOP, AND DO NOT ASK ANYONE WHETHER TO BUILD.** You were given this work because the
planner believes it needs doing; step zero catches the rare case where it has already shipped, it does
not make you seek permission you already have. **Report your step-zero result in your PR body, not as a
question to Lutan.**
```

---

## E. Before the end — make the test plan pass the checker first

The four traps are the whole value; three of six wasted commits were the two-space one, which no care catches by eye. **The template is the authority** — if this block and `docs/test-plan-template.md` disagree, the template is right and this is stale.

```markdown
## Before you push: make the test plan pass the checker FIRST

**Do it in this order, and do not push between steps 1 and 4:**

1. Commit the code.
2. Fill the test plan in **completely** — every box, the header's
   `Tested at SHA` (`git rev-parse --short HEAD`), the gates, both signature
   lines, `Result:`.
3. Run **`node scripts/check-test-plan.mjs`** and **`node scripts/gates.mjs`**.
   Fix everything they print, then run them again until clean.
4. *Then* commit the plan, push, and open the PR.

**The four traps, each of which has already cost a commit:**

- **The sign-off line needs TWO OR MORE SPACES before `Date:`.**
  `Automated checks by: <name>  Date: <yyyy-mm-dd>` — one space fails, and one
  space looks **identical** on screen to two. Same for `Manual verification by:`.
- **`Result:` must be exactly one of `pass`, `pass with accepted defects`,
  `fail`** — no other wording, and `fail` does not merge.
- **Every box is ticked or marked `n/a: <reason>` with a real reason** (three
  characters minimum). A bare `n/a` fails, and so does an untouched `- [ ]`.
- **`n/a:` and `pending:` lines carry NO date; a name does.** Use
  `pending: <what is outstanding>` when the work is done and a person genuinely
  needs to look — that is a legitimate state, it reports as *awaiting*, and it is
  not a failure.

**THE CI LINE IS NEVER TICKED. LEAVE IT `n/a` AND DO NOT COME BACK TO IT.**
Corrected 2026-10-22: this block told streams to tick it in a follow-up commit,
and **the template changed on 2026-10-20 to forbid exactly that** — so the brief
has been contradicting the checklist it is meant to help pass. Write
`n/a: not yet — the PR does not exist at this commit` and **leave it there.**
The reasoning is on the template line itself: a follow-up commit **invalidates
its own evidence**, because a new HEAD means a new run, so every PR was paying
**two full CI cycles** to transcribe a result GitHub already records permanently
against the commit. **Do not pre-tick it either.**

**What replaces it is a MERGE step, not a checklist line:** before merging, read
the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`)
and **confirm `headSha` matches**. Merging on an older run's strength merges a
commit whose CI never finished.

**And the general lesson, which is why this correction is worth its space:** a
brief block that quotes a checklist goes stale when the checklist changes, and
nothing tells you. **When you write a brief, the template is the authority** —
if this block and `docs/test-plan-template.md` disagree, the template is right
and this is out of date. Fix it here when you notice.

**A red `test-plan` is always someone's mistake to fix.** It is never noise and
never "nobody has signed yet" — a correct-but-unsigned plan exits 0 by design. So
if it is red, read what it says rather than pushing again to see.
```

---

## F. Beside it — a red `audit` cannot block the merge

He was asked about this five times in five minutes across three streams. Every answer was correct and none of them needed him.

```markdown
## A red `audit` check CANNOT block your merge — do not wait on it, and do not ask about it

`audit` is `continue-on-error: true`. It **cannot fail a CI run and cannot block a merge** —
verified across 30 pull-request runs. If it is the only red on your PR, **there is nothing to wait
for.**

What it asks of you, and all it asks: **read the advisory in the job log**, establish whether the
flaw is reachable in this app, and **write what you concluded in the PR**. Fix it only if the fix
is not worse than the finding.

**If there is NO advisory in the log, the job was inconclusive, not red for a reason.** It has been
seen to hang on the registry for five minutes and be terminated, with no output at all — the same
job passes in ten seconds elsewhere. **Say in the PR that the audit was inconclusive and carry on.**

**Do not ask Lutan about a red `audit`** unless it is red *and* an advisory names something
reachable. He was asked five times in five minutes on 2026-10-22, and the answer was the same
every time.

**Never** change either audit workflow to make the red go away, and **never** run
`npm audit fix --force` — it is free to move a dependency backwards across a major version.
```

---

## G. For any stream that RUNS check scripts — a silent check is a killed check

Omit for a stream that runs nothing. The planner's half: do not ask a stream to run something you have not sized, and name the slow ones. Most check scripts take NO arguments.

```markdown
## Running the checks: a silent check is a killed check, not a broken one

- **Start the dev server first** and confirm it is serving. Eighteen checks were once filed as broken because a
  sweep ran with no server up, and **seven of them had never been broken.**
- **Put a per-check timeout on every run of a `scripts/check-*.mjs`:** `timeout 60 node scripts/check-<name>.mjs`. The limit exists to catch a check that hangs. **If one trips it, re-run it ONCE WITHOUT the limit before filing anything, and file only if it is still wrong:** a slow check is not a defect. Known slow ones: `check-migration-grants.mjs` about **3 minutes** (it replays migrations), `check-public-views.mjs` over 60 seconds. Most take 1–3 seconds.
- **THAT 60 SECONDS IS FOR `scripts/check-*.mjs` ONLY, NEVER FOR `gates.mjs`.** The check scripts take 1–3 seconds; `node scripts/gates.mjs` runs typecheck, lint, test and a full `next build` and takes **about five minutes**. **Run the gates with no timeout, in the background, with output to a file in your scratchpad, and wait for them.** (#1168 timed them out at 60 s and reported "lint/test/build did not finish locally"; a killed gates run proves nothing.)
- **Echo the name BEFORE each check runs**, not after, so a killed command still shows where it got to.
- **Never loop over a list you have not sized**, and never over all of `scripts/check-*.mjs`.
- **Anything you expect to run long goes in the background with its output redirected to a file in your
  scratchpad** — never in the foreground.
- **If a check gives you NO output, establish whether it was killed before concluding it is broken.**
  "No output" is not evidence of a fault.
```

---

## H. Then — report every deliverable, including the ones you did not do

Mechanism, not hypothesis: it fired on the two batches after it was written.

```markdown
## REPORT EVERY DELIVERABLE, INCLUDING THE ONES YOU DID NOT DO

**A stream once shipped its main task, reported `finished=yes`, and silently dropped two of its four
deliverables** — one of them a decision Lutan had made that morning. Nothing caught it; the planner found
it by grepping `main` a day later. **Your PR body must account for EVERY numbered deliverable in this
brief**, one line each, done or not done and why. A deliverable you skip is a legitimate outcome **said out
loud** and a fault **left silent**.

**AND BEFORE YOU WRITE "done" AGAINST A DELIVERABLE, OPEN THE FILE AND LOOK.** A PR body is a claim about
the repository and it is believed by everything downstream. #1113 reported *"`audit.ts` writes both —
done"*; it was never written, its decision file repeated the claim, and a merged migration's `-- consumer:`
header pointed at a file that did not consume it. **CI, the test plan, the backlog tick and the usage
comment were all green.** Accounting for a deliverable is not the same as checking it landed.

**AND IF A DELIVERABLE'S OUTCOME IS A BACKLOG NOTE, IT IS THE PLANNER'S TO FILE, NOT YOURS.** On
2026-11-02 a stream reported *"Reported, not fixed. Backlog note added"* and nothing had reached
`docs/backlog.md`. **Write the finding into your PR body in full and say "for the planner to file". Do
not claim to have filed it, and do not add items to `docs/backlog.md`** — the only edit to that file that
belongs in your PR is ticking your own item.
```

---

## I. As a NUMBERED DELIVERABLE — the finishing sequence

Went 6 of 6 against 4 of 10 for three rewordings of the old gates/CI-wait block. What matters is the READ step, not the run.

```markdown
**THE FINISHING SEQUENCE, AS A DELIVERABLE WITH ITS OWN READ STEP.** Run `node scripts/gates.mjs` **in the
background**, output redirected to a file in your scratchpad, and **wait for it** (typecheck, lint, test and a full
`next build`, about five minutes). **Then `cat` that file yourself and paste the four-gate line with its four exit
codes into your PR body.** Do **not** end a turn saying you are waiting to be notified: nothing will notify you. Two
streams did exactly that on 2026-11-02 and sat idle until nudged. Reading the file is the deliverable, not running
the command.
```
