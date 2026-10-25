# The Doctor role is Lutan's test role, so `doctor-cells` red is expected

**Lutan, 2026-10-25, during the `0.40.4` release:** *"I am using the doctor role to test one card at a
time what each one provides."*

And, in the same exchange: *"I have been signing into production as admin after each release."*

## What this settles

`node scripts/check-production.mjs doctor-cells` asserts the Doctor role still holds the 13 permission
cells migration `0230` gave it. On production it reports `MISSING 9 of 13` at `0.40.3` and
`MISSING 12 of 13` at `0.40.4`, because Lutan is holding **one card at a time** on that role to see
what each card actually provides.

**That red is his work in progress, seen from outside. It is not drift, not a regression, and not an
open item.**

- **Never restore the Doctor's cards.** Putting `0230`'s 13 cells back destroys whatever he is
  part-way through measuring. The `0.40.4` record's first draft named "the new doctor cards" as the
  remedy and told the next session to find out *how* the count was changing — both would have led
  straight to undoing a person's deliberate work.
- **Report the number and change nothing.** A release record should say what `doctor-cells` printed
  and that it is expected, in one line.
- **Whether the check should keep asserting `0230`'s cells against a role in active use is Lutan's
  call**, not a release manager's. Nothing has been changed about the script. Do not "fix" the red by
  editing the check, and do not add an exemption for `doctor`.

## The second claim this retires

Three consecutive editions of `docs/release-handover.md` carried *"the ten production sign-in checks,
which are Lutan's and were NOT done"*. **That was wrong.** He signs into production as admin after
each release. The claim rested on nothing but the absence of a session's record of it — and a session
**cannot** pass the authenticator step, so that absence was never evidence either way. It got written
down as his omission and then inherited three times.

What is honestly unknown is narrower and worth one question rather than a standing item: whether the
**card save on Who does what** (add a card, remove one, move one) has been exercised specifically,
since that is what one of `0.40.4`'s two release notes promises.

## Why this is a decision file and not a backlog item

There is no work to do. This exists so the next session reads it **before** concluding from
`doctor-cells` that something is broken. The general fault it guards against: a measurement can prove
what a release *did not* do without supplying a cause, and filling that gap with a plausible-sounding
cause is how a session ends up undoing someone's deliberate work. **Measure, report, ask.**
