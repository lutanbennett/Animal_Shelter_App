# Planner handover — written 2026-10-14, after eleven workstreams

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of eleven workstreams across two days — batches 4, 5 and 6, plus the planner's own. It says
where the planning loop stands, what is blocked and on whom, and what not to re-derive. It is
**rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top block and the batch 6 section.** The top says which batch is live
4. this file, for what has changed since
5. **`docs/public-site-review-2026-10-13.md`** — the Fable review of the public site. **All 25 of its
   suggestions are now backlog items on Lutan's instruction**, which turned the public site from one
   item into a programme. About 17 remain open.
6. **`docs/database-review-2026-10-13.md`** — still the best single description of the database.
   **F1, F2, F4 and W1 are now filed; the other twelve findings are not, by design.**

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

**What the planner did wrong.** It put a block in all three batch-5 briefs telling each stream to
call `get_usage` and **stop without starting if the weekly figure was above ~85%.** Nobody asked for
it. It did two separate kinds of damage:

1. **It would have refused to start two streams on an allowance he had paid for** — the planner's
   judgement substituted for his, on his own property.
2. **It silently cancelled an experiment he had just asked for**, because it gated on *all-models*
   (97%) while the stream drew on the *Fable* bucket (26%). **He caught that himself.** The stream
   would have looked like one that sensibly judged the window too tight — **not** like a brief wired
   to the wrong number.

**The shape every brief must use instead:**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.** *"This probably will not cover all four; I would do the metadata
  first"* is right. *"The window is at 97% so I am not starting"* is not.
- **Mid-work exhaustion is different and still correct:** stop with words — what is built, what is
  not, what is next.

**Do not reintroduce a numeric stop threshold into a brief, ever.** Advisory ("the window is tight,
commit often") is fine. A gate is not.

**And the sibling lesson, from an hour earlier the same day:** *"PLEASE DON'T MAKE ARBITRARY
DECISIONS ABOUT HOW I USE MY CREDITS WITHOUT ASKING ME FIRST."* The planner had decided on its own
which stream ran on Fable, at what effort, and that the others would wait. **Model, effort, which
allowance gets spent, and whether to start at all are all his.** The planner's job is the trade-off,
a recommendation and the consequence in one line — **then ask.**

---

## FABLE: TWO CORRECTIONS, BOTH THE PLANNER'S FAULT

### 1. Fable is NOT a separate bucket

**Lutan, 2026-10-14: *"Confirming Fable usage is not separate to the weekly allowance."*** The
*Weekly · Fable* line is a **sub-limit inside** the weekly window, not an addition to it. It can cap
Fable work early; **it never grants extra capacity.**

**The planner said the opposite twice** — *"Fable is the bucket with genuine headroom"* and *"your
Fable bucket is 74% of free headroom"*. **Both wrong.** At *all-models 97% / Fable 26%* there is
**3% left, full stop.** **Never offer Fable spend as a way round a spent weekly window.** In memory
as `fable-counts-against-weekly`, because `get_usage` prints the Fable line in the same shape as the
weekly one and it looks exactly like a second allowance.

### 2. Fable is NOT inherently expensive — that was effort, not model

The planner then over-corrected and told him Fable was *"the more costly choice on a tight window"*.
**Also wrong.** Every large Fable figure on record is `xhigh`. **Measured 2026-10-14, two Fable BUILD
streams at `low`: 219,364 and 187,886 — both inside a ~150–220k band that was set from SONNET
quick-wins.** So **Fable at `low` costs about what Sonnet at `low` costs for the same work.**

**Compare like effort with like effort.** The axis that actually moves these numbers is effort and
task shape, not the model family.

### 3. The Fable review band splits in two by SHAPE

| Fable review shape | band | evidence |
|---|---|---|
| **Reads files** | **~300–400k** | `fable-db-review` **332,421** — 194 migrations + the catalogue to a 958-line report |
| **Drives a browser** | **~500–600k** | `public-site-fable-review` **545,745** — 14 pages, 2 widths, 2 languages, with screenshots. **Messages alone 462,474** |
| Whole-system read | ~450k | `fable-architecture-review` **448,294** |

Both of the first two ran `fable-5-1` / `xhigh`, **so shape is the only variable** — a clean
measurement. **Stop quoting one band for "a Fable review".**

**The general axis, found again in a new place:** not *"must it count?"* but **"must it build or
DRIVE the instrument?"** Reading is cheap (`silent-empty-reads`: 64 files, 133,986). **Driving a
browser belongs with building, not with reading.**

---

## READ THE DIALS, NEVER THE RECOMMENDATION

**This caught the planner out twice more in two days**, and `get_session` is the only answer.

- **`public-site-trust-copy`** was recommended Sonnet/low and briefed as the Sonnet half of a
  controlled comparison. **Lutan ran it on Fable/low too.** So **the Sonnet-versus-Fable comparison
  never happened** — do not report one from those two figures, they are the same model. If it is
  still wanted it needs a deliberate pairing.
- Earlier, `restore-rehearsal` ran opus/medium against a sonnet band, and reporting it as an overrun
  would have corrupted the table.

**Always call `get_session` and read `model` and `effort` before comparing any figure to a band.**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`930bb8f3`** (#605 to #609 merged, backlog folded in) |
| Dev database | **195 applied, 0 pending**. 195 files, latest `0194_role_cards.sql`; `0191` is duplicated by design and never renamed |
| Production database | **not read from this session.** A peer session read it at Lutan's explicit request — see the backup alarm below |
| Next free migration number | **`0195`, unclaimed.** Batch 6 carries no migration, deliberately, so the security fold can take it |
| Open backlog items | **118 on `main`, 119 on `backlog`** (the deploy-guard item below is not yet folded in) |
| Open PRs | none at the time of writing; batch 6's three are in flight |
| Last release | **`0.29.0`** |
| `unreleased` | **SIX lines. A release is well worth cutting** — major versus minor is his |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Batches 4, 5 and 6.** Batch 4: #605 `bills-photo-fix`, #606 `public-site-fable-review`. Batch 5:
#607 `public-site-findability`, #608 `public-site-trust-copy`, #609 `cards-who-does-what`. Batch 6
live: `cards-home-screen` (3006), `public-site-phone-polish` (3007), `backup-check-alarm` (3008).

---

## Token estimates — forty-eight measured

### The last six

| slug | model / effort **run** | estimated | actual | |
|---|---|---|---|---|
| `bills-photo-fix` | sonnet-5-5 / low | ~110–170k | **129,868** | inside |
| `public-site-fable-review` | fable-5-1 / xhigh | ~300–400k | **545,745** | **+36%, a real overrun on the recommended dials** |
| `public-site-findability` | **fable-5-1 / low** | ~150–220k | **219,364** | just inside |
| `public-site-trust-copy` | **fable-5-1 / low** *(sonnet recommended)* | ~150–220k | **187,886** | inside |
| `cards-who-does-what` | sonnet-5-5 / low | ~230–320k | **259,167** | inside |
| `cards-schema`, `backup-own-token`, `us-date-order` | sonnet-5-5 / low | — | **unmeasured** | **see the capture rule** |

**`claude-sonnet-5-5` / `low` remains the default. The streak is 43.**

### THE CAPTURE RULE BIT FOR THE FIRST TIME — three figures are gone for good

**Batch 3's three actuals are `unmeasured`.** All three sessions had closed before the planning chat
read them. **`cards-schema` in particular would have been the first measurement of a
schema-plus-recompute stream.** It cannot be recovered.

**The rule is not "try harder": it is that a planning chat which sleeps through a merge loses the
data permanently.** So **capture in the same turn you notice a merge**, and **if this chat is about
to end with a batch in flight, say so and say the figures will be lost.** Batches 4, 5 and 6 were all
captured because the chat was awake.

### THE FOLDING RULE IS THE PLANNER'S BEST SAVING, AND THIS IS THE PROOF

**Eight of the public-site review's items cleared in TWO streams for about 407k.** As eight separate
streams they would have paid **about 620k in floor alone**, before any work. **Fold aggressively.**

**Split folds by KIND, not by rank.** The tempting cut was "top four" and "next four"; that would
have put metadata and page copy in one stream and split the home page across both. Splitting by kind
(one stream of metadata and routes, one of copy and one logic file) meant each read one sort of file
and each brief could say plainly what the other touched.

**Only ONE public-site fold fits per batch — checked, not assumed.** The remaining 17 or so review
items mostly live in the same handful of files (`PublicHeader`, `PublicNav`, the adopt list, the
adopt detail, the home page), so a second fold *would* collide, which by the batch rule makes it one
bigger stream, not two.

### The floor is about 77k, confirmed again

System tools ~38.7k, MCP ~17k, Memory ~10.9k, Skills 6,383, System prompt ~5k, totalling about
**77,500**. **Memory is the only part still growing.** Settled — stop re-deriving it.

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** What else earned its place:

- **Write the boundary of a multi-stream item at the TOP, before the task.** The cards item is about
  16,000 characters and describes all four streams. Both cards briefs opened with *what you are not
  building*, and neither stream overran its half.
- **Name the one thing that can hurt someone.** `cards-home-screen`: a tile that opens a page the
  person cannot use is the exact failure the feature removes, so prove the pairing with a check
  script rather than a screenshot. `cards-who-does-what`: a card granting more than its description
  says is a silent over-grant with no fault on any screen — hash `role_permissions` before and after.
- **Tell a stream which lines in its own item are correct but dangerous.** `bills-photo-fix`'s three
  files each contained *other* `order("created_at")` lines that were right, on tables that do have
  the column. Without that sentence a careless sweep breaks working code.
- **Say when the item's text is data, not code.** Most public page bodies are typed in Settings and
  translated through the queue. Edit the string and the change is invisible wherever someone has
  already saved a body.
- **Say what a stream must NOT fix.** The 44 px check already exists and reports notes rather than
  failures; the staff app's buttons are a different item; the lightbox's last two controls need a
  person on a handset. All three said so explicitly.
- **Hand over an honest split when a stream cannot finish alone.** `backup-check-alarm` cannot read
  production, so its brief does the code and dev halves and gives Lutan the production confirmation
  as named steps — **one at a time, at the moment he runs each.**

---

## Traps in the tooling

Everything in the last handover's list still holds (`grep -c` exit codes; **no long prose in
`node -e` or heredocs — use the Write tool and splice with `awk`**; a long backlog item is one line,
so survey with the `awk` title extractor; query dev read-only with `loadEnv("test")`; the planner may
apply a migration to dev from the main checkout only; **`git show <rev>:<path>` LIES SILENTLY ON
DOTTED PATHS in this shell — use `git grep` or `git ls-tree`, or prefix `MSYS_NO_PATHCONV=1`**).
Added this round:

- **`awk -v nf="$WINDOWS_PATH"` BREAKS, SILENTLY AND DESTRUCTIVELY.** A scratchpad path like
  `C:\Users\Leidos\AppData\Local\Temp\...` contains `\U`, `\L`, `\A`, `\T`, which awk treats as
  escape sequences — so `getline l < nf` reads nothing, **the inserted block is empty, and a splice
  that deletes a range then inserts leaves a GAP.** It happened mid-edit to two briefs. **Use the
  POSIX path** (`/tmp/claude/...`) for any file awk must read, and **verify the insert landed** with
  a `grep -c` on a distinctive phrase, not just on the deletion.
- **A `Write` to a file that exists in a fresh worktree is refused** until it has been read in that
  conversation. Writing to the scratchpad and `cp`-ing over is cheaper than reading a 366-line file
  back just to replace it wholesale.
- **`.plan-day.md` is 850 lines now and has accreted three "state at run N" blocks.** The newest is
  at the top and says it supersedes the ones below. **The next rewrite should prune them** — a
  superseded state block that still reads as current is exactly how a stale figure gets quoted.
- **A `post-commit` push can fail transiently** and the hook says so plainly
  (*"push of 'backlog' failed — run 'git push -u origin backlog' when back online"*). It is not a
  rejected history: **just `git push` again.** Happened once this round and succeeded immediately.
- **`worktree.mjs new` can exceed a 7-minute tool timeout** on `npm ci` and be moved to the
  background. **The branch and folder exist well before `npm ci` finishes**, so check
  `worktree.mjs list` rather than assuming it failed.

### Leftovers — `/clean-streams` is the next thing to run

**Two are clearable right now** — `free`, 0 ahead, PR merged: **`bills-photo-fix`** (#605) and
**`public-site-fable-review`** (#606).

**Three more become clearable the moment their sessions close** — all 0 ahead with merged PRs, but
`HELD`: **`cards-who-does-what`** (#609), **`public-site-findability`** (#607),
**`public-site-trust-copy`** (#608). **Ask before tearing any of them down.**

**Three are LIVE WORK and must not be touched:** `backup-check-alarm` (1 ahead),
`cards-home-screen` (2 ahead), `public-site-phone-polish` (2 ahead, 2 dirty). **Ahead with no merged
PR is unsubmitted work — `done`ing it destroys a day's build.**

Plus **`planner-handover-138`**, this file's own stream.

---

## The red backup alarm — a live situation, and a trap with it

**Production's backup alarm is still red**, read on production by the `Backlog item review` session
at Lutan's explicit request (14 Oct, about 15:00 Bangkok): `state fail`, **`fail_runs` 315**,
`alerted_at 2026-10-02`, error **"BACKUP_DRIVE_FOLDER_ID is not set here"**.

**Three things not to re-derive:**

1. **The error has CHANGED from what the backlog item records** ("No backup ... has been found").
   **The live fault is a missing secret on the Worker**, which runs the 15-minute alert cron. The Pi
   has had the value since 2026-10-12.
2. **The green System status tile is NOT proof the alarm works.** The tile is drawn by the Pi, which
   has the secret; the alarm is the Worker, which does not. **Two readers, two answers** — and that
   confusion is what let this run for eleven days.
3. **DO NOT fix it with `deploy.mjs --env production --secrets`.** Verified in the code, not taken on
   trust: `loadEnv()` returns `{ ...base, ...overlay, ...process.env }` with **`base` = `.env.local`
   (dev)**, so a required secret absent from `.env.deploy.production` **falls through to the dev
   value** — and `GOOGLE_DRIVE_ROOT_FOLDER_ID` is `required: true`, so `--secrets` always pushes it
   (`deploy.mjs:259`). **The nuance the warning lacked:** `env.mjs`'s own header says this is
   deliberate *"while Drive still runs on the dev account"*, so today dev's Drive values *are*
   production's. **It becomes a live hazard** the moment production gets its own Drive tree, or the
   Drive identity changes again (#600 gave the backup its own token; **#604 reverted it and reopened
   S4**). A `--secrets` push would then break live photo uploads with nothing on screen.

**The fix is one secret and it is Lutan's**, being a production Worker change (his instruction,
2026-10-02): set `BACKUP_DRIVE_FOLDER_ID` alone on the production Worker from the id in
`.env.deploy.production`, then confirm `fail_runs` is 0. **Give him that command at the moment he
runs it, never earlier.** **Filed as its own backlog item:** `deploy.mjs` should refuse a production
`--secrets` push when a required secret resolves only from `.env.local` (`b31be632` on `backlog`).

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The production cutover** — **no firm date.** Blocked on the Director transferring
  `lannacareforanimals.org` to Cloudflare from sav.com. **Not plannable until the zone reads Active.**
- **`from-zero-rebuild`** — **displaced THREE times**, on his decision each time. Needs a third free
  Supabase project (the free tier allows two; dev and production hold both). **Not a paid plan.**
  **About two thirds needs nothing from anyone** — the drift script and the migration restating dev's
  two hand-edited columns — so brief that half first when it runs.
- **Nine or so of the public-site review's items need the Director or Lutan, not code** — her phone
  number and LINE id, the Thai tagline and visiting hours, what adoption costs, publishing adoptable
  residents a few a week. **Reminders, not streams.**
- **Five red check harnesses** — all five need a per-role ruling from Lutan.
- **F3** (one delete rule for 54 `auth.users` links) — a decision before a stream.
- **The photo lightbox at 375 px** — a person on a real phone.
- **The maintenance board on a phone** — the Director left it blank on the 2026-10-08 sheet.
- **The Bills tile on the Director's phone home**; **whether purchasing keeps reading stock receipts
  through `stock.delivery`**; **promoting `test-plan` to a required check** — all his.
- **The acceptance checklist's pre-run agreements**, which also block the one remaining Fable item.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions; the third Supabase project; **the twelve unfiled database review
  findings**; F3's delete rule; the five red harnesses; the Pi failover options paper; the second
  admin account (Anchalee); the mobile sweep (**declined five times — offer only as a swap**); the
  product `.org` name; **the one-secret backup alarm fix**; **whether to cut a release now that
  `unreleased` has six lines**.
- **The Director:** signing the roles draft; the community-dogs baseline number; the Thai receipt
  wording; the online merchandise shop; **the domain transfer, which gates the cutover**.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Fable is not a separate bucket** (2026-10-14) — and Fable at `low` is not dearer than Sonnet.
2. **Never block his paid usage.** No numeric stop thresholds in briefs.
3. **The card set is TWENTY-ONE**, agreed, in `src/lib/permissions/cards.ts`. **It will grow, and he
   knows the cost** (a card is code; which cards a role has is data). **Never add one on a stream's
   initiative.**
4. **Tap a card for its access; the 56-row grid does NOT sit under the cards.** It moved to its own
   Details view in #609. **It is not deleted** — dropping it entirely would be his call.
5. **The menu removal goes LAST** (stream 4 of the cards work), gated on a re-runnable orphan list.
6. **All 25 public-site review suggestions are filed**, on his instruction.
7. **F1, F2, F4 and W1 are filed; the other twelve review findings are not**, by design.
8. **The backup's own Drive identity (S4) was shipped and REVERTED** — #604 put it back on the shared
   token. **Do not re-attempt it**; it needs him at a Google console.
9. **Backups prune by AGE, not count.** **Backup key custody is DONE** (encrypted USB and Keychain).
   **The restore rehearsal is ticked**, with the Supabase half its own item.
10. **The test-site visitor tile is NOT wanted** — grey *Not set up* is the intended permanent state.
11. **Raising model or effort is NOT the answer to a handoff miss.** The fix is the brief.
12. **The quick-win band stays as written.** Asked four times.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — though he often merges from the PR bar himself
before the planner has read the checks. **Release PRs are the exception: Claude merges those itself
the moment CI is green.** Not technical in these areas: **plain English, no jargon, options with
consequences and a recommendation.** Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The
repo is public** — never commit or attach a file naming real people. **Never give him a command
before the moment he should run it** (he ran a production deploy three steps early on 2026-10-10).

**He answers questions put as options with a recommendation, and he answers them fast.** He also
**overrides freely and expects that to be accepted without re-argument** — he started a batch at 88%
of the window, ran two streams on Fable when one was recommended, and declined the third Supabase
project three times. **When he overrides, adapt the work to survive the choice.**

**He reads the briefs' consequences carefully and will catch a planner error in them.** He found both
the mis-keyed window gate and the blocking gate itself. **Take that seriously: a brief is a thing he
audits, not just something the streams read.**

**He may start a batch before the planning conversation finishes, may merge a PR himself, may run a
stream on a different model, and may pull an urgent item in outside the batch.** **Ask what he has
actually started rather than assuming the plan describes reality**, and **read `get_session` rather
than the recommendation.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it. **This one
was asked for directly at eleven**, in the chat that had planned all three batches — which is the
rule working.

**Count the workstreams honestly, and count other sessions' too.** This round's eleven are batch 4's
two, batch 5's three, batch 6's three, the planner's own handover, and two streams this chat did not
plan (#601 backup custody, #604 the S4 revert). **Counting PRs instead of streams is how the counter
once read 13 and then 16.** **And do not double-count a batch**: streams are added when the batch is
*set up*, so a postponed stream is already on the board.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-138`; the previous were **#597** (`127`), **#588** (`116`),
**#575** (`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490**
(`81`). Lutan asked on 2026-10-09 whether the PR was really needed; **it is.** It is a `docs/` file in
the repo, so the only alternatives are committing to `main` directly or routing it through the
`backlog` branch, and the second is the 2026-10-07 failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
