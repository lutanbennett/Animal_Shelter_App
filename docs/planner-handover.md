# Planner handover — written 2026-10-13, after eleven workstreams

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of eleven workstreams in one chat — three batches of three planned and merged, plus two the
planner ran itself. It says where the planning loop stands, what is blocked and on whom, and what
not to re-derive. It is **rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** The top line says which
   batch is live
4. this file, for what has changed since
5. **`docs/architecture-review-2026-09-22.md`** — 568 lines, the best single description of the
   system. Read §1 before planning anything structural. **Its findings are all but worked through:
   S1, S2, S3, S5, S6, S7, C2, C3, C5, C6 and N1/N4 closed; C4 and C7 are IN FLIGHT as batch 3.**
   If batch 3 merged, the review is done — say so rather than planning from it again.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`e95e6bbb`** (#586 merged, backlog folded in, `backlog` in step) |
| Dev database | **193 applied, 0 pending, no drift** |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0193`**, held by `photo-rpc` in batch 3 |
| Open backlog items | **94** |
| Open PRs | **#583** (`brief-finish-line`, green, awaiting Lutan's go) plus batch 3's three when they open |
| Last release | **`0.28.0`** (2026-10-13) |
| `unreleased` | **THREE lines** — the resident picker, nightly backups, the Bills page. **A cut is due once batch 3 merges** |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Batch 1** #578–#580 · **batch 2** #584–#586 · **the planner's own** #583 (open) and this file.
**Four more were other sessions'**: #582 `handover-refresh`, #581 `release-fewer-merges`, #576 and
#577 the `0.28.0` release pair.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog` (**expect a conflict in `docs/backlog.md` — see below**);
check whether the live batch merged and **capture token actuals in that same turn if it has**; check
each candidate against the code, the live database, *what the user has already ruled out*, and
*whether it is waiting on a decision rather than on effort*; present three batch tables with bands
**and a model/effort recommendation**; ask once; create only the current batch's worktrees and
briefs, **each opening with the finish-line block and ending with the pre-push test-plan block**;
save the plan and bump the counter.

---

## THE BIGGEST FINDING OF THE DAY: a finished feature with no PR

**`claude/bills-inbox` held 8 pushed commits, 31 files, 1,414 lines — the entire Bills app half —
and no PR had ever been opened.** Its session had been archived overnight. The previous handover
recorded it as "in flight, session live". By morning the session was gone and the branch looked
exactly like abandoned scratch; it came within one `/clean-streams` round of being deleted. It
merged as #580 for 129,178.

**The rule, and it is new:**

> **`gh pr list` shows NOTHING for a branch whose PR was never opened.** An unsubmitted stream is
> invisible in the PR view and looks identical to a finished one. **`worktree.mjs list`'s `ahead`
> column is the only place it shows.**
>
> **Ahead with no PR = unsubmitted work, not a leftover.** Never `done` it.
> **Ahead with a merged PR = a leftover**, because a squash-merged branch stays ahead for ever.

**Both halves are needed.** The first rule alone would have stopped `release-tooling-fixes` (5
ahead, #579 merged) being cleared, for no reason at all.

**What was done about it:** every brief now **opens** with a *where your finish line is* block — you
are finished when the PR is open, not when the code works; commit and push as you go; if you must
stop, stop *with words*; never end a turn with a built branch and no PR. It is verbatim in
`SKILL.md` §7 beside the pre-push block, and it is **PR #583, open and green at the time of
writing.** If #583 merged, the block is permanent; if it was closed, the three batch-3 briefs still
carry it locally and the next planner must re-add it by hand.

### And the question that produced it, which must not be re-litigated

**Lutan asked whether the misses justified raising model or effort. The answer is no**, argued from
the record in `docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`: **every miss in two days
happened at a handoff** — in the gap between a stream's work and its PR — not inside a stream's
reasoning, and **effort buys care within a turn; it cannot make a stopped session open a PR.** The
precedent is the pre-push block: six format commits before it, zero after. **The fix for this class
of miss is the brief. Do not reach for the dials, and do not re-argue it.**

---

## Token estimates — thirty-seven measured, none over band

### Today's six

| batch | slug | estimated | actual | |
|---|---|---|---|---|
| 1 | `release-tooling-fixes` | ~130–180k | **127,677** | just under |
| 1 | `bills-inbox-finish` | ~130–190k | **129,178** | inside, at the bottom |
| 1 | `backup-check-folder` | ~170–240k | **136,307** | 20% under |
| 2 | `resident-picker-floor` | ~170–240k | **121,974** | 28% under |
| 2 | `maintenance-bills` | ~200–280k | **210,290** | inside |
| 2 | `donate-buttons` | ~230–280k | **230,891** | inside |

**All six confirmed from `get_session` as `claude-sonnet-5-5` / `low`** — read, not assumed.

### THREE WERE LOST, AND THE CAUSE IS STRUCTURAL — READ THIS BEFORE TRUSTING THE STREAK

**`donate-channels`, `test-runner-node-test` and `bills-inbox` PR 1 are `unmeasured`.** All three
were archived before the next planning chat opened; `get_usage` returns *"no running Claude Code
process … an archived one never has one"*. **Tried, not assumed.**

**That ended a run of twenty-six consecutive captures, and no later `/plan-day` can recover them.**
The capture rule only works **while the planning chat is awake when the PR merges** — yesterday's
batch merged at 13:52, the chat that planned it wrote the handover and ended, and the sessions were
archived that evening.

**Today proves the other half:** all six captured, because every resume found the batch merged and
called `get_usage` in the same turn. **So: if a chat is about to end with a batch in flight, say so
and say the figures will be lost.** Do not promise a capture the next chat cannot make.

### Band corrections earned today

- **A view-body migration plus a consumer sweep is a QUICK WIN, not schema-with-code.**
  `resident-picker-floor` changed one view's filter, read eight consumer files, probed several roles
  and fixed three check scripts for **121,974** against ~170–240k. **Fifth confirmation that reading
  is cheap; only building the instrument is expensive.** Band this shape **~120–170k**.
- **A feature adding a Settings page AND a public page AND both dictionaries sits at the TOP of
  medium, not above it.** `donate-buttons` 230,891 and `maintenance-bills` 210,290, both inside
  ~200–280k. **That band is now well evidenced. Stop widening it.**
- **A finish-and-submit job** (sync, read someone else's 31 files, verify, open the PR) bands at
  **~120–170k**. `bills-inbox-finish` was 129,178.

### THE FLOOR IS ~77k, NOW CONFIRMED FIFTEEN TIMES

System tools 38,776 · MCP 16,902 · **Memory 10,463** · Skills 6,383 · System prompt 4,973 ≈
**77,500**. **Memory files grew from 9,820 to 10,463 today**, which is the only real movement; System
tools drifts a kilotoken or two with the tools a session loads. **This is settled. Stop
re-deriving it and stop calling it one measurement.**

### Landmarks

| | |
|---|---|
| Largest ever measured | **`who-does-what-view` 449,014** (est. ~300k, +50%) |
| Second | **`fable-architecture-review` 448,294** — fable-5-1 at `xhigh`, **two dials, not comparable** |
| Cheapest stream ever | **`release-note-truth-rule` 103,070** |
| Cheapest schema stream | **`resident-picker-floor` 121,974** (`receipt-backdate-rule` 119,322 still holds it for a single-file migration) |

**Nothing lands below ~100k.**

---

## Model and effort

**Two dials, and they do not behave the same way.** **Model** changes the price per unit of work,
not the amount: the floor is identical whichever model runs, so **choosing a cheaper family is the
only dial that reduces usage without changing the work.** **Effort** changes how much thinking
happens per turn, so raising it **raises** the figure. **It is not a usage optimisation and must
never be presented as one.**

**Never raise effort to fix an overrun, and never to fix a handoff miss.** The cure is a tighter
brief or a spin-out. See the decision file named above; this was asked and answered on 2026-10-13.

**`claude-sonnet-5-5` / `low` is the default and the evidence is now strong:** thirty-seven
consecutive streams, none over band, including a dozen carrying migrations or permissions. **The
caveat stands and should keep standing — the briefs also keep getting better, so the model cannot
take the credit.**

**Fable sat at 5% all day and expires at the 2026-10-14 reset, unused.** Its one item is *Fable dry
run of the acceptance checklist*, still blocked on Lutan and the Director agreeing who tests which
role. **The drop-shipment options paper was offered twice as a use for the bucket and not taken up.
Do not offer it again.** All-models ran **77% → 80%** across the eleven.

---

## What briefs should do

Everything from the last handover still holds. **Both standing blocks are now in `SKILL.md`** — the
finish-line block at the top of every brief, the pre-push test-plan block at the end. Copy both
verbatim. What else earned its place today:

- **Hand the stream what you checked, so it does not re-check it.** `backup-check-folder`'s brief
  carried the Pi crontab findings the planner had read over SSH, and said explicitly *"you do not
  need to re-check these, and you cannot reach the Pi yourself."* It came in 20% under band.
- **Name the one thing that can hurt someone.** `donate-buttons` — a donor sent to a look-alike
  domain loses real money, so the brief demanded the wrong-company case be proved, not just the
  happy path. `resident-picker-floor` — a widened read shows on nobody's screen, so the brief
  demanded the three negative logins be probed and the positive ones **match the 2IC's row count
  exactly, not merely be non-empty.** Both landed clean and both under band.
- **Tell a stream to file the outstanding step as a backlog item, not a test-plan row.**
  `donate-buttons` did exactly this for its production data entry, and wrote `n/a` on the
  release-notes line rather than promising users something that needed a hand step first.
- **Tell a two-PR stream that the finish line applies twice.** Merging the schema PR is not
  finishing. This is the trap `donate-channels` fell into.
- **Say which territory belongs to the stream beside it.** Two streams adding dictionary entries in
  different sections is a trivial conflict; both briefs naming the other's area is what keeps it
  trivial.

---

## Traps in the tooling

Everything in the last handover's list still holds (`grep -c` exit codes · no long prose in
`node -e` or heredocs · anchors and the empty-`$A` `sed` trap · a long backlog item is one line, so
survey with the `awk` title extractor · scanned PDFs need `render-pdf.ps1` · query dev read-only with
`loadEnv("test")` and a `file:///C:/...` import · the planner may apply a migration to dev from the
main checkout only). Added today:

- **FOLDING IN `backlog` CONFLICTS ROUTINELY, AND THAT IS NORMAL.** It happened on **both** syncs
  today: a PR ticks an item on `main` while a stream files a new item on the `backlog` branch beside
  the still-open original. **The resolution is always the same — keep both sides, drop the
  superseded unticked duplicate** — and `CLAUDE.md` documents it. It is not a sign anything is
  wrong. Resolve it in the main checkout, commit, carry on.
- **READ A LONG ITEM'S *LAST* STATUS NOTE FIRST, THEN WORK BACKWARDS.** The 44 px item
  **contradicts itself**: its earlier *"Still open"* clauses name the account-menu button as 20 px
  and ~80 files as unread, while its later clauses record both as fixed by `bare-buttons-groups` and
  `bare-buttons-lightbox` — and the later ones are right (`src/app/AccountMenu.tsx:68` is
  `min-h-11 min-w-11 … md:min-h-9`). **It was batch 3's third slot and was dropped**; the item now
  carries a dated note marking the early clauses superseded. **The lesson is not "the item was
  stale" — it is that a long item accretes contradictory notes across several streams and the newest
  is at the bottom.** All that is left of it: two bare buttons on `/admin/website` (a ten-minute
  fold-in) and one look at the photo lightbox at 375 px, which only Lutan can do.
- **A stream can legitimately do schema and app in ONE PR when the consumers already exist.**
  `resident-picker-floor` (#584) did, and it was right: the migration changed a *view body* whose
  readers were already on `main`, so nothing shipped reading schema the database lacked. **The rule
  bites when a PR adds a migration AND new code that reads it.** Judge by that, not by file count.
- **The planner's own stream still needs the full discipline.** Writing #583's checklist, the
  planner pre-ticked *"CI green on the PR"* **before the PR existed** — caught before the checker
  ran, but it is the exact trap the briefs warn streams about. **Run `check-test-plan.mjs` on your
  own plan too.**

### Leftovers

**Nine `Animal_Shelter_*` folders at writing, six of them merged leftovers:**
`backup-check-folder`, `bills-inbox`, `donate-buttons`, `handover-refresh`, `maintenance-bills`,
`release-fewer-merges`. **`brief-finish-line` is NOT a leftover — #583 is open.** Batch 3's three
(`photo-rpc`, `c4-locale-split`, `red-harnesses`) are working. **Every actual through today is
captured**, so nothing is at risk if Lutan archives those chats. `/clean-streams` does the round.

---

## Candidates for the next batch, in order

1. **Cut the next release once batch 3 merges.** `unreleased` holds three lines and batch 3 may add
   more. **Check `--status --env production` first** — production may be behind on migrations, and
   `0192` must reach it before its release note is true.
2. **The two bare buttons on `/admin/website`** — fold into any quick-win stream; not a workstream.
3. **The remaining five red check harnesses**, if `red-harnesses` closes eight — **three need a
   per-role ruling from Lutan** and are deliberately not Claude's.
4. **`maintenance-bills` follow-ons** and the **Bills tile on the Director's phone home** —
   **Lutan's call**: Management's daytime home is a fixed whiteboard list guarded by
   `check-home-screens.mjs`.
5. **C4 and C7**, if batch 3 did not land them.
6. **The `x-origin-key` Pi deploy**, the **production backup-tile confirmation** and the
   **`/donate` production data entry** — all deploys plus a check. Release-manager work with Lutan.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**
Carried forward; **none was re-verified today** except where noted, so treat the list as a pointer
and check any one you intend to act on.

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it at 375 px.
  Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — on a real phone. **Now the only
  person-blocked half of the 44 px item.**
- **The Director signing her roles draft** — Lutan said on 2026-10-09 it *"appears to already have
  been done"*; **unverified**, and production cannot be read from these sessions.
- **The app header's button sizes** — Lutan's call; recommendation already written.
- **The Staff holders on production** — until that list is answered, **`0173` must not reach
  production**, or those logins fail closed.
- **The acceptance checklist's pre-run agreements** — who tests which role, the per-role accounts on
  Test, what counts as a blocker, and where the signed paper copy lives (**it carries real names and
  this repo is public**). **This also blocks the one remaining Fable item.**
- **Who can read what of a contact, checked on production**, as each of six roles.
- **The role walkthrough re-run** — owed twice; a person runs it.
- **`search_path` on production** — dev came back 0 unpinned, but production may hold an older
  unpinned body. A one-minute release-manager query, in #560's test plan.
- **The Pi's spare-clone timer** — **confirmed NOT installed, over SSH on 2026-10-13** (no timer, no
  unit files). Its own open item; a hand step with Lutan.
- **VERIFIED DONE 2026-10-13, so do NOT re-raise it:** *Switch the Pi's backup from Sundays to
  daily.* The crontab holds the daily line **with `--keep-days 14`** and it ran at 03:00 on Tuesday
  13 October (the two runs before it were Sundays). The item had said the Pi "still holds the Sunday
  line", which was **false**; corrected on the `backlog` branch as `b5cd87e1`, and the release line
  shipped with #578.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions · the Pi jobs and failover options paper · the Google secret
  rotation leftovers · the second admin account (Anchalee) · the mobile sweep (**declined five times
  — offer only as a swap**) · the product `.org` name · **whether the purchasing job keeps reading
  stock receipts through `stock.delivery`** · **three of the thirteen red check harnesses** · **the
  Bills tile on the Director's phone home** · **merging #583**.
- **The Director:** signing the roles draft · **the community-dogs baseline number and the date it is
  true up to** · the Thai receipt wording checked by a Thai reader · the online merchandise shop.
- **Time:** HSTS not before **2026-11-08** · the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **The quick-win band stays as written** (2026-10-11, asked four times).
2. **The test-site visitor tile is NOT wanted.** The grey *Not set up* on `test.lannacare.org` is
   **the intended permanent state.**
3. **The Director MAY backdate a receipt.** `received_on <= issued_on <= today`, Bangkok today.
4. **The token floor is ~80k** (measured ~77k, fifteen times).
5. **`/r` and `/e` are not edge-cached, on purpose** (2026-10-12).
6. **Maintenance bills are Management and Admin only** (Lutan, 2026-10-12). The activity
   `maintenance.bills` is on the Who does what grid, so it can be widened without a release.
7. **Backups prune by AGE, not count** — "remove backups over 2 weeks old". Both items ticked.
8. **NEW — raising model or effort is NOT the answer to a handoff miss** (Lutan asked, 2026-10-13;
   `docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`). The fix is the brief.
9. **NEW — the duplicate `0191` is not renamed.** Applied files are never edited. Both are recorded
   under their own filenames and touch unrelated objects. The hazard is in `docs/release-handover.md`
   for the release manager, and `check-migration-numbers.mjs` was deliberately left as it is
   (#579). **The planning rule is the fix: a schema-then-app stream holds the migration slot until
   its APP PR merges.**

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — though he merges from the PR bar himself, often
before the planner has read the checks. Not technical in these areas: **plain English, no jargon,
options with consequences and a recommendation.** Deliverables go to
`C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a file naming
real people. **Never give him a command before the moment he should run it.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

**He answers questions put as options with a recommendation, and he answers them fast.** On
2026-10-13 he took the recommendation **every time** — including the two that cost him something
(no dial change; dropping a planned item from batch 3). **A two-line "here is the trade-off, here is
what I suggest" gets a decision in seconds; a paragraph of options does not.**

**He also asks good process questions mid-batch** — the model/effort one above produced a permanent
rule. **Answer those from the record, with the misses enumerated, not from instinct.**

**He may start a batch before the planning conversation finishes, may set a different model or effort
than recommended, may merge a PR himself, and may pull an urgent item in outside the batch** (he
merged #581 today, unplanned). **Ask what he has actually started rather than assuming the plan
describes reality.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it.

**Count the workstreams honestly, and count other sessions' too.** Today's eleven are six planned
streams, the planner's own #583 and this file, and **three release/handover streams this chat did not
plan** — they are still workstreams against this repo since the handover. Counting PRs instead of
streams is how the counter read 13 and then 16 on 2026-10-12. **This one went past the threshold to
eleven before being written**, which is why the rule says to offer at nine.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-116`; the previous were **#575** (`planner-handover-105`),
**#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on
2026-10-09 whether the PR was really needed; **it is.** It is a `docs/` file in the repo, so the only
alternatives are committing to `main` directly or routing it through the `backlog` branch, and the
second is the 2026-10-07 failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
