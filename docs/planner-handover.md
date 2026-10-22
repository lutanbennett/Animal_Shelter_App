# Planner handover — edition `294`, 2026-10-22

**A delta, fifth edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `303`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `285` asked for, and what happened

- **"Check for an open `planner-handover-*` PR first." HELD** — checked, none. Keep it.
- **"Capture the actuals the moment a batch merges." HELD, sixth round.** Nine of nine measured;
  `get_usage` again answered for sessions with `isRunning: false`.
- **"Brief the stream to run the allow-listed read-only script." FIRED twice** —
  `menu-orphans-close-all` ran `check-menu-coverage.mjs` before and after, and `production-rehearsal`
  wrote `check-schema-drift.mjs` and ran it. Keep doing it.
- **The `rm`-then-write trap: HELD for a seventh edition.** But the **CRLF half fired in a new
  place** — resolving a conflict in `src/lib/releases.ts`, not in a handover. **It is not a handover
  trap, it is a Windows trap:** normalise before matching anything in this repo.
- **The STEP ZERO block: FIRED, and nothing already-built was offered this round.** `285`'s defining
  failure did not repeat.
- **"You do not control the dial." COLLAPSED THE OTHER WAY.** All nine streams ran **exactly** the
  recommended `claude-sonnet-5-5` / `low`, after `285`'s nine were all overridden. **Still read
  `get_session`; still no model finding** — nothing varied, so nothing was compared. The rule stands
  because it is about not *assuming*, not about which way it goes.

## The round: nine of nine inside or under band, none over

**Four under, five inside. The best spread recorded**, beating `285`'s six-inside/two-under/one-over.
Figures and bands in `.plan-day.md`.

**And the gate the cards programme existed for is at ZERO.** `check-menu-coverage.mjs` read 66 on
20 October, 15 yesterday and **"No unexplained orphans"** today. `menu-removal` is buildable.

---

## THE DEFINING FINDING: a mitigation you wrote is a HYPOTHESIS — check whether it fired

**Now a rule in the skill (step 8), so it is stated here only as what happened.**
`purchasing-to-buy-first` could not sign in to dev, so its browser check fell to Lutan. The planner
called it a briefing gap, **wrote a sign-in block into the next batch's briefs, and recorded it as
solved.** `who-does-what-add-group` carried that block and **failed identically** — sixteen checks
marked *"not driven in a browser (no signed-in session)"*. It is structural.

**Two consequences that outlive the round:** **two merged PRs fixed UI faults nobody has seen work on
a screen** — a result message rendering out of view, a button failing after the tap, a shopping list
moved up a page, each the main claim of its PR — and **the +30k browser allowance is suspended** in
the skill until signing in works. Filed as an item naming the three PRs with checks outstanding.

**`285`'s habit of listing each warning as *fired, held or closed* is what caught this in one round
instead of three.** Do it for your own mitigations, not only the previous edition's.

## THE SECOND FINDING: if a stream meets a rule before reading it, it belongs in the BRIEF

**Also now a rule in the skill (step 8), with a ready-made brief block.** **Lutan was asked about a
failed `audit` check five times in five minutes across three streams.** Every stream's advice —
ignore it — was **correct**, and `CLAUDE.md` documents the red-`audit` rule at length. The briefs
did not repeat it.

**Underneath it, a fault nobody had looked at.** The job was **not reporting a vulnerability at
all**: on #836 `npm audit` ran five minutes and was terminated as an orphan process with no advisory
output, while the same job passes in **ten seconds** elsewhere and the same command locally returns
**0 vulnerabilities**. **A check that cannot tell "nothing found" from "could not reach the registry"
trains everyone to ignore it** — which is how a real advisory gets missed. Filed, with the standing
prohibitions intact.

## The mirror fault fired THREE times in two days

Real findings living only in a decision file or a test plan, where nothing can schedule or tick them:
**`production-rehearsal`'s two blockers**, **the sign-in gap**, **the audit hang**. One of them — the
migration runner refusing the full history, which made the domain cutover's own step 2 false —
**became batch 2's third stream and shipped the same day**.

**So read every merged stream's decision file AND test plan for findings, every round.** It is one
`head -50` and one `grep` per PR, and this round it produced **five schedulable items**.

## The hub lesson fired again, in a form `285` did not predict

`285` said to ask whether an orphan count is leaves or doorways. **This round the same cascade had
already invalidated four items' counts**, and nobody had re-measured: the 66 rows were from
20 October, the real figure was **15 behind only six pages**, and **report 4 of 6 was empty** — all
eight of its pages already reachable, so it closed on the measurement with no report written.
Reports 5 and 6 shrank to one page each and Lutan ruled all six at once instead.

**Re-run the gate script before quoting any count from an item.** One command. It turned four
reports and a six-way split into one ruling and one stream.

---

## And the brief block had gone stale against the checklist it exists to help pass

Found while filling **this** handover's own test plan. The brief's test-plan block told streams to
tick the CI line in a follow-up commit; **the template changed on 2026-10-20 to forbid that**,
because a new HEAD means a new run, so the tick **invalidates its own evidence** and every PR paid
**two CI cycles** to transcribe what GitHub already records. **Corrected in the skill**, along with
the general rule: **when a brief quotes a checklist, the checklist is the authority** — nothing tells
you when a quoted rule goes stale, so check it against `docs/test-plan-template.md` when you write a
brief.

## Where things stand — re-read 2026-10-22, not carried

| | |
|---|---|
| `main` | `f0eb067f` |
| `backlog` | in sync |
| Next free migration | `0247` |
| Open backlog items | 71 |
| Open PRs | **#831** only — conflicted on `releases.ts`, resolved and gates-clean, CI running |
| Menu-coverage gate | **ZERO. "No unexplained orphans."** `menu-removal` is buildable |
| Release | `0.39.0` shipped; **`0.40.0` not cut, `unreleased` carries FIVE notes** (counted in the file, not inferred) |
| Leftover worktrees | the round's nine, mostly `HELD` by their sessions — **ask, do not tear down** |
| Workstreams since handover | **10** — three batches of three, plus one unplanned stream that shipped a PR |

**The round's ten:** #828–#830, #832–#834, #835–#837, and #831.

## For the release manager

- **`unreleased` has five notes**, all merged: the home-screen tiles, the Who does what group fix,
  the vet calendar going live on production (#831), the Purchasing reorder, and the Diets recipe
  book. **Three carry `roles` tags and two are plain strings** — the two plain ones are shown to
  every live role, which is the thing the new audience question in the template exists to catch.
- **Two of those notes describe UI fixes nobody has verified on a screen** (see the defining
  finding). **Worth knowing before the cut**, not a reason to hold it.
- **The menu gate is at zero**, so `menu-removal` may land before the cut. It is a visible change for
  every login but Admin.

## Rulings worth not re-deriving — cited, not summarised

- **The last six orphan pages each get a card, none widened** — Lutan, 2026-10-21, asked with the
  re-measured six in front of him. Orphans 2, 3, 5 and 6 had nothing left to decide, and **reports 5
  and 6 were never written because he ruled directly. Do not re-offer them.**
- **A role group's Thai name is optional** — Lutan, 2026-10-21. `0246` made the column nullable but
  **a blank string is still refused**, so the app stores `NULL`.
- **Swapping a go-live blocker into a planned batch is his call and he takes it** — he displaced the
  tooling stream for the cutover fix as soon as it was explained.

## Next round's candidates

The next chat plans; this is only where the board points. **`.plan-day.md` carries the reasoning.**

1. **The sign-in gap — arguably first**, because it blocks verification on every UI PR and two have
   already merged unverified.
2. **`menu-removal`**, then **`0.40.0`**. The end of the cards programme.
3. **The importer question** — a deletion or a stream, on one line from Lutan: AppSheet was retired
   on 2026-10-09, so the cutover's "fresh export" may have nothing to export from.
4. **`role-walkthrough-cards`** — deliberately held back so it is written after the cards settled.
   They have now settled.
5. **Raise HSTS to a year** — one line, **not before 2026-11-08**.
6. **THE BOARD IS THIN AND THE NEXT ROUND SHOULD SAY SO.** Of 71 open items, most of the remainder
   waits on Lutan's consoles, the Pi, or the Director. **Nine is a target, not a quota** — plan fewer
   and say why rather than padding with user-driven reminders.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup, and an unplanned stream
that shipped a PR counts and is named. Branch, worktree, test plan, PR, then **merge it yourself on
green CI** — never a gate. This one is `claude/planner-handover-294`, after #823 (`285`) and #813.

**What could go next time:** the audit and sign-in sections shrink to a line once their items ship,
and the dial paragraph can finally go — two rounds of evidence that the planner should record the
setting and stop theorising about it is enough.
