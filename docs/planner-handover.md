# Planner handover — edition `465`, 2026-10-29

**A delta, twenty-fourth edition in this shape. Nine streams** — six merged (#1060–#1065), three set
up and live, because a batch counts once at setup. `456`'s subject was *the cost of a stale note
landing on a person*. **This round every cost that reached Lutan started with the planner**: the
question he had to answer twice, the files that downloaded onto his machine, the wrong statement about
his own firewall. No stream caused any of them.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `456` → this. **The next slug is `474`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: `456` NAMED THE FAULT, AND THEN CARRIED AN INSTANCE OF IT

`456`'s closing list said what was with Lutan, and the first thing on it was **the 60-day Supabase
session timeout**. Two paragraphs earlier the same document said leaked-password protection *"is NOT
on that list and must never return to it"*, because it is **Pro-only** and this project runs on a hard
zero-ongoing-cost rule — **so it was never a question he could answer.**

**The session timeout is the same feature of the same paid tier.** It had already been settled on
2026-10-07 (both projects returned `402 User sessions can only be configured on Pro Plans and up`; he
declined Pro), and that ruling **was** on the board — recorded on the item that carried it, which was
then **ticked**. The live item still listed the timeout as to-do, so he answered it again himself:

> *"Supabase user sessions are only available in pro plan, we will not be doing this."*

**The mechanism is one step past `456`'s.** There the note was stale. Here the answer was *on the
board and correct*, on a closed item, while the open item asked the question — and **nobody re-reads a
ticked item.** Writing *do not ask again* on the item that is about to be ticked puts the guard
somewhere it will not be read.

**THE GUARD, AND IT IS WHY THIS PR CARRIES A FILE:** a ruling that closes a *class* of future asks —
a paid tier declined, a feature dropped rather than deferred — **goes in `docs/decisions/`, not only on
a backlog item.** `docs/decisions/2026-10-29-pro-only-features-are-dropped.md` now holds both, by name,
with his words. A decision file is read by `ls docs/decisions/ | grep -i <subject>`, which the skill
already tells every planner to run; a ticked backlog item is read by nobody.

## THE COST THAT LANDED ON HIS MACHINE, AND IT WAS THE PLANNER'S OWN TOOL

A recursive search was pointed at `C:/Users/Leidos/OneDrive/Desktop/` to find a deliverable. **Every
cloud-only file in that folder began downloading**, because reading a OneDrive placeholder hydrates it.
He had to report it **twice** — the first stop killed the shell and not the child process, so from his
side it looked like it was ignoring him:

> *"Grep won't stop, it keeps coming back kicking off downloads."*

**THE RULE: SEARCH ONLY INSIDE THE CHECKOUTS.** `C:\Development\*` is the whole permitted surface for
any recursive read. His Desktop, OneDrive, and anything under `C:\Users\` are **write-only
destinations** — `CLAUDE.md` says to put deliverables there, and that is all it says. **To find a file
you put there, list the one folder; never walk the tree.**

**And the second half, which is general:** stopping a shell is not stopping what it started. **Confirm
by looking for the process**, not by seeing the tool call end.

## WHAT `456` ASKED FOR, and what each warning did

- **"Run the one command that would settle it before any item reaches him." HELD, and it is now the
  planner's cheapest habit** — but note what it cannot reach. It settled nothing about the Supabase
  item, because the answer was not in the live system; it was in a *closed item*. **Extend it: the one
  command is sometimes `git grep` over the backlog's own history, not a read of production.**
- **"A question generated FROM A DOCUMENT is not a question from the system." FIRED, as the subject
  above.** A third instance in two rounds.
- **"All analysis by CARD, never by role." HELD this round**, for the first time with no instance — all
  three batch-3 briefs are card-shaped and the vet item stayed restated. **Do not read that as closed:**
  it has fired in four of the last five rounds.
- **"Count from the PR list before quoting the counter." HELD.** Six merged, three live, counter nine;
  the two PRs that merged mid-round before `456` (#1058, #1059) were **not** double-counted.
- **"Re-read the TITLE of every item a stream touched." FIRED AGAIN, and in a new shape.** Batch 2 left
  two faults the planner had to fix: a title describing work that had shipped, and — the new one — **a
  real gap recorded only as a sub-note inside a decision file's *Found, not fixed* section.** #1063
  retired six harnesses honestly and wrote that no per-card photo-table check now exists. **An honest
  sub-note is still invisible and still un-tickable.** It is now its own item. **Briefs should say: a
  gap you record in a decision file must also be filed as an item.**

## THE BATCH RE-CHECK EARNED ITSELF THIS ROUND — DO NOT EVER SKIP IT

Batch 2 was saved on 2026-10-28 and set up on 2026-10-29, and **two of its three premises had moved
overnight.** One stream was **largely void**: it existed to author walkthrough steps for four
`/management` pages, and his six answers that afternoon made three of the four **Admin tasks**, which
no card will ever open; the fourth had been authored by the migration that merged mid-round. **A stream
briefed from the saved plan would have spent a full session writing steps for pages that cannot have
them.** Batch 3's re-check, by contrast, found nothing moved — which is what makes the first one worth
its minutes rather than theatre.

## TWO BAND CORRECTIONS, BOTH NOW CONFIRMED TWICE. THE SKILL'S TABLE IS WRONG ABOUT ONE OF THEM

- **A re-pass after NARROW migrations costs the FIRST-PASS rate (`~98k + ~6.3k/step`), not the
  reconciliation rate (`~11k`).** Two rounds agreeing: `card-repass-manage-medical` landed at 6.0k a
  step above the floor, and `card-repass-medical-two`, banded deliberately on that reading, landed
  **inside**. The reconciliation rate was measured on a pass that also had to **adjudicate disputed
  findings** — that is what costs, not the second visit. **The skill still prescribes 11k. Correct it.**
- **A restate-or-retire batch is an AUDIT (145–190k), not a repair campaign.**
  `harness-restate-permission-checks` was banded at the triage rate and came in **28% under**, because
  **six of its eight were retired and only two restated**, and retiring costs almost nothing once the
  reasoning is done. **Ask before banding a harness batch: how many of these will survive?** If the
  honest answer is *delete most of them with reasons*, it is a report.

## THE USAGE COMMENT IS A SETTLED MECHANISM. STOP TREATING IT AS A HYPOTHESIS

**Six of six this round, eight of eight since it shipped**, every figure read from the stream's own PR
comment, every one `compacted=no rescoped=no finished=yes`, and all six checked against the artifacts
rather than the comment before being allowed near a band. Auto-archive on merge no longer costs a
figure. **`get_usage` is the fallback only.** The retry mitigation never needed to fire; **closed.**

## WHAT WENT RIGHT, AND IS WORTH COPYING

- **Correcting myself to him, in his favour, in one sentence.** He was told his Cloudflare managed
  attack rules were missing and unavailable on the free plan. **They are on** — every section reads
  *"Cloudflare managed ruleset — Always active"*; what is paid is *customising* them. Said plainly, not
  apologised over, and he was better off than he had been told.
- **An honest *not established* beat a plausible answer.** Leaked-credentials detection is free, and
  whether it can read a Next.js **server-action** body is genuinely unknown. It went on the board as
  unknown. The one well-targeted free step — **rate-limiting sign-in**, 0 of 1 rules used — went on as
  work, sequenced behind his domain move at his instruction. **Bot Fight Mode was recommended against
  with reasons**, not offered as a switch.
- **A peer session's report was verified, not trusted.** Another session groomed the backlog mid-round
  and said its collapse had preserved this round's edits. It had — **checked against `origin/backlog`
  with `git grep`, not taken on its word.** That is the standing rule for any agent's report, including
  a stream's own PR comment.
- **The two unanswerable screens got a positive answer, from the repo.** Whether the Pi origin is
  protected does not depend on reading his dashboard: the Cloudflare rule *and* the Pi's own refusal in
  `src/proxy.ts` are **two independent layers**, and the second is in the repo where any planner can
  read it.

## STATE, RE-READ EVERY TIME

Nothing in this section may be quoted from here. **Re-read it:** open items and their titles from
`docs/backlog.md`; batches, bands and actuals from `.plan-day.md`; release state from
`apply-migrations.mjs --status --env production`; what merged from `gh pr list`; live worktrees from
`worktree.mjs list`.

**What is with Lutan as of this writing:** the glance at the Google OAuth consent screens; the
**power-pull drill at the Pi** and the **option-5 CPU measurement** (which needs his `wrangler login`,
and until both land Pi failover B, C and D cannot be briefed); the Translations card assignment; the
duplicate-resident corrections; the NFC card check on two phones; and the Director's list, of which the
**sav.com nameservers block the most**. **The domain move is now a sequencing fact, not a task of
his:** two free Cloudflare steps wait behind it.

**NEITHER SUPABASE PAID FEATURE IS ON THAT LIST, AND NEITHER MAY EVER RETURN TO IT** — session
inactivity timeout and leaked-password protection are both **dropped, not deferred**. See
`docs/decisions/2026-10-29-pro-only-features-are-dropped.md`.
