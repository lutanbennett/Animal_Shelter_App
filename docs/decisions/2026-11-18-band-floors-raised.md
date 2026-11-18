# Two band rows' bottoms raised to 143k (2026-11-18)

**Decision:** in `.claude/skills/plan-day/SKILL.md`, `Quick win (1–3 files, answer already on the item)`
goes from `110–170k` to `143–170k`, and `Schema PR, nothing left to discover` from `110–140k` to
`143–165k` (its top had to move, or it would be narrower than one reading). The basis is in
`reference.md`, so `SKILL.md` gains no lines.

## The sixteen figures (read from each PR's `stream-usage:` comment, all `sonnet-5-5`/`low`)

| slug | PR | band | actual | result |
|---|---|---|---|---|
| card-catalogue-writes | #1676 | 150–180k | 167,847 | inside |
| dictionary-shelter-prose | #1677 | 175–220k | 195,320 | inside |
| shelter-drive-connect | #1678 | 200–250k | 210,727 | inside |
| calendar-per-shelter-schema | #1684 | 150–185k | 204,314 | over |
| security-check-coverage | #1686 | 185–230k | 220,028 | inside |
| scheduled-writer-visibility | #1687 | 190–240k | 281,551 | over |
| release-order-measures-worker | #1688 | 120–160k | 143,281 | inside |
| part5-closing-pass | #1689 | 110–140k | 146,673 | over |
| calendar-per-shelter-app | #1690 | 170–215k | 186,724 | inside |
| advisory-glob-judged | #1691 | 125–165k | 149,997 | inside |
| calendar-status-rpc | #1692 | 115–145k | 154,869 | over |
| cron-watch-purge-requests | #1693 | 110–145k | 148,976 | over |
| migration-check-not-checked | #1694 | 115–150k | 160,170 | over |
| calendar-connect-screen | #1695 | 170–215k | 173,744 | inside |
| worker-writer-runs-adopt | #1696 | 140–180k | 146,719 | inside |
| calendar-per-shelter-readers | #1698 | 160–200k | 218,782 | **excluded**: `rescoped=yes` |

Fifteen usable. No other exclusion applies: none `finished=blocked`, none `compacted=yes`, every
`model=` matches its band's dials (`claude-sonnet-5-5` and `sonnet-5-5` are the same model, a naming
difference only). #1689's `started=unmeasured` does not affect its token figure.

## Reading

The four bands whose bottom was under 120k all overran (146.7k, 149.0k, 154.9k, 160.2k), as
handover 761 said. Sixteen figures change nothing about that. **No stream of the fifteen came in
under 143,281.** A real PR's own bookkeeping (test plan, decision file, gates, usage comment, the
branch dance) puts the floor of any PR near 143k whatever the work. The recommendation was ~145k;
the lowest reading is 143,281, so a bottom of 145k would exclude a real reading, and **143k** is used.
The schema row's top is 165k, not 140k, because the three readings that belong near it run to 160k.

## What was deliberately NOT changed, so nobody "finishes the job"

- **The floor row (`~86–90k`)** is untouched. Handover 761 re-measured it (86,693 to 90,806) and it
  still describes the data.
- **No other scale row** was touched. The floor row and the scale rows are independent measurements,
  and correcting two rows from actuals does not imply shifting the rest; a row with no reading is
  changed by no one.
