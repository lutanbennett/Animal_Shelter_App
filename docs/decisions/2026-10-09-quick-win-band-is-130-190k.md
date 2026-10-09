# The quick-win token band is 130–190k, not 110–170k

**2026-10-09, written by the daily planner session after batch 84.**

## The decision

`/plan-day`'s token-estimate table (`.claude/skills/plan-day/SKILL.md`) gives a quick win
**110–170k**. From thirty measured streams, that lower bound is unreachable and the upper
bound has been exceeded. **Estimate a quick win at 130–190k.**

The medium (200–320k) and large (350–550k) bands are holding and are **not** changed.

## Why

Two streams have been scoped as quick wins and measured:

| stream | estimated | actual |
|---|---|---|
| `account-menu-min-width` (batch 72) | 180–280k | **129,320** |
| `residents-select-all` (batch 83) | ~150k | **179,312** (+20%) |

Every stream pays a **~110k floor** before any work — tools, memory, skills, `CLAUDE.md`
and its brief. A quick win is one to three files, but it still has to read the area,
build, check the result in a browser, tick the backlog item, write a `docs/decisions/`
file where one is warranted, and fill in a full test plan. **None of that is free, and
none of it scales down with the file count.** So the realistic floor for *any* stream that
finishes properly is ~130k, and 179k is what a one-file change costs once it has a real
edge case to think about — in `residents-select-all`'s case, what "select all" means when
the filters change under a selection.

The 110k figure is the cost of a stream that has done nothing yet. No completed stream has
ever landed within 20k of it.

## Why this is written here and not only in the handover

`docs/planner-handover.md` is **rewritten every nine workstreams and is deliberately
short-lived** (see `docs/decisions/2026-10-08-planner-handover-counter.md`). A correction
recorded only there is lost at the next rewrite, and the next planner would re-derive it
from the same two measurements. A `docs/decisions/` file is permanent and is the first
place `/plan-day` is told to look when checking whether something has already been
settled.

## What this does not do

**It does not change `.claude/skills/plan-day/SKILL.md`.** The skill is the rules, and
changing the band there is Lutan's call, not a session's — the same way promoting the
`test-plan` check to a required check is his. Until he does, a planner reading the skill
sees 110–170k and a planner reading this file sees why the real number is higher. **If you
are that planner: use 130–190k, and say in your estimate table that you did.**

## The standing warning that still applies

**Do not shade estimates down across the board.** An earlier handover advised a 10%
reduction after eight consecutive unders; the next three streams came in +2%, +7%, +8%.
Batches 82 and 83 then produced five unders in six, by 11–33% — and the one that went
*over* was the quick win. Two runs of undershooting is what that trap looks like from the
inside. **This decision moves one band on direct evidence; it is not permission to move
the others.**
