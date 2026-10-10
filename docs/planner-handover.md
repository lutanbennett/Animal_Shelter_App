# Planner handover — written 2026-10-10, after batch 87

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat,
written at the end of nine workstreams (batches 85, 86, 87). It says where the planning
loop stands, what is blocked and on whom, and what not to re-derive. It is **rewritten
every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with
it, they are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is ~8,100
   lines; do not read it all. The top line says which batch is live
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`4081637d`** |
| Dev database | **176 applied, 0 pending, no drift** (`apply-migrations.mjs --status`) |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0178`** — `0176` is the highest file on `main`, and **`0177` is owned by the live `receipt-content-server-side` stream** |
| Open backlog items | **88** |
| Open PRs | **none** at writing; batch 87's three have just started |
| Live worktrees | batch 87: `receipt-content-server-side` :3004, `page-guard-fixes` :3008, `user-colour-theme` :3009, plus this one :3010 — and **six merged leftovers** from batches 85 and 86, all `HELD` by their own sessions |
| Last release | **`0.24.0`** (2026-10-10, major); `unreleased` holds **3 lines** from batches 85 and 86 |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Nine workstreams went through in one day again**, across four `/plan-day` runs — and
**six of them merged inside about nine hours**, both batches start-to-merged between
planning runs. **Do not assume a batch you set up is still in flight**; check
`gh pr list` before telling the user anything about it.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; read the worktree registry and **capture
token actuals for merged streams whose sessions are still open** (the only chance); check
each candidate against the code, *against what the user has already ruled out*, and
*against whether it is waiting on a decision rather than on effort*; present three batch
tables with estimates; ask once; create only the current batch's worktrees and briefs;
save the plan and bump the counter.

---

## Five states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch tip is
   not in `main`. The work is in. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict. A conflict
   shows as `CONFLICTING`, and **silent CI on a pushed commit means exactly that** — sync
   the branch, do not wait.
3. **NEW, and it cost two round trips in one day: `UU docs/backlog.md` in the main
   checkout is almost certainly another session mid-sync, not a conflict for you.**
   Twice on 2026-10-10 the main checkout showed an unresolved `docs/backlog.md` and
   `git pull` / `git merge` refused with *"Merging is not possible because you have
   unmerged files"*; both times `MERGE_HEAD` had vanished by the next command, because the
   **Production release manager** was running the same daily sync in the same folder.
   **So: re-read the state before doing anything, and check `ListAgents` for a busy
   session whose `cwd` is the main checkout.** Resolving it yourself means two sessions
   resolving one conflict in one working tree. The batch-84 handover said to check once;
   **expect it** — the main checkout is shared and the release manager syncs there too.
4. **A stale session-start `git status`.** The snapshot in the first system message is
   from session start and can be hours old. On 2026-10-10 it showed `main` three merges
   behind. **Re-read `git log` rather than quoting it.**
5. **`HELD` is a snapshot, not a verdict — and the batch-84 correction was itself too
   strong.** That copy said held worktrees "reliably release within minutes" and that
   re-running `list` beats asking Lutan to close chats. Over three readings on 2026-10-10
   the truth settled: **a worktree is held while its session lives, and releases within
   *hours* of that stream's work finishing, not minutes.** Six held at 05:50 were free by
   10:00; six more were held immediately after their PRs merged. **So: clear leftovers on
   the next run, never ask Lutan to close chats for it, and never `done` something that
   reads `HELD` at the moment you look.**

---

## The lesson that cost the most, and its five questions

**An open item is not proof the work is undone, and a status note saying "still open" is
not proof either.** On 2026-10-07 that cost four streams.

**Two commands per candidate, before it enters a batch:**
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"` (or `-- <file>`).

**Third question: has an approach already been declined?** A declined approach lives as
**prose inside the item**, not as a decision file or a commit, so the two commands cannot
see it. Read the item's own prose for *declined*, *parked*, *on hold*, *Lutan said*.

**Fourth question: is it waiting on a decision rather than on effort?** This keeps paying.
On 2026-10-10 **six items were closed or unblocked by answers in the planning chat, before
any worktree existed** — twice as many as a single stream closes. Put them to him as
options-with-a-recommendation in the same `AskUserQuestion` as the batch confirmation, and
commit the answers to the `backlog` branch immediately.

**Fifth, new: an item's *count* is the count someone happened to run.**
`check-harness-repair`'s item said *"eight dev check harnesses"*, measured from six run
plus two inferred. There were **51**. The item even named the grep that would have found
them. **If an item says "measured on dev" and names a wider search, size it for the
search, not for the number.** That stream ran 17% over for exactly this reason.

---

## Token estimates, from measured actuals

**Thirty-nine measured, five lost — five clean sweeps in a row.** Every loss was a
**closed** session: `get_usage` answers fine for an *idle* one, so **the loss is
specifically a chat shut between the merge and the next `/plan-day`.**

| landmark | figure |
|---|---|
| Largest ever measured | **`donation-receipts` 454,572** |
| Second | **`vet-to-doctor-rename` 452,067** — live tables, 5 check scripts, routes, nav, manual, both dictionaries, **two PRs** |
| Cheapest real feature | **`receipt-issuer-server-side` 143,678** — a `security definer` RPC, app code *and* a migration |

**THE SCHEMA-PR BAND IS NO LONGER UNMEASURED. The skill's table still says it is.**
Measured twice: `map-rooms-schema` **151,273** (a single-file migration with a back-fill,
dry-run, apply and a mostly-`n/a` test plan) and `receipt-issuer-server-side` **143,678**
(migration plus app). **Use ~150k.**

**Nothing lands below ~130k.** Six streams in a row now confirm it. The ~110k floor is
paid before any work and every stream still has to read, build, check and write a plan.
The quick-win band is **130–190k**
(`docs/decisions/2026-10-09-quick-win-band-is-130-190k.md`).

**Do not shade estimates down by a flat percentage.** Nine streams across batches 84–86
ran **−23, −3, +21, +5, +17, −11, −15, −35, −43** per cent. The mean is about −10% and it
is useless, because the spread is +21 to −43.

**What explains the spread is how much each stream had to find out:**

- **One known fix, named files, a precise brief → 143k–185k**, whatever it touches.
- **A fully-specified large build lands at the *bottom* of its band**, not the middle
  (`map-rooms-editor` −15% on ~450k).
- **A stream that must discover its own scope overruns** (`check-harness-repair` +17%).

**So estimate by what must be discovered, not by files touched** — and estimate a
precisely-briefed single-fix stream at **~160–200k**, not ~250k.

---

## Three constraints that shape batches

**1. One app-wide sweep is left, and it cannot share a batch with screen work** — the
**mobile sweep**. Its own item says Lutan schedules it and `/plan-day` should **stop
offering it**; he has now chosen other work over it three times. **Offer it as a swap
option, never as a slot-filler, and let him decline it.**

**2. One migration per batch is still the real bottleneck.** Two candidates are queued on
it right now: `cashflow-and-vaccine-forecast` and the map-room leftover drops. When two
belong together, **fold them into one stream.**

**2a. A stream that must not merge still needs the slot managed** — `multi-tenancy-spike`
was **explicitly forbidden a migration number** and told to use the `begin … rollback`
`do $$ … $$` harness, which is what let it share a batch with a migration-carrying stream.

**3. NEW — when a schema stream hands the next stream "drop these in a migration", check
whether that stream *needs* them dropped or merely *should* eventually.** `0175`'s
handover told `map-rooms-editor` to drop a unique constraint, a trigger and a function
"in one migration" — which would have put **two migrations in batch 86** and broken rule
3, on a stream the saved plan had down as needing none. It was resolved by establishing
the drops were not *required*: `0175` had made `kind` nullable, new rooms carry none, and
Postgres allows unlimited NULLs in a unique column, so the constraint could not block
anything and the trigger could never fire. **The editor was forbidden a number, told to
move its writes onto the primary key, told to prove both claims rather than trust the
brief, and told to spin the drops out as a new backlog item.** That kept a security fix
and the feature in the same batch. **Cleanup is almost always deferrable; correctness is
not.**

---

## What briefs should do, learned the hard way

- **Name the specific way a thing fails, not the general requirement.** The receipts brief
  said English-only receipts still need Thai glyphs *because donor names are free text*,
  and that found a pre-existing bug (#486).
- **NEW — tell a stream to read the code against what it *does*, not what it *says*, and
  say what a null result would mean.** `parity-layer-3` was briefed that if it pinned each
  page to the activity its guard already named, it would have pinned the bug in place —
  and that finding nothing would be a surprising result for pages nobody had ever checked,
  so it must say how it checked. It came back with two real findings. **A brief that
  predicts a finding gets one; a brief that asks for green gets green.**
- **NEW — say which number to take, or forbid the number outright and say what to do
  instead.** See constraint 3. The receipts brief once said "no migration expected", it
  needed one, and the brief had not covered that.
- **Say what is a decision and what is a build**, with the recommendation attached, and
  **tell the stream to build everything else first so the question does not block it**
  (`user-colour-theme`, the dev-marker question).
- **Carry the reasoning, not just the instruction.** A future session undoes a decision
  whose reason it cannot see.
- **Name the release-time hazard in the PR, not just in the code** — the release manager
  reads the PR. Also worth stating when there *is* no manual step.
- **Tell a stream what to do with work it is not allowed to take.** Forbidden its
  migration slot, `dashboard-cashflow-followups` **spun two schema-needing candidates out
  as new backlog items**. `map-rooms-editor` did the same with its three drops.
  **This is now the norm and it works: batches 85 and 86 spawned seven new items between
  them**, three of them Security findings, and batch 87 was re-planned around two of them.
- **A stream told "schema first, then the sweep" will split itself into two PRs**,
  unprompted (#495/#496, #498/#499). Keep both PRs in one stream.
- **For an umbrella item of lettered candidates, the first deliverable is the sort-out,
  not the build.**

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan
them.** Keep this list current:

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it
  at 375 px. Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — *Set as profile* and the *Remove
  photo* confirm row, on a real phone.
- **The Director signing her roles draft.** Draft 2 is loaded on test.
  `docs/decisions/2026-10-06-director-draft-apply.md` opens *"The item stays open"*. Lutan
  said on 2026-10-09 it *"appears to already have been done"* — **unverified**, and
  production cannot be read from these sessions.
- **The app header's button sizes** — Lutan's call; recommendation already written. Partly
  shipped 2026-10-07; read the item before re-raising.
- **The Staff holders on production** — until that list is answered, **`0173` must not
  reach production**, or those logins fail closed.
- **The acceptance checklist's pre-run agreements** — the A4 PDF shipped (#493). What is
  left is Lutan and the Director agreeing who tests which role, the per-role accounts on
  Test, what counts as a blocker, and where the signed paper copy lives (it carries real
  names and **this repo is public**). Plus Thai steps, which wait on the Thai manual.
- **NEW — the Cat Zone plan on production.** Lutan said on 2026-10-10 *"I will load in cat
  zone today into production"*. **Recorded as in flight on the item — do not re-raise it
  as a finding.** What closes it is the load plus one confirmation that every zone has a
  `facility_maps` row.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions; the Pi jobs and the failover options paper; the Google
  secret rotation (the stocktake shipped as #481, so check what is left); **the visitor
  count**, which needs a Cloudflare API token he creates; the second admin account
  (Anchalee); the mobile sweep; and the product `.org` name.
- **The Director:** signing the roles draft; **the community-dogs baseline number and the
  date it is true up to**; the Thai receipt wording checked by a Thai reader.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and
  `miniflare` ship a `sharp` past 0.35.5; **dropping the four old vet compatibility
  views**, which waits for the release *after* 0.24.0.

### The facility map — the long-standing warning is finally resolved

For weeks the item said production must move its plans into storage *before* the three
committed files were deleted, or the live map would blank. **The warning was backwards:
production never had them, so the live map was already blank** — a feature shipped and
never populated, which no screen reports.

**That is now fixed, by hand, by Lutan.** On 2026-10-10 he loaded **House Zone and the
revised Main Zone** into production through Settings → Facility map, and the three
committed files were deleted in #512 once both databases were confirmed storage-backed.
**Two things remain and neither is a planner's to build:** the **Cat Zone** plan (above),
and whether every zone the map offers now has a row — one query settles it. The
**overview stays as it is** (decided 2026-10-10: the revised Main Zone does *not* become
it), and **plan uploads stay Admin only** (decided 2026-10-10, item ticked, recorded with
the reasoning so nobody reopens it).

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude
to own git; commits auto-push; **merge only on his go**. Not technical in these areas:
**plain English, no jargon, options with consequences and a recommendation.** Deliverables
go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a
file naming real people. Make the smallest defensible choice and record it — **except an
over-grant, which no screen will show as broken.**

**He holds a release for a change that breaks quietly**, and names it separately from the
count. That is why both receipt holes were taken the day they were found: a receipt naming
any organisation, or saying 1,000,000 baht for a 100-baht gift, is stored in the register
and no screen shows it as wrong.

**NEW — put the consequence in the option text, not the symbol names.** On 2026-10-10 a
question about four `*_ROLES` lists named them by their code identifiers; he approved the
recommendation and *then* asked what he had approved. He also **corrected his own answer
in the same turn** — "permanent" became *"can we ensure we clean these roles up later
after the database updates"*. **Record a deferral as its own item, never as a promise
inside something ticked**, which is what was done (*Move the last four role-name lists
onto the permissions system*, gated on `perm-drop-enum`).

---

## Three traps in the tooling

- **`grep -c` exits 1 when it finds nothing**, so never use it as a success check in an
  `&&` chain. On 2026-10-09 a resolution chain stopped **before the commit** because the
  grep correctly found zero conflict markers, and the repo sat in a half-finished merge.
- **Do not put long prose inside `node -e` or a `bash` heredoc.** Backticks, apostrophes
  and quotes break the shell's parsing in ways the error message does not explain — a
  quoted heredoc of this very file failed with *"unexpected EOF while looking for matching
  quote"* on 2026-10-10. **Write the file to the scratchpad directory with the file-writing
  tool and copy it into place**, or run a script with a path argument. That worked every
  time today; the shell-quoting route failed twice.
- **A scanned PDF cannot be read by the usual means on this machine** — no text layer,
  `pdftotext` is the only poppler tool present, and the browser pane will not screenshot a
  `file://` PDF. Render it with
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`,
  then read the PNGs. The Director returns her answer sheets as scans.

### One husk that cannot be cleared, and has been raised three times

`Animal_Shelter_planner-handover-81` is a folder git no longer tracks. `done` **refuses
it**, because the folder is no longer a git repo and so cannot be checked for uncommitted
work; only `--force` gets past that, and **that is Lutan's call, not a session's.**
**Mention it once if it is still there, then leave it.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first,
in the chat that still has the context, then start the fresh chat.** Offer it; do not just
do it.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as
`docs/release-handover.md` does. This one is `claude/planner-handover-87`; the previous two
were **#501** (`planner-handover-84`) and **#490** (`planner-handover-81`). Lutan asked on
2026-10-09 whether the PR was really needed; it is. It is a `docs/` file in the repo, so
the only alternatives are committing to `main` directly or routing it through the `backlog`
branch, and the second is the 2026-10-07 failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is
still true; reset the counter in `.plan-day.md` with today's date.
