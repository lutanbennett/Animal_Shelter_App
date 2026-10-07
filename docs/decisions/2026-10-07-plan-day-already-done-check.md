# /plan-day: check whether an item is already done before planning it (2026-10-07)

Proposed, not settled: `.claude/skills/plan-day/SKILL.md` is a process file, so
this is Lutan's to accept or change.

## What happened

On 2026-10-07 `/plan-day` put four streams in two batches on work that had
already shipped: three on the public-site redesign (built 2026-09-26) and
`deceased-heic-profile`. That last one found its own item stale: `a1452515`
(2026-09-24) already made `loadProfilePhoto()` try Drive's JPEG thumbnail first,
and Drive renders HEIC; `f356e90b` (PR #397) closed the silent-failure half. The
item still read "still open: gap 4".

The planner did look at the code. It found `EMBEDDABLE_IMAGE_TYPES` was
`{jpeg, png}`, which agreed with the item, and took that as proof. The constant
was real; it only gates the fallback path.

## Change

A new first bullet, "Already done?", under step 3 of the skill: run
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"`, trust a
decision file or earlier commit over the item's own status notes, and test the
behaviour the item describes rather than the existence of the code it names.

## Not done

No tooling to automate the check; two commands in the skill is the cheapest
thing that would have caught all four.
