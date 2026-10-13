# Planner handover — written 2026-10-13, after eleven workstreams

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of eleven workstreams — two batches of three planned and merged in one chat, three release and
handover streams this chat did not plan, and the planner's own two. It says where the planning loop
stands, what is blocked and on whom, and what not to re-derive. It is **rewritten every nine
workstreams** and is deliberately short-lived.

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
5. **`docs/database-review-2026-10-13.md`** — 958 lines, **the best single description of the
   database**, with 16 ranked findings written as ready-to-paste backlog items. **Only F1 has been
   filed. The other fifteen are waiting on Lutan's picks** — see *The review's findings* below.
   The older `docs/architecture-review-2026-09-22.md` is **finished**: every finding closed, C4 and
   C7 last. **Do not plan from it again.**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`776fde36`** (#594–#596 merged, backlog folded in, `backlog` in step) |
| Dev database | **193 applied, 0 pending**. 194 files, latest `0193`; `0191` is duplicated by design and never renamed |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0194`**, held by `from-zero-rebuild` in batch 2 until its PR merges |
| Open backlog items | **89** |
| Open PRs | batch 2's three when they open, plus this handover |
| Last release | **`0.29.0`** |
| `unreleased` | **empty** — a cut is due once batch 2 or 3 merges |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Batch 1** #594–#596 · **batch 2** set up, ports 3005–3007. **Three were other sessions'**: #592 and
#593 the `0.29.0` release pair, #588 the previous handover.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog` (**expect a conflict in `docs/backlog.md`**); check
whether the live batch merged and **capture token actuals in that same turn if it has, reading the
dials from `get_session` before comparing anything to a band**; check each candidate against the code,
the live database, *what the user has already ruled out*, and *whether it is waiting on a decision
rather than on effort*; present three batch tables with bands **and a model/effort recommendation**;
ask once; create only the current batch's worktrees and briefs, **each opening with the finish-line
block and ending with the pre-push test-plan block**; save the plan and bump the counter.

---

## THE BIGGEST FINDING OF THE DAY: a recommendation read as a setting

**`restore-rehearsal` ran on `claude-opus-5-5` at `medium`, not the `claude-sonnet-5-5` / `low` the
planner recommended.** Lutan sets the dials himself, in the session's model menu, and he did.

It came in at **222,616 against a ~140–200k band** — and **that is not an overrun**, because the band
was written for Sonnet/low and the stream ran on a more expensive model at higher effort. Had the
planner not read `get_session` first, it would have recorded a false overrun, and **the obvious next
move — widening the band — would have corrupted the table for every future Sonnet/low stream.**

> **Read the dials before comparing any figure to a band.** `get_session` reports `model` and
> `effort`. A recommendation is not a setting. **The Sonnet/low streak is unbroken at 41**, and it
> only stayed intact because this was checked.

`SKILL.md` already warned about this in one sentence under step 6. **It earned its place and should
not be trimmed.**

---

## Token estimates — forty-three measured

### Today's six

| batch | slug | model / effort **run** | estimated | actual | |
|---|---|---|---|---|---|
| 1 | `stream-tooling-fixes` | sonnet-5-5 / low | ~130–180k | **133,574** | inside, near the floor |
| 1 | `restore-rehearsal` | **opus-5-5 / medium** | ~140–200k *(sonnet band)* | **222,616** | **not comparable** |
| 1 | `fable-db-review` | fable-5-1 / xhigh | ~350–480k | **332,421** | 5% under |
| 2 | `from-zero-rebuild` | sonnet-5-5 / low | ~200–280k | *pending* | |
| 2 | `vet-visits-director` | sonnet-5-5 / low | ~230–300k | *pending* | |
| 2 | `small-fixes-fold` | sonnet-5-5 / low | ~110–160k | *pending* | |

**All three of batch 1 were captured**, because the planning chat was awake when they merged and
called `get_usage` in the same turn.

### Band corrections earned today

- **A deep single-area Fable review is CHEAPER than a whole-system one: band it ~300–400k.**
  `fable-db-review` read 194 migrations and the whole dev catalogue and produced a 958-line ranked
  report for **332,421**, against a band set from `fable-architecture-review`'s 448,294. **It cost
  about 11% of the Fable weekly bucket**, which was otherwise going to expire at 5% used.
- **A walkthrough stream is more expensive than it looks: ~180–260k on sonnet/low, provisionally.**
  `restore-rehearsal` spent its window on round-trips with a person, each re-sending the context.
  **One non-comparable measurement** — treat it as a starting point, not a band.
- **The quick-win fold holds.** `stream-tooling-fixes` folded two tooling items for **133,574**, with
  only 53,716 of messages. **Folding small items is the single most reliable saving the planner has.**

### THE FLOOR IS ~77k, NOW CONFIRMED SIXTEEN TIMES

System tools 38,776 · MCP 16,902 · **Memory 10,463** · Skills 6,383 · System prompt 4,973 ≈
**77,500**. Memory is the only part still growing. **This is settled. Stop re-deriving it and stop
calling it one measurement.**

### Landmarks

| | |
|---|---|
| Largest ever measured | **`who-does-what-view` 449,014** (est. ~300k, +50%) |
| Second | **`fable-architecture-review` 448,294** — fable-5-1 at `xhigh`, **two dials, not comparable** |
| Cheapest stream ever | **`release-note-truth-rule` 103,070** |
| Cheapest schema stream | **`resident-picker-floor` 121,974** |

**Nothing lands below ~100k.**

---

## Model and effort

**Two dials, and they do not behave the same way.** **Model** changes the price per unit of work, not
the amount: the floor is identical whichever model runs, so **choosing a cheaper family is the only
dial that reduces usage without changing the work.** **Effort** changes how much thinking happens per
turn, so raising it **raises** the figure. **It is not a usage optimisation and must never be
presented as one.**

**Never raise effort to fix an overrun, and never to fix a handoff miss.** Asked and answered
2026-10-13; `docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`. The cure is a tighter brief
or a spin-out. **Do not re-argue it.**

**`claude-sonnet-5-5` / `low` is the default**, and the evidence is now strong: **41 consecutive
streams, none over band.** The caveat stands and should keep standing — the briefs also keep getting
better, so the model cannot take the credit.

**Fable is no longer the unused bucket.** It went 5% → 16% on `fable-db-review` and the spend was
clearly worth it: the review's first finding caught a cutover risk nobody had seen. **A deep,
narrowly-scoped review is what that bucket is for.** Its one remaining backlog item — *Fable dry run
of the acceptance checklist* — is still blocked on Lutan and the Director agreeing who tests which
role. **The drop-shipment options paper was offered twice and is not to be offered again.**

**The all-models window hit 88% with 22 hours to the reset**, and **Lutan chose to start batch 2
anyway** after being told the consequence. **So every batch-2 brief carries an extra block**: the
window is nearly spent, commit after every meaningful step, do the resource-free work first, and stop
*with words* rather than silently. **If a batch-2 stream looks stalled, running out of window is the
first thing to check, not the last.** Keep that block for any batch started above ~80%.

---

## What briefs should do

Everything from the last handover still holds. **Both standing blocks are in `SKILL.md`** — the
finish-line block at the top, the pre-push test-plan block at the end. Copy both verbatim. What else
earned its place today:

- **Hand the stream the blocker you could not clear, with the options and a recommendation.**
  `from-zero-rebuild` needs a third Supabase project and there is none; the brief says so, says why
  the local Postgres trick will not work here, lists three ways out, names the planner's pick, and
  **tells the stream to get on with the parts that need nothing from anyone while Lutan decides.**
  That is better than either guessing or blocking.
- **Say which half of a claim the stream will actually prove.** `restore-rehearsal`'s brief insisted
  the report distinguish "the dump restores and holds every row" from "a Supabase project comes back",
  because `--no-owner --no-privileges` discards exactly what the second would test. It did, and the
  unproved half is now its own item instead of a false assurance.
- **Warn a stream when its own backlog item is stale.** Three items briefed today had wrong names or
  superseded clauses: item 336 still said `vet_appointments`/`vet_id` (renamed by `0172`, old views
  dropped by `0184`), item 267 contradicts itself across four streams' notes, and the F1 item's own
  source said "latest `0181`" when it was `0193`. **Check the item against the code before briefing
  it, and put the correction in the brief.**
- **Say what is NOT in the stream, and why.** `small-fixes-fold` was told the five remaining red
  harnesses all need Lutan's ruling, so there is nothing buildable in that item — otherwise a stream
  reads an open item and starts work that cannot finish.
- **Name the one thing that can hurt someone.** `vet-visits-director`: she is the person who books, so
  a page that silently drops a visit means an animal misses a clinic appointment — hence "the count
  must match exactly, not merely be non-empty", and probe the negative logins.
- **Tell a stream when one PR is correct**, with the reason. `from-zero-rebuild` carries a migration
  *and* code, but every consumer is already on `main`, so it is one PR — same shape as
  `resident-picker-floor`. Without that sentence a careful stream splits it and pays two floors.

---

## Traps in the tooling

Everything in the last handover's list still holds (`grep -c` exit codes · **no long prose in
`node -e` or heredocs — use the Write tool and insert with `awk`** · anchors and the empty-`$A` `sed`
trap · a long backlog item is one line, so survey with the `awk` title extractor · scanned PDFs need
`render-pdf.ps1` · query dev read-only with `loadEnv("test")` and a `file:///C:/...` import · the
planner may apply a migration to dev from the main checkout only · **folding in `backlog` conflicts
routinely and the resolution is always "keep both sides, drop the superseded unticked duplicate"**).
Added today:

- **`git show <rev>:<path>` LIES ON DOTTED PATHS IN THIS SHELL, AND SILENTLY.** MSYS rewrites any
  argument containing `:`, so `git show origin/main:.claude/skills/plan-day/SKILL.md` dies — and
  piped into `grep -c` it prints `0`, indistinguishable from the file not containing the pattern.
  **It is the leading dot**, which is exactly where the skills, workflows and settings live. Use
  `git grep <pattern> <rev> -- <path>` or `git ls-tree -r <rev> --name-only -- <path>`, or prefix
  `MSYS_NO_PATHCONV=1`. Documented by #594; **this cost a session a false "the block was reverted"
  conclusion, whose obvious fix would have corrupted `main`.**
- **`done` now proves a squash merge, so `/clean-streams` works again** (#594). It needs **two**
  proofs — the PR merged **and** the squashed commit an ancestor of `origin/main` — and it reports a
  branch with commits after its merge commit as **unmerged work**, separately from force candidates.
  **Ahead with no PR is unsubmitted work, never a leftover. Ahead with a merged PR is a leftover.**
  Both halves still needed.
- **`apply-migrations.mjs` can only reach a database through the Supabase Management API.** It cannot
  target a plain Postgres URL. So the **local PostgreSQL 17.11** at
  `C:\Users\Leidos\AppData\Local\Programs\PostgreSQL\17\bin` — which made the restore rehearsal
  possible without a third project — is **not** a target for the migration runner. Different problem,
  different answer.
- **`scripts/lib/env.mjs` has exactly three environments**: `test` (the dev project), `uat` and
  `production`. **`dev` is not one**, and **`uat` has no project of its own until the cutover.** A
  runbook line saying `--drift dev` cannot run; that is item 173, in batch 2.
- **The planner's own stream still needs the full discipline.** Run `check-test-plan.mjs` on your own
  plan too, and never pre-tick the CI line.

### Leftovers

**`bills-inbox` is merged and `free`** (one dirty junk file, so `--force` may be needed). **Batch 1's
three folders read `HELD` with their sessions attached** — ask, and close the sessions first. The two
leftovers `done` used to refuse are **already gone, cleared without `--force`**, which is #594 proved
in the field. `/clean-streams` does the round.

---

## The review's findings — Lutan picks, and only F1 is filed

`docs/database-review-2026-10-13.md` holds 16 ranked findings, each a ready-to-paste backlog item.
**The review raises none itself, by instruction.** Do not file them unasked; do not plan from them as
if they were items.

**Filed:** **F1** (`368a7f73` on the `backlog` branch) — the from-zero rebuild, because the cutover has
a date.

**Put to him, not yet answered:** **F2** (`site_content` and two siblings readable by every login,
carrying the vet-visit budget estimate the public view deliberately omits — an hour) and **F4** (the
audit log watches 18 tables; **43 writable ones are outside it, including placements, role changes and
bills**, so there is no record of who moved a resident).

**Worth knowing so nobody re-derives it:** no data loss found · nothing newly public · all 290 policies
use `has_permission()` the efficient way · an anonymous visitor reaches exactly 14 views and 5 harmless
functions · the audit log cannot be edited by anyone including the owner · the database is **~30 MB of
the free plan's 500 MB** · the forecast functions (0.2–0.6 s, up to 4 s) are the first thing that will
feel slow · **F3** needs a decision about one delete rule before it is a stream.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**
Carried forward; **none was re-verified today** except where noted.

- **The production cutover**, tentatively **Friday 16 October** — release-manager work with Lutan, and
  **F1 is meant to land before it.**
- **The Supabase half of the restore rehearsal** — its own item now. Waits for a third free project or
  a recreatable dev project. **Not a paid plan.** What the local rehearsal already settled is written
  into the item so nobody repeats it.
- **The photo lightbox's last two controls at 375 px** — on a real phone. **The only person-blocked
  half of the 44 px item.**
- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it at 375 px.
  Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **Five red check harnesses** — `check-2ic-role`, `check-maintenance-role`, `check-medical-jobs`, and
  the doctor's missing cells which keep three more red. **All five need a per-role ruling.**
- **The Director signing her roles draft** — Lutan said on 2026-10-09 it *"appears to already have been
  done"*; **unverified**, and production cannot be read from these sessions.
- **The Staff holders on production** — until that list is answered, **`0173` must not reach
  production**, or those logins fail closed. **Note this interacts with the cutover**, which runs
  `0173` on a fresh project where it cannot trip.
- **The acceptance checklist's pre-run agreements** — who tests which role, the per-role accounts on
  Test, what counts as a blocker, and where the signed paper copy lives (**it carries real names and
  this repo is public**). **This also blocks the one remaining Fable item.**
- **Who can read what of a contact, checked on production**, as each of six roles · **the role
  walkthrough re-run** · **`search_path` on production** (dev came back 0 unpinned) · **the Pi's
  spare-clone timer** (**confirmed NOT installed**, over SSH 2026-10-13).
- **The app header's button sizes** — Lutan's call; recommendation already written.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions · **the rehearsal project for F1 (an account step, and the
  planner recommends creating the new production project early)** · **which of the review's fifteen
  unfiled findings become items** · **F3's one delete rule** · the Pi jobs and failover options paper ·
  the Google secret rotation leftovers · the second admin account (Anchalee) · the mobile sweep
  (**declined five times — offer only as a swap**) · the product `.org` name · **whether the purchasing
  job keeps reading stock receipts through `stock.delivery`** · **five red check harnesses** · **the
  Bills tile on the Director's phone home** · **promoting `test-plan` to a required check**.
- **The Director:** signing the roles draft · **the community-dogs baseline number and the date it is
  true up to** · the Thai receipt wording checked by a Thai reader · the online merchandise shop ·
  **opening the vet-visits page on her phone**, once batch 2 ships it.
- **Time:** HSTS not before **2026-11-08** · the `sharp` override until `wrangler` and `miniflare` ship
  a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **The quick-win band stays as written** (2026-10-11, asked four times).
2. **The test-site visitor tile is NOT wanted.** The grey *Not set up* on `test.lannacare.org` is
   **the intended permanent state.**
3. **The Director MAY backdate a receipt.** `received_on <= issued_on <= today`, Bangkok today.
4. **The token floor is ~80k** (measured ~77k, sixteen times).
5. **`/r` and `/e` are not edge-cached, on purpose** (2026-10-12).
6. **Maintenance bills are Management and Admin only** (Lutan, 2026-10-12).
7. **Backups prune by AGE, not count** — "remove backups over 2 weeks old".
8. **Raising model or effort is NOT the answer to a handoff miss** (2026-10-13). The fix is the brief.
9. **The duplicate `0191` is not renamed.** Applied files are never edited. **The planning rule is the
   fix: a schema-then-app stream holds the migration slot until its APP PR merges.**
10. **NEW — the restore rehearsal is ticked, on Lutan's "mark it done for now"**, with the Supabase
    half living on as its own item. **Backup key custody is ticked too** — the key is on an encrypted
    USB drive and in Apple Keychain. **Do not re-raise either as a gap.**
11. **NEW — the Pi's daily backup is DONE and verified.** Do not re-raise it.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — though he merges from the PR bar himself, often
before the planner has read the checks. **Release PRs are the exception: Claude merges those itself
the moment CI is green.** Not technical in these areas: **plain English, no jargon, options with
consequences and a recommendation.** Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo
is public** — never commit or attach a file naming real people. **Never give him a command before the
moment he should run it.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

**He answers questions put as options with a recommendation, and he answers them fast.** Today he took
the recommendation on three of four — and **overrode the fourth, choosing to start batch 2 at 88% of
the weekly window rather than wait for the reset.** He had been told the consequence in one line.
**That is the pattern: give the trade-off, give the pick, and accept the answer without re-arguing
it.** When he overrides, **adapt the work to survive the choice** — which is why batch 2's briefs all
carry a commit-early block.

**He sets the model and effort himself** and may choose differently from the recommendation. **Read
`get_session`, never the recommendation.** See the finding at the top of this file.

**He may start a batch before the planning conversation finishes, may merge a PR himself, and may pull
an urgent item in outside the batch.** **Ask what he has actually started rather than assuming the plan
describes reality.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it. **This one was
offered at eleven and written in the same chat, which is the rule working** — the previous one went
past the threshold before anyone noticed.

**Count the workstreams honestly, and count other sessions' too.** Today's eleven are six planned
streams, the planner's own two, and three release and handover streams this chat did not plan — all of
them workstreams against this repo since the handover. **Counting PRs instead of streams is how the
counter read 13 and then 16 on 2026-10-12.**

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-127`; the previous were **#588** (`planner-handover-116`),
**#575** (`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490**
(`81`). Lutan asked on 2026-10-09 whether the PR was really needed; **it is.** It is a `docs/` file in
the repo, so the only alternatives are committing to `main` directly or routing it through the
`backlog` branch, and the second is the 2026-10-07 failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
