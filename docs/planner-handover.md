# Planner handover — written 2026-10-12, after batch 96

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat, written at the
end of eleven workstreams (batches 94, 95 and 96, all planned and merged in one chat on one day, in
about three and a half hours). It says where the planning loop stands, what is blocked and on whom,
and what not to re-derive. It is **rewritten every nine workstreams** and is deliberately
short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run. **It gained a step on
   2026-10-12: every brief must end with the pre-push test-plan block, quoted verbatim in the
   skill.** That is not optional and the reason is below
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is long; do not read it
   all. The top line says which batch is live
4. this file, for what has changed since
5. **`docs/architecture-review-2026-09-22.md`** — 568 lines, the best single description of the
   system. Read §1 before planning anything structural. **Its findings are being worked through
   fast: S1, S3, S5, S6, S7, C2, C3 and N1/N4 all closed on 2026-10-12**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`cbad541d`** (#561) |
| Dev database | **187 applied, 0 pending, no drift** |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0188`** — and it is genuinely free; see the `search-path-pin` story |
| Open backlog items | **93**, down from 101 |
| Open PRs | **none**; #550–#561 are all merged |
| Last release | **`0.27.0`** (2026-10-11) |
| **A release cut is DUE** | **`unreleased` carries two lines** — the *Who does what* sticky headers, and readable refusals on maintenance jobs and project folders |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Eleven PRs merged in about three and a half hours** (#550–#561), across three `/plan-day` runs in
one chat. **Batch 94 was planned, built and merged in 25 minutes.** **Do not assume a batch you set
up is still in flight** — check `gh pr list` before telling the user anything about it. On
2026-10-12 a whole batch merged *while the planner was waiting on its own unrelated PR's CI.*

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; check whether the live batch has merged and **capture
token actuals in that same turn if it has**; check each candidate against the code, *against what
the user has already ruled out*, and *against whether it is waiting on a decision rather than on
effort*; present three batch tables with bands **and a model/effort recommendation**; ask once;
create only the current batch's worktrees and briefs, **each ending with the pre-push block**; save
the plan and bump the counter.

---

## Six states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch tip is not in
   `main`. The work is in. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict. A conflict shows as
   `CONFLICTING`, and **silent CI on a pushed commit means exactly that** — sync the branch, do not
   wait.
3. **`list_sessions` reporting `prState: OPEN` for a merged PR.** Seen again on 2026-10-12.
   **`gh pr list` is the truth; the session listing caches.**
4. **A stale session-start `git status`.** The snapshot in the first system message is from session
   start and can be hours old. **Re-read `git log` rather than quoting it.**
5. **`HELD` is a snapshot, not a verdict.** A worktree is held while its session lives. **Clear
   leftovers on a later run, never ask the user to close chats for it.**
6. **NEW — the user may merge a PR before you get to it.** #560 was merged from the PR bar at 04:43
   while the planner was still reading its checks, and a later commit of its own made it in anyway.
   **Read `gh pr view --json state` before announcing a merge, and do not be thrown by `MERGED`.**

---

## NEW AND IMPORTANT: every brief must carry the pre-push test-plan block

**Lutan, 2026-10-12: *"the streams seem to be making errors in the test plan when they submit the CI.
Can we add something into the brief that gets them to make sure it's right before they submit the CI
rather than us reworking all the time."*** He was right, and **it was the planner's gap, not the
streams'.**

Six commits across batches 94 and 95 were spent fixing a test plan *after* CI went red, **every one
on format rather than content** (`15b5ef9f`, `d98c3317`, `d1175619`, `be8948e4`, `36dce481`,
`7c613d74`). All six were catchable locally in one command. `CLAUDE.md` already said to run
`check-test-plan.mjs` before pushing — **but the briefs did not repeat it, and the brief is what a
fresh session reads first.**

**#557 put the block in the skill, verbatim, as a required part of step 7.** Copy it; do not
paraphrase it. **The four named traps are the whole value** — three of the six commits were the same
invisible one: the sign-off line needs **two or more spaces** before `Date:`
(`check-test-plan.mjs:361`), and one space looks identical to two on screen.

**Early evidence, honestly stated:** the two batch-95 streams that had the block from the start
produced **one** test-plan commit each; the one already past it produced two, one a format error.
Batch 96's three also produced one each. **But one test-plan commit per PR remains and always will**
— the gates output cannot be pasted before the gates have run. **So the claim is that the block
removed the *format* rework, not all of it.** If a stream shows two, read which kind they are before
concluding anything.

**Do not "fix" this by loosening `scripts/check-test-plan.mjs`.** `CLAUDE.md` forbids it at length,
and the strictness is what makes a red check meaningful.

---

## The lesson that keeps paying — and it needed a THIRD command

**On 2026-10-12 a planned stream was found already done for the fifth time.** `search-path-pin` was
batch 96's schema stream, holding `0188`, from architecture review S7: *"Pin `search_path` on every
`security definer` function"*, reporting **about forty** unpinned.

**A read-only query against dev found zero.** 57 `security definer` functions, 57 pinned — 40 with
`search_path=public`, 17 with `search_path=""`, so the per-function choice (not cosmetic: `''`
forces every name in a body to be schema-qualified, and a body relying on the search path breaks *at
call time*) had already been made. **And the gate the item asked for already existed**, at
`check-migration-grants.mjs:261`, inside `npm run lint`, on every PR all along.

**Where "about forty" came from:** the review grepped the migration *files* — 173 declarations
against 165 `set search_path` lines across 110 files — but **files are not the live state**, because
`create or replace` means a later file supersedes an earlier body. 173 declarations resolve to 57
live functions. **The item predicted this in its own words** (*"later files replace earlier
bodies"*), which is why it said to verify first.

**THE NEW PART, AND WHY THIS SECTION CHANGED.** The previous four phantoms were all caught by
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"`. **This one could not have
been** — no decision file, no commit, and the code the item named really did exist. **Only querying
the live database answered it.**

**So the already-done check now has three commands, and the third is new:**

1. `ls docs/decisions/ | grep -i <subject>`
2. `git log -S "<a distinctive symbol the item names>"`
3. **For any item whose claim is about database objects — functions, policies, triggers, columns,
   indexes — query the database, not the migrations.** `pg_proc`, `pg_policies`, `pg_trigger`,
   `information_schema.columns`. A file grep cannot answer it, and here the answer was `0` against a
   claimed `40`.

Then the ones already learned: **has an approach been declined?** (prose inside the item, not a
decision file) · **is it waiting on a decision rather than effort, and has that decision in fact
been made?** · **an item's count is the count someone happened to run** — brief every stream to
count for itself and report the real figure · **a gate whose condition is "one release after X"
needs re-checking every run.**

`search-path-pin` was recorded and ticked in **#560**, and **`0188` was deliberately not taken.**

---

## Token estimates — twenty-one measured, none over band

### Today's nine, newest first

| batch | slug | model / effort | estimated | actual | |
|---|---|---|---|---|---|
| 96 | `public-lists-unify` | sonnet-5-5 / low | ~170–250k | **138,752** | **below** |
| 96 | `pi-token-off` | sonnet-5-5 / low | ~170–260k | **174,607** | inside |
| 96 | `writers-no-can` | sonnet-5-5 / low | ~170–260k | **150,318** | below |
| 95 | `runtime-config-manifest` | sonnet-5-5 / low | ~230–320k | **141,507** | **39% under** |
| 95 | `who-does-what-freeze-header` | sonnet-5-5 / low | ~110–170k | **127,188** | inside |
| 95 | `medical-archive-trigger` | sonnet-5-5 / low | ~160–230k | **149,696** | below (**two PRs**) |
| 94 | `arch-quick-wins` | sonnet-5-5 / low | ~130–190k | **122,423** | below |
| 94 | `origin-key-in-app` | sonnet-5-5 / low | ~110–170k | **125,029** | inside |
| 94 | `receipt-backdate-rule` | sonnet-5-5 / low | ~140–170k | **119,322** | below |

**All nine ran `claude-sonnet-5-5` / `low`, confirmed from `get_session`, not assumed.** Two more
(#557, #560) were built in the planner session and are **unmeasured** — their cost is not separable.

**BANDS WORK — keep giving bands, never figures. But they are still set high.**

### THE FLOOR IS ~77k, CONFIRMED FOUR TIMES

Identical across every session measured on 2026-10-12: System tools 38,782 · MCP 16,903 · Memory
9,820 · Skills 6,377 · System prompt 4,973 = **76,855**. The 2026-10-11 correction from ~110k to
~80k holds and **is no longer one measurement.**

### Trim these two, from the table

- **Schema PR, single file: ~120–155k.** `receipt-backdate-rule` **119,322** beats
  `cashflow-forecast-function`'s 139,791. **It had nothing to find out** — Lutan had pre-decided the
  rule — which is the point: the band tracks discovery, not file count.
- **A schema-then-app stream in ONE worktree costs about one schema band, not two.**
  `medical-archive-trigger` covered **#553 (schema) and #556 (app)** for **149,696 together**. Much
  cheaper than splitting across batches, and `CLAUDE.md` allows it. **Repeat this.**

### STOP WIDENING FOR "IT MIGHT HAVE TO BUILD SOMETHING" — twice wrong in one day

This is the most useful correction in this file.

- `runtime-config-manifest` was banded **~230–320k** because it *might* need to build a check
  proving four lists agreed. **141,507 — 39% under.** Folding four enumerations into one table is
  reading and rewriting.
- `public-lists-unify` was banded **~170–250k** for two folded items that *might* need a probe.
  **138,752.** **It did build one — a 120-probe comparison — and was still cheap.**

**So even "builds a small instrument" does not justify a wide band.** Reserve it for an instrument
that must establish something **nobody knows**, like `who-does-what-view`'s +50% (449,014) for
writing `scripts/check-who-does-what.mjs` to find which of 300 permission boxes the system obeys.
**That script was the work.** A loop over two lists is not.

The 2026-10-11 correction still stands: **reading a long list of files is cheap** —
`silent-empty-reads` faced 64 files and came in at 133,986.

### Landmarks

| | |
|---|---|
| Largest ever measured | **`who-does-what-view` 449,014** (est. ~300k, +50%) |
| Second | **`fable-architecture-review` 448,294** — fable-5-1 at `xhigh`, **two dials, not comparable** |
| Cheapest stream ever | **`release-note-truth-rule` 103,070** |
| Cheapest schema stream | **`receipt-backdate-rule` 119,322** |

**Nothing lands below ~100k.**

### CAPTURE THE FIGURE WHEN THE PR MERGES, NOT AT THE NEXT `/plan-day`

**Now nineteen consecutive successes and not optional.** The instant a stream's PR has merged, call
`get_usage` **in that same turn**, before touching the registry. On 2026-10-12 the user announced
three merges in passing (*"pi token off now merged"*, *"561 is merged"*) — **each was captured in the
reply to that message**, which is the only reason those figures exist.

- **An archived session is as lost as a closed one.**
- **The condition is a live process, not a session state.** `isRunning: false` has answered fine
  nineteen times. **Do not infer readability from the listing — try the call.**
- **It is not a setting to change.** Lutan archives by hand, which is correct. **Do not ask him to
  stop.**

---

## Model and effort

**Two dials, and they do not behave the same way.** **Model** changes the price per unit of work, not
the amount: the floor is identical whichever model runs, so **choosing a cheaper family is the only
dial that reduces usage without changing the work.** **Effort** changes how much thinking happens per
turn, so raising it **raises** the figure. **It is not a usage optimisation and must never be
presented as one.**

**Never raise effort to fix an overrun.** The cure is a tighter brief or a spin-out. On 2026-10-12
`pi-token-off` carried a silent-failure hazard — deleting the token before its replacement would have
killed the Sunday backup into a log nobody reads — and was **still** left at `low`, with the hazard
written into the brief instead. It came in inside band and got the ordering right.

**`claude-sonnet-5-5` / `low` is the default and the evidence is now strong:** twenty consecutive
streams, none over band, including nine carrying migrations or permissions. **The caveat stands — the
briefs also keep getting better, so the model cannot take all the credit.**

**Fable sat at 5% all day with two days left.** The remaining Fable item is *Fable dry run of the
acceptance checklist*, which still needs Lutan and the Director to agree who tests which role.
**Check the windows (`get_usage`) at the start of every run:** all-models went **69% → 72%** across
the eleven PRs.

---

## What briefs should do — the 2026-10-12 additions

Everything from the last handover still holds. Three things earned their place today:

- **Name the expected finding AND license a null answer.** `writers-no-can` was told to expect that
  most of its eight candidates were already guarded, and that returning "none open" was a result
  rather than a failure. **It returned exactly that, below band** — all eight guarded by RLS,
  function guards or admin helpers — plus the catalogue check that stops the next one being missed.
  Second such brief to pay off, after `silent-empty-reads`. **A brief that asks for green gets green;
  a brief that licenses a null answer gets the truth, and cheaply.**
- **Hand the stream the contradiction you found, rather than letting it hit it.**
  `runtime-config-manifest` had just classified `SUPABASE_ACCESS_TOKEN` as `where: "tools"`, defined
  as *"dev-machine scripts only"* — **but the weekly production backup runs from the Pi's own
  crontab.** `pi-token-off`'s brief put that tension in writing and told it to resolve it either way.
  It did: `docs/decisions/2026-10-12-tools-means-scripts-not-dev-machine.md`.
- **Force the one answer the refactor would otherwise bury.** `public-lists-unify`'s two lists
  disagreed about whether `/r` and `/e` were edge-cached, and nothing said which was right. The brief
  made that answer non-negotiable. Result: a reasoned decision
  (`docs/decisions/2026-10-12-r-and-e-not-edge-cached.md`) — per-item pages read from views whose
  membership changes, so a 10-minute-old copy could show a card that should already be gone.
  **Without that instruction the stream would have unified the lists and left the question unanswered
  in a new place.**

Also: **tell the stream to prove a refactor's output is identical, not assert it.**
`public-lists-unify` proved its lists matched on **120 probes, 0 differences**.

---

## NEW RULE: a step owed to a DEPLOY is a backlog item, not a test-plan row

**Found on 2026-10-12 and worth more than it looks.**

#551 added an `x-origin-key` check to `src/proxy.ts` so the Pi stops trusting the Cloudflare WAF rule
alone, and `pi-token-off` put `ORIGIN_KEY` on the Pi. **But the Pi serves `0.27.0`, which predates
the check, so nothing on the Pi checks the header today.** It starts working at the next Pi deploy
and not before.

**The only record of that was one row of `docs/test-plans/pi-token-off.md`'s manual table.**
Everything else read as shipped: merged PR, signed plan, secret in place. **Nothing ever re-reads a
merged PR's test plan.**

This is the release-note-truth failure in a new costume — not a false note to users, but **a security
control believed live that is not.** Filed as its own Security item (`c80dd0d3` on `backlog`). **So:
when a stream's manual table records something outstanding *for a deploy* rather than *for a person*,
it needs its own backlog item.** The *Left for manual verification* table is for people who will
look; it is not a place to park work.

---

## A brief can be right when written and wrong when the stream finishes

`pi-token-off`'s brief said **do not tick the item** — the token would still be on the Pi until Lutan
did steps 1, 2 and 5 himself. **The stream ticked it, and it was correct to:** its manual table
records all six Pi steps as actually performed on 2026-10-12 (test clone's copy deleted,
`SUPABASE_DB_URL` set and the backup re-run by hand, token deleted everywhere and the backup re-run
again, Drive values moved and `.env.local` parked, the token rotated and the old one deleted), and
its signature uses the sanctioned form — *"Lutan — confirmed in chat; line written by Claude at
their request"*. **Lutan worked the Pi steps with the session while it ran.**

**The planner flagged the tick as a defect and was wrong.** Same shape as the 2026-10-11 phantom: a
correct instruction overtaken by its own stream. **Before calling a tick false, read the test plan's
manual table and signature — the work may have happened while you were not looking.**

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it at 375 px.
  Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — on a real phone.
- **The Director signing her roles draft.** Lutan said on 2026-10-09 it *"appears to already have been
  done"* — **unverified**, and production cannot be read from these sessions.
- **The app header's button sizes** — Lutan's call; recommendation already written.
- **The Staff holders on production** — until that list is answered, **`0173` must not reach
  production**, or those logins fail closed.
- **The acceptance checklist's pre-run agreements** — Lutan and the Director agreeing who tests which
  role, the per-role accounts on Test, what counts as a blocker, and where the signed paper copy
  lives (**it carries real names and this repo is public**). **This also blocks the one remaining
  Fable item.**
- **Who can read what of a contact, checked on production**, as each of six roles.
- **The role walkthrough re-run** — owed twice; a person runs it.
- **NEW — `search_path` on production.** The dev answer was 0 unpinned, but production may be behind
  on migrations and hold an older unpinned body. In #560's test plan as a one-minute release-manager
  query. **Deliberately not a backlog item, because there is no work unless it comes back dirty.**

---

## Blocked, and on whom

- **Lutan:** the two auth decisions · the Pi jobs and failover options paper · the Google secret
  rotation leftovers · the second admin account (Anchalee) · the mobile sweep (**declined five times
  — offer only as a swap**) · the product `.org` name · **whether the purchasing job keeps reading
  stock receipts through `stock.delivery`** · **three of the thirteen red check harnesses**, which
  need a per-role ruling.
- **The Director:** signing the roles draft · **the community-dogs baseline number and the date it is
  true up to** · the Thai receipt wording checked by a Thai reader · the online merchandise shop.
- **Time:** HSTS not before **2026-11-08** · the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **The quick-win band stays as written** (2026-10-11, asked four times).
2. **The test-site visitor tile is NOT wanted.** The grey *Not set up* on `test.lannacare.org` is
   **the intended permanent state.**
3. **The Director MAY backdate a receipt.** Shipped in `0186`/#550: `received_on <= issued_on <=
   today`, Bangkok today.
4. **The token floor is ~80k.**
5. **NEW — `/r` and `/e` are not edge-cached, on purpose** (2026-10-12). Revisit only with a measured
   load problem, and then cache the enclosure page before the resident one.

---

## Candidates for the next batch, in order

**First, cut the release.** `unreleased` has two lines and a cut is due.

1. **Lutan's three new items from 2026-10-12, which are one theme** — *photo first, then the
   resident* (a home-screen button to take or pick photos and tag each to a resident) · *photos of
   receipts for purchases and clinic visits, with the cost, at the time or in a batch at night* ·
   *bills on maintenance jobs, summing to the job's actual cost*. **These are the newest thing he has
   asked for and they share a spine: photograph a bill, get the cost onto the right record.** They
   probably need **one** migration between them, so plan a schema PR then two feature streams.
2. **The `x-origin-key` Pi deploy item** (`c80dd0d3`) — no code, just a deploy and a check.
3. **The medical `stock.delivery` tail** — **Lutan's decision first.**
4. **The thirteen red check harnesses** — three need Lutan.
5. **The architecture review's remaining items** — C5 (the 1,465-line resident record page), C6 (no
   test runner; 137 `check-*.mjs` are the tests), C7 (an internal photo costs seven queries).
6. **S2, back up daily rather than weekly** — ends on the Pi's crontab, and the restore rehearsal is
   overdue.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — though he may merge from the PR bar himself. Not
technical in these areas: **plain English, no jargon, options with consequences and a
recommendation.** Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** —
never commit or attach a file naming real people. **Never give him a command before the moment he
should run it.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

**He answers questions put as options with a recommendation, and he answers them fast.** On
2026-10-12 he took the recommendation three times out of three, and **twice redirected the plan
mid-flight** — deferring this handover to finish the day's last batch, and asking for
`search-path-pin`'s outcome to be double-checked *before its session was ever opened*, which is what
caught the phantom. **When he questions an outcome, check it properly rather than reassuring him; he
was right both times.**

**He may start a batch before the planning conversation finishes, may set a different model or effort
than recommended, may merge a PR himself, and may pull an urgent item in outside the batch.** **Ask
what he has actually started rather than assuming the plan describes reality.**

---

## Traps in the tooling

- **`grep -c` exits 1 when it finds nothing**, so never use it as a success check in an `&&` chain.
- **Do not put long prose inside `node -e` or a `bash` heredoc.** Backticks, apostrophes and quotes
  break parsing in ways the error does not explain, and **a script can report success while writing
  mangled text**. **Write the file with the file-writing tool** — and for anything structural
  (ticking an item and moving it to Completed, inserting a backlog item), **write a small `.mjs`
  script with the file-writing tool and run it**, which worked cleanly twice on 2026-10-12.
- **Appending by line position needs an anchor that cannot match another item, and a guard.** `§` and
  other non-ASCII are multibyte — avoid them in anchors. An umbrella item quotes its children's
  titles, so anchor on `^- \[ \] \*\*<Title>`. **`sed -n "${A}p"` with an empty `$A` prints the ENTIRE
  FILE** — always `test -n "$A"` first.
- **A scanned PDF cannot be read by the usual means on this machine.** Render it with
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`, then read the
  PNGs. The Director returns her answer sheets as scans.
- **NEW — to query dev read-only**, copy the `query()` helper from `scripts/apply-migrations.mjs:140`
  into a scratchpad `.mjs` and load credentials with **`loadEnv("test")`** — *not*
  `loadEnv("development")`, which demands a `.env.deploy.development` that does not exist and exits 2.
  This is how the `search-path-pin` phantom was caught, and it will be needed again.

### Leftovers and one husk

**Thirteen `Animal_Shelter_*` folders at writing, twelve of them merged leftovers.** **Every actual
through batch 96 is captured**, so nothing is at risk if Lutan archives those chats. `/clean-streams`
clears them.

`Animal_Shelter_planner-handover-81` is a folder git no longer tracks. `done` **refuses it**, because
it is no longer a git repo and cannot be checked for uncommitted work; only `--force` gets past that,
and **that is Lutan's call, not a session's.** Raised six times now. **Mention it once if it is still
there, then leave it.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it — and if he
defers it to finish a batch, as he did on 2026-10-12, **record the deferral as its own section in
`.plan-day.md` listing what the next session must carry**, because the deferring chat is where all of
it lives.

**Count the workstreams honestly.** The counter was wrong twice on 2026-10-12 — 13 and then 16 — by
adding batches at set-up time and double-counting. The true figure was **11**: nine planned streams
plus two PRs built in the planner session.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-96`; the previous were **#546** (`planner-handover-93`),
**#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was
really needed; **it is.** It is a `docs/` file in the repo, so the only alternatives are committing to
`main` directly or routing it through the `backlog` branch, and the second is the 2026-10-07 failure
`CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
