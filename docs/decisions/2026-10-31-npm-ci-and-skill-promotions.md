# `npm ci` in the daily sync, and the facts two handovers asked to have promoted (2026-10-31)

Stream `npm-ci-and-skill-promotions`. Documents only: `CLAUDE.md`, `.claude/skills/plan-day/SKILL.md`,
the backlog tick and this file. No `src/`, `scripts/`, migration or workflow.

## `npm ci` in the daily sync

The daily sync pulls `main` and never reinstalls. On 2026-10-31 a `--no-pi` test deploy from the main
checkout died minutes into `next build` on `Can't resolve '@anthropic-ai/sdk'`: the package was in
`package.json` and the lockfile, added after the last release, and the main checkout's `node_modules`
had never been reinstalled. The release path already runs `npm ci` (`docs/release-procedure.md`); the
daily sync was the gap.

- **Where:** after the pull, which is the only step in the sequence that can change `package-lock.json`,
  and after the pushes, so a failed install cannot hold back publishing the sync. Before `worktree.mjs
  clean`, which is the last line. `CLAUDE.md` says the same in one sentence, so nobody reorders it.
- **Unconditional**, not "only when the pull touched the lockfile". The backlog item offered both. A
  conditional is one more thing to get wrong; `npm ci` on an unchanged lockfile costs about a minute once a day.
- **The command is `npm --prefix C:/Development/Animal_Shelter_App ci`**, matching the `git -C` / full-path
  style of the block it sits in. `npm --prefix . ci --dry-run` was run from this worktree to confirm the form.

## What was promoted, and from where

Source: `docs/planner-handover.md` editions `519` (commit `a356ad05`) and `528` (#1137), and
`.plan-day.md`'s batch 5 diagnosis. Both handovers say they did not apply these themselves. The handovers
were **not edited**; the next edition should cite this file instead of repeating them.

| fact | from | now in |
|---|---|---|
| The floor is `tokens − messages` from the PR comment, no live process needed (nine readings) | `519`, `528` | skill step 2 |
| Does the environment hold what the proof needs? An apparatus the stream must stand up is an instrument | `519`, `528` | skill Token estimates |
| A production proof is the planner's time, not the stream's band | `519`, `528` | **already there** (skill, Token estimates, *Do not band a stream for a proof it cannot run*, 2026-10-27); cross-referenced, not copied |
| The `+25%` adjustment for a `medium` stream | `510`, `519`, `528` | skill Model and effort |
| Quoted heredocs collapse `\\` | `519` | skill, step 6, beside the `node -e` trap |
| `--cards` takes card keys, not activity names | `528` | `CLAUDE.md`, Getting a signed-in dev session |
| `git merge backlog` conflicts most days, always the same way | `528` | skill step 1 |
| Reconcile two sources of truth: band on the harder side | `.plan-day.md` (batch 5) | skill Token estimates |

## The judgement rule, superseded in place

`528` said to count the judgements in a brief and add roughly 15-20k each. It was applied the same day
and all three of batch 5 ran +20%, +28% and +33% over band-plus-25%, with it applied. The planner's own
diagnosis replaces it: when a stream must reconcile two existing sources of truth, band on the harder side,
because the disagreements it finds are the work. The skill records the new rule and keeps the old one
marked **SUPERSEDED 2026-10-31**, as a special case of the new one. **The judgement rule was never in the
skill**, only in `528` and `.plan-day.md`, so the supersession is recorded in the skill and the handover
will go stale on its own cadence. The four overruns that prompted it are kept as valid readings.

## Not promoted, on purpose

`528` also names, without asking for promotion: *when a PR body and a check disagree, read the query*
(the empty-table coverage fault), *write open questions as questions*, and *re-read the title of any item
you changed the facts of*. The first two are habits the handover is the right home for and the third was
carried by `519`; none was marked for the skill, and adding them would grow a long file for no
instruction. If a later planner disagrees, they are one paragraph each.

## Size

The skill grew by about 65 lines, `CLAUDE.md` by 5. No existing passage was made redundant except the
production-proof corollary, which was already in the skill and was **not** copied in a second time. The
promotions are mostly new instruction, so there was little to cut. A trimming pass on the skill is its own
item, not this one.
