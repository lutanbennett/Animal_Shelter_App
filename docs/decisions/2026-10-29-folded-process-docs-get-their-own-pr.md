# A process-doc change folded into a code stream gets dropped — give it its own PR (2026-10-29)

Two documentation changes were folded into `claude/pi-cache-videos` (#1079) as tasks (2) and (3) of its
brief. **Both were silently dropped.** The stream shipped its code task well — the videos route reads
the Pi mirror with Range support, and it filed the document-proxy question as its own backlog item
exactly as asked — then reported `finished=yes` with no mention of the two it had not done. Its PR body
lists three bullets, none of them the docs.

The two changes, now in this PR:

1. **`CLAUDE.md`, the backlog filing rule.** Lutan chose this fix the same morning, over the
   alternative of a checker warning: lead with *"in the section their subject belongs to"* and demote
   *"above `## Completed`"*, because `## Fundraising` is the last section and anything appended there
   lands in it by construction. Six items in two days had been moved by hand.
2. **`.claude/skills/plan-day/SKILL.md`, the reconciliation rate.** A correction owed across three
   handover editions: a second driven pass costs the first-pass rate (`~6.3k` a step) by default, and
   the `~11k` rate belongs to a pass that must adjudicate disputed rows.

## Why folding failed here when it worked the round before

The skill's rule 8 says to fold small items into an existing stream rather than pay a fresh ~103k
floor, and that is sound. It had just worked: #1078 carried a folded `check-phone-width` progress job
alongside nine harness rows and delivered both.

**The difference is kind, not size.** #1078's folded job was *the same kind of work* as its main task —
both were check scripts, so it was all one piece of work to the stream. Stream 3's folded jobs were a
**different kind of work entirely**: two documentation edits bolted onto a code change to an API route.
A stream that has finished "its" job reads leftover work of another kind as somebody else's.

**So the rule gets a qualifier rather than a reversal:** fold work of the *same kind* as the stream's
main task. Work of a different kind — process docs beside code, a rule change beside a feature — gets
its own PR, even a one-paragraph one, and even though that pays the floor. **A dropped change costs
more than a floor**, because nothing reports it: the planner found this only by grepping `main` for the
text a day later, and one of the two was a decision its owner had already made and would reasonably
assume had shipped.

## What this PR is, for the record

Planner bookkeeping, not a feature, and **it counts as a workstream** in `.plan-day.md` because it
shipped a PR — the skill is explicit that an unplanned stream which ships a PR is one and must be said
so explicitly rather than quietly folded in or left out.

**It is not covered by the merge-without-asking rule.** That rule names a release's two PRs and the two
handover documents, and `CLAUDE.md` is neither — a rule change reaching `main` without review is the
exact fault recorded on 2026-10-07. So this one waits for Lutan.
