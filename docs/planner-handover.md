# Planner handover — edition `456`, 2026-10-28

**A delta, twenty-third edition in this shape. Nine streams.** `447` covered the round whose subject
was *the record was right and the thing itself was not*. **This round is the cost of that fault landing
on a person: SIX times in one afternoon Lutan was asked for something he had already settled or that
was already done**, and he said what it was doing to him:

> *"it is wearing me down having to continually answer the same questions."*

**That sentence is this edition's subject. Everything below is either an instance of it or a guard
against it.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `447` → this. **The next slug is `465`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.** This edition names no figure you
> could get from a command.

---

## THE ONE THING TO READ: THE BACKLOG ASKS, AND THE PLANNER RELAYS WITHOUT CHECKING

All six have the same mechanism. **A note was true when it was written and false later. Nobody
re-read it against the live system, so it was relayed to him as a live question.** He cannot tell a
question nobody recorded from a question nobody asked — they look identical from his side.

1. **The status alert.** Put to him as *apply `0226`, then deploy the Worker*. **Done since 20 October**
   — the release record for that day says in its own words that it applied the migration, deployed the
   Worker and shipped the note *"The status test alert now works"*, which the truth rule only permits
   once the step is closed. His reply: *"I'm sure is done, this one is yet another one that keeps
   coming back as outstanding."*
2. **BitLocker.** *"you showed me how to do this already and we confirmed it was on."* It was on the
   list in **two** items, so fixing one would have left the other to ask again.
3. **The vet's cards**, put to him as a *role* question after he had ruled on that three times:
   *"we are back on doctor roles. Why are we back talking about roles yet again."*
4. **The 1 TB drive**, offered as a choice between two jobs when the first was **already built** and he
   wanted both.
5. **Leaked-password protection**, asked for when it is **Pro-only** and this project runs on a hard
   zero-ongoing-cost rule — so it was never something he could say yes to.
6. **The auth sender**, with directions to *Authentication → SMTP settings* — **a panel he does not
   use**, so it was empty and he had to find the real screen himself.

**THE GUARD, AND IT IS MEASURED: TWO COMMANDS SETTLED THREE OF THESE IN UNDER A MINUTE.**
`node scripts/apply-migrations.mjs --status --env production` (280 applied, 0 pending — so `0226` and
`0261` were both live) and reading `docs/releases/<date>.md` for the release that closed the step.
**Before any item reaches him, run the one command that would settle it.** The planner is the only
role that can read production; leaving that unrun and relaying the question instead is the whole fault.

**And its corollary, which is the half that costs him most: a question generated FROM A DOCUMENT is
not a question from the system.** Items 5 and 6 above were never answerable — one asked for a paid
feature, the other named an empty screen. **Nothing in the repo would have caught either. Reading the
item as a claim about the world, rather than as an instruction, would have.**

## WHAT TO DO WITH A NOTE ONCE YOU HAVE CHECKED IT

Every one of the six is now recorded with **his words, what closed it, and why it read open** — and
three carry an explicit *do not ask again*. **That last clause is the only part that stops recurrence**,
because the next planner reads the item, not this document.

**Write the reason it read open, not just the answer.** *"BitLocker: confirmed"* would have been ticked
and forgotten; *"confirmed 2026-10-28, and he had confirmed it once before — closed, do not re-ask"*
tells the next reader that the board itself was the fault.

## WHAT `447` ASKED FOR, and what each warning did

- **"RE-READ THE ARTIFACT, NOT THE NOTE ABOUT IT." FIRED FOUR TIMES, and it was the planner breaking
  it in three of them** — the six above are that warning, aimed at a person instead of a file. **Where
  it was obeyed it paid immediately:** his resident-download ruling was checked against
  `src/app/residents/export/route.ts` rather than the fault log's description of it, and the answer was
  that **nothing needed building**. One file read turned a feature into a record.
- **"All analysis by CARD, never by role." FIRED AGAIN, a fourth telling.** The planner relayed an
  item's role-shaped framing instead of restating it. **The new sub-rule: an item written role-first
  will make you break the rule by quoting it.** Restate it card-shaped before you act on it — the vet
  item is now *"nine activities carried by no card sized for them"*, and in that shape there was no
  decision for him at all.
- **The count correction, which is small and embarrassing and worth recording.** He was told the round
  stood at **ten** streams and that this handover was overdue. **It was seven.** One `gh pr list`
  settled it. The day had been busy with answers, production reads and a driven check — **none of which
  is a workstream. Count from the PR list before quoting the counter.**

## WHAT WENT RIGHT, AND IS WORTH COPYING

- **The usage-comment mechanism fired on its first real batch, 3 of 3** (shipped by #1051 that morning).
  **Auto-archive on PR close was switched on the same day**, and every session was archived within
  moments of merging, so `get_usage` was `unavailable` for all three: **the comment is now the only
  record, which was the point.** Two gave figures, both inside band.
- **The one gap is the mechanism's real cost, not a failure of it.** One stream posted
  `tokens=unmeasured` — **honest, and the rule asks for exactly that over a guess** — but with the
  session archived the figure is **permanently lost**, where before auto-archive it could have been
  read afterwards. **Batch 3's briefs now say: retry once, and say in the comment what failed, so a gap
  is explained rather than blank. That is a hypothesis — check next round whether it fired.**
- **Driving a question beats arguing it.** Whether the `dashboard` card opens `/management/cashflow`
  was settled by signing in with that card alone and watching it land on `/no-access`, with the
  dashboard page itself as the control. **Both halves matter: a refusal with no control proves nothing.**

## THE TRAP THAT COST THE MOST TECHNICALLY: A DEFAULT IS A FIELD, NOT AN OMISSION

`requirePermission(activity)` **defaults its level to `"edit"`** (`src/lib/permissions/require.ts`).
The planner read the cashflow route and page asking the activity *"with no level"* and **inferred
read** — then wrote that inference onto a backlog item as a finding, concluding a card already existed.
Driving it proved the opposite.

**Inferring a value from the absence of an argument is the same fault as quoting a check without
reading its query.** Open the function and read the default. **It also changes what gets built:** three
new cards would have shipped granting *read* against guards demanding *edit*, i.e. **three cards that
open nothing** — the one state `CLAUDE.md` says a card must never be in.

## TWO THINGS THE STREAMS DID THAT THE PLANNER HAD TO CLEAN UP

- **Two of three streams in one batch never edited `docs/backlog.md`**, so their work was invisible and
  both items' titles still described it as outstanding. **This is the fault shape promoted into the
  skill's step 3 that same morning, recurring the same day.** Briefs should name the item to annotate
  and say that annotating is part of finishing.
- **`CLAUDE.md` documents `dev-signin.mjs <role> --cards <card>`; the script refuses it.** The correct
  form is **`--cards` alone**, which builds a throwaway role holding exactly those cards — safer as well
  as correct, since the documented form would have re-keyed a shared role and could have signed a
  running stream out. Filed as a quick win; **the script is right and must not be changed.**

## ONE FINDING ABOUT SIZING, FROM CARD REVIEW 2

`check-menu-coverage` reported **17 pages no card opens**. Thirteen were `/admin/*`, outside the card
system by his settled ruling — and he then answered that **three of the remaining four are Admin tasks
too**. So **sixteen times in seventeen, *"no card opens this page"* meant *"and none should."***

**A page nothing opens is a question about who the page is for, not evidence of a missing card.** The
obvious reading of that check is a backlog of cards to create, and it was not. **Do not size a future
review as though every such page implies a card** — and note that what settled three of them was
telling him what a page *is*. He asked what URL the stock-usage card would point at, was told the page
is reachable only by typing its address, and answered *Admin*. **One line of fact beat a schema PR.**

## STATE, RE-READ EVERY TIME

Nothing in this section may be quoted from here. **Re-read it:** open items and their titles from
`docs/backlog.md`; batches, bands and actuals from `.plan-day.md`; release state from
`apply-migrations.mjs --status --env production`; what merged from `gh pr list`.

**What is with Lutan as of this writing** — and it is short, which is the point: the 60-day Supabase
session timeout and the Cloudflare WAF glance; the Translations card assignment; the duplicate-resident
corrections and the six deceased PDFs on production; the Pi drive work; the NFC card check on two
phones; and the Director's long list, of which **the nameservers at sav.com block the most**.
**Leaked-password protection is NOT on that list and must never return to it.**
