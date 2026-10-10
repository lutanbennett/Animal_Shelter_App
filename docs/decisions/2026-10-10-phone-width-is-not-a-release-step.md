# The phone-width sweep is a testing step, not a release step

**Decided by Lutan, 2026-10-10, during the `0.25.0` release.**

`node scripts/check-phone-width.mjs` is **removed from
`docs/release-smoke-test.md`** and is no longer run as part of a production
release. It stays as a script, and it stays part of **testing** — a feature that
changes a page is what should run it, in that feature's own test plan, before the
PR merges.

## What was wrong

Two kinds of duplication, and the release was paying for both.

**The literal kind:** the smoke test listed the same check **twice**, as two
near-identical bullets (lines 40 and 41 at the time of removal), differing only
in wording. Nobody had noticed, because nobody had run it for three releases.

**The real kind:** the check verifies that pages do not scroll sideways at 375 px
and that tap targets are at least 44 px. That is a property of **a page**, and it
changes when **a feature changes that page** — not when a release is cut. Running
it at release time asks the same question of the same unchanged pages every time,
long after the PR that could have broken it has merged. If it ever did fail at a
release, the fix would be a code change, which means a new PR, which means the
release stops anyway. The information arrives too late to be worth what it costs.

## What it cost

At `0.25.0` it was the single longest step in the release — longer than the
production Worker deploy, which is the acknowledged long pole. Six roles in two
languages, run one at a time because they share the dev database, roughly 45
minutes in total, while the release itself had been live and verified for half an
hour. Lutan's words: *"I don't want each release doing page checks, this is
something handled in testing"*, and *"we are doubling up the work"*.

It also competes for the machine: it drives a real browser and at `0.25.0` it ran
alongside two builds on the same PC, which is part of why it took as long as it
did. And at `0.24.0` its `--clean` flag deleted another stream's throwaway logins
mid-run, because the flag is not scoped to the run that calls it.

## What this does not change

- **The script is not deleted and not deprecated.** It is the right tool; this is about *when* it runs.
- **A feature that changes a page should still run it** and record the result in its own test plan, which is where a failure is cheap to fix.
- The two known gaps in the script stay on the backlog and are now testing's problem rather than the release manager's: its `ALL_ROLES` still names the retired `staff`, so a default run dies at setup, and it has no `second_in_command`, so the 2IC — the one role with no PC on site — has never been measured.

## The last release run, for the record

It ran in full at `0.25.0` against `test.lannacare.org` before this decision was
taken, and passed clean, so nothing is being waved through. Six roles, English and
Thai:

| Role | Page views | Component actions | Result |
|---|---|---|---|
| admin | 107, 5 skipped | 1105 | pass |
| management | 94, 12 skipped | 1048 | pass |
| doctor | 22, 82 skipped | 56 | pass |
| volunteer | 18, 88 skipped | 194 | pass |
| head_of_medical | 20, 86 skipped | 180 | pass |
| head_of_maintenance | 22, 84 skipped | 210 | pass |
| **total** | **283 page views** | **2793 actions** | **pass, 0 warnings** |

Every slice ended with the three lines that matter, and none was `FAIL`:

```
No page scrolls sideways.
No text box, select or textarea is under 16 px (iPhone zoom on tap).
Every component action is at least 44 px.
```

## The wider lesson, which is not about this script

`0.24.0`'s record treated three releases of skipping this check as a failing to
put right, and `0.25.0` duly ran it. **Nobody asked whether it belonged there at
all.** A checklist item that has been skipped repeatedly is evidence worth
reading: sometimes it means the step is being neglected, and sometimes it means
the step is in the wrong place. Ask which before spending forty-five minutes
restoring it.
