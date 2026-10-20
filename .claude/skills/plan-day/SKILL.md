---
name: plan-day
description: Plan the backlog as three sequential batches of three workstreams, then set up one batch at a time — sync main, read the backlog, order nine items, create the current batch's worktrees, and remember the plan so the next run resumes instead of re-planning. Use when the user asks to plan the day, pick workstreams, start or set up the next batch, or "what should we work on".
---

# Plan the day's workstreams

You are the integrator. The user opens one Claude session per workstream;
your job is to order the backlog into batches that can be built without
colliding, and to set up one batch at a time so each session can start
with "go". Paths below are absolute because this skill runs from any
checkout.

**Nine items, three batches of three, built in order.** The user works in
chunks of three and averages 6–9 backlog items per release, so a full
plan is roughly one release. Planning all nine up front means one
planning conversation per release instead of one per batch — but only one
batch's worktrees exist at a time.

## 0. Resume, or plan from scratch?

Look for `C:/Development/Animal_Shelter_App/.plan-day.md`. In a fresh chat,
read `docs/planner-handover.md` first.

**If it exists and has a batch not yet set up, this is a resume — do not
re-plan.** Still do step 1 (`main` moves between batches; that is the
point), then:

1. Check the current batch has actually landed. If streams from it are
   still open, name them and ask before setting up the next one —
   silently running six live worktrees defeats the cap.
2. Re-check the next batch against the backlog as it is *now*: are its
   items still open, still unblocked, still non-overlapping? Has
   something merged since that collides? Is the migration slot free?
3. Report what changed, if anything, then go to step 7 and set that
   batch up.

Re-plan from scratch when the user asks for one, when the saved plan's
items are all closed, or when the plan is from an earlier day and the
backlog has moved under it. Otherwise resume.

## 1. Sync `main` (the daily step in CLAUDE.md "The main checkout")

In `C:/Development/Animal_Shelter_App`: it must be on `main` and clean.
If it is on a `claude/*` branch or dirty, **stop and report** what is
there — the user decides whether to commit, stash or move it into a
worktree — then continue once it is clean. Then:

```
git -C C:/Development/Animal_Shelter_App checkout main
git -C C:/Development/Animal_Shelter_App pull
git -C C:/Development/Animal_Shelter_App merge backlog
node C:/Development/Animal_Shelter_App/scripts/check-backlog-sections.mjs   # stop here if it fails, before the push
git -C C:/Development/Animal_Shelter_App push
git -C C:/Development/Animal_Shelter_Backlog merge --ff-only main
git -C C:/Development/Animal_Shelter_Backlog push
```

(`check-backlog-sections` run from the main checkout reads **`main`'s** copy of `docs/backlog.md`, not the backlog worktree's — if you just edited the other folder, a stale count is expected until the merge above has brought it in.)

(The post-merge hook pushes both merges too; the explicit pushes cost
nothing and do not depend on `core.hooksPath` being set.)

## 2. What is already in flight

`node C:/Development/Animal_Shelter_App/scripts/worktree.mjs list`.
Live `claude/*` worktrees count toward the cap of three **for the current
batch**. Flag any that show "nothing beyond main" with no PR open as
leftovers to `done` — but only if `held` says `free`. A `HELD` worktree
has a session or a process in it; name it and ask rather than tearing it
down. List any husks it prints so the user can clear them.

**Capture actuals now — this is the only chance.** For each worktree whose
PR has merged and whose session is still running, find the session in
`mcp__ccd_session_mgmt__list_sessions` (match on its folder) and call
`mcp__ccd_session_mgmt__get_usage` with that `session_id`; record
`context.tokensUsed` against the slug in `.plan-day.md` (step 6). Once a
session closes the figure is gone; if it reports `unavailable`, write
`unmeasured`, never a guess.

## 3. Read the backlog

`C:/Development/Animal_Shelter_App/docs/backlog.md`, open items only
(`- [ ]` above `## Completed`). Section order and item order are the
user's priority; keep that as the default ordering. For each candidate
note:

- **Already done?** — **check this first, and trust it over the item's own
  status notes.** Two commands settle it: `ls docs/decisions/ | grep -i
  <subject>` and `git log -S "<a distinctive symbol the item names>"`. A
  decision file or a commit dated before the item's status note means the work
  shipped and nobody updated the item. **An open item is not proof the work is
  undone, and a status note saying "still open" is not proof either.** On
  2026-10-07 this cost four streams in two batches: three on a public-site
  redesign built 2026-09-26, and one on a deceased-archive gap fixed
  2026-09-24 whose item still read "still open: gap 4" eight days later.
  **Testing the item's claim is not the same as finding a line that agrees
  with it:** that second failure grepped the constant the item named, which
  was real, while the fix sat on another code path. Ask whether the behaviour
  the item describes still happens, not whether the code it names still exists.
- **Who does it** — Claude-buildable, or user-driven (physical setup like
  the Pi, dashboard clicking, a guided walkthrough, "decide with the
  user" as the main content). User-driven items are reminders, not
  streams.
- **Dated / blocked** — "from ~2026-09-28", waiting on an account, a
  prerequisite item still open.
- **Area** — the routes, directories and tables it touches, from the
  file references in the item. This is what decides overlap.
- **Schema** — does it need a migration? Then it is a schema PR first
  and a feature branch after (CLAUDE.md "Database migrations").
- **Depends on** — does it read a column, or reuse a component, that
  another candidate creates? That fixes which batch it can go in.
- **Size** — a quick win, a day, or more.

## 4. Choose — nine items, in three batches

Rules, in order:

1. **Backlog priority is the default order across all nine.** Depart
   from it only for the reasons below, and say so when you do.
2. **Disjoint within a batch; overlap across batches is fine.** Batches
   run one after another, so two items that both add nav entries, both
   rework the same topic in `src/lib/manual/en.ts`, or both touch the
   same hub tab are no longer mutually exclusive — put them in
   *different batches*. This is what makes nine items plannable where
   three were a squeeze. Inside one batch the old rule still holds: two
   streams that collide are one stream, not two.
3. **At most one migration-carrying stream per batch** (CLAUDE.md's
   one-in-flight rule, applied per batch because batches are
   sequential). If two items in one batch need schema, either fold them
   into a single schema PR or move one to the next batch.
4. **Schema-first items span adjacent batches** — the schema PR in batch
   N, its feature branch in batch N+1, never the same batch. The feature
   needs the migration on `main` and applied to dev first.
5. **Dependencies flow forwards.** An item that reads another's column or
   reuses its component goes in a later batch.
6. **Mix sizes within each batch** — one quick win per batch keeps the
   merge train moving and gives the user something to review early.
7. **Nine is a target, not a quota.** If the backlog does not hold nine
   Claude-buildable, unblocked items, plan fewer and say why. Padding
   the list with user-driven items to reach nine is the failure mode to
   avoid — those stay reminders in **Not today**.
8. **Fold small items into one stream.** Every stream pays a ~80k floor
   before any work (see *Token estimates*), so three quick wins as three
   streams cost ~240k of floor; as one stream, ~80k. Disjointness
   decides what *can* share a stream; this decides what *should*. Worked
   example: batch 73's `stock-pages-finish` folds three items.

When the third batch is planned, note that cutting a release is the
natural step once it merges.

## 5. Present

Three tables, one per batch, each with `#`, feature slug (`kebab-case`,
becomes `claude/<slug>` and `Animal_Shelter_<slug>`), the backlog item's
bold title, area, migration yes/no, **model and effort**, estimated tokens
(a **band**, from the bands below), and one line on why now. Under the
tables, one line: *token figures are context-window size, a measure of
scale, not a bill.* Give each batch a line saying what makes it a batch —
what its three share, what it unblocks for the next one, which dependency
fixed the order.

Give every stream a recommended **model** and **effort** — never leave the
cells empty; name the default rather than omitting it. Put the reason in
the "why now" line when it departs from the default. See *Model and
effort* below for the defaults and, more importantly, for how little
evidence there is.

Below the tables: **Not today** — user-driven items that are due or close
(one line each), and anything blocked with the reason.

Then **one** `AskUserQuestion`: multi-select over **batch 1's** streams to
confirm or swap, since those are the ones about to be created. Say in the
question that batches 2 and 3 are saved and can still change. Do not ask
a question per batch — the whole plan is visible above it.

## 6. Save the plan

Write `C:/Development/Animal_Shelter_App/.plan-day.md` (gitignored, and
it must stay that way — it is local day-scoped state, not a repo
artifact). Markdown, readable: the user may well open it.

It holds the date planned, and per batch a status (`pending` /
`set up <when>` / `merged`) and its three items with slug, bold title,
area, migration flag and the one-line why. Record any dependency that
fixed the ordering, so a later run does not have to re-derive it.

Keep the statuses current: mark a batch when you set it up, and mark it
merged on a later run once its PRs are in.

Keep a line `Workstreams since handover: <n> (last handover <date>)`: add
the batch's stream count when you set it up.

Keep a `slug | model | effort | scale | estimated | actual` table: the
estimate when a batch is set up, the actual when step 2 reads it. Writing
both is what lets the bands below correct themselves from recorded work.

Record the model and effort the stream **actually ran on**, which
`mcp__ccd_session_mgmt__get_session` reports as `model` and `effort` — not
what you recommended. The user sets them in the session's model menu and
may choose differently, or may have started the batch before you
recommended anything (he did on 2026-10-11, so that batch's
recommendations applied to nothing). Reading a recommendation as the
setting produces a false finding.

### Token estimates (provisional — revise from the actuals)

**START HERE: AN ORDINARY WELL-BRIEFED STREAM COSTS ABOUT 128k, WHATEVER IT IS.**
Promoted into this file 2026-10-21 from the handover edition that measured it, so
no future handover has to carry it. On 2026-10-20 four of nine streams landed
within **4,000 tokens of each other**: `stock-receipts-immutable` 126,512 (a
migration, a trigger and rulings on four permission findings),
`nfc-medical-jobs` 127,979 (routing an existing link into an existing picker),
`prescription-dose-schema` 128,114 (a column, a back-fill and a proof harness) and
`release-tooling-fixes` 129,848 (four unrelated small items folded into one
stream).

**Four unlike jobs, one thing in common: each brief named its files, its decision,
its boundary and what it must not touch.** So the number to start from is the
**floor (~85k) plus ~43k of messages**, and then add only for the shapes in the
table below. **Do not add for "it touches a lot of files" or "it has several
parts"** — those four readings are the counter-example, and the most intricate
*judgement* of that round is one of them. **Intricacy of judgement is not what
spends tokens; unbounded scope is.**

Two axes that genuinely do cost, both measured 2026-10-20:

- **Does it CREATE a surface people submit data through, or ROUTE INTO one that
  exists?** Same band given to both, 108k apart: 235,561 for a new public form
  with rate limiting and a staff screen, 127,979 for routing into working pages.
- **Is there an existing caller, credential path and schema to hang a new
  integration on?** All three exist → an ordinary feature, however new the
  behaviour sounds. `two-way-calendar-app` was banded 250–320k as a new transport
  path and came in at **153,821**, because the cron, the Google client and the
  schema were all already there. **Reserve 250–320k for a stream with no existing
  piece to extend.**

| scale | band | shape |
|---|---|---|
| **Ordinary well-briefed stream — the default** | **120–145k** | 126,512 · 127,979 · 128,114 · 129,848 (2026-10-20) |
| Floor | **~84–85k** | every stream, before any work: tools, memory, skills, CLAUDE.md, brief. Measured across nine streams 2026-10-20: System tools 38.7k · MCP 16.3–16.7k · Memory 11.9–12.0k · System prompt 8.6k · Skills 6.6k. **Corrected 2026-10-11 from ~110k and drifting slowly down since; re-measure rather than carrying a number forward.** The original 30k error was inherited by every band below, which is most of why the older ones read high |
| Routing into surfaces that already exist | **120–165k** | 127,979 · 119,265 |
| A new integration on existing machinery | **145–180k** | 153,821 |
| Schema with a public write path / RLS to get right | **145–185k** | 159,976 |
| Replacing an existing screen | **155–200k** | 169,220 |
| Reads very widely and edits many call sites | **185–250k** | 200,612 — **reading widely is cheap; editing many call sites is what cost** |
| **Creates a new surface people submit data through** | **200–270k** | 235,561 |
| Builds an instrument / transport path from nothing | **250–320k** | 286,350 — **one reading only, and nothing since has belonged in it. Do not widen a stream into this row because its behaviour sounds new** |
| Quick win | 110–170k | 1–3 files; screenshots cost far less than first assumed. **Left as written on Lutan's ruling, 2026-10-11** — the planner had been quoting 130–200k while both measured quick wins (129,320 · 135,901) sat *inside* this band. **The band was right and the quoting was high. Do not reopen it** |
| Schema PR | **~140–155k single-file · 230–285k with code** | measured 6×: `cashflow-forecast-function` 139,791 · `drop-leftovers-schema` 143,030 (three unrelated items in one file) · `receipt-issuer-server-side` 143,678 · `map-rooms-schema` 151,273 · `role-floor-schema` 231,297 · `perm-functions-schema` 284,248 |
| Medium | **170–290k** | 5–15 files, browser checks, both dictionaries. Measured: `residents-list-sort` 166,843 · `vaccine-stock-forecast` 188,913 · `perm-policy-cleanup` 206,567 · `who-does-what-edit` 210,888 · `place-order-settings` 282,082 |
| Large | **340–460k** | rebuilt pages, many files, or a whole-system read. Measured: `perm-drop-enum` 352,802 · `medications-diets-split` 361,651 · `fable-architecture-review` 448,294 (**fable-5-1 at `xhigh` — two dials, not comparable**) · `who-does-what-view` 449,014 |

Measured 2026-10-08 (batch 72): `account-menu-min-width` quick 129,320
(est. 180–280k); `place-order-settings` medium 282,082 (est. 300–450k);
`medications-diets-split` large 361,651 (est. 400–600k). The figure is
the window, not billed tokens — each turn re-sends it, mostly cached.
Auto-compact starts at 97% of 1M, so a stream past ~970k spent more than
its figure shows. Reasoning: `docs/decisions/2026-10-08-plan-day-token-estimates.md`.

**Estimate by what the stream must find out, not by files touched — and
give a band, never a figure.** The bands above have been wrong by +50% and
−39% in consecutive batches. Before estimating, ask **must this stream
BUILD something to measure with?** If it must, widen the band and say in
the brief that the counting is the deliverable. A brief can name every
file and still sit on an open-ended measurement: `who-does-what-view` was
fully briefed and ran +50%, because establishing which of 300 permission
boxes the system actually obeys meant writing
`scripts/check-who-does-what.mjs`, and **that script was the work.**

**Reading a long list of files is NOT that, and the band must not be
widened for it.** Corrected 2026-10-11: `silent-empty-reads` faced 64
candidate files, eight named as a stated lower bound, each needing a
judgement — it was banded ~250–400k on exactly the reasoning above and
**came in at 133,986, barely over the floor.** The axis is not "must it
count?" but "must it build the instrument?" Reading is cheap; building
the instrument is not.

**THE THIRD AXIS, AND THE ONE THAT COST THE MOST: HOW MANY LIVE
INTERACTIONS?** Added 2026-10-18 after `fable-acceptance-dry-run` was banded
300–460k and reached **819,980 at about 35% done** before Lutan stopped it. By
the test above it looked cheap — `scripts/acceptance-matrix.mjs` already
existed, so it did not have to build its instrument. **What it had to do was
drive 132 activities + 42 "must not" lines, × 6 roles × 2 languages × 2
widths, by real taps in a browser.** Extrapolated, a complete run was **~2.3M
tokens, more than two context windows**: unfinishable in one session at any
effort, on any model.

So the questions are now three, in this order:

1. **Must it build the instrument?** Dear. Widen.
2. **How many live interactions must it drive?** **Dearest, and it scales with
   the row count.** Reading 64 files is 64 cheap calls; driving 132 screens is
   thousands of expensive ones, each returning a page into the context.
3. **Must it merely read a lot?** Cheap. Do not widen (the `silent-empty-reads`
   correction above).

**A WALK OF N ITEMS × M ROLES IS A PROGRAMME, NOT A WORKSTREAM.** Do not brief
one. Split it into finishable units — one role per stream for the acceptance
dry run — and say so to the user as a plan rather than handing a stream an
unbounded walk. **Nine is a target for items, never a licence to pack an
unfinishable one into a single brief.**

**EVERY BRIEF NEEDS A HARD DELIVERABLE BOUNDARY**, not only the scope-creep
escape. The escape ("build the rest, report that one, stop") was given to three
streams that day and **left off the largest**, which is the one that needed it.
Name the unit the stream stops at.

**AND THE COST OF A TURN IS THE SIZE OF THE SESSION, NOT THE SIZE OF THE
WORK**, because every turn re-sends the whole window as input. Measured the
same day: that session's context grew **21,282 tokens** while the weekly Fable
window moved **41% → 47%** — about a whole ordinary stream's allowance — and
all of it went on merging `main`, filling a test plan and opening the PR at
~800k. **The first minute of a session is its cheapest and the last is its
dearest.** Hence the stop-and-hand-over rule in step 7.


### Model and effort

**Two dials, and they do not behave the same way.** **Model** changes the
price per unit of work, not the amount: the ~80k floor is identical
whichever model runs, so **choosing a cheaper family is the only dial that
reduces usage without changing the work.** **Effort** changes how much
thinking happens per turn, so raising it **raises** the figure. It buys
care and it costs. **It is not a usage optimisation and must never be
presented as one.**

**Never raise effort to fix an overrun.** Batch 88's three all ran over
because each had to count something first; more thinking per turn would
have made those figures worse. The cure is a tighter brief or a spin-out.

**Defaults by shape, to be revised from the actuals:**

- **Default: `claude-sonnet-5-5` at `low`.** It has cleared a permissions
  migration, an app conversion and an audit, all under estimate.
- **Carries a migration, changes permissions, or could over-grant
  silently** → still Sonnet/low on current evidence, but this is where to
  spend if anything looks shaky. Nothing here shows the fault on a screen.
- **Review or report work with no code change** → Fable, which is metered
  in its own weekly bucket and is routinely unused.
- **A stream that must discover its own scope** → fix the brief, not the
  dials.

**State plainly how much evidence there is, because it is thin.** Every
stream measured before 2026-10-11 ran `claude-opus-5-5` / `medium` and
spread −9% to +50%, so that entire variance was task shape. Batch 89 then
ran `claude-sonnet-5-5` / `low` and came in 23–39% under on all three —
**but its briefs were also far more prescriptive and its measuring script
already existed, so the model cannot be credited.** **Vary one dial per
batch** and let the table accumulate.

**Check the plan windows first** (`mcp__ccd_session_mgmt__get_usage`): if
*Weekly · all models* is high with days left, the cheaper model on the
batch's lowest-risk stream is the real mitigation, and *Weekly · Fable*
sitting unused is worth spending on the backlog's Fable items rather than
letting it expire.

### NEVER BLOCK HIS PAID USAGE — a hard rule, not a preference

Promoted into this file 2026-10-21. It had been carried as "the biggest thing
on this page" by every handover edition while living nowhere permanent, which
is precisely the fault the delta rule in step 8 exists to fix: **the most
important rule in the loop was in the one document that gets replaced every
nine streams.** Also in memory as `never-block-paid-usage`.

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block
like this, it's actually unethical for you to block the usage I paid for."***

- **Report the figures in the first message**, and forecast in one line what
  will get done.
- **Then work. Never refuse to start, and never ask permission to begin**,
  however little is left.
- **A forecast is not a refusal.** Say what you expect to cost and carry on.
- **Mid-work exhaustion is different and still correct:** stop with words,
  saying what is done and what is not.
- **Never put a numeric stop threshold in a brief.** Not once, not as a
  safeguard, not as a suggestion.

**Model, effort, which allowance gets spent, and whether to start at all are
all his.** A reading of *Weekly · Fable* is never spare headroom either: Fable
draws on the same weekly allowance (memory: `fable-counts-against-weekly`), so
"the Fable window is only half used" is not a reason to schedule Fable work.

## 7. Set up — the current batch only

For each confirmed stream in that batch, in sequence (each `npm ci`
takes a minute):

1. `node C:/Development/Animal_Shelter_App/scripts/worktree.mjs new <slug>`
2. Write `C:/Development/Animal_Shelter_<slug>/.brief.md` (gitignored):
   the backlog item verbatim as the task, the branch name, the port, and
   for a schema-first item which half this stream is. Keep it to what a
   fresh session needs; CLAUDE.md covers the rest — **except the
   pre-push test-plan block below, which every brief must carry.**

### Every brief ends with this block, verbatim

**Lutan, 2026-10-12: "the streams seem to be making errors in the test plan
when they submit the CI. Can we add something into the brief that gets them to
make sure it's right before they submit the CI rather than us reworking all the
time."** He is right, and it is the planner's gap, not the streams'. `CLAUDE.md`
already says to run the checker before pushing; **the briefs did not repeat it,
and the brief is what a fresh session actually reads first.**

Measured: **six commits across batches 94 and 95** were spent fixing a test plan
*after* CI went red, every one of them on **format, not content** — `15b5ef9f`
"fix the CI line so the checker accepts it", `d98c3317` "sign-off line in the
format the checker reads", `d1175619` "gates and SHA", `be8948e4` "record gates
in the test plan", `36dce481` "gates result", `7c613d74` "the
manual-verification tick gets a reason while it is pending". **All six were
catchable locally in one command.**

Append this to every `.brief.md`, changed only where a stream genuinely differs:

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

**One follow-up commit IS legitimate, and only one.** The template's CI line
cannot be true in the commit that creates the PR, so leave it
`n/a: not yet — the PR does not exist at this commit` on the first push and tick
it once you have **seen** the run go green. **Do not pre-tick it** — a green you
have not seen is the exact failure the checklist exists to prevent.

**A red `test-plan` is always someone's mistake to fix.** It is never noise and
never "nobody has signed yet" — a correct-but-unsigned plan exits 0 by design. So
if it is red, read what it says rather than pushing again to see.
```

**Do not water this down to "remember to run the checker".** The four traps are
the whole value: three of the six commits were the two-space one, which no amount
of care catches by eye.

**Do not change `scripts/check-test-plan.mjs` to be more forgiving instead.**
That script's strictness is deliberate and `CLAUDE.md` documents at length why it
must not be loosened or given `continue-on-error`. The fix belongs in the brief.

### Every brief also OPENS with this block, verbatim

**The misses of 2026-10-12 and 2026-10-13 were handoff failures, not thinking
failures**, and this is the block that closes them. Two streams in two days
looked finished and were not: one **built an entire feature — 8 commits, 31
files, 1,414 lines — committed it, pushed it, and ended without opening the
PR**, which sat unnoticed overnight and was nearly cleared away as a leftover;
the other merged its schema PR and stopped, leaving the half a user can see
unbuilt, because its brief drew the line there.

**Lutan asked on 2026-10-13 whether these justified raising model or effort.
They do not, and the answer is on the record** (`docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`):
both misses happened at a **handoff**, in the gap between the work and the PR,
and **effort buys care within a turn — it cannot make a session that has
stopped open a PR**. Raising it would also have raised the figure, with the
weekly window at 78%. **So the fix is the brief. Do not reach for the dials for
this class of miss**, and do not let a later run re-argue it.

Put this at the **top** of every `.brief.md`, before the task itself — the
finish line has to be read before the work, not after it:

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
```

**Add one line for a stream that is two PRs** (a schema half then an app half):
*this applies **twice**, because merging the schema PR is not finishing.* That
is the exact trap the second stream fell into.

### And every brief carries this STOP rule beside the finish-line block

Added 2026-10-18. **The finish-line block above stays exactly as it is** — it
exists because two streams ended with finished work and no PR, and that holds
for every ordinary stream. **This is a narrow exception to it, for one
condition only: a session that has already grown large.**

`fable-acceptance-dry-run` was asked to stop at about 35% and then (a) walked
more rows its own report had already listed as not reached, and (b) did the
correct, brief-mandated tidy-up — merge `origin/main`, fill the test plan, open
the PR, tick CI once seen green. **(b) was obedience, not error.** But at ~800k
of context each of those turns cost ~800k of input, and the tidy-up alone spent
about 6% of the weekly Fable window — roughly a whole ordinary stream.

**The brief gave it no stop condition at all.** It said walk the checklist; the
only stopping rule was *"if you must stop before the work is done, stop with
words"*, which is the stream's own judgement, not a response to being told to
stop. Append this to every `.brief.md`, directly after the finish-line block:

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

**Do not water this down, and do not let it cancel the finish-line block.** The
two coexist: finish the work and open the PR *unless* you were told to stop and
the session is already large.


**And the planner's own half of this, in step 2:** read `worktree.mjs list`'s
**`ahead`** column against the open PRs every run. **Ahead with no PR is
unsubmitted work, not a leftover** — `done`ing it destroys a day's build. **Ahead
with a merged PR is a leftover**, because a squash-merged branch stays ahead for
ever.

**Do not create all nine worktrees.** CLAUDE.md caps live worktrees at
two or three — more than that and merging becomes the bottleneck — and
nine folders would each cost an `npm ci` and go stale before their turn.

On a resume, re-read the backlog item **fresh** when writing the brief.
It may have been reworded or reprioritised on the `backlog` branch since
the plan was saved: the saved plan holds the ordering, the backlog holds
the task.

## 8. Finish

One line per stream: folder, port, and that the session should be opened
on that folder — its first move is to read `.brief.md`. Then one line
saying that once these have merged, running `/plan-day` again sets up the
next batch without re-planning.

**At nine or more workstreams since handover**, end by telling the user, in
this order: (1) update `docs/planner-handover.md` now, in this chat, while the
context exists — offer to do it; (2) then start a fresh chat for the next
`/plan-day`. Reset the counter to 0 with today's date once the handover is
written. Why: `docs/decisions/2026-10-08-planner-handover-counter.md`.

### THE HANDOVER IS A DELTA, AND IT HAS A CEILING

**Lutan, 2026-10-20: *"can you just do a delta change to the handover? that's
what the release handover does now"*, and *"this rule should only be for your
stream and the release stream — just for the handover documents."*** The release
side has had this since the same day (`docs/release-procedure.md`, "The paperwork
has a time budget too", rule 4). This is the planner's half of it.

**Aim for about 100 lines and treat 150 as the limit.** The edition of 2026-10-20
ran to roughly 400, and by its own author's measurement the writing — not the
worktree, not CI, not the merge — was the largest single cost of producing it.

Three rules, mirroring the release handover's shape:

1. **Say what CHANGED since the last edition**, not what is true in general. Open
   by correcting the predecessor where it was wrong or over-cautious, then carry a
   short list of what each of its warnings actually did — **fired, held, or now
   closed** — with a running tally where one exists. The release handover is the
   worked example; read it before writing this one.
2. **Promote durable facts ONCE, do not recopy them.** A fact that will still be
   true in three rounds belongs in this skill (the bands, the loop, the brief
   blocks) or in `CLAUDE.md` (the workstream rules) — **not** in a document that
   gets rewritten every nine streams. Move it, then cite it.
3. **Cite `.plan-day.md`, do not repeat it.** The per-stream measurement table,
   the batch composition and the dependency notes already live there. The handover
   says what they *mean*; it does not reproduce them.

> **THE ONE THING THE DELTA MUST NOT COVER: anything read from the repo.** Open
> item counts, the blocked lists, migration numbers, PR numbers, release state and
> the candidate list are **re-read every time, from the repo, and never diffed
> against the previous edition.** That saving is not available here, and taking it
> reintroduces the exact fault that cost Lutan decisions he had already answered
> twice: a stale sheet carried forward reads as current, and nobody re-asks a
> question they believe is already with the user. **Short prose, fresh facts.**

**SCOPE: this applies ONLY to the two handover documents** —
`docs/planner-handover.md` and `docs/release-handover.md` — **and to nothing
else.** Lutan set that boundary explicitly on 2026-10-20. It is **not** a general
rule about documents, and it does **not** touch `docs/decisions/` files,
`docs/releases/<date>.md` records, `docs/test-plans/`, `README.md`, the manual, or
any document a feature stream writes. Those are records and rules rather than
short-lived snapshots: a decision file is read years later by someone asking why,
and shortening one to a delta would destroy the thing it exists for.
