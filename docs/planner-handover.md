# Planner handover — written 2026-10-11, after batch 93

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat, written at the
end of nine workstreams (batches 91, 92 and 93, all planned and merged in one chat on one day). It
says where the planning loop stands, what is blocked and on whom, and what not to re-derive. It is
**rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is ~10,000 lines; do
   not read it all. The top line says which batch is live
4. this file, for what has changed since
5. **`docs/architecture-review-2026-09-22.md`** — new, 568 lines, and the best single description of
   the system that exists. Read §1 (what the architecture actually is) before planning anything
   structural. Its §2 findings are already backlog items

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`4d9e32ea`** (this file's own merge) |
| Dev database | **185 applied, 0 pending, no drift** (`apply-migrations.mjs --status`) |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0186`** |
| Open backlog items | **101** — up from ~95, because the architecture review filed 15 |
| Open PRs | **none**; batches 91–93 are all merged |
| Last release | **`0.27.0`** (2026-10-11, carrying batches 91–93); **`unreleased` is empty, so no cut is pending.** `0.26.0`, cut earlier the same day, carried *Who does what* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Nine workstreams went through in about four hours**, across three `/plan-day` runs in one chat.
**Batch 93's three were planned, built and merged inside about an hour.** **Do not assume a batch
you set up is still in flight** — check `gh pr list` before telling the user anything about it. It
happened three times out of three in this period: every `/plan-day` resume found its batch already
merged.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; check whether the live batch has merged and **capture
token actuals in that same turn if it has**; check each candidate against the code, *against what
the user has already ruled out*, and *against whether it is waiting on a decision rather than on
effort*; present three batch tables with bands **and a model/effort recommendation**; ask once;
create only the current batch's worktrees and briefs; save the plan and bump the counter.

---

## Six states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch tip is not in
   `main`. The work is in. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict. A conflict shows as
   `CONFLICTING`, and **silent CI on a pushed commit means exactly that** — sync the branch, do not
   wait.
3. **NEW — `list_sessions` reporting `prState: OPEN` for a merged PR.** Seen three times on
   2026-10-11. **`gh pr list` is the truth; the session listing caches.** Do not conclude a stream
   is still open from the session row.
4. **A stale session-start `git status`.** The snapshot in the first system message is from session
   start and can be hours old. **Re-read `git log` rather than quoting it.** Equally, `git pull`
   reporting *"Already up to date"* in the main checkout **does not mean nothing merged** — another
   session may have pulled already. Read `git log`.
5. **`HELD` is a snapshot, not a verdict.** A worktree is held while its session lives and releases
   within hours. **Clear leftovers on a later run, never ask the user to close chats for it, and
   never `done` something reading `HELD` at the moment you look.**
6. **An item's own "still open" note can be flatly wrong, written in good faith minutes earlier.**
   See the next section — this nearly cost a whole stream again on 2026-10-11.

---

## The lesson that keeps paying: check the code, never the note

**On 2026-10-11 the already-done check caught a phantom at the TOP of the highest-priority
section** — it would have been batch 91's first stream.

The item was *"a configured role's boxes are refused by the volunteer floor it borrows"*, and it
carried a confident, recent, bolded note: **`ANSWERED 2026-10-11 in the /plan-day chat — all three
parts. Do not re-open any of them; build to this.`** That note was true when written. By the time it
was read, **`role-floor-schema` had removed both `fixed-for-now` entries it named** (its decision
file says so in as many words) and **`perm-drop-enum` had deleted `legacy_role` outright**, so the
mechanism the item described **could not happen at all.**

**The note was written before its own author's stream merged.** That is the pattern: not
carelessness, but a note whose world changed an hour later.

**Two commands per candidate, before it enters a batch:**
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"` (or `-- <file>`).

**Third: has an approach already been declined?** A declined approach lives as **prose inside the
item**, not as a decision file. Read the item's prose for *declined*, *parked*, *Lutan said*.

**Fourth: is it waiting on a decision rather than on effort?** And then — **has the decision in fact
already been made, by Lutan or by the Director?** This paid three times over on 2026-10-11.

**Fifth: an item's *count* is the count someone happened to run.** `perm-drop-enum` was briefed to
count for itself: its item said 16 functions, its own first regex said 14, and **reading the bodies
gave 4.** Brief every stream to count, and to report the real figure.

**Sixth, and new: a gate whose condition is "one release after X" needs re-checking every run.** The
four vet compatibility views waited on *"one release after `0172`"*. `0172` shipped in `0.24.0`, and
`0.25.0` **and** `0.26.0` had both been cut — **the gate had been open for a release and a half and
nobody had looked.** Grep the backlog for `release after`, `not before`, and dates.

---

## Token estimates — the floor was wrong, and that explains most of the error

**59 measured, 7 lost.** **Twelve of the last twelve streams came in below or inside their band; not
one went over.**

### THE ~110k FLOOR IS WRONG. IT IS ABOUT 80k.

`release-note-truth-rule` came in at **103,070 — below the floor the skill asserted every stream
pays before any work.** Its breakdown: System tools 38,782 · MCP tools 17,001 · Memory 9,695 ·
Skills 6,377 · System prompt 4,973 = **~77k fixed**, with **23,881** of messages on top.

**Lutan ruled on 2026-10-11: correct the floor to ~80k and trim the bands that sit on it**, recorded
as one measurement rather than a law. **That correction ships in this handover's PR.**

**This is not a contradiction of his earlier ruling the same day** — asked whether the *quick-win
band* (`110–170k`) should widen to the `130–200k` the planner had been quoting, he said **leave the
skill, the planner quotes it as written**, because both measured quick wins (129,320 and 135,901)
were *inside* the written band. **The band was right; the floor was not.** **Do not reopen the
quick-win band.**

### The twelve measured, newest first

| batch | slug | model / effort | estimated | actual | |
|---|---|---|---|---|---|
| 93 | `fable-architecture-review` | **fable-5-1 / xhigh** | unmeasured | **448,294** | see caveat below |
| 93 | `vaccine-stock-forecast` | sonnet-5-5 / low | ~170–280k | **188,913** | **inside** |
| 93 | `drop-leftovers-schema` | sonnet-5-5 / low | ~150–240k | **143,030** | below |
| 92 | `cashflow-forecast-function` | sonnet-5-5 / low | ~140–220k | **139,791** | just below |
| 92 | `silent-empty-reads` | sonnet-5-5 / low | ~250–400k | **133,986** | **46% under** |
| 92 | `release-note-truth-rule` | sonnet-5-5 / low | ~130–190k | **103,070** | **under the old floor** |
| 91 | `perm-policy-cleanup` | sonnet-5-5 / low | ~230–350k | **206,567** | below |
| 91 | `residents-list-sort` | sonnet-5-5 / low | ~250–400k | **166,843** | well below |
| 91 | `medical-gates-and-tooling` | sonnet-5-5 / low | ~140–220k | **127,970** | below |
| 90 | `who-does-what-edit` | sonnet-5-5 / low | ~250–400k | 210,888 | below |
| 90 | `record-permission-gaps` | sonnet-5-5 / low | ~130–200k | 135,901 | inside |
| 90 | `perm-drop-enum` | sonnet-5-5 / low | ~250–400k | 352,802 | inside |

**BANDS WORK — keep giving bands, never figures.** But they are set high, and **trim gradually from
the table, never from one batch.** The planner over-corrected the other way once already: after
batch 88 overran it raised estimates ~15% and then went three-for-three under.

### Widen a band for BUILDING a measuring tool — not for reading a list of files

**This is the correction to batch 88's lesson, and it is the most useful new thing here.**

`silent-empty-reads` was banded **~250–400k** specifically because it faced an open-ended count: 64
candidate files, eight named as a stated lower bound, each needing a judgement. **It came in at
133,986** — barely over the real floor.

Compare `who-does-what-view`, two batches earlier: **449,014, +50% over**, because establishing
which of 300 permission boxes the system obeys meant **writing `scripts/check-who-does-what.mjs`**.
**That script *was* the work.**

**So the axis is not "must it count?" — it is "must it BUILD something to count with?"** Reading 64
files is cheap. Writing the instrument is not.

### The schema band, measured six times

`receipt-issuer-server-side` 143,678 · `drop-leftovers-schema` 143,030 · `cashflow-forecast-function`
139,791 · `map-rooms-schema` 151,273 · `role-floor-schema` 231,297 · `perm-functions-schema` 284,248.
**~140–155k for a single-file migration, even one folding three subjects; ~230–285k when it also
converts functions or carries app code.**

### Landmarks

| | |
|---|---|
| Largest ever measured | **`who-does-what-view` 449,014** (est. ~300k, +50%) |
| Second | **`fable-architecture-review` 448,294** — but see the caveat |
| Cheapest stream ever | **`release-note-truth-rule` 103,070** — a process answer in three files |
| Cheapest real feature | **`medical-gates-and-tooling` 127,970** — three quick wins folded |

**Nothing lands below ~100k.**

### CAPTURE THE FIGURE WHEN THE PR MERGES, NOT AT THE NEXT `/plan-day`

**This now has fourteen consecutive successes and is not optional.** The instant you see a stream's
PR has merged, call `get_usage` **in that same turn**, before touching the registry.

- **An archived session is as lost as a closed one**, and archiving a finished build chat is the
  ordinary thing to do the moment its PR merges.
- **The condition is a live process, not a session state.** `isRunning: false` has answered fine
  **fourteen** times. **Do not infer readability from the listing — try the call.**
- **It is not a setting to change.** `auto_archive_on_pr_close` is Off and
  `auto_archive_inactive_days` is Never. Lutan archives by hand, which is correct. **Do not ask him
  to stop.**

---

## Model and effort

**Two dials, and they do not behave the same way:**

- **Model changes the price per unit of work, not the amount.** The floor is identical whichever
  model runs. **Choosing a cheaper family is the only dial that reduces usage without changing the
  work.**
- **Effort changes how much thinking happens per turn, so raising it RAISES the figure.** It buys
  care and it costs. **It is not a usage optimisation and must never be presented as one.**

**Never raise effort to fix an overrun.** The cure is a tighter brief or a spin-out.

**`claude-sonnet-5-5` / `low` is the default, and the evidence is now strong.** Eleven consecutive
streams on it, **none over band**, including six that carried migrations — two of which dropped
columns or views, the least reversible thing in the repo. The retired "spend Opus/high on the risky
one" recommendation looks worse with every batch. **The caveat still stands: the briefs also got
better, so the model cannot take all the credit.**

### The Fable datapoint is confounded — do not quote it as a Fable cost

**`fable-architecture-review` ran on `claude-fable-5-1` at `xhigh`, not the `low` that was
recommended.** Its **448,294** therefore varies **two dials at once** against every other row in the
table, and **cannot be attributed to the model.** `xhigh` on a 568-line whole-system review is
plausibly most of it.

**This is exactly why the skill says to read `model` and `effort` from `get_session` rather than
assuming the recommendation was applied.** It has now differed from the recommendation twice: once
because Lutan had already started the batch, once because he chose a higher effort deliberately.
**Record what ran; never what was recommended.**

**Fable's weekly bucket went 0% → 5% for that one review**, so it is barely dented and remains the
cheapest place to put review work. The remaining Fable item is *Fable dry run of the acceptance
checklist*.

**Check the plan windows** (`get_usage`) at the start of every run. All-models sat at **62% → 68%**
across these nine streams with three days left.

---

## What the architecture review found, because it changes what to plan

**`docs/architecture-review-2026-09-22.md`** (#543, 568 lines) is the first outside read of the whole
system. It filed **15 backlog items and 7 notes** (`46d11c0c`). **Read §1 before planning anything
structural**; §1.9 lists seven places `README.md` disagrees with the code.

**Two High findings, both already on the backlog:**

- **S1 — the Supabase personal access token is, by the setup instructions, on the Pi.**
- **S2 — backups are weekly and a restore has never been run.** This **matches an existing item**
  (the restore rehearsal, now overdue) rather than being new — the review agreeing with an open item
  is itself worth knowing.

**The structural findings worth planning around:** the Worker render fallback is the expensive half
of the Pi/Worker asymmetry (C1); **runtime configuration is four hand-kept lists** (C2 — the same
class of fault as the visitor-count drift bug, which was two hand-kept lists); the public-page list
exists three times (C3); the resident record is one 1,465-line file (C5); **there is no test runner
and the 137 `check-*.mjs` scripts are the tests** (C6).

**Its §3, "what is fine and should be left alone", is as useful as the findings** — it says what was
examined and found sound, which is what you cannot otherwise distinguish from what was never looked
at.

---

## Three constraints that shape batches

**1. One migration per batch is the real bottleneck.** Fold rather than defer where the subjects are
small: `drop-leftovers-schema` carried **three** unrelated items in one file for 143,030, which
`CLAUDE.md` explicitly allows (*"If two streams both need schema, their migrations go in one schema
PR"*).

**2. NEW — a stream may legitimately need its own schema PR mid-flight.** `vaccine-stock-forecast`
found it needed stock columns, **opened `0185` as its own PR first and then the feature PR** from the
same worktree. That is the schema-first rule honoured inside one stream rather than across two
batches, and it worked — but **it means a batch can end up with two migrations**, so brief streams to
say so rather than quietly taking a number.

**3. The mobile sweep: offer it as a swap option, never as a slot-filler.** **Declined a fifth time**
on 2026-10-11. Its own item says Lutan schedules it.

---

## What briefs should do, learned the hard way

- **Name the specific way a thing fails, not the general requirement.** `residents-list-sort` was
  told that sorting the loaded page yields a sorted *page* and not a sorted list, **and that it would
  look right** — the class Lutan holds releases for.
- **Tell a stream to read the code against what it *does*, and say what a null result would mean.**
  **A brief that predicts a finding gets one; a brief that asks for green gets green.**
- **Tell a stream when work already exists for it.** `cashflow-forecast-function` was asked to leave
  its dose generation reusable **and to say so either way**; it left
  `immunization_due_dates(p_from, p_to)` and documented what it does *not* cover (overdue doses;
  residents with no vaccine record). **That cut the next stream's band from ~230–380k to ~170–280k
  before it started.** Best single brief-to-brief handover so far — do it again.
- **Name what is NOT in scope, with the reason.** `release-note-truth-rule` was told
  `check-test-plan.mjs` is not at fault and must not change, `continue-on-error` must not return, and
  the script must not fail on unsigned plans — **because the obvious fix there is the forbidden one.**
- **Hand over the tension in a stream's own answer** rather than letting it discover it late.
- **Say which migration number to take, or forbid it outright and say what to do instead.**
- **Name the release-time hazard in the PR, not just the code** — **and state it even when there is
  none**, because an absent statement reads the same as an unknown.
- **Answer §7 in advance, per stream, and differently.** A split answer is fine and better:
  `drop-leftovers-schema` was told parts A and C are `n/a` and part B earns the tick, **and to say
  which part earned it.**
- **Tell a stream what to do with work it may not take.** Spinning out is the norm and it works:
  batches 91–93 spawned about twenty items between them, **including two that `perm-policy-cleanup`
  spun out rather than forcing** — so *Who does what* has two small tails, not zero. **Do not report
  that feature as entirely finished.**

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it at 375 px.
  Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — on a real phone.
- **The Director signing her roles draft.** `docs/decisions/2026-10-06-director-draft-apply.md` opens
  *"The item stays open"*. Lutan said on 2026-10-09 it *"appears to already have been done"* —
  **unverified**, and production cannot be read from these sessions.
- **The app header's button sizes** — Lutan's call; recommendation already written.
- **The Staff holders on production** — until that list is answered, **`0173` must not reach
  production**, or those logins fail closed. Carried for several releases.
- **The acceptance checklist's pre-run agreements** — the A4 PDF shipped (#493). Left: Lutan and the
  Director agreeing who tests which role, the per-role accounts on Test, what counts as a blocker,
  and where the signed paper copy lives (**it carries real names and this repo is public**).
- **The Cat Zone plan on production.** Lutan said on 2026-10-10 he would load it. **In flight — do
  not re-raise it as a finding.**
- **Who can read what of a contact, checked on production**, as each of six roles.
- **The role walkthrough re-run** — owed twice; a person runs it.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions · the Pi jobs and the failover options paper · the Google secret
  rotation leftovers · the second admin account (Anchalee) · the mobile sweep · the product `.org`
  name · **whether the purchasing job keeps reading stock receipts through `stock.delivery`** (new,
  from `perm-policy-cleanup`) · **three of the thirteen red check harnesses**, which need a per-role
  ruling.
- **The Director:** signing the roles draft · **the community-dogs baseline number and the date it is
  true up to** · the Thai receipt wording checked by a Thai reader.
- **Time:** HSTS not before **2026-11-08** · the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered on 2026-10-11 — do not re-raise any of these

1. **The quick-win band stays as written** and the planner quotes it. Asked four times. Closed.
2. **The test-site visitor tile is NOT wanted** (`ea3ad5bf`). Zone-wide token, so it would show
   figures identical to production's. **The grey *Not set up* on `test.lannacare.org` is now the
   intended permanent state** — not to be re-raised by a status audit or a release pass.
3. **The Director MAY backdate a receipt** (`7be41bdc`). *"It is not uncommon for someone to donate
   and then ask for a receipt a week later."* **The rule is `received_on <= issued_on <= today`**,
   today being the shelter's Asia/Bangkok date (`shelter_date()`, `0073`), and **`p_issued_on` is
   validated, not ignored** — unlike `0176`/`0177`, the caller's value is legitimate input.
   **Warn the stream not to narrow it to today-only "to be safe"**: that refuses his ordinary case.
   **This is the first schema candidate for the next batch.** Offered as a swap twice and declined
   both times — he wanted the planned work first, not the item dropped.
4. **The token floor is ~80k and the skill should say so.** Ships in this PR.

---

## Candidates for the next batch, in order

1. **The receipt backdating fix** — schema, unblocked, rule above.
2. **The two tails `perm-policy-cleanup` spun out** — the `medical.archive` trigger (schema, then
   app) and the stock-receipts question (**Lutan's decision first**).
3. **The architecture review's S1 and S2** — both High, both already items.
4. **C2, runtime configuration as four hand-kept lists** — the same class of fault that produced the
   false visitor-count release note. Worth doing before it bites a third time.
5. **The thirteen red check harnesses** — three need Lutan first.
6. **Items filed by other sessions today:** writers with no `can()` outside the medical area · one
   person holding more than one role with a cover end date · freeze the role-name header on *Who does
   what* · the migration runner cannot apply a subset, and the restore rehearsal is now overdue.

**No release cut is pending.** `0.26.0` and then `0.27.0` were both cut on 2026-10-11; `0.27.0`
carries batches 91–93 and `unreleased` is empty again. The next cut carries whatever the next batch
produces, so **do not plan a release as the step after the next batch merges without checking
`unreleased` first.**

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go**. Not technical in these areas: **plain English, no
jargon, options with consequences and a recommendation.** Deliverables go to
`C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a file naming
real people. Make the smallest defensible choice and record it — **except an over-grant, which no
screen will show as broken.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

**Put the consequence in the option text, not the symbol names.** And **record a deferral as its own
item, never as a promise inside something ticked** — a step named only in another item's "afterwards"
clause is invisible to the loop.

**He answers questions put as options with a recommendation, and he answers them quickly.** Four of
four were answered on 2026-10-11, three taking the recommendation and one choosing the more thorough
option (correct the skill rather than quietly quote lower). **Two had been carried unasked for days.
Ask.**

**He may start a batch before the planning conversation finishes, he may set a different model or
effort than recommended, and he may pull an urgent item in outside the batch.** **Ask what he has
actually started rather than assuming the plan describes reality.**

---

## Three traps in the tooling

- **`grep -c` exits 1 when it finds nothing**, so never use it as a success check in an `&&` chain.
- **Do not put long prose inside `node -e` or a `bash` heredoc.** Backticks, apostrophes and quotes
  break parsing in ways the error does not explain, and **a script can report success while writing
  mangled text**. **Write the file with the file-writing tool**, or append by line position
  (`sed -n "${N}p"`).
- **NEW — appending a backlog item by line position needs an anchor that cannot match another item,
  and a guard.** This bit three times on 2026-10-11 while writing briefs:
  - **`§` is multibyte**, so a pattern like `three splits of .4` does not match what it looks like it
    matches. Avoid `§` and other non-ASCII in anchors entirely.
  - **An umbrella item quotes its own spun-out children's titles**, so an anchor on a title matches
    the *parent* first. **Anchor on `^- \[ \] \*\*<Title>`** — the start of the line.
  - **`sed -n "${A}p"` with an empty `$A` prints the ENTIRE FILE.** One failed grep appended all 587
    lines of `docs/backlog.md` into a brief. **Always `test -n "$A"` before using it.**
- **A scanned PDF cannot be read by the usual means on this machine.** Render it with
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`, then read the
  PNGs. The Director returns her answer sheets as scans.

### One husk that cannot be cleared, and has been raised five times

`Animal_Shelter_planner-handover-81` is a folder git no longer tracks. `done` **refuses it**, because
the folder is no longer a git repo and so cannot be checked for uncommitted work; only `--force` gets
past that, and **that is Lutan's call, not a session's.** **Mention it once if it is still there,
then leave it.**

**Leftovers:** about **fifteen** merged `Animal_Shelter_*` folders at writing. **Every actual through
batch 93 is captured**, so nothing is at risk if Lutan archives those chats. `/clean-streams` clears
them.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-93`; the previous were **#514** (`planner-handover-87`),
**#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was really needed; **it
is.** It is a `docs/` file in the repo, so the only alternatives are committing to `main` directly or
routing it through the `backlog` branch, and the second is the 2026-10-07 failure `CLAUDE.md`
documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
