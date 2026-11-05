# Planner handover — edition `654`, 2026-11-05

**A delta over `645`.** It covers one plan of **nine streams in three batches** — batch 1 (#1290,
#1291, #1292), batch 2 (#1296, #1297, #1298), batch 3 set up — **plus two unplanned streams that
shipped** (#1293, #1294) and **one PR deliberately left open** (#1295, the cutover).

> **Written at batch 3's SETUP, as the rule requires, so batch 3's own figures are NOT in it.** They
> land in `663`.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `663`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE LEAD: HE ASKED WHY IT WAS TAKING SO LONG, AND THE ANSWER WAS THE ORDER OF THE WORK

**His words, in two messages:** *"this is taking too long, why is it taking so long"*, then the
instruction that fixes it — ***"Priority should be to do what I ask first, paperwork can be fixed after
you finish what I ask for"***.

**He was right, and the diagnosis is uncomfortable because nothing that was done was wrong.** Batch 2's
worktrees and briefs were finished early. He then waited through: the actuals capture, five backlog
edits, a deep source read of `0315`, and **a notes-file script that crashed on its own quoting and was
rebuilt in pieces** — before he was told which three folders to open. Every one of those is legitimate
planner work. **None of it was what he asked for.** The paperwork cost nothing to do afterwards.

**The rule, saved as a memory and followed in this round:**

- **Worktrees created, briefs written, folders/ports/dials handed over — STOP THERE.** Then
  `.plan-day.md`, the backlog filing, the actuals, this file.
- **A real blocker is not paperwork.** Chasing the failed `npm ci` was worth doing first, because it
  gated his cutover. The test is *"does he need this to act?"*, not *"is it on my checklist?"*
- **Write the record in ONE pass.** Never a multi-round-trip script against prose.
- **If the record will take a while, hand over first and say the record is still to write.**

**It does NOT override `do-it-right-first-time`.** That rule is about care versus shortcuts; this one is
about order. Do the job properly, then do the bookkeeping, in that order.

---

## HIS CUSTOMER PRIORITIES PANEL CHANGED A BATCH FOR THE FIRST TIME

**This is the panel working as intended, and a planner should expect it to happen mid-plan.**

`ArtifactData get priorities/ranking` on the pinned page returned **one** starred item, set at **02:55
today** — `i-314hq` — which is *after* batch 2 was planned. **His star outranks file position and it
outranks the saved plan**, so `#314hq` went into batch 3 and `correct-resident-receipts` (`#dklvq`) came
out, being the one of the three not named in the backlog's own order-of-work nine.

**Three things to copy:**

- **Read the panel on a RESUME, not only on a fresh plan.** The skill says re-check the next batch
  against the backlog *as it is now*; the panel is part of "now". Had this resume skipped the read, his
  number-one priority would have waited a whole batch.
- **A worktree already created is not a reason to keep a stream.** `correct-resident-receipts`'s folder
  had been made; `worktree.mjs done` cleared it (0 ahead, nothing lost) and the displaced item goes to
  the front of the next plan. **Say that explicitly so it does not read as dropped.**
- **`No document` or an empty `order` is the ordinary case.** One star is a strong signal precisely
  because he rarely sets any.

---

## THE ACTUALS, AND WHY ONLY FIVE OF SIX ARE READINGS

| slug | PR | estimated | actual | source | verdict |
|---|---|---|---|---|---|
| `drive-cutover-remap` | #1291 | 220–280k | 191,230 | PR comment | 13% under |
| `planner-tooling-follow-ups` | #1292 | 150–195k | 198,929 | PR comment | 2% over |
| `project-photos-approval` | #1290 | 175–225k | 209,063 | PR comment | inside, upper half |
| `card-prose-corrections` | #1296 | 115–155k | 155,152 | PR comment | 0.1% over |
| `assistant-tag-save-silent` | #1297 | 140–185k | 160,222 | **`get_usage` fallback** | inside |
| `website-approval-portal-2` | #1298 | 180–230k | 116,099 | PR comment | **NOT A READING** |

**#1298 carried `compacted=yes` AND `rescoped=yes` — two disqualifiers at once.** Its figure is a
remainder of a reset window measured against a scope that changed. Banked, it would have read as a 48%
under-run on the batch's largest estimate and taught the next planner that an approval portal costs less
than a prose sweep. **Keep it out of the bands and say why in one line.**

**#1297 posted no `stream-usage:` comment at all.** The figure came from `get_usage` on the live session
with `context.session` echoed back and checked. **The fallback worked only because the session had not
been archived yet.** The comment is durable; the fallback is a race. **A stream that merges without
posting one is worth a note on its own** — this is the first of this plan.

**Floors, re-derived and never carried forward:** 107,929 · 104,015 · 105,200 (batch 1), then 104,083
and 103,496 (batch 2 — #1298's is meaningless). **Seven batches now read spreads of
5,001 / 5,435 / 424 / 26,515 / 1,087 / 3,914 / 587.** There is no constant floor.

**Two band lessons, both worth more than the numbers:**

- **A brief that knows something the band does not is a band error, not a lucky under-run.**
  `drive-cutover-remap` came in 13% under, and its own step-zero evidence had said *"you are extending
  existing machinery, not building a transport from nothing"* — because `files.copy` already existed.
  **The band charged the full instrument rate anyway.** When writing step-zero evidence that shrinks the
  job, shrink the band in the same breath.
- **Removing a mechanism from scope does not shrink a job much when the judgement and the proof remain.**
  `project-photos-approval` was re-cut downward after `attachments.approved_at` turned out to exist, and
  landed near the old band's middle. **Right in discipline, slightly wrong in direction.**
- **Two re-cuts in batch 2, two held bands.** `card-prose-corrections` narrowed (all five locations named
  by file and line) landed 152 tokens over the top; `assistant-tag-save-silent` raised (a
  NOT-ESTABLISHED question to settle plus a browser drive) landed inside. **Re-cutting on stated grounds
  works; re-cutting on a feeling does not.**

---

## WHAT THE PR BODIES GAVE US, AND IT WAS AGAIN THE BEST VALUE IN THE ROUND

**Four items filed from six PR bodies.** A stream reports; only the planner files. Read every merged
body for findings outside its deliverable list, every batch.

- **`#p3k9w`** (Security), from #1290 — an approver can edit columns of an attachment they were only
  meant to approve, **captions included**, on project and event photos. A caption is published public
  text and the grant is a row write, not a column one.
- **`#m8x2r`** (Architecture) — the install blocker below.
- **`#w4s2n`** (Quick wins), from #1296 — the same sign-up list is **"desexing"** in a decision file and
  **"sterilisation"** in `en.ts`. The dictionary's word is the one a user reads.
- **`#a7r3k`** (Assistant), from #1297 — the tag-notice shipped, but **no retry in place** and **the
  failure path cannot be exercised on dev without faking it**, so the notice has never been seen on a
  screen. A path nobody can exercise is a path that rots.

**And one that needed nothing: #1298 asked the planner to strike the gallery-draft clause from `#7j2qf`
and had already struck it, and had already ticked the item.** Checked rather than assumed — which is the
whole habit. **An instruction in a PR body may already have been carried out by the PR.**

---

## `645`'s LEAD IS CLOSED PROPERLY, AND THE RULE IT LEAVES

`645` opened on an hour he lost redoing BitLocker, the Google OAuth checks and R-0323. **The cause was
that nobody could CHECK, so everybody ASKED.**

`scripts/check-deceased-archive-state.mjs` is now on `main` (#1292, `056f7b9d`) **and has been run
against production**: `R-0323 Chao Guay (2) — died 2026-10-28, archived 2026-11-04 12:30:43, summary,
index`. **Nobody has cause to ask him about R-0323 again. A column the planner can read is never a
question for a person.**

**The rule it leaves, and it is new:** **an "uncommitted" file named in a handover is a race, not a
deliverable.** `645` said the archive script was *"sitting uncommitted"* and expected step 1's
clean-tree check to stop on it. It did not — **the file had already gone, and a clean tree looks exactly
like a tidy one.** Name the commit or name nothing.

---

## STILL HIS, AND STILL OPEN: the main checkout cannot build

**`#m8x2r`.** `node scripts/guarded-install.mjs` failed **EPERM unlink** on
`node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node`, exit **127**. `npm ci` deletes
before installing, so the tree is half-removed: **37 entries, no `node_modules/next`.**

**Holder, identified not guessed:** a defunct `npx next start -p 3100` pair, **pids 76628 and 87036**,
from the main checkout's own `node_modules`. **Nothing is listening on 3100.** The planner tried to stop
them and the auto-mode classifier refused it (*Interfere With Workloads*), so **only Lutan can clear it,
and he has been away from the laptop since.**

**Why `#gspxx`'s tree lock did not prevent it:** that lock is taken by things that **write**
`node_modules`. A `next start` only **reads** it, takes no lock, and holds the SWC binary anyway — so
the guard is blind to the commonest holder. The proposed fix is for `guarded-install.mjs` to detect a
live `next` process pointing at the checkout and **refuse before deleting anything**.

**It did not block any stream** — `worktree.mjs new` installs into each worktree's own `node_modules`
and all six installs succeeded. **What it will block:** a release cut, `gates.mjs` in the main checkout,
and `scripts/deploy.mjs` for the cutover. **PR #1295 is open and marked DO NOT MERGE YET.**

---

## TOOLING HABITS THAT COST TURNS THIS PLAN, AND THE SHAPES THAT WORK

- **Do not compose long prose with a shell heredoc or a JS template literal.** It failed twice in one
  day on its own quoting — a template literal terminated early on backticks in markdown prose, and a
  heredoc died on `unexpected EOF`. Nothing was written either time. **What works: write each prose
  block with the Write tool, then `cat` them together, lifting the mandatory blocks with
  `sed -n <range>` from the previous batch's brief** so they cannot drift within a batch. All six briefs
  this plan carry the nine mandatory blocks verbatim, verified by heading count.
- **Amend a long local file by APPENDING a dated UPDATE section**, never by matching anchors in prose.
- **Do not pipe a command whose exit code you need.** `guarded-install.mjs | tail` reported `tail`'s 0
  while npm had errored; redirecting to a file gave the real **127**. **Read the output before writing
  the conclusion under the command.**
- **`gh pr comment` can be refused by the classifier** (*External System Writes*). It happened on #1286.
  **Do not retry in a loop** — record the verification elsewhere and carry on; `gh pr merge` worked fine
  moments later.
- **Insert into `docs/backlog.md` with `sed -i '<line>r <file>'` after the section heading's blank
  line.** The working tree is CRLF and `sed -i` rewrites it LF; git stores LF either way, so the diff is
  exactly the lines added — **check with `git diff --numstat` before committing**, which is how this
  round proved it.

---

## WHAT IS SET UP AND WHAT IS OWED

**Batch 3, set up and handed over 2026-11-05:**

| slug | item | port | migration | estimated |
|---|---|---|---|---|
| `deceased-visit-app-half` | `#314hq` | 3010 | no (`0310` shipped it) | 170–220k |
| `accountant-card-expenses` | `#00e3u` | 3008 | **`0317`** | 230–290k |
| `control-listing-sweep-9` | `#79sqf` | 3009 | no | 145–190k |

All three sonnet-5-5 / low, **both dials set by hand** — nothing a session can edit sets the default
(measured; settled 2026-11-02).

**Owed to the next planner:**

1. **`#dklvq` goes to the front of the next plan.** Displaced by his star, not dropped, unstarted.
2. **`#m8x2r` is Lutan's and still open.** Ask once, in a clause, not as a question of its own.
3. **The role-shaped instruments are still role-shaped.** `scripts/check-menu-coverage.mjs` loops over
   roles and says so in its own first line, and most of `scripts/check-production.mjs` is keyed the same
   way. **Every band and brief is written from their output, so while they answer per role the
   all-analysis-by-card rule keeps being broken by people trying to follow it.** This has been owed for
   three editions.
4. **Thai is unreviewed across the board** (`#y1dqu`, widened on 2026-11-05 from one string to the
   standing gap — 6 of 13 notes in `0.43.0` had unread Thai, and 29 items mention it). Every brief says
   Thai goes in unreviewed and the stream must say so. **Do not let a stream tick it as reviewed.**

