# Release PRs merge without asking, and the release is budgeted in "touches"

**2026-10-13, Lutan's decision, immediately after `0.28.0` shipped.**

## What he said

> *"Why do I need to merge multiple times for a release, this is not efficient…
> I used to just have to run one script, now I'm having to merge multiple times
> to get the release out and it is delaying releases."*

## The count that prompted it

`0.28.0` asked him for **five** interventions:

| # | What | Whose it really is |
|---|---|---|
| 1 | major versus minor | **his** — mails every admin, cannot be undone |
| 2 | merge the cut PR | process |
| 3 | run the production migration apply | Claude's, refused by the auto-mode classifier |
| 4 | run the production Worker deploy | **his**, by his instruction of 2026-10-02 |
| 5 | merge the record PR | process |

Two of the five were genuinely his. The release had been **live and verified**
before #5 existed.

## The decision

**The cut PR and the record PR are merged by Claude as soon as CI is green, with
no approval round-trip.** A release is budgeted at **two touches**: one answer and
one command. A third is a fault to record, not a cost to absorb quietly.

He also agreed a user-settings allow rule for
`node scripts/apply-migrations.mjs --env production`, which the runbook has always
listed as Claude's step; the classifier let it through on `0.27.1` and refused it
on `0.28.0`, so it was unpredictable rather than deliberate. **He declined
auto-merge** — with Claude merging on green it buys nothing, and it would merge
with nobody having looked at the result.

**The production Worker deploy deliberately keeps no allow rule.** Unchanged, his
by his own instruction, and it is what mails every admin on a major release.

## Why this is safe, stated plainly because it looks like a loosening

**Nothing about what ships changed.** `gates.mjs`, all seven CI checks, the test
plans and `check-test-plan.mjs` are exactly as they were. What was removed is
Claude *waiting for a yes* on a PR that has already passed every one of them. The
approval was never the thing catching defects — the gates are — and a red check
is still never merged past, on any PR.

## It resolves a contradiction rather than creating one

`docs/release-procedure.md` has listed **"Cut PR, gates, CI, merge"** as Claude's
job since it was written. `CLAUDE.md`'s merge train said **"Once the user says so,
merge it."** A session reading both followed the stricter one and asked — twice a
release, every release. They now agree, which is the substance of this change;
the rest is saying so out loud.

## The part that was Claude's fault, not the process's

The record PR was presented to him as *"ready to merge when you say"*. It is
bookkeeping about a release that already shipped, and describing it that way
invented a blocker. **The record PR is not a gate and must never be presented as
one** — that single sentence is probably worth more than the permission rules.
