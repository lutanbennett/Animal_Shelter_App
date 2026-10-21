# The handover's 150 lines is a target, not a hard gate (2026-10-21)

**Lutan, 2026-10-21, asked by the Daily Planner session at the end of a nine-stream round:
*"yes let's make it a target not a hard gate"*.**

Applies to **`docs/planner-handover.md`** and the rule in `.claude/skills/plan-day/SKILL.md` step 8.

## What was wrong

The rule read *"Aim for about 100 lines and treat 150 as the limit."* Read as a gate, and it was,
every edition that landed over it opened a trimming pass.

Four editions running missed the figure on their first write, and each **stated a number it had not
measured**:

| edition | claimed | actually was |
|---|---|---|
| `258` | 147 | 151 |
| `267` | 104 | 131 |
| `276` | ~125 | 164 |
| `285` | ~130 | 170 |

`285` then took **four trimming passes** to reach 152 and stopped there, recording the two-line
overshoot as an accepted defect. Several of those passes cost a round-trip and saved **nothing**,
because a substitution that replaces prose with prose of the same line count does not shorten the
file. `276` had already predicted the recurrence — *"worth watching whether `285` does it again"* — and
it did.

## What the number is actually for

The budget it protects is real and is not being relaxed. The edition of 2026-10-20 ran to roughly 400
lines, and by its own author's measurement **the writing — not the worktree, not CI, not the merge —
was the largest single cost of producing it.** `docs/release-procedure.md`'s "The paperwork has a time
budget too" is the same argument from the release side.

**But trimming passes are the most expensive possible way to spend that budget.** They happen at the
end of a long session, where every turn re-sends the whole context, and they buy nothing a reader
would notice.

## The rule now

- **Aim for about 100 lines.** 150 is a target.
- **Write the content first and the stated figure last, measured with `wc -l`.** The four misses above
  are all cases of asserting a length rather than measuring it; that is the habit worth fixing, and it
  costs one command.
- **Up to about 160: ship it.** No trimming pass, no defect entry, no apology in the document.
- **200 or more: cut CONTENT, do not reword.** Ask which sections repeat the repo, repeat
  `.plan-day.md`, or re-explain something that should have been promoted into the skill.
  **Promotion is the real lever on length.**
- **Never trade accuracy for the number.** The three delta rules and the "never carried forward" block
  outrank the line count every time.

## Scope — deliberately narrow

**This changes the PLANNER handover only.**

`docs/release-procedure.md` rule 4 carries the identical wording for the **release** handover, and it
is **unchanged here**. Lutan was asked about the planner's ceiling, in the context of the planner's
four misses; the release side has its own history, its own author and its own 45-minutes-after-deploy
cost, and nobody has shown it has the same problem. **Changing it was not asked for and would be the
planner reaching into the release manager's runbook.** If the release side wants the same latitude,
that is its own decision to record.

It also changes nothing about the delta shape itself: say what changed, promote durable facts once,
cite `.plan-day.md`, and never carry forward anything read from the repo.
