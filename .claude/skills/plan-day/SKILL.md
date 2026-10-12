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
git -C C:/Development/Animal_Shelter_App push
git -C C:/Development/Animal_Shelter_Backlog merge --ff-only main
git -C C:/Development/Animal_Shelter_Backlog push
```

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

| scale | band | shape |
|---|---|---|
| Floor | **~80k** | every stream, before any work: tools, memory, skills, CLAUDE.md, brief. **Corrected 2026-10-11 from ~110k, on one measurement** — `release-note-truth-rule` came in at **103,070** with only 23,881 of messages, so its fixed overhead was **~77k** (System tools 38,782 · MCP 17,001 · Memory 9,695 · Skills 6,377 · System prompt 4,973). **One measurement, not a law: re-check it.** The 30k error was inherited by every band below, which is most of why they read high |
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
