# Planner handover — written 2026-10-08, during batch 78

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh
chat, written at the end of three batches (nine workstreams). It says where the
planning loop stands, what is blocked and on whom, and what not to re-derive. It
is **rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they
disagree with it, they are right and this file is stale — check the date at the
top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is
   ~6,800 lines; do not read it all. The top line says which batch is live
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`c827c8a9`** |
| Dev database | `165 applied`, **no drift** (`apply-migrations.mjs --status`) |
| Production database | `164 applied`, **1 pending** (`0165`) at the `0.22.0` release — see `docs/release-handover.md`; not re-read from a worktree |
| Next free migration number | **`0166`**, held by `translations-schema-0166` (batch 78) |
| Open backlog items | **88** (`- [ ]` above `## Completed`) |
| Open PRs | **none** at writing; batch 78's three will open soon |
| Live worktrees | batch 78: `enclosures-offsite-chip`, `translations-schema-0166`, `planner-handover-doc`; plus **two free leftovers**, `record-0-22-0` and `release-handover-0-22-0` — `/clean-streams` them |
| Last release | **`0.22.0`** (2026-10-08) |
| Workstreams since the last handover | **counter starts here** — this is the first handover; `.plan-day.md` carries the count from now on |

**Production one migration behind `main` is normal between releases**, and dev
level with `main` is normal while no schema PR is open. Once `0166`'s schema PR
is applied to dev, **dev ahead of `main` is normal too** until it merges.
`docs/release-handover.md` has the pair spelled out.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; read the worktree registry and
**capture token actuals for merged-but-still-running sessions** (the only
chance — a closed session's figure is gone); check each candidate item against
the code before offering it; present three batch tables with token estimates;
ask once; create only the current batch's worktrees and briefs; save the plan
and bump the workstream counter.

---

## Three states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch
   tip is not in `main`. The work is in. Most PRs here are merge commits; `#416`
   was squashed and showed **4 ahead**. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict.
   A conflict shows as `CONFLICTING`, and **silent CI on a pushed commit means
   exactly that** — sync the branch, do not wait.
3. **A `backlog` merge conflict** during the daily sync — expected; eleven are
   written up in `.plan-day.md` and the planner's count reached fifteen.
   **"Keep both sides" has resolved every one**, in three shapes: two lines
   kept; one line spliced from both; **one side discarded because the other was
   a superset.** Compare byte lengths before assuming both hold something.

---

## The lesson that cost the most

**An open item is not proof the work is undone, and a status note saying "still
open" is not proof either.** On 2026-10-07 this cost **four streams**: three on
a public-site redesign built 2026-09-26, one on a deceased-archive gap fixed
2026-09-24 whose item still read "still open: gap 4" eight days later. A sweep
then found five more done-and-unticked items.

**Two commands per candidate, before it enters a batch:**
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"` (or
`-- <file>`). A commit title can close an item as surely as a decision file.

**And testing a claim is not finding a line that agrees with it.** The deceased
item named a constant that really was `{jpeg, png}` — while the fix sat on
another code path. Ask whether the bad outcome can still happen.

**Read an item before *offering* it, not just before briefing it.** On
2026-10-08 the Vet rename was offered to Lutan and turned out to be parked on
his own note.

**An item can end in a question.** Also 2026-10-08: the contacts-maps item
closed on Lutan answering "no preview wanted", not on a build (`c827c8a9`).

---

## Token estimates, from measured actuals

Every stream pays a **~110k floor** before any work. **Cost tracks how much a
stream must find out, not how much it writes** — a one-row migration cost 181k
(`website-content-grant`) because its brief asked open questions; a
column-and-constraint migration cost 151k (`zone-colour-schema`).

The `slug | estimated | actual` tables are in `.plan-day.md`, one per batch.
**Seventeen measured actuals and one `unmeasured` by 2026-10-08.** Of the last
eight measured, seven came in under estimate, mostly by 8–12%; the eighth,
`facility-map-upload`, was 1% over.

**Fold small items.** Three items in one stream (`stock-pages-finish`) cost 262k
where three streams would have spent ~330k on floors alone.

**The figure is the context window, not billed tokens.** Each turn re-sends it,
mostly cached. A measure of scale, not a bill.

**The capture window is the run right after a merge.** `residents-and-nav-polish`
(batch 77) is `unmeasured` because its session closed before the next run.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do
not plan them.** Keep this list current:

- **The maintenance board on a phone** — someone must watch the Head of
  Maintenance use it at 375 px.
- **The photo lightbox's last two controls at 375 px** — *Set as profile* and the
  *Remove photo* confirm row, on a real phone (inside the bare-buttons item).

---

## Blocked, and on whom

- **Lutan:** the two auth decisions (refuse admin until 2-step; who opens 2-step
  set-up for a real admin); the Pi jobs (spare-clone timer, app user, backup key
  custody, failover); F-11 Thai translations; the Google secret rotation —
  **stopped, a full account-and-client stocktake comes first** (his instruction,
  2026-10-07); the mobile sweep, which he schedules himself; **deleting the
  committed facility-map plan files, which is ORDER-SENSITIVE — production must
  have the plans in storage first or the map blanks.**
- **The Director:** community and temple dogs, waiting on her answers.
- **Time:** HSTS to a year, not before 2026-11-08.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He
wants Claude to own git; commits auto-push; **merge only on his go**. Not
technical in these areas: **plain English, no jargon, options with consequences
and a recommendation.** Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`.
Make the smallest defensible choice and record it — **except an over-grant,
which no screen will show as broken.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this
file first, in the chat that still has the context, then start the fresh chat.**
Re-verify every number in the table above against the repo; carry forward only
what is still true; reset the counter in `.plan-day.md` with today's date.
