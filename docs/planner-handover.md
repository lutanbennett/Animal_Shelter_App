# Planner handover — edition `303`, 2026-10-22

**A delta, sixth edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `312`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `294` asked for, and what happened

- **"Check for an open `planner-handover-*` PR first." HELD** — checked, none. Keep it.
- **"Capture the actuals the moment a batch merges." HELD, seventh round.** Six of six measured.
- **"You do not control the dial." FAILED IN A NEW WAY — and this one is the planner's.** `294`'s
  nine ran exactly as recommended; `285`'s nine were all overridden. **This round the dial was not
  read at all**, for any of six streams: every session reported `isRunning: false` by the time
  `/plan-day` next ran, and `get_session` was never called while one was live. Not an override, not a
  surprise — **an unmeasured round.** The fix is sequencing, not willpower: **read the dial in the
  same breath as the token figure, while the session is still live.** Two rounds of readings have now
  been lost this way or to overrides, so there is still no model finding worth the name.
- **The STEP ZERO block: HELD.** Nothing already-built was offered, second round running.
- **The `rm`-then-write trap: HELD for an eighth edition.** `cat <scratch> > .plan-day.md` worked
  three times today.
- **"The sign-in gap, arguably first." FIRED AND CLOSED.** #843 shipped `scripts/dev-signin.mjs` —
  a disposable login per role, no password, no Redirect URL. **Two streams then drove real screens
  and both landed in the top half of their bands** (`bills-icon-library`, 174,293 of 140–180k;
  `calendar-button-and-env-guard`, 205,931 of 180–230k). **So the +30k browser allowance is restored
  and is the right size.** It is one round old: check it again before calling it settled.
- **The audit section can now be one line.** #842 gave the job a timeout and a retry, and an
  inconclusive run no longer reads as red. **Lutan was not asked about `audit` once in nine streams**,
  after five times in five minutes the day before. The brief block fired.
- **The importer question: CLOSED.** He answered it; #842 deleted `import-appsheet.mjs`.
- **"The board is thin, and the next round should say so." HALF WRONG, and worth correcting.** It was
  thin. Then one bad morning on one feature produced **four schedulable items before lunch**, and the
  round ran a full nine. **An incident refills the board faster than any amount of grooming** — so
  "thin" is a statement about today, not a forecast.

## The round: nine of nine inside or under band

Six measured, six inside or under; three still running. Figures, bands and the per-stream table are
in `.plan-day.md`. **The cards programme is one stream from done:** `0247` is merged and applied, and
`menu-removal` — the last piece, part (3) — is set up.

---

## THE DEFINING FINDING: the planner asserted three things it had not verified, in one morning, about production

**All three are now rules in the skill (step 7), so this edition states only what happened.** Lutan's
words at the time were *"This is really bad"* and *"This is a complete disaster"*, and in two of the
three cases he was right.

1. **A delete script checked the wrong field and I called the result safe.** Four orphan events were
   deleted from the production calendar after a guard that read `extendedProperties.visitId`. **The
   poll matches on `clinic_visits.calendar_event_id`** — an older event carries no `visitId` and is
   still tracked. I had told him "nothing will be cancelled, nobody will be emailed". Minutes later a
   cancellation email arrived. **Verify against the field the code actually reads, and quote the
   line you read it from.**
2. **"Verified identical" was carried forward after it had been overtaken.** The test and production
   calendar ids matched when I compared them and differed forty minutes later, because a stream had
   separated them in between — exactly as asked. Nothing was wrong with the check; what was wrong was
   restating its result as a present fact. **An env comparison is a measurement with a timestamp.**
3. **Reassurance without the caveat that mattered.** He was told the calendar was safe to work in,
   and not told that nothing appears in it for up to fifteen minutes. He added six appointments, saw
   none of them, and reported the feature as broken. It was not broken; the sweep had not run.
   **When you say a feature works, say what its visible latency is.**

**What this cost, and what it bought.** It cost most of a morning and a good deal of trust. It bought
four items and a repair stream that shipped the same day — and the one genuine fault underneath it all
was found only because he kept pushing: **booking does not reach the calendar instantly although the
code awaits the sync**, with `calendar_error` **null** on all six, which is the signature of
`calendarConfigured()` returning false in the runtime that served the page.

**The cause of that one is still open and it is not Claude's to close:** whether the app process on
the Pi holds the four calendar values. `ssh` to read the env file's **names** is refused as a
production read. The command is in #847 for Lutan.

## The calendar incident, in three lines

Measurements and the fix list are on the backlog item at the top of *Next up*, and in
`docs/decisions/2026-10-22-calendar-event-environment-tag.md`.

- **The duplicates were the "Add to Google Calendar" button**, one orphan per press — not the sync,
  which had duplicated nothing. The button is gone.
- **Deleting an event cancelled visits across environments** — six on dev, one on production, in one
  morning. Events now carry an `env` tag the poll checks, the cancellation mail names its system, and
  **event ids are ours**, so a sync-made duplicate is impossible by construction.
- **"No error" used to mean both "all well" and "the calendar is not switched on here."** It no longer
  does: a visit says on screen whether it reached the calendar.

## The mirror fault nearly fired again — and the catch is worth copying

**Every measurement above lived only in the chat for about an hour.** The backlog meanwhile grew an
item saying the duplicate cause was *"not yet confirmed"*, with four candidate causes, two of which I
had already ruled out. A stream reading that item would have re-diagnosed a settled bug. **The item
was rewritten with the evidence, the guesses marked `SUPERSEDED` in place, and the whole thing
re-pointed at the button item** — before any stream was briefed.

So, as a habit: **when an incident ends, the backlog is where the findings go, in the same session.**
A diagnosis held only in a conversation is a diagnosis that will be paid for twice.

## Where things stand — re-read 2026-10-22, not carried

| | |
|---|---|
| `main` | past #845–#847 |
| `backlog` | in sync |
| Next free migration | `0248` (`0247` merged **and applied to dev**) |
| Open backlog items | 72 |
| Open PRs | none at batch 3 setup |
| Menu-coverage gate | **zero orphans**; `menu-removal` is the last piece and is running |
| Release | `0.39.1` shipped; **`0.40.0` not cut** |
| Leftover worktrees | six idle, plus `handover-ceiling-target` (detached) and two husks |
| Workstreams since handover | **9** — three batches of three |

## For the release manager

- **`0.40.0` is the natural cut once batch 3 merges.** It will carry the calendar repair, the
  environment tag, the icon-library fix, the `show_menu` column, and — if it lands — the left-hand
  menu going away for every login but Admin, which is **visible to every non-Admin user.**
- **Two things in it were user-visible failures today**, so their notes should read as fixes, not
  features: the duplicate calendar entries and the iPhone date picker (if that stream lands).
- **Do not tick the release-note line for the instant-booking fix** while the Pi question is open —
  the on-screen latency line shipped, the cause did not.

## Rulings worth not re-deriving — cited, not summarised

- **A card walkthrough comes before the role walkthrough** — Lutan, 2026-10-22: *"then I can set the
  roles with confidence that each card works."* **Stage 1 is a programme, not a stream:** generating
  the script from `CARDS` is one bounded stream; *running* it is dozens of live interactions per card
  and must be split by card group. `.plan-day.md` has the reasoning.
- **Test and production never share a calendar id** — 2026-10-22, with its own decision file.
- **The deterministic event id was his call and he took it**, as hardening, after being told plainly
  that the create race was *not* that morning's cause.
- **`test-plan` is ADVISORY permanently.** Do not raise it; do not list it as a decision he owes.

## Next round's candidates

The next chat plans; this is only where the board points. **`.plan-day.md` carries the reasoning.**

1. **`docs/card-walkthrough.md`, generated from the card catalogue**, with a check that fails when a
   card has no steps. Then the running, split by card group.
2. **`0.40.0`**, once batch 3 is in.
3. **The Pi env answer**, which is one line from Lutan and closes the last calendar fault.
4. **Raise HSTS to a year** — one line, **not before 2026-11-08**.
5. **Whatever batch 3's three streams file.** Two of them are in the areas that produced today's
   incident, so expect findings rather than silence.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup. Branch, worktree, test
plan, PR, then **merge it yourself on green CI** — never a gate. This one is
`claude/planner-handover-303`, after #838 (`294`) and #823.

**What could go next time:** the sign-in and audit paragraphs shrink to nothing once a second round
confirms them, and the dial paragraph should finally be replaced by **one line saying the dial was
read at capture time** — which is the only thing that will retire it.
