---
name: plan-day
description: Plan the backlog as three sequential batches of three workstreams, then set up one batch at a time — sync main, read the backlog, order nine items, create the current batch's worktrees, and remember the plan so the next run resumes instead of re-planning. Use when the user asks to plan the day, pick workstreams, start or set up the next batch, or "what should we work on".
---

# Plan the day's workstreams

You are the integrator. The user opens one Claude session per workstream;
your job is to order the backlog into batches that can be built without
colliding, and to set up one batch at a time so each session can start
with "go". Paths below are absolute because this skill runs from any
checkout.

**Nine items, three batches of three, built in order.** The user works in
chunks of three and averages 6–9 backlog items per release, so a full
plan is roughly one release. Planning all nine up front means one
planning conversation per release instead of one per batch — but only one
batch's worktrees exist at a time.

## 0. Resume, or plan from scratch?

Look for `C:\Development\Animal_Shelter_App\.plan-day.md`.

**If it exists and has a batch not yet set up, this is a resume — do not
re-plan.** Still do step 1 (`main` moves between batches; that is the
point), then:

1. Check the current batch has actually landed. If streams from it are
   still open, name them and ask before setting up the next one —
   silently running six live worktrees defeats the cap.
2. Re-check the next batch against the backlog as it is *now*: are its
   items still open, still unblocked, still non-overlapping? Has
   something merged since that collides? Is the migration slot free?
3. Report what changed, if anything, then go to step 7 and set that
   batch up.

Re-plan from scratch when the user asks for one, when the saved plan's
items are all closed, or when the plan is from an earlier day and the
backlog has moved under it. Otherwise resume.

## 1. Sync `main` (the daily step in CLAUDE.md "The main checkout")

In `C:\Development\Animal_Shelter_App`: it must be on `main` and clean.
If it is on a `claude/*` branch or dirty, **stop and report** what is
there — the user decides whether to commit, stash or move it into a
worktree — then continue once it is clean. Then:

```
git -C C:\Development\Animal_Shelter_App checkout main
git -C C:\Development\Animal_Shelter_App pull
git -C C:\Development\Animal_Shelter_App merge backlog
git -C C:\Development\Animal_Shelter_App push
git -C C:\Development\Animal_Shelter_Backlog merge --ff-only main
git -C C:\Development\Animal_Shelter_Backlog push
```

(The post-merge hook pushes both merges too; the explicit pushes cost
nothing and do not depend on `core.hooksPath` being set.)

## 2. What is already in flight

`node C:\Development\Animal_Shelter_App\scripts\worktree.mjs list`.
Live `claude/*` worktrees count toward the cap of three **for the current
batch**. Flag any that show "nothing beyond main" with no PR open as
leftovers to `done` — but only if `held` says `free`. A `HELD` worktree
has a session or a process in it; name it and ask rather than tearing it
down. List any husks it prints so the user can clear them.

## 3. Read the backlog

`C:\Development\Animal_Shelter_App\docs\backlog.md`, open items only
(`- [ ]` above `## Completed`). Section order and item order are the
user's priority; keep that as the default ordering. For each candidate
note:

- **Who does it** — Claude-buildable, or user-driven (physical setup like
  the Pi, dashboard clicking, a guided walkthrough, "decide with the
  user" as the main content). User-driven items are reminders, not
  streams.
- **Dated / blocked** — "from ~2026-09-28", waiting on an account, a
  prerequisite item still open.
- **Area** — the routes, directories and tables it touches, from the
  file references in the item. This is what decides overlap.
- **Schema** — does it need a migration? Then it is a schema PR first
  and a feature branch after (CLAUDE.md "Database migrations").
- **Depends on** — does it read a column, or reuse a component, that
  another candidate creates? That fixes which batch it can go in.
- **Size** — a quick win, a day, or more.

## 4. Choose — nine items, in three batches

Rules, in order:

1. **Backlog priority is the default order across all nine.** Depart
   from it only for the reasons below, and say so when you do.
2. **Disjoint within a batch; overlap across batches is fine.** Batches
   run one after another, so two items that both add nav entries, both
   rework the same topic in `src/lib/manual/en.ts`, or both touch the
   same hub tab are no longer mutually exclusive — put them in
   *different batches*. This is what makes nine items plannable where
   three were a squeeze. Inside one batch the old rule still holds: two
   streams that collide are one stream, not two.
3. **At most one migration-carrying stream per batch** (CLAUDE.md's
   one-in-flight rule, applied per batch because batches are
   sequential). If two items in one batch need schema, either fold them
   into a single schema PR or move one to the next batch.
4. **Schema-first items span adjacent batches** — the schema PR in batch
   N, its feature branch in batch N+1, never the same batch. The feature
   needs the migration on `main` and applied to dev first.
5. **Dependencies flow forwards.** An item that reads another's column or
   reuses its component goes in a later batch.
6. **Mix sizes within each batch** — one quick win per batch keeps the
   merge train moving and gives the user something to review early.
7. **Nine is a target, not a quota.** If the backlog does not hold nine
   Claude-buildable, unblocked items, plan fewer and say why. Padding
   the list with user-driven items to reach nine is the failure mode to
   avoid — those stay reminders in **Not today**.

When the third batch is planned, note that cutting a release is the
natural step once it merges.

## 5. Present

Three tables, one per batch, each with `#`, feature slug (`kebab-case`,
becomes `claude/<slug>` and `Animal_Shelter_<slug>`), the backlog item's
bold title, area, migration yes/no, and one line on why now. Give each
batch a line saying what makes it a batch — what its three share, what it
unblocks for the next one, which dependency fixed the order.

Below the tables: **Not today** — user-driven items that are due or close
(one line each), and anything blocked with the reason.

Then **one** `AskUserQuestion`: multi-select over **batch 1's** streams to
confirm or swap, since those are the ones about to be created. Say in the
question that batches 2 and 3 are saved and can still change. Do not ask
a question per batch — the whole plan is visible above it.

## 6. Save the plan

Write `C:\Development\Animal_Shelter_App\.plan-day.md` (gitignored, and
it must stay that way — it is local day-scoped state, not a repo
artifact). Markdown, readable: the user may well open it.

It holds the date planned, and per batch a status (`pending` /
`set up <when>` / `merged`) and its three items with slug, bold title,
area, migration flag and the one-line why. Record any dependency that
fixed the ordering, so a later run does not have to re-derive it.

Keep the statuses current: mark a batch when you set it up, and mark it
merged on a later run once its PRs are in.

## 7. Set up — the current batch only

For each confirmed stream in that batch, in sequence (each `npm ci`
takes a minute):

1. `node C:\Development\Animal_Shelter_App\scripts\worktree.mjs new <slug>`
2. Write `C:\Development\Animal_Shelter_<slug>\.brief.md` (gitignored):
   the backlog item verbatim as the task, the branch name, the port, and
   for a schema-first item which half this stream is. Keep it to what a
   fresh session needs; CLAUDE.md covers the rest.

**Do not create all nine worktrees.** CLAUDE.md caps live worktrees at
two or three — more than that and merging becomes the bottleneck — and
nine folders would each cost an `npm ci` and go stale before their turn.

On a resume, re-read the backlog item **fresh** when writing the brief.
It may have been reworded or reprioritised on the `backlog` branch since
the plan was saved: the saved plan holds the ordering, the backlog holds
the task.

## 8. Finish

One line per stream: folder, port, and that the session should be opened
on that folder — its first move is to read `.brief.md`. Then one line
saying that once these have merged, running `/plan-day` again sets up the
next batch without re-planning.
