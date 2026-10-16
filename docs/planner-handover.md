# Planner handover — written 2026-10-16, after SEVENTEEN workstreams

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **seventeen workstreams**: eight in a previous chat, then three batches of three planned and
set up in one chat across 2026-10-15 and 2026-10-16, plus this handover. It says where the planning
loop stands, what is blocked and on whom, and what not to re-derive. It is **rewritten every nine
workstreams or so** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the top block, the measurement table, and the three PLANNER ERROR sections at
   the bottom. **It is longer than usual this round and the bottom third is the valuable part.**
4. this file, for what has changed since
5. **`docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md`** — the rule that a schema
   PR is not finished until the public view names its columns
6. `docs/decisions/2026-10-15-menu-orphans-worked-down.md` — the orphan list that gates the menu
   removal, with **two questions in it that are Lutan's**
7. `docs/decisions/2026-10-16-migration-guard-for-test.md` — why `--env test` is now guarded, and
   why it is a narrow check rather than full guarding

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

**The shape every brief and every planning message must use:**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.** *"This probably will not cover all four; I would do the metadata
  first"* is right. *"The window is at 97% so I am not starting"* is not.
- **Mid-work exhaustion is different and still correct:** stop with words — what is built, what is
  not, what is next.

**Do not reintroduce a numeric stop threshold into a brief, ever.** Twenty-seven briefs across
2026-10-14 to 2026-10-16 used the reporting form and none of them gated; keep it that way.

**And the sibling rule:** *"PLEASE DON'T MAKE ARBITRARY DECISIONS ABOUT HOW I USE MY CREDITS
WITHOUT ASKING ME FIRST."* **Model, effort, which allowance gets spent, and whether to start at all
are all his.** The planner's job is the trade-off, a recommendation and the consequence in one line
— **then ask.**

**The allowance was never close to the constraint this round.** Seventeen workstreams, two releases
and this handover moved *Weekly · all models* from about 15% to **21%**. Nine streams cost roughly
1–2% of a weekly window. Say the figures; do not dress them up as a reason to do less.

---

## THE PROCESS CHANGED ON 2026-10-16: `/plan-day` NO LONGER CREATES WORKTREES

**Lutan's decision, and the single most important operational change in this handover.** Read this
before setting up a batch, because `SKILL.md` step 7 still says
`node scripts/worktree.mjs new <slug>` and that is now **wrong**.

**What happens now.** The desktop app cuts its **own** worktree for every new session, under
`C:\Development\Animal_Shelter_App\.claude\worktrees\<slug>-<hash>`, on a branch
`claude/<slug>-<hash>`, branched from `main`. `get_session` shows it plainly: `worktreePath` is the
app's folder, `originCwd` is wherever the session was started.

**How this was discovered:** batch 2's three sessions were started on the planner's
`Animal_Shelter_<slug>` folders, and the app made its own worktrees anyway. The planner's three
folders — three `npm ci` runs each — were **never used.** The merged branches were
`claude/vet-calendar-build-e5f89d`, `claude/migration-test-guard-930a8b` and
`claude/labels-year-app-84e026`.

**So the planner now writes ONLY the brief**, to `C:\Development\Claude_Briefs\<slug>.md`, and hands
Lutan one line per stream:

> Read `C:\Development\Claude_Briefs\<slug>.md` and do what it says.

He starts a new session on the **main checkout** and pastes that line. Batch 3 was set up this way
and all three streams started correctly.

**Why the brief lives OUTSIDE the repo, which is not obvious:** `.brief.md` is **gitignored**, so it
does not travel into a worktree the app cuts from `main`. And a folder named `Animal_Shelter_*`
would be reported as a **husk** by `worktree.mjs list` and offered for deletion. Hence
`C:\Development\Claude_Briefs\`.

### THE TRAP THIS CREATED — and it is still only worked around, not fixed

**An app-cut worktree has NO `.port` file, and `worktree.mjs` falls back to 3000 — the MAIN
CHECKOUT's port** (`readPort(dir) ?? MAIN_PORT`, `scripts/worktree.mjs:477` and `:353`).

So every portless worktree's `launch.json` aims at 3000, and `preview_start` attaches the session to
whatever is already serving there — the main checkout, or **another stream's dev server**. **A
stream can verify its change against someone else's build and see it pass for reasons unconnected to
its work.** The failure is completely silent.

**Confirmed, not reasoned:** all three of batch 2's app-cut worktrees have no `.port`, while the
planner's folders held 3001–3006.

**The workaround, which every brief must now carry as its FIRST step:**

```
printf '<port>\n' > .port && node scripts/worktree.mjs launch
```

Batch 3 used 3007, 3008, 3009, because 3001–3006 are held by leftovers. **The real fix belongs in
`worktree.mjs`** — probably allocating a free port and writing `.port` itself when the file is
missing and the checkout is not main — and it is **filed on the backlog, not something to patch
inside a feature stream.**

**And the trap has a SECOND half, demonstrated by this very handover.** `worktree.mjs new
planner-handover-173` was given port **3008** — the port already assigned to the live
`ledger-and-labels-schema` stream. `nextFreePort` walks the worktrees it knows and reads their
`.port` files, and **the app-cut worktrees have none, so their ports are invisible to it and get
handed out twice.** Harmless here (a docs branch needs no dev server), but **a second stream that
started a dev server on 3008 would have collided with a live one.** So the fix must make
`nextFreePort` see the app's worktrees too, not merely write a `.port` when one is missing.

### Two things this change leaves broken, both filed, both needing a PR

- **`CLAUDE.md` still says *"If there is a `.brief.md`, that is the task"*** and describes a
  workstream as `C:\Development\Animal_Shelter_<feature>` with its port from `.port`. Both are now
  only sometimes true. **A session currently finds its brief only because it is told the path, and
  that convention lives in a chat rather than the repo** — exactly what is lost when a chat ends.
- **`worktree.mjs new`/`done`/`list`/`sync` all still assume `Animal_Shelter_<slug>`.** Not broken,
  but `list` does not name the app's worktrees usefully, so **the planner's step-2 "what is in
  flight" read is now partly blind.** Use `git worktree list` as well, every run.

**Do not fix either inside a feature branch.** The 2026-10-07 failure `CLAUDE.md` documents by name
is what happens when a rule reaches `main` through the `backlog` branch instead of a PR.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`1c6e0ac1`**, `backlog` in step |
| Dev database | **210 applied, 2 ahead of `main`'s 208 files** — `0208_clear_phantom_ledger_row_0201_again.sql` and `0209_residents_breed_colour_labels.sql`, applied by the live `ledger-and-labels-schema` stream before its PR merges. **This is the normal schema-first state mid-stream, not drift** |
| Production database | **the planner cannot read it** — refused as [Production Reads]. Hand Lutan a read-only script and read the result from his terminal |
| Next free migration number | **`0210`** once batch 3 merges; `0208`/`0209` are claimed by the live stream |
| Open backlog items | **106** |
| Open PRs | **none.** Batch 3's three are still being built |
| Last release | **`0.32.1`**, cut, recorded and deployed 2026-10-15 — the third release of that day |
| `unreleased` | **four notes**, from batches 1 and 2: the "Counting since (year)" box, Thai breed and colour, the neutral *All zones* chip, the intake-date fix |
| Leftover worktrees | **SEVEN** `Animal_Shelter_*` folders plus four stale app worktrees — see *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The seventeen.** Eight in a previous chat (#642–#650 era). Then, in one chat: batch 1 — #653
`intake-date-nan-fix`, #654 `zone-chip-neutral-fill`, #655 `calendar-and-weigh-schema`; batch 2 —
#656 `vet-calendar-build`, #657 `labels-and-year-app`, #658 `migration-test-guard`; batch 3 —
`weigh-first-app`, `ledger-and-labels-schema`, `check-harness-crashes`, all live when this was
written.

**Batch 1 was planned, built and merged inside about forty minutes.** Lutan merges from the PR bar
as soon as CI is green, so the merge train never queues. **On a resume, read `gh pr list` rather
than assuming a batch is still in flight** — and read the `ahead` column against the open PRs, since
*ahead 0 with a merged PR* is a leftover while *ahead with no PR* is unsubmitted work.

---

## Token estimates — six more measured, and the streak is 75

| slug | model / effort **run** | estimated | actual | |
|---|---|---|---|---|
| `calendar-and-weigh-schema` | sonnet-5-5 / low | 140–200k | **133,065** | 5% under |
| `intake-date-nan-fix` | sonnet-5-5 / low | 130–190k | **109,067** | 16% under |
| `zone-chip-neutral-fill` | sonnet-5-5 / low | 110–170k | **111,479** | inside, at the bottom |
| `vet-calendar-build` | sonnet-5-5 / low | 340–460k | **259,979** | 24% under |
| `migration-test-guard` | sonnet-5-5 / low | 140–200k | **118,893** | 15% under |
| `labels-and-year-app` | sonnet-5-5 / low | 170–250k | **183,880** | inside |

**All six ran `claude-sonnet-5-5` / `low`, the recommended dials, confirmed by `get_session` rather
than assumed. The streak is 75.**

### READ THE TWO BIG UNDERRUNS WITH THEIR CAVEAT, OR THE BANDS WILL DRIFT WRONG

**This is the most likely way the next planner misuses this table.** Both low figures came from
streams that correctly shipped **less than their whole item**:

- **`vet-calendar-build` could not do its live verification**, because the refresh token is Lutan's
  to mint and he had not. **259,979 is a LOWER BOUND for the finished feature**, not its cost. **Do
  not move the `large` band down on it.**
- **`migration-test-guard` shipped part (1) only**, the guard, and left part (2) — the cleanup
  migration — open with a precise note. That was right, and it is why that work became a batch-3
  stream.

**What the calendar figure does support is the existing axis.** It had every file named, its schema
already on `main`, and every design question already answered by the Director, so **it had nothing
to find out.** `large` is for a stream that must **build the instrument**.

### The bands as they now stand

| scale | band |
|---|---|
| Floor | **~77k** (System tools ~39k · MCP ~17–20k · Memory 11,120 · Skills 6,546 · System prompt ~5–10k). **Memory has stopped growing** — 11,120 in every one of the nine |
| Quick win | **110–170k** — left as written on Lutan's ruling, 2026-10-11. Asked four times. **Do not reopen it** |
| Schema PR | **100–150k single-file (quote the bottom) · 140–200k folded · 230–285k with code** |
| Medium | **170–290k** |
| Large | **340–460k** — and nothing measured since 2026-10-11 has needed it |

**The axis that decides a band: *must this stream build the instrument?*** Deciding something is
cheap. Reading a long list of files is cheap. Applying an existing design to N pages is cheap.
**Building the thing that measures is not.**

### The capture rule held six times and FAILED twice — know which failure mode this is

Six actuals were captured in the same turn the planner noticed the merge. **But two from the
previous round (`labels-and-year-schema`, `about-visit-us-page`) are recorded `unmeasured`, because
their sessions had closed before any `/plan-day` run read them.**

**The lesson is sharper than "capture promptly".** A **fresh chat planning the next round is already
too late** — the sessions are gone by then. So: capture in the same turn, and **if a chat is about
to end with a batch in flight, say so and say the figures will be lost.** Never write a guess;
`unmeasured` is the honest value.

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** What earned its place this round:

- **SAY THAT THE BACKLOG ITEM OUTRANKS THE BRIEF.** This is new and it is the most valuable line
  added this round. See the planner error below.
- **Name the one thing that can hurt someone, in the stream's own terms**, and prefer the quiet
  failure over the loud one. The four that worked: a date fix that could break what twenty-plus
  forms *submit* while only the display was wrong; a calendar that must never block a booking when
  Google is down; a permissions read that must not widen the Head of Medical's access to make a page
  easier to build; a repaired guard that **reports green without checking anything**.
- **For a schema half, say three things explicitly**: the feature is **not usable** when this
  merges, the stream must **say so in its last message**, and it must **not tick the item**. #655
  did exactly that. **Do not drop the three sentences.**
- **Tell a stream what to do if it finds it needs a migration it was not given** — *file it on the
  `backlog` branch, do not write it.* **Filing must be the easier path or the stream will build it.**
  #657 was told this, needed a migration, and filed it; that filed item became a batch-3 stream.
  **This is the mechanism working end to end and it is worth keeping.**
- **Tell a stream which red is NOT its job.** `check-harness-crashes` was told the 21-line doctor
  disagreement in `check-permission-parity` is a separate decision and must not be "fixed" green.
- **For a repaired guard, demand the deliberate break.** Making a script run is not the deliverable;
  showing it go red on a planted fault is.
- **A folded stream is cheap and is the planner's best lever.** `labels-and-year-app` carried two
  features for 183,880; `ledger-and-labels-schema` folds two unrelated schema jobs.

---

## Traps in the tooling

Everything in the last handover's list still holds, and **two of them bit again this round**:

- **`git show <rev>:<path>` LIES SILENTLY ON DOTTED PATHS in this shell** — use `git grep`,
  `git ls-tree`, or prefix `MSYS_NO_PATHCONV=1`.
- **No long prose in `node -e` or heredocs.** A `bash` heredoc carrying a long brief died with
  *unexpected EOF while looking for matching `'`*. **Use the Write tool and splice with `cat`.**
  This cost a round trip on the first brief of the day and is entirely avoidable.
- **A `grep -c` for a phrase that WRAPS across two lines reads 0.** It looked exactly like a failed
  splice when the brief was correct. **Verify with a single distinctive word, never a phrase.**
- **`python` is the Store stub** — do not reach for it. `perl -0pi -e` works for multi-line
  substitution; `sed -i` for single lines.
- **`worktree.mjs new` exceeds the 7-minute tool timeout** on `npm ci` and gets backgrounded. The
  folder and branch exist well before it finishes, **so write the brief immediately**.

### `git merge backlog` CONFLICTS EVERY TIME — assume it

**One conflict this round, in `docs/backlog.md`, resolved as a UNION, about three minutes.** Four
conflicts in three days now.

2026-10-16's had **two hunks** and both sides were right about different things:

1. `main` had the `.ics` feed item **ticked** by #656 (Lutan dropped the feed when way (c) shipped)
   and its way-(c) item **updated** with the 2026-10-16 decisions; `backlog` held the **stale open**
   `.ics` copy, the **pre-build** way-(c) copy, and a **new item** for sharing the calendar with the
   Director. Kept main's tick, main's updated copy, and backlog's new item.
2. `main` had the Thai breed/colour item's **PARTLY DONE** note from #657; `backlog` had the stale
   status **plus a new split-off item**. Kept main's note and backlog's new item.

**The method, which beats eyeballing an 8,000-character line:**

1. `grep -n '^<<<<<<<' docs/backlog.md` for the count and line numbers.
2. Print each side with `sed -n '<n>p' | cut -c1-230` — and when two copies of the same item differ,
   **`wc -c` and `fold -w 150 | tail -5` tell you which is newer.** The longer one with the dated
   note is main's.
3. Rebuild by concatenation: `sed -n '1,Np'`, the lines you keep, `sed -n 'M,$p'`.
4. **Check `grep -c '^<<<<<<<'` is 0, the open-item count is sane, and the line arithmetic adds
   up** — 885 → 876 was exactly the 9 lines dropped, which is how you know nothing else moved.
5. `node scripts/check-backlog-sections.mjs` before committing. **Run it from the App checkout** —
   run from the Backlog worktree it reads the App's file and tells you nothing.

**Read both sides for what they ASSERT before choosing. Neither side is usually wrong.**

---

## Leftovers — SEVEN folders and four stale app worktrees, and this needs a round

**`git worktree list` at the time of writing holds the main checkout, `Animal_Shelter_Backlog`,
seven `Animal_Shelter_*` leftovers, and four app worktrees under `.claude/worktrees/`** beyond the
three live batch-3 ones.

- Seven folders: `calendar-and-weigh-schema`, `intake-date-nan-fix`, `labels-and-year-app`,
  `migration-test-guard`, `vet-calendar-build`, `zone-chip-neutral-fill`, and
  `handover-defect1-source-gone` (not the planner's — another session's).
- **Three of those seven were never used at all** — they are the batch-2 folders the app ignored.
- **They hold ports 3001–3006**, which is why batch 3 had to start at 3007.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover, because a
squash-merged branch stays ahead for ever. **Nothing was ever in the first category this round.**

**`done` refuses a folder a process has open**, and all of these were `HELD` by their own sessions,
so **those sessions must be closed first. Ask; do not tear one down.** `/clean-streams` does the
round. **`worktree.mjs done` does not know about the app's `.claude/worktrees/` folders at all** —
those need `git worktree remove`, and that is part of the filed tooling gap.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The vet calendar's last mile — the nearest thing to done on the whole board.** #656 built it
  all. Outstanding, all Lutan: mint `GOOGLE_CALENDAR_REFRESH_TOKEN` (`calendar.events`, the
  **published Desktop client in `lanna-care-dev`**, never a new project), set `GOOGLE_CALENDAR_ID`,
  put both in the **test and production** values files explicitly (a production `--secrets` deploy
  falls through to dev values for missing Google settings), deploy; then see an event in a real
  calendar and on the Director's phone. **Then share the "Lanna Care: vet visits" calendar with her
  and tell her to delete her hand-typed copies** — its own backlog item. **Decided 2026-10-16: the
  title uses the stored clinic name, the record link lands on the resident hub, the `.ics` feed is
  dropped.**
- **The two cards questions and the Doctor's broken `home_path`** — sign-in sends the Doctor to
  `/appointments`, which its cells do not open. **A live defect on dev, not bookkeeping.**
- **The production cutover** — blocked on the Director transferring `lannacareforanimals.org` to
  Cloudflare from sav.com. **Not plannable until the zone reads Active.**
- **`from-zero-rebuild`** — needs a third free Supabase project (the free tier allows two). **Not a
  paid plan.** **About two thirds needs nothing from anyone**, so brief that half first.
- **`Review the manual against real use`** — a staff member and a volunteer following it on a phone
  for a day. **It reads like a Fable review item and is not one.** The Thai manual sits behind it.
- **The eleven other red check harnesses** — each needs a per-role ruling.
- **F3** (one delete rule for 54 `auth.users` links) — a decision before a stream.
- **The photo lightbox at 375 px**; **the maintenance board on a phone**; **the map on the
  Director's actual phone**; **somebody actually covering a role** — all need a person at a device.
- **The Bills tile on the Director's phone home**; **whether purchasing keeps reading stock receipts
  through `stock.delivery`**; **promoting `test-plan` to a required check** — all his.
- **Three SEO items**: a Google Business Profile, Search Console verification, Thai wording for four
  public page titles. **About nine public-site review items** need the Director.

---

## Blocked, and on whom

- **Lutan:** the calendar's token and deploy; the two cards questions and the Doctor's home; the two
  auth decisions; the third Supabase project; the twelve unfiled database review findings; F3's
  delete rule; the eleven red harnesses; the Pi failover options paper; the second admin account;
  the mobile sweep (**declined five times — offer only as a swap**); the product `.org` name; **the
  seven leftover folders, which need their sessions closed**.
- **The Director:** signing the roles draft and applying it to production; the community-dogs
  baseline; the Thai receipt wording; the online shop; **the domain transfer, which gates the
  cutover**; the Thai public-page wording; a photo per public page; **the "since &lt;year&gt;" year
  itself**, now that the box exists.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **Fable is not a separate bucket**, and its cost tracks **effort**, not the model family. It sat
   at 9% all round. **That is not a reason to invent Fable work** — the drop-shipment options paper
   is the only unblocked item that suits it.
3. **The card set is TWENTY-ONE.** Never add one on a stream's initiative — and note its guard was
   found **crashing** on 2026-10-16, so nobody knows whether it is still twenty-one until
   `check-harness-crashes` reports.
4. **The menu removal goes LAST**, gated on the orphan list.
5. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
6. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
7. **Raising model or effort is NOT the answer to a brief or handoff miss.** Proved again this round
   by a brief-accuracy error that more thinking per turn would not have caught.
8. **The quick-win band stays as written.** Asked four times.
9. **`/plan-day` no longer creates worktreees.** His decision, 2026-10-16.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast, from the PR bar, often before the planner has read the checks.**

**He takes the planner's recommendation when it is explicit and first.** Every stream this round ran
exactly what was recommended, and he confirmed all three of each batch with no swaps.

**He answers a well-posed either/or immediately, and the answer can change the process.** Offered
three options on the worktree question, he picked "stop making them" at once. **So when the planner
finds a mechanism that is wasting work, ASK — do not quietly keep doing it.**

**He files items himself, mid-day, from looking at the live app.** Re-read an item fresh when
writing its brief.

**He reads the briefs' consequences carefully and will catch a planner error in them.** A brief is
a thing he audits.

**He asks for the process to be written down when it changes.** *"you will need to give me
instructions on how to set up a stream now that the process has changed"* — the moment a convention
moves, he wants the steps, in plain words, as paste-ready lines.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it. **This one was
asked for directly.**

**Count the workstreams honestly.** This round's seventeen are eight carried in plus three batches
of three; the handover stream itself is counted in the next round, as its predecessors were.
**Counting PRs instead of streams is how the counter once read 13 and then 16.** **And do not
double-count a batch**: streams are added when the batch is *set up*.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-173`; the previous were **#638** (`156`), **#625**
(`147`), **#612** (`138`), **#597** (`127`), **#588** (`116`), **#575** (`105`), **#562** (`96`),
**#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09
whether the PR was really needed; **it is.** It is a `docs/` file in the repo, so the only
alternatives are committing to `main` directly or routing it through the `backlog` branch, and the
second is the 2026-10-07 failure `CLAUDE.md` documents by name.

**Note for this one:** `EnterWorktree` **refused** with *"git could not be run to resolve it, so its
git identity could not be verified"*, so `node scripts/worktree.mjs new planner-handover-173` was
used instead. That is still the right tool for the planner's **own** working copy — Lutan's "stop
making worktrees" decision was about the folders set up for **other** sessions.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
