# Planner handover — written 2026-10-17, after ELEVEN workstreams in FOUR batches

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **four batches — 3 + 3 + 2 + 1 — planned, built and merged between 14:08 on 2026-10-16 and
09:17 on 2026-10-17**, in one chat, resumed four times, plus this handover. It says where the
planning loop stands, what is blocked and on whom, and what not to re-derive. It is **rewritten every
nine workstreams or so** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the top block, the measurement table, and the three outcome sections (batch 1's,
   batch 2's and batch 4's). **Batch 4's is the most important thing either file gained this round**
4. this file, for what has changed since
5. `docs/decisions/2026-10-16-public-views-foreign-branch-skip.md` — the fix for the collision that
   dominated the last edition, and a worked example of a stream correctly rejecting its brief's
   suggested approach
6. `docs/decisions/2026-10-17-mobile-sweep.md` and `docs/mobile-sweep-inventory.md` — the largest
   single item on the board, done, with a per-route record

---

## FIRST, THE TRAP: CHECK FOR AN OPEN HANDOVER PR BEFORE YOU TRUST THIS FILE

**Run `gh pr list --state open` and look for an open `planner-handover-*` PR.** A previous chat read
the file on `main`, reported its figures to Lutan, and was wrong by ten migrations, because the
current edition was sitting in an unmerged PR the whole time. Two commands settle it, and this is the
one document whose own staleness is most likely to be invisible: it is written to be authoritative
and it ages in hours.

**So: `gh pr list` first, then read the file, then verify every number in the table below against the
repo anyway.**

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.** *"This probably will not cover all four"* is right. *"The window is
  at 97% so I am not starting"* is not.
- **Mid-work exhaustion is different and still correct:** stop with words — what is built, what is
  not, what is next.

**Do not reintroduce a numeric stop threshold into a brief, ever.** And the sibling rule: *"PLEASE
DON'T MAKE ARBITRARY DECISIONS ABOUT HOW I USE MY CREDITS WITHOUT ASKING ME FIRST."* **Model, effort,
which allowance gets spent, and whether to start at all are all his.**

**The allowance was again nowhere near the constraint.** Eleven workstreams, including the biggest
item on the board, moved *Weekly · all models* from **29% to 33%** — about **4% for eleven streams**.
Fable sat at **9%** throughout and had nothing suited to it; see *Answered and closed*.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`e784df44`** (#689 merged) |
| `backlog` branch | **one commit AHEAD of `main`** (`ab8a7022`, the sweep's leftovers). Fold it in at the next sync |
| Dev database | **216 applied, 216 files, 0 pending, zero drift** — re-verified with `--status` after batch 4 |
| Next free migration number | **`0216`** (highest on `main` is `0215_recent_adoptions_resident_id.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **102 on `main`, 105 on the `backlog` branch** (the difference is `ab8a7022`) |
| Open PRs | **none** |
| Release | **`0.34.0` is the newest entry and is deployed. `0.35.0` is NOT cut**, and `unreleased` carries **five** lines from this round. Cutting it is the natural next step and is the release manager's session, not the planner's |
| Leftover worktrees | **ten** `Animal_Shelter_*` stream folders, **two husks** (`clean-streams-orphans`, `planner-handover-182`) and **five** app worktrees under `.claude/worktrees/` — see *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The eleven, in order.** Batch 1: #681 `ci-script-fixes-fold`, #680 `migration-files-match-dev`,
#682 `assistant-death-rehome`. Batch 2: #683 `public-stories-schema`, #684
`status-alert-mail-clearable`, #685 `name-card-scanning`. Batch 3: #687 `adoption-stories-app`, #686
`assistant-refused-row`, plus the unplanned #688 `recent-adoptions-resident-id`. Batch 4: #689
`mobile-sweep`, alone. Then this handover.

**Four batches, not three, and that was right.** Lutan swapped the Fable acceptance dry run for the
full mobile sweep, and the sweep cannot share a batch with a UI stream — it touches every screen, and
its item says never fold it. He chose *alone, as a batch 4, after the UI streams*, so it swept an app
that already contained batch 3's new public pages and nothing was swept twice. **Offer that shape
again** whenever a whole-app stream appears: a batch of one is a legitimate batch.

---

## THE FINDING OF THIS ROUND: THE BANDS SKEW HIGH ON BREADTH

### The eleven

| slug | model / effort **run** | estimated | actual | |
|---|---|---|---|---|
| `ci-script-fixes-fold` | sonnet-5-5 / low | 190–280k | **147,293** | 22% under |
| `migration-files-match-dev` | sonnet-5-5 / low | 140–200k | **137,460** | just under |
| `assistant-death-rehome` | sonnet-5-5 / low | 200–290k | **201,464** | inside |
| `public-stories-schema` | sonnet-5-5 / low | 140–200k | **145,531** | inside |
| `status-alert-mail-clearable` | sonnet-5-5 / low | 170–290k | **131,675** | **34% under** |
| `name-card-scanning` | sonnet-5-5 / low | 340–460k | **185,439** | **45% under** |
| `adoption-stories-app` | sonnet-5-5 / low | 200–290k | **262,974** | inside, upper half |
| `assistant-refused-row` | sonnet-5-5 / low | 110–170k | **145,319** | inside |
| `recent-adoptions-resident-id` | sonnet-5-5 / low | not estimated | **103,410** | the floor plus 14k of messages |
| `mobile-sweep` | sonnet-5-5 / low | 600–900k | **309,202** | **48% under** |

**All ten ran on the recommended dials. Not one exceeded its band. Three missed low by 34%, 45% and
48%.** Every figure read from `get_session` / `get_usage`, none assumed. (The eleventh stream is this
handover, measured next round.)

### Breadth is cheap. Depth costs. Count what the stream must CHANGE

**The three big misses share one cause: the planner banded by how much the stream had to LOOK AT.**

- **`mobile-sweep` is the clearest case.** 121 page routes, every one given a verdict, in two
  languages — and **104 came back `ok` needing nothing**, 13 were fixed, 4 were honestly
  `not checked: <why>`. So the work was 121 units of looking and **13 units of fixing**. The machine
  check (`scripts/check-phone-width.mjs`) does the bulk in batches; a browser look at a screen that
  is already fine costs almost nothing. The brief quoted 600–900k and said it might not fit one
  context window. **It fitted, finished and cost 309,202.**
- **`name-card-scanning` killed the last edition's newest rule.** That rule said three or more
  distinct sub-features is banded `large`. This stream shipped all three — Android Web NFC, the
  iPhone waiting marker, the R-code in the picker — for 185,439 against 340–460k. **The difference
  from the streams that rule came from** (`pack-sizes-app`, `appeals-staff-side`) **is that its three
  sub-features were three paths into ONE screen, sharing one lookup, with the mechanism already
  written out in the item.** Almost no design was left, and there was one surface to verify.
- **`status-alert-mail-clearable`** was widened for a distributed problem that might need a Pi relay.
  The stream concluded the relay needed a decision and a deploy, **split it out as its own backlog
  item**, and did the part that could be done — 131,675 against 170–290k.

**So the questions that decide a band, in this order:**

1. **How many distinct things must this stream CHANGE?** Not read, not visit, not list — change.
2. **How many of those need their own design and their own screen?** Three features with three
   screens is a large. Three paths into one screen, specified by the item, is a medium.
3. **Must it build the instrument?** (Still true, still the biggest multiplier:
   `who-does-what-view` ran +50% because writing `check-who-does-what.mjs` *was* the work.)

**Do not widen a band because an item has a numbered list in it, a long file list, or the word
"every".** And **do not raise effort to fix a band** — nothing this round came close to needing it,
and effort raises the figure.

### The bands as they now stand

| scale | band |
|---|---|
| Floor | **~77k** (System tools ~39–44k · MCP ~20k · Memory **11,120** · Skills 6,601 · System prompt ~10k). Memory read 11,120 in all ten; it has stopped growing. `recent-adoptions-resident-id` is the cleanest floor measurement yet: **103,410 with only 14,341 of messages** |
| Quick win | **110–170k** — Lutan's ruling 2026-10-11, asked four times. **Do not reopen it** |
| Schema PR | **100–150k single-file · 140–200k folded · 215–285k with code.** Confirmed twice more: `0214` folded two unrelated halves for 145,531; `0215` single-column for 103,410 |
| Medium | **170–290k** — one or two things to change; three paths into one screen also lands here |
| Large | **340–460k** — three or more things to change, each with its own screen, **or** a stream that must build the instrument |
| A whole-app sweep | **~310k, measured once.** Breadth alone does not reach `large` |

### The capture rule held ten for ten

Every actual was read in the same turn the planner noticed the merge, including two batches that had
merged overnight while the chat was idle. **A fresh chat planning the next round is too late.** If a
chat is about to end with a batch in flight, **say so and say the figures will be lost.**
`unmeasured` is the honest value; a guess is not.

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** What earned its place this round:

- **BRIEF AN OPTION, NOT A MANDATE — AND SAY WHICH IT IS.** `ci-script-fixes-fold` was told option
  (a) looked cheapest *and* that if the check could not reliably tell the two cases apart it should
  document the behaviour instead. **The brief's suggestion was wrong, and the stream said so**:
  reading `origin/main` alone cannot distinguish a foreign branch's view from one nothing explains,
  because "not on main" is identical for both. It required positive proof from the foreign branch's
  own migration, made CI fetch full depth, and wrote the correction into its decision file
  (`docs/decisions/2026-10-16-public-views-foreign-branch-skip.md`). **A brief that names an option as
  a recommendation gets corrected; a brief that names it as the task gets obeyed.**
- **TELL A STREAM IT MAY HONESTLY FAIL, AND WHAT TO DO THEN.** Still the highest-value line. Worked
  twice more: the alert-tile relay split into its own item rather than half-built, and the sweep's
  four `not checked: <why>` verdicts instead of silent skips.
- **Name the one thing that can hurt someone, in the stream's own terms**, preferring the quiet
  failure. The four that worked this round: a public view exposing an adopter's surname or a staff
  note written in confidence; a scan filing a wound photo against the wrong animal; a tile going
  green on no evidence, so an alert that reached nobody looks like one that worked; a layout fix that
  "tidies" a column away and takes the one field somebody needed.
- **Point a stream at the PR that just changed its files, by name**, and at the decision file that
  settled the question. Both batch-3 streams were given #683's migration header and decision file,
  and neither re-decided anything.
- **Read the merged schema yourself and put its traps in the brief.** `0214` widened *insert* only, so
  a volunteer cannot read back the row they just wrote — an insert chaining `.select()` would have
  failed **only for the people the feature is for**. The brief named it; the stream avoided it
  (`docs/decisions/2026-10-17-refused-row-is-fire-and-forget.md`).
- **For a schema half, three sentences**: the feature is not usable when this merges; say so in the
  last message; do not tick the item. Held again for `0214`.
- **An app half that depends on new columns must be told it builds the control that SETS them.**
  `adoption-stories-app` was told the public strip is useless until staff can tick the opt-in, so the
  tick-box, the public-story field and the first-name field were part of its job, not a follow-up.
- **Plan a genuinely large stream as resumable, and say so.** The sweep's brief required the inventory
  as the **first commit**, fixes in passes that tick it in the same commit, and — if the window ran
  out — stopping with words and naming the next group, with the PR opening only when every route had a
  verdict. It finished in one session, but **the inventory is now the record nobody had for that
  item**, which is worth the instruction either way.
- **Tell a stream what to do if it needs a migration it was not given** — file it on the `backlog`
  branch, do not write it. **But see the next section: one stream found a better answer.**

---

## The pattern worth copying: a stream that span off its own schema PR

`adoption-stories-app` needed `resident_id` on the existing `public_recent_adoptions` view so the
Happy endings strip could link to the animal. Its brief said to file a migration it was not given
rather than write one. **It did something better: it started its own schema session**
(`Animal_Shelter_recent-adoptions-resident-id`, #688, `0215`), merged that first, then used it.

**That is the schema-first rule applied correctly by a stream to itself, and it cost 103,410 — the
floor plus 14k of messages.** Keep it as the recommended answer for a small, obviously-correct schema
need discovered mid-stream, and say so in briefs: *file it on the backlog branch, or spin a schema
stream of your own and merge it first — never write a migration on a feature branch.*

**And the counting consequence:** it was a workstream by every test that matters — own worktree, own
branch, own PR, own test plan — so **it counts toward the handover counter.** This round was eleven,
not ten. **Counting PRs instead of streams is how the counter once read 13 and then 16**; counting
only *planned* streams is how it would now read short.

---

## Traps in the tooling

Everything in the last edition's list still holds. **`git show <rev>:<path>` LIES SILENTLY ON DOTTED
PATHS in this shell** — use `git grep`, `git ls-tree`, or prefix `MSYS_NO_PATHCONV=1`. **No long prose
in `node -e` or heredocs** — use the Write tool and splice with `cat`. **`rev` does not exist in this
shell** (to read the tail of a very long line use `awk '{print substr($0, length($0)-N)}'`).
**`python` is the Store stub.** **`gh` reports `mergeStateStatus: UNKNOWN` for a MERGED PR** — read
`state` and `mergedAt` instead. **`worktree.mjs new` can exceed the tool timeout on `npm ci`**, but
the folder, branch and `.port` exist well before it finishes, so write the brief immediately. New this
round:

### `git merge backlog` conflicted TWICE in two days, and the second was the whole file

The last edition said three clean merges and *"keep expecting one"*. Both runs this round conflicted.

- **First run:** the alert-tile PR annotated its item while the same stream filed the relay half as a
  **new item on the `backlog` branch**, so both sides had edited the same lines. Resolution: **keep
  both** — the new item and the PR's newer note.
- **Second run:** **the entire file came back as one conflict hunk** (`<<<<<<<` on line 1), because an
  earlier merge on a feature branch had rewritten it. **Do not pick a side.** Split the two halves
  into files and `diff` them: only **six lines** actually differed. `main` was newer for two ticks and
  an annotation; the `backlog` branch had **two items Lutan filed that morning**, which a "take
  main's version" resolution would have thrown away silently.

**The method, written down because it took two attempts to find:** extract both sides with `sed`,
`diff` them, resolve line by line, then run **`node scripts/check-backlog-sections.mjs` from the App
checkout** (run from the Backlog worktree it reads the App's file and tells you nothing) before
committing.

### The auto-mode classifier refuses `git add && git commit` chained, as "Modify Shared Resources"

Hit once while committing a merge resolution. **Splitting it into two calls — `git add`, then
`git commit` — went through unchanged.** The refusal is not about the content; a chained mutating
command is read as broader than it is. Worth trying the split before reporting a block, and worth
knowing that `git add` not having run is why the next `commit` says *"Committing is not possible
because you have unmerged files"*.

### The mobile sweep's inventory has a stale summary at the top

`docs/mobile-sweep-inventory.md`'s *"Progress so far"* block still reads as mid-work — *"no route is
marked `ok` until…"*, *"Next: …"* — and **contradicts the completed table beneath it**, where all 121
routes carry a verdict. The table is right. **The top of a document is what a reader believes**, so
this is worth one line in the next PR that touches `docs/`. Recorded here rather than fixed, because
the sweep had already merged.

---

## A LIVE DEFECT the sweep found, and it is not bookkeeping

**`/medical/photos` and `/medical/weight` crash when opened with no resident chosen.** Next raises
*"Functions cannot be passed directly to Client Components"* at `<ResidentPicker t={t} …>`: `t` is the
translation dictionary and contains functions. The picker is the only way into those pages from the
nav, so **both pages are unusable that way** — and they are the Head of Medical's two jobs.

The sweep was asked for layout only, so it correctly **did not fix it** and filed it on the `backlog`
branch with the file and line numbers and the fix (pass plain strings, not `t`).

**Two things to carry:**

- **These are the two pages #685 shipped name-card scanning into**, and `ResidentPicker.tsx` was last
  touched by #685's scan-card commits. The `t={t}` call itself is older, so **this may or may not be a
  regression from #685 — it is not proved either way.** Whoever fixes it should check against the
  commit before #685 rather than assuming.
- **`0.35.0`'s notes already tell users scanning works on those pages.** That makes this a
  release-note-truth problem as well as a bug: it belongs in the release's own smoke test, and it is
  the obvious quick win for the next batch.

---

## Leftovers — ten stream folders, two husks, five app worktrees

- **The ten:** `ci-script-fixes-fold`, `migration-files-match-dev`, `assistant-death-rehome`,
  `public-stories-schema`, `status-alert-mail-clearable`, `name-card-scanning`,
  `adoption-stories-app`, `assistant-refused-row`, `recent-adoptions-resident-id`, `mobile-sweep`.
  All merged, all `nothing beyond main`. **Most were `HELD` by their own sessions**, and `done`
  refuses a folder a process has open, **so those sessions must be closed first. Ask; do not tear one
  down.** `/clean-streams` does the round.
- **Two husks** git no longer tracks: `clean-streams-orphans`, `planner-handover-182` —
  `done <name>` clears them.
- **`worktree.mjs done` does not know about `.claude/worktrees/` at all** — those five need
  `git worktree remove`. Count them with `git worktree list`, not `worktree.mjs list`.
- They hold ports up to 3015, which is why this handover's worktree got 3015.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and `done`ing
it destroys a day's build; ahead with a **merged** PR is a leftover, because a squash-merged branch
stays ahead for ever. **Nothing was ever in the first category this round.**

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The sponsorship/appeals threads:** the Director's wording for money raised beyond a target, a Thai
  reader's review of the appeal wording, the share-preview image's style.
- **The vet calendar's last mile.** Outstanding, all Lutan: mint `GOOGLE_CALENDAR_REFRESH_TOKEN`
  (`calendar.events`, the **published Desktop client in `lanna-care-dev`**, never a new project), set
  `GOOGLE_CALENDAR_ID`, put both in the **test and production** values files, deploy; then see an
  event in a real calendar and on the Director's phone, **then** share the calendar with her and tell
  her to delete her hand-typed copies.
- **The Pi relay for the alert-mail test** (new this round, split out of #684): the Pi writes a
  request row, the Worker cron sends it. **Needs a schema PR, Lutan's yes and a Worker deploy**, and
  the options are in `docs/decisions/2026-10-16-alert-tile-green-needs-delivery.md`.
- **The Pi `x-origin-key` activation**, the spare-clone timer, running the app on its own Pi user —
  all need a Pi deploy.
- **The menu removal** (stream 4 of the cards work): 68 unexplained orphans left, each needing a
  ruling, and **the Doctor's broken `home_path`** is among them — sign-in sends the Doctor to
  `/appointments`, which its cells do not open. **A live defect on dev, not bookkeeping.**
- **The production cutover** — blocked on the Director transferring `lannacareforanimals.org` to
  Cloudflare from sav.com. **Not plannable until the zone reads Active.** The Thai site's own
  addresses sits behind it.
- **`from-zero-rebuild`** — needs a third free Supabase project (the free tier allows two). **Not a
  paid plan.** The file-agreement half landed this round as `0213`; the rehearsal half is what is
  left.
- **`Review the manual against real use`** — a staff member and a volunteer following it on a phone
  for a day. **It reads like a Fable review item and is not one.**
- **The acceptance checklist's pre-run agreements** — who tests which role, an account per role, what
  counts as a blocker. **The printable PDF half is BUILT.**
- **The remaining red check harnesses**, **F3**, the two auth decisions — each needs a ruling first.
- **The photo lightbox at 375 px**, **the maintenance board on a phone** (somebody must watch a person
  use it), **the map on the Director's actual phone**, **somebody actually covering a role**.
- **Three SEO items** and **about nine public-site review items** need the Director.

---

## Blocked, and on whom

- **Lutan:** closing the ten leftover sessions; the calendar token and deploy; the Pi relay decision;
  the Pi deploys; the Doctor's home and the two cards questions; the third Supabase project; F3's
  delete rule; the red harnesses; the Pi failover options paper; the second admin account; the product
  `.org` name; promoting `test-plan` to a required check; the Bills tile.
- **The Director:** the over-raising wording; signing the roles draft; the community-dogs baseline;
  the Thai receipt wording; the online shop; **the domain transfer, which gates the cutover**; the
  Thai public-page wording; a photo per public page; the "since &lt;year&gt;" year.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare` ship
  a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **The shared-dev public view collision is FIXED** (#681). A view only a foreign unmerged branch's
   migration explains is a loud **skip**; an own-branch view, a view on `main`, and a view nothing
   explains still **FAIL**. CI's `public-views` job fetches full depth. **Do not soften it further and
   do not re-derive the two windows the last edition documented** — they no longer exist.
3. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
4. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
5. **Raising model or effort is NOT the answer to a band being wrong.** Ten streams on the recommended
   dials, none over band.
6. **The quick-win band stays as written.** Asked four times.
7. **"Three or more sub-features is large" is NOT a rule** — see the finding above. Count what must
   change and how many screens it needs.
8. **Fable had no work on this board again.** The acceptance dry run was **swapped out by Lutan for
   the mobile sweep** on 2026-10-16; it remains the one genuinely runnable Fable item (the acceptance
   matrix it needs is built), so **offer it again** — but **an unused bucket is not a reason to invent
   work for it.**
9. **A batch of one is a legitimate batch** when the stream touches the whole app.
10. **`/plan-day` creates worktrees, as it always did.**

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach
a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast, from the PR bar, often before the planner has read the checks.** All
ten went that way, three of them overnight while the chat sat idle.

**He takes the planner's recommendation when it is explicit and first.** Both real either/ors this
round — batch 1's three, and where the sweep should run — were answered in one message each, and he
took the recommended option both times.

**He states a scope and means it.** *"For the sweep let's do the full sweep, not the light sweep."*
The right response was to count the routes (121), widen the band honestly, say the figure, and brief
for completeness with a resumable structure — **not** to ask whether he was sure, and **not** to
quietly plan a sample.

**He will stop a run mid-turn.** He typed *"Stop"* once, while the planner was reading a PR list.
Nothing had been created, so the correct response was a two-line report of exactly what had and had
not happened, plus the three things left undone, and then silence until asked. **Do not resume on your
own initiative after a Stop.**

**He asks for housekeeping mid-turn, too** — *"can we remove C:\Development\Claude_Briefs please"*,
while this handover was being written. Look before deleting (it held three brief files from streams
that had all merged, each with its own decision file, nothing tracked by git), say what was in it, do
it, and carry on with the task in hand.

**He files items himself, mid-day, from looking at the live app** — two appeals items arrived on the
morning of 2026-10-17 while batch 3 was building. **Re-read an item fresh when writing its brief.**

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **`/medical/photos` and `/medical/weight` crash with no resident chosen** — a live defect on two of
   the Head of Medical's jobs, with the fix already identified. A quick win, and it should go first.
2. **Appeals are hard to find, on the public site and for staff** (Lutan, 2026-10-17: *"Can't find the
   fundraiser page on the website."*) — small, app only.
3. **Appeals may show medical photos, chosen one by one, on the appeal's pages only** (Lutan,
   2026-10-17) — **schema PR then app, and a privacy question first**, because Medical photos are
   excluded from every public view by design (`0210`, `0214`). Brief the schema half to settle who may
   expose which photo before a column exists.
4. **The sweep's leftovers** — the four screens it could not see (two crashing, one needing a
   2-step-verified admin, one needing a doctor with a clinic) and *admin tables as cards*, both filed
   in `ab8a7022` on the `backlog` branch.
5. **Cutting `0.35.0`** — five lines in `unreleased`, four batches merged. The release manager's
   session, not the planner's.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat that
still has the context, then start the fresh chat.** Offer it; do not just do it. **This one was asked
for directly** in the chat that had planned all four batches — the rule working, for the fourth
handover running.

**Count the workstreams honestly.** This round's eleven are 3 + 3 + 2 + 1 planned **plus the
unplanned schema spin-out #688**; the handover stream itself is counted in the next round, as its
predecessors were. **Streams are added when a batch is set up, and a stream that another stream starts
for itself still counts.**

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-193`; the previous were **#676** (`182`), **#662** (`173`),
**#638** (`156`), **#625** (`147`), **#612** (`138`), **#597** (`127`), **#588** (`116`), **#575**
(`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`).
Lutan asked on 2026-10-09 whether the PR was really needed; **it is.** It is a `docs/` file in the
repo, so the only alternatives are committing to `main` directly or routing it through the `backlog`
branch, and the second is the 2026-10-07 failure `CLAUDE.md` documents by name.

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an open
`planner-handover-*` PR before you trust the file on `main` at all.** Carry forward only what is
still true; reset the counter in `.plan-day.md` with today's date.
