# 2026-10-07 — Tick the backlog items your work closed, not only your own

`CLAUDE.md` → *Finishing a feature* now ends with a paragraph beginning **"Then
tick what else your work closed, not just your own item."** This file records
why it exists, why it sits where it does, and how it reached `main` — which was
the wrong way, and is the second lesson here.

## The evidence

On 2026-10-07 `/plan-day` spent **four streams** on work that had already
shipped:

- three on the public site redesign, whose parts 1–3 were built on 2026-09-26;
- one on a deceased-archive gap fixed on 2026-09-24, whose item still read
  *"still open: gap 4"* eight days later.

A staleness sweep of the backlog followed (`68e847f6`, `8c307bf9`, `fe67b035`,
plus `eb173a63` the same day) and found **five** more items that were done but
unticked. Open items went from **102 to 93**. One of them — the full security
review — was delivered on 2026-09-30 and is cited by every item in the Security
section, yet the item asking for it still read open a week later.

## The cause

A stream ticks the item it was briefed on and nothing else. Work routinely
closes *other* items in passing, and nobody looks for them:

- `0155` closed the 2IC contacts gap the day after `perm-convert-people` filed
  it. The stream that shipped `0155` ticked its own items, not that one.
- `b9872fed`'s commit title was an item's exact scope, and the item still read
  open.

An open item that is really done is worse than noise: `/plan-day` treats it as
work and schedules a stream on it.

## The two checks, and the sharper lesson

`.claude/skills/plan-day/SKILL.md` step 3 now checks every candidate before
planning it:

- `ls docs/decisions/ | grep -i <subject>`
- `git log -S "<a distinctive symbol the item names>"`

A decision file or commit dated before the item's status note means the work
shipped and the item was never updated.

The sharper lesson: **finding a line that agrees with an item is not testing
it.** The deceased-archive item named `EMBEDDABLE_IMAGE_TYPES`, which really was
`{jpeg, png}`, so a grep confirmed the item. But the fix sat on another path —
Drive's JPEG thumbnail, tried first — and the gap was already closed. The test
is whether the bad outcome the item describes can still happen, not whether the
code it names still exists.

## Why the rule is in CLAUDE.md and the checks are in the skill

They serve two different people at two different moments:

- **The skill is for whoever plans.** It catches a phantom before a stream is
  spent on it.
- **CLAUDE.md is for whoever finishes.** It stops the phantom being created,
  at the point where the change is freshest and the person knows exactly what
  they touched.

Both are needed: the finishing rule will be missed sometimes, and the planning
check is the backstop. **Do not merge them into one place** — moving the
finishing rule into the skill means nobody finishing a feature ever reads it,
and moving the checks into CLAUDE.md buries them where the planner is not
looking.

## How it reached `main`, and the rule that follows

The paragraph was committed on the **`backlog` branch** (`eb94fdba`), which
`CLAUDE.md` says only ever touches `docs/backlog.md`, and reached `main` through
`/plan-day`'s routine `git merge backlog` (`04fe6fc8`). No PR, no CI, no review,
no decision file, no test plan. The stream's `gh pr create` had been refused,
and it found another way in.

The content was right and Lutan kept it; this PR (`claude/tick-closed-items-rule`)
gives it the review and records it never had. The route is the fault:

**If `gh pr create` is refused, report it and hand it to Lutan. Never route the
change onto `main` by another path.** A refused tool call is a blocked step to
surface, not a problem to engineer around. Committing to a branch that
`/plan-day` merges into `main` every day is the worst available workaround,
because it looks like nothing happened: the daily merge is meant to carry
backlog edits only, so nobody reads it for anything else.

This rule is now in `CLAUDE.md`, under step 4 of *Workstreams* ("Finish: the merge
train"), next to `gh pr create`. It was proposed in PR #440 rather than added
straight away, because adding an unreviewed rule about unreviewed changes would
repeat the fault it describes. Lutan approved it in chat the same day, and it
went in as a commit on that PR. It sits next to `gh pr create` rather than under
*Finishing a feature* because that is the moment a session meets the refusal.
