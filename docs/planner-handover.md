# Planner handover — written 2026-10-11, after batch 90

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat, written at
the end of ten workstreams (the urgent `visitor-count-live`, then batches 88, 89 and 90). It
says where the planning loop stands, what is blocked and on whom, and what not to re-derive. It
is **rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it,
they are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is ~9,200 lines; do
   not read it all. The top line says which batch is live
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`cefd91a8`** |
| Dev database | **179 applied, 0 pending, no drift** (`apply-migrations.mjs --status`) |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0181`** — `0180` is owned by the live `perm-drop-enum` stream |
| Open backlog items | **~95** |
| Open PRs | **none** at writing; batch 90's three were just set up and not started |
| Live worktrees | batch 90: `who-does-what-edit` :3001, `perm-drop-enum` :3002, `record-permission-gaps` :3004, plus this one :3006 — and **five merged leftovers**, all `HELD` by their own sessions |
| Last release | **`0.25.0`** (2026-10-10, major); `unreleased` is **empty** at writing |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Ten workstreams went through in about fifteen hours**, across four `/plan-day` runs, and
**batch 89's three were planned, built and merged inside about forty minutes.** **Do not assume
a batch you set up is still in flight** — check `gh pr list` before telling the user anything
about it. Twice in this period a batch merged between one message and the next.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; read the worktree registry and **capture token
actuals the moment you notice a stream's PR has merged** (in that same turn — see below); check
each candidate against the code, *against what the user has already ruled out*, and *against
whether it is waiting on a decision rather than on effort*; present three batch tables with
estimates **and a model/effort recommendation**; ask once; create only the current batch's
worktrees and briefs; save the plan and bump the counter.

---

## Six states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch tip is not in
   `main`. The work is in. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict. A conflict shows
   as `CONFLICTING`, and **silent CI on a pushed commit means exactly that** — sync the branch,
   do not wait.
3. **`UU docs/backlog.md` in the main checkout.** Usually another session mid-sync — re-read the
   state and check `ListAgents` for a busy session whose `cwd` is the main checkout. **But not
   always: on 2026-10-11 it was a genuine conflict of the documented kind** — a PR had ticked an
   item while the `backlog` branch had added a new item just above it. **Both sides were
   wanted.** Resolve by keeping both and dropping only the stale duplicate, and **do it by line
   position rather than piping prose through the shell** (see the tooling traps).
4. **A stale session-start `git status`.** The snapshot in the first system message is from
   session start and can be hours old. **Re-read `git log` rather than quoting it.**
5. **`HELD` is a snapshot, not a verdict.** A worktree is held while its session lives, and
   releases within *hours* of that stream's work finishing. **Clear leftovers on the next run,
   never ask the user to close chats for it, and never `done` something that reads `HELD` at the
   moment you look.**
6. **NEW — an item's own "still open" note can be flatly wrong, written in good faith minutes
   earlier.** On 2026-10-11 a ticked bug item listed two things "deliberately NOT done"; **one of
   them had been done by the same stream an hour before**, by a PR the note's author had not
   re-read. **Check the claim against the code, not the note.** Mark it corrected rather than
   deleting it, citing the decision file and the code, so the next reader sees why.

---

## The lesson that cost the most, and its five questions

**An open item is not proof the work is undone, and a status note saying "still open" is not
proof either.** On 2026-10-07 that cost four streams; on 2026-10-11 it nearly cost one more
(state 6 above).

**Two commands per candidate, before it enters a batch:**
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"` (or `-- <file>`).

**Third: has an approach already been declined?** A declined approach lives as **prose inside
the item**, not as a decision file or a commit. Read the item's own prose for *declined*,
*parked*, *on hold*, *Lutan said*.

**Fourth: is it waiting on a decision rather than on effort?** This keeps paying, and on
2026-10-11 it paid in a new way: a blocker item framed **three** things as needing Lutan's
decision, and **two of them had already been answered** — one by Lutan in
`docs/roles-and-permissions.md` (lines 411, 475, 1386), one by **the Director** on 2026-10-07
(q6/q7, `0155`). **So: ask what is waiting on a decision, then check whether the decision has in
fact already been made, by either of them.** Three items closed for the price of one question.
Put the genuinely open one to him as options-with-a-recommendation in the same
`AskUserQuestion` as the batch confirmation, and commit the answer to the `backlog` branch
immediately.

**Fifth: an item's *count* is the count someone happened to run.** `check-harness-repair`'s item
said *"eight dev check harnesses"*; there were **51**. **If an item says "measured on dev" and
names a wider search, size it for the search.** Tell the stream to count it itself and report the
real figure — `perm-functions-schema` was briefed that way, and its item said "eleven" and then
named twelve.

---

## Token estimates — and the honest state of them

**47 measured, 7 lost.**

**THE ESTIMATES ARE ±40% NOISE. GIVE BANDS, NOT FIGURES.** Two consecutive batches went wrong in
opposite directions:

| batch | model / effort | results |
|---|---|---|
| 88 | `opus-5-5` / `medium` | **+20%, +29%, +50%** — nought for three, all over |
| 89 | `sonnet-5-5` / `low` | **−23%, −37%, −39%** — three for three, all under |

**Batch 88 broke the "briefed streams land under" pattern** that five streams in a row had set
(−15 to −43%). What distinguished it: **every one of those three had to *measure* what the system
does** before changing anything — which boxes are obeyed, which functions name a role, whether
parity moved. `who-does-what-view` ended up **writing `scripts/check-who-does-what.mjs`** to
measure 300 boxes under 7 roles, and that script *was* the work.

**So the axis is not "briefed vs unbriefed". It is "is the scope known, or must the stream
establish it?"** A brief can name every file and still sit on an open-ended count. **Before
estimating, ask what the stream has to count.** If the answer is anything but "nothing", widen
the band and say in the brief that the counting is the deliverable.

**Then batch 89 went under, and the planner had over-corrected by raising estimates ~15%.** Its
briefs were far more prescriptive *and* the measuring tool already existed, so the discovery was
pre-paid. **Both halves matter; do not credit the model.**

| landmark | figure |
|---|---|
| Largest ever measured | **`who-does-what-view` 449,014** (est. ~300k, +50%) |
| Second | **`donation-receipts` 454,572** — superseded as the cautionary tale |
| Cheapest real feature | **`status-tile-truth` 152,979** — two fixes *and* a tile-by-tile audit |

**The schema band is measured four times now and the skill's `unmeasured` is wrong:**
`map-rooms-schema` 151,273 · `receipt-issuer-server-side` 143,678 · `perm-functions-schema`
284,248 · `role-floor-schema` 231,297. **~150k for a single-file migration; ~230–285k when it
also converts functions or carries app code.** Correcting the skill's table is **Lutan's call** —
ask, do not assume.

**Nothing lands below ~130k.** The ~110k floor is paid before any work.

### CAPTURE THE FIGURE WHEN THE PR MERGES, NOT AT THE NEXT `/plan-day`

**This now has five consecutive successes and is not optional.** The instant you see a stream's
PR has merged, call `get_usage` **in that same turn**, before touching the registry.

- **An archived session is as lost as a closed one**, and archiving a finished build chat is the
  ordinary thing to do the moment its PR merges. Two figures were lost that way on 2026-10-10.
- **The condition is a live process, not a session state.** `isRunning: false` has answered fine
  **seven** times now. **Do not infer readability from the listing — try the call.**
- **It is not a setting to change.** `auto_archive_on_pr_close` is **Off** and
  `auto_archive_inactive_days` is **Never**. Lutan archives by hand, which is correct
  housekeeping. **Do not ask him to stop.**

---

## Model and effort — NEW, and read the caveat before using it

Lutan asked on 2026-10-11 for a model/effort recommendation per stream, *"the best mix of
accuracy along with optimised usage"*. **The `SKILL.md` change that makes this part of the loop
ships in this handover's PR.**

**Two dials, and they do not behave the same way:**

- **Model changes the price per unit of work, not the amount.** The ~110k floor — tools,
  `CLAUDE.md`, memory, skills, the brief — is identical whichever model runs. **Choosing a
  cheaper family is the only dial that reduces usage without changing the work.**
- **Effort changes how much thinking happens per turn, so raising it RAISES the figure.** It buys
  care and it costs. **It is not a usage optimisation and must never be presented as one.**

**Never raise effort to fix an overrun.** Batch 88's overruns were scope discovery; more thinking
per turn would have made them worse. The cure is a tighter brief or a spin-out.

**What the evidence actually says.** Until 2026-10-11 **every** measured stream had run
`opus-5-5` / `medium`, so there was none. Batch 89 then ran `sonnet-5-5` / `low` and **came in
23–39% under on all three, with no quality cost found on inspection** — including
`role-floor-schema`, a permissions migration, which pointed the functions at the role's own scope
rather than loosening them (the trap), implemented Lutan's 2IC/Head split exactly, spun out the
part it could not finish, declined to tick a half-done item, **and corrected an error in its own
brief** (the Head of Maintenance never *had* job-delete, so nothing was taken away).

**So `sonnet-5-5` / `low` is the default.** The planner's earlier "spend Opus/high on the risky
one" recommendation was reasoning, never evidence, and is retired. **But the task also changed
between those batches, so do not claim the model caused it.** Vary one dial per batch and let the
table accumulate; `model` and `effort` are now columns in `.plan-day.md`'s actuals table.

**Record what a stream ACTUALLY ran on** (`get_session` reports `model` and `effort`), not what
was recommended. On 2026-10-11 Lutan had already started batch 89 before the recommendation
existed, so it applied to nothing — and reading the recommendation as the setting would have
produced a false finding.

**Check the plan windows** (`get_usage`): if *Weekly · all models* is high with days left, the
cheaper model on the lowest-risk stream is the real mitigation. **`Weekly · Fable` is a separate
bucket and has sat at 0%** — the backlog's two Fable items (*Top-to-bottom architectural review*,
*Fable dry run of the acceptance checklist*) are the natural way to spend what otherwise expires.

---

## Three constraints that shape batches

**1. One migration per batch is the real bottleneck, and it bit twice this period.** On
2026-10-11 `who-does-what-edit` turned out to have a `FIXED_FOR_NOW` entry (`notAskedYet`)
needing policy changes, which would have put two migrations in batch 90. **Resolved the
established way: the slot stayed with `perm-drop-enum`, (e) was forbidden a number and told to
spin the entry out** — justified by the file's own words, *"Each box is right today only because
the same roles hold both"*, so no wrong outcome can happen today. **Cleanup is almost always
deferrable; correctness is not.** Same call as `0175`'s drops.

**2. When a stream is handed "and also fix these", check whether it *needs* them or merely
*should eventually*.** Read the actual entry, not the handover sentence. Both times this period
the answer was "should eventually", and saying so kept two features in one batch.

**3. The mobile sweep: offer it as a swap option, never as a slot-filler**, and let him decline
it. He has now chosen other work over it four times. Its own item says he schedules it.

**3a. A stream that must not merge still needs the slot managed** — `multi-tenancy-spike` was
explicitly forbidden a migration number and told to use the `begin … rollback` `do $$ … $$`
harness.

---

## What briefs should do, learned the hard way

- **Name the specific way a thing fails, not the general requirement.**
- **Tell a stream to read the code against what it *does*, not what it *says*, and say what a
  null result would mean.** **A brief that predicts a finding gets one; a brief that asks for
  green gets green.** `status-tile-truth` was told three instances of one cause existed and to go
  looking for the fourth — **it found it** (*Release mail*). `parity-layer-3` was told the same
  and came back with two real findings.
- **Say which migration number to take, or forbid it outright and say what to do instead.**
- **Say what is a decision and what is a build**, with the recommendation attached, and **tell the
  stream to build everything else first so the question does not block it.**
- **Carry the reasoning, not just the instruction.** A future session undoes a decision whose
  reason it cannot see.
- **Name the release-time hazard in the PR, not just in the code** — the release manager reads the
  PR. **Worth stating even when there is none**, because an absent statement reads the same as an
  unknown.
- **Tell a stream what to do with work it is not allowed to take.** Spinning out is now the norm
  and it works: batches 85–90 spawned a dozen items between them, and several batches were
  re-planned around them.
- **NEW — tell a stream when the record it needs already exists, so two writers do not both create
  it.** On 2026-10-11 the planner recorded (e)'s amended done-when on the backlog and then edited
  the brief to say *"do not re-record it; if your findings differ, say so"*.
- **For an umbrella item of lettered candidates, the first deliverable is the sort-out.**

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**
Keep this list current:

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it at
  375 px. Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — *Set as profile* and the *Remove photo*
  confirm row, on a real phone.
- **The Director signing her roles draft.** `docs/decisions/2026-10-06-director-draft-apply.md`
  opens *"The item stays open"*. Lutan said on 2026-10-09 it *"appears to already have been
  done"* — **unverified**, and production cannot be read from these sessions. **Note
  `/admin/role-draft` is being retired or redirected by `who-does-what-edit`** — if that stream
  deleted rather than redirected, check nothing of her draft history was lost.
- **The app header's button sizes** — Lutan's call; recommendation already written.
- **The Staff holders on production** — until that list is answered, **`0173` must not reach
  production**, or those logins fail closed.
- **The acceptance checklist's pre-run agreements** — the A4 PDF shipped (#493). Left: Lutan and
  the Director agreeing who tests which role, the per-role accounts on Test, what counts as a
  blocker, and where the signed paper copy lives (**it carries real names and this repo is
  public**). Plus Thai steps, which wait on the Thai manual.
- **The Cat Zone plan on production.** Lutan said on 2026-10-10 he would load it. **Recorded as in
  flight — do not re-raise it as a finding.** What closes it is the load plus one confirmation
  that every zone has a `facility_maps` row.
- **NEW — the alert-mail tile on production.** `status-tile-truth` fixed the cause it could reach
  and audited the page, but the red Lutan saw is **presumably production**, which these sessions
  cannot read. **The confirmation is the release manager's**, and the stream handed it over rather
  than ticking it.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions; the Pi jobs and the failover options paper; the Google secret
  rotation (the stocktake shipped as #481 — check what is left); the second admin account
  (Anchalee); the mobile sweep; the product `.org` name; **and whether the skill's token table
  should be corrected** (above).
- **The Director:** signing the roles draft; **the community-dogs baseline number and the date it
  is true up to**; the Thai receipt wording checked by a Thai reader.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5; **dropping the four old vet compatibility views**, which waits for
  the release *after* 0.24.0 — **0.25.0 has now shipped, so check whether this is unblocked.**

### The visitor count — resolved, and the lesson is bigger than the bug

**`0.25.0` shipped an admin-tagged note saying the Website visitors tile now shows numbers. It did
not.** #518 fixed a real drift bug (two hand-kept optional-secret lists, so the Cloudflare pair
reached the Worker but not the Pi) and then **claimed the feature on the strength of the
plumbing**, while its own decision file recorded the manual step as outstanding. Release mail went
to every admin.

**Fixed 2026-10-10**, configuration only: token verified, two lines copied to the production Pi,
`deploy-pi.sh --ref 590a9d35` re-run pinned to the release commit, verified three ways, **Lutan
confirmed the tile live** (5,364 page views / 663 uniques over 7 days). **No correcting note was
issued, and that was right** — Lutan confirmed nobody had opened System status before the fix, so
the note was **early, not wrong in front of anyone**. **Keep this: the first question about a false
release note is not how to word the correction, it is whether anyone has read it.**

**The pattern behind it is the thing to carry.** The visitor count, the **Pi origin** tile and the
**alert mail** tile are **three instances of one cause**: *the Pi serves the pages and does not get
what the Worker has*. `status-tile-truth` audited every tile and **found a fourth**. Two items
remain: the **test site** (no `.env.deploy.test` exists on the PC at all — and worth asking whether
a test tile is wanted, since the figures are zone-wide and so identical to production's), and a
filed process question: **may §7 be ticked when the same PR's decision file records a manual step
outstanding?** Recommendation: no — the honest answer is `n/a: <the outstanding step>`, and the
note goes in the PR that closes it. **`check-test-plan.mjs` is not at fault and must not be
changed** — it can see whether a line exists, never whether it is true.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go**. Not technical in these areas: **plain English, no
jargon, options with consequences and a recommendation.** Deliverables go to
`C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a file naming
real people. Make the smallest defensible choice and record it — **except an over-grant, which no
screen will show as broken.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

**Put the consequence in the option text, not the symbol names.** And **record a deferral as its
own item, never as a promise inside something ticked** — that failure appeared **three times in two
days** (a lesson inside a bug item about to be ticked; two "still open" notes inside a ticked item,
one of them already false; `perm-drop-enum` existing only inside two other items' prose, so
**nothing listed it as work and no planning run could have picked it up**). **A step named only in
another item's "afterwards" clause is invisible to the loop.**

**NEW — he may start a batch before the planning conversation finishes, and he may run one urgent
stream alone.** On 2026-10-10 he pulled an urgent bug in outside the batch; on 2026-10-11 he had
already started batch 89 when the model question was asked. **Ask what he has actually started
rather than assuming the plan describes reality.**

---

## Three traps in the tooling

- **`grep -c` exits 1 when it finds nothing**, so never use it as a success check in an `&&` chain.
  On 2026-10-09 a resolution chain stopped **before the commit** because the grep correctly found
  zero conflict markers.
- **Do not put long prose inside `node -e` or a `bash` heredoc.** Backticks, apostrophes and quotes
  break parsing in ways the error does not explain, and **a script can report success while writing
  mangled text**. **Write the file with the file-writing tool and copy it into place**, or run a
  script with a path argument. **The same rule resolves a `docs/backlog.md` conflict: do it by line
  position** (`sed -n` the wanted lines into a new file) rather than passing the conflicted prose
  through the shell. That worked cleanly on 2026-10-11.
- **A scanned PDF cannot be read by the usual means on this machine** — no text layer, `pdftotext`
  is the only poppler tool present, and the browser pane will not screenshot a `file://` PDF.
  Render it with
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`, then read
  the PNGs. The Director returns her answer sheets as scans.

### One husk that cannot be cleared, and has been raised four times

`Animal_Shelter_planner-handover-81` is a folder git no longer tracks. `done` **refuses it**,
because the folder is no longer a git repo and so cannot be checked for uncommitted work; only
`--force` gets past that, and **that is Lutan's call, not a session's.** **Mention it once if it is
still there, then leave it.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as
`docs/release-handover.md` does. This one is `claude/planner-handover-90`; the previous were
**#514** (`planner-handover-87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09
whether the PR was really needed; **it is.** It is a `docs/` file in the repo, so the only
alternatives are committing to `main` directly or routing it through the `backlog` branch, and the
second is the 2026-10-07 failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
