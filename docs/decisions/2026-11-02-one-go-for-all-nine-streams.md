# One go for all nine streams: Lutan triggers the plan, the planner sequences the batches

**Date:** 2026-11-02
**Asked for by:** Lutan, in chat: *"can we set it up so I give you a single go for all 9 streams and you
sequence them in the correct order rather than me having to start you off for each batch"*.

## The problem

A plan is nine items in three batches of three, and until now **each batch needed a fresh typed message
from Lutan** before its sessions could start. So a plan of nine cost him **three goes**.

The first is genuine: it confirms the plan and batch 1. **The second and third were ceremony.** By then
the ordering was decided, the items were re-read, the worktrees and briefs were ready, and he was
supplying nothing but a trigger. On 2026-11-02 he supplied it three times in one morning.

## Why he had to

`start_session` is refused on a turn that an automated event began, and **a batch finishing reaches the
planner as exactly that** — a `<side-sessions-event>`. The refusal is a real condition, not a fault, and
it has fired four times across nine batches.

## The decision

**He triggers the PLAN. The planner sequences the BATCHES.** Written into
`.claude/skills/plan-day/SKILL.md`, step 7, as *ONE GO FOR ALL NINE*.

The mechanism is a carve-out that already exists: **a `<side-sessions-event>` turn that follows the
user's own turn, or another such turn, may start a session for a step he asked to have in its own
session.** A chain of those events traces back to his single go, so batches 2 and 3 are startable on them.

## What this does NOT change, and the wording matters

- **Still three batches of three, still one batch's worktrees at a time.** `CLAUDE.md` caps live
  worktrees at two or three because merging is the bottleneck. **"A single go for all nine" is never a
  licence to create nine worktrees** — the whole request is that the *planner* sequences them, so a
  future reading that creates nine has inverted it.
- **Every ordering rule still decides the order**: schema before its app half, one migration a batch, one
  dictionary stream a batch, and never a census beside a stream editing what it counts.
- **The plan is still presented and batch 1 still confirmed.** That one `AskUserQuestion` is his steer on
  priorities and he did not ask to lose it. It is answered inside the turn his own message opened, so it
  satisfies the turn condition.
- **The counter and the handover are unchanged.** The handover is still written when the plan's last
  batch is set up — which now happens without him typing anything, so **the edition should say nobody
  asked for it.**

## What must still stop the chain

**A decision that is his.** One go is a trigger, not a mandate to drive through a blocker. If a batch's
results raise a question only he can answer, a fault that makes the next item wrong, or a red nobody has
read, **the planner stops and asks, exactly as before**, saying in one line that the chain is paused and
on what.

**A single go buys him fewer interruptions, not fewer answers.** Steamrolling a blocker to honour it
would be the worst possible reading of the instruction. There is a live example on the day this was
written: whether a `#tag` typed in a resident note may appear on the public `/adopt` page is unanswered,
and it holds the rest of that item.

## Status: this is a hypothesis until a batch has started that way

**The carve-out is written down; nobody has used it to start a batch.** The skill's own rule — that a
mitigation the planner adds is an experiment to be checked rather than a fix to be assumed — applies
here as much as to anything written into a brief.

**The fallback is exactly what he has today, so the downside is zero:** if the start is refused, say so
in one line, ask for a go-ahead, and retry the identical call, which has worked both times it was needed
(tally at the time of writing: nine batches succeeded, four refusals, two recovered by a verbatim retry,
three never refused). **Do the whole round's other work first** — actuals, findings, sync, worktrees,
briefs — so his one word is the only thing outstanding.

**The next planner should record which way it went**, in `.plan-day.md` and in the next handover.
