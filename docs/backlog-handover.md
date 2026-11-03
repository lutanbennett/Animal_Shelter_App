# Backlog manager handover — edition `1`, 2026-11-03

**The founding edition.** There is no `docs/backlog-procedure.md` to be a delta over, so this file
carries both the durable rules of the role and the finding that caused it to be written. A later
edition is a **delta** over this one, in the shape `docs/planner-handover.md` uses.

> **THE LEAD, AND IT IS THE REASON THIS FILE EXISTS: GROOMING MEANS PUTTING ITEMS INTO `## Next up`.**
> On 2026-11-03 a backlog manager was asked to groom the backlog, spent the round folding stale notes
> and rewriting titles, and **put nothing into `Next up`** — which was empty of open items at the time
> and had been for the whole session. Lutan had to ask three times. By the time the nine items were
> promoted, **his planning round had already been set up without them**, so work he wanted was missed
> and, in his words, *"delayed by another day for some high priority work."*
> **The grooming was not wrong. It was late, and late is the same as not done.**

**Nothing here outranks `CLAUDE.md`, `docs/backlog.md` or `.claude/skills/plan-day/SKILL.md`.**
**Read first:** `CLAUDE.md` → this → `docs/backlog.md`. **The next edition is `2`.**

> **Never carried forward: anything read from the repo** — item counts, line numbers, which items are
> open, which streams are live, what is in `Next up`. **Re-read every time, never diffed.**

---

## WHAT THE ROLE IS FOR, IN ONE LINE

**The backlog manager decides what is next; `/plan-day` decides who does it.** Those are different
jobs and the second depends on the first having been done. A groomed backlog with an empty `Next up`
has had its hygiene improved and its purpose missed.

## THE DELIVERABLE OF A GROOMING ROUND IS `## Next up`, NOT TIDIER ITEMS

**Say what you are about to do and then do it. Do not ask whether to restock `Next up`.** The file's
own header says *"Ordered by suggested priority; reorder freely"*, so a promotion is a **proposal
already made reversible by the file's own convention** — it is not a decision that needs his yes.
Asking costs a round trip and, on 2026-11-03, cost the round.

- **`Next up` is the first section of `docs/backlog.md`, and that is the whole mechanism.**
  `/plan-day` reads **open items only, in file order**, and its skill says *"backlog priority is the
  default order across all nine"*. The skill **never mentions `Next up` by name** — it does not have
  to. First in the file is first to be planned.
- **So an empty `Next up` does not break `/plan-day`; it silently hands the planner whatever happens
  to sit at the head of the next section.** That is the failure mode: nothing errors, nothing is
  flagged, and the day gets planned off an order nobody chose.
- **Items are MOVED into `Next up`, not referenced from it.** Lutan, 2026-11-03: *"the backlog manager
  usually places items in the next up when I ask for it to be groomed."* Move the whole item line out
  of its topic section. Other items already refer to promoted items by name (*"moved to PI TESTS AT
  THE PI, Next up"*), which is the established way to point at one.
- **Prove you moved rather than copied or lost:** count `- [ ]` and `- [x]` before and after. They
  must be identical. On 2026-11-03 that was 71 open and 845 ticked both sides.
- **Aim at three batches of three**, which is the shape `/plan-day` wants, unless he asks otherwise.

## "FOCUS ON THE ITEMS FROM THE LAST 24 HOURS" MEANS PROMOTE THEM

**It is an instruction about WHICH items to put in `Next up`, not about which items to copy-edit.**
This was misread on 2026-11-03 and is the proximate cause of the delay. Lutan afterwards:
*"That's why I asked for a focus on backlog items generated in the last 24 hours."*

**Why the recent ones:** an item he filed yesterday is a thing he has just decided he wants. It needs
no priority call from anybody — **he already made it by filing it.** Find them from the `backlog`
branch's own history, not by reading the file:

```bash
git log --since='<24h ago>' --first-parent origin/backlog -- docs/backlog.md
```

then diff the window and take the added `- [ ]` lines. Expect **rewrites to show up as additions**:
an item whose text changed appears in that diff and is not new, so read its title before promoting it.

## TIMING IS THE WHOLE VALUE. GROOM BEFORE THE DAY IS PLANNED

**A groom that lands after `/plan-day` has set up its batch is worth nothing until the next round**,
because a stream's work is fixed by its `.brief.md` when its worktree is created. That is a day, and
on 2026-11-03 it was a day of work he had specifically asked for.

- **Before starting, look at whether a planning round is in flight:** `git worktree list` and
  `gh pr list --state open`. Live `claude/*` worktrees mean a batch is already running.
- **If a round is in flight, say so in your first line and promote anyway** — it lands for the next
  round rather than nothing.
- **Do the promotion FIRST and the prose grooming second.** If the round is cut short, the valuable
  half is done. On 2026-11-03 it was done in the opposite order and the valuable half never happened.

## NEVER FLAG A GAP AND THEN LEAVE IT

**The empty `Next up` was spotted in the session's very first reply, put to him as a question, and
then dropped through three further instructions.** A finding you raise and do not act on is worse than
one you never noticed, because it reads as handled.

**The rule: if you can fix it in this round, fix it in this round and report it fixed.** Reserve a
question for something only he can answer — a priority he has not expressed, a trade-off that is his.
Restocking `Next up` from items he filed himself is not one of those.

## WHAT ELSE A GROOMING ROUND OWES, AND NONE OF IT SUBSTITUTES FOR THE ABOVE

These are real and were done well on 2026-11-03. They are **second**.

- **One item, one consolidated block.** `CLAUDE.md` already says it. The worst offenders are items
  with five or more appended dated notes, each with its own *"STILL OWED"* list contradicting the one
  above it — the later note has usually superseded all the earlier ones, so state the latest and fold
  the rest away **marked**, never silently deleted.
- **Dead dates are the most misleading thing in the file.** One item carried two tentative go-live
  dates, both long past, written as live planning with a *"move the date rather than squeeze it"*
  checklist. Strip them and say no date is set.
- **A title must say what is still open, read alone.** A title that leads with provenance
  (`ANSWERED <date> (PR #…, decision file…): …`) makes you read kilobytes to learn what is left.
- **`node scripts/check-stale-titles.mjs [path]` is a heuristic and will flag MORE items after a good
  groom**, because it matches on words like *decided* and *answered*. It always exits 0.
  **Read the items; never report its count as a result.** It also reads `main`'s copy by default, so
  pass the backlog worktree's path when checking work you have not yet synced.
- **Two separate storage or state facts about different things, sitting far apart in one item, will
  eventually be crossed.** Put them adjacent and name which is which.

## THE MECHANICS, AND THE TWO THAT GET FORGOTTEN

- **Edit `C:\Development\Animal_Shelter_Backlog\docs\backlog.md` and commit there.** No `claude/*`
  branch, no PR; the post-commit hook pushes. Never edit `docs/backlog.md` on `main` directly.
- **New items go in the section their subject belongs to**, above `## Completed`. Appending to the end
  of the file is always wrong — `## Fundraising` is last, so an appended item lands in Fundraising by
  construction and passes the checker. `check-backlog-sections.mjs` tests **position only**.
- **FORGOTTEN ONE: sync to `main`, or nothing you did is visible.** New worktrees branch from
  `origin/main`, so a groom that stops at the `backlog` branch reaches no stream. In the main
  checkout: `git checkout main && git pull`, `git merge backlog`,
  `node scripts/check-backlog-sections.mjs`, then
  `git -C ../Animal_Shelter_Backlog merge --ff-only main`, then `npm ci` last. **The post-merge hook
  pushes `main` before you can run the section check**, so that check is a verification, not a gate —
  know that rather than discovering it.
- **FORGOTTEN TWO: republish the backlog page.** `docs/backlog.md` has a published artifact,
  **Lanna Care Backlog**, pinned in Lutan's sidebar, and it is how he reads the backlog. It is stale
  the moment you sync and he will ask. Generator and templates are in the main checkout's gitignored
  `.local/`: `node .local/gen-backlog.mjs . .local/backlog.html`, then publish to the **same URL**.
  Find the URL with the Artifact tool's `list`; never create a second one.
  **Read the live version before publishing** — the tool refuses otherwise.
  Its *Customer priorities* panel is the mechanism Lutan has for ranking items himself; check whether
  it holds anything before changing item titles, because the ranking is keyed on a slug derived from
  the title and a retitle orphans an entry.

## STATE, RE-READ EVERY TIME

- **`Next up` was stocked with nine items on 2026-11-03** (`141b0e8f`), promoted from what Lutan filed
  on 2026-11-02, ordered security-and-cards first, then his three feature requests schema-first, then
  three smalls. **Its *ORDER OF WORK* note was replaced** — the previous one was refreshed 2026-10-25
  and stale in six ways. **That note is the right place for the order and the reasons**, and the next
  manager should refresh it rather than append to it.
- **`Next up` still holds a large block of ticked items below the open ones**, left in place
  deliberately: moving them to `## Completed` is cosmetic, high-churn on a file streams are ticking,
  and would break the many cross-references that name them. **Not a task; a decision already taken.**
- **One question is outstanding and it is Lutan's**, inside the *several items on one bill* item:
  should a described item later be promotable to a real stock item? It does not block the build.
- **The page generator was fixed on 2026-11-03** so that a blank line no longer ends an item; before
  that, an item whose body sat on an indented line after a blank line rendered with an empty body and
  its text appeared inside the section's intro note.
