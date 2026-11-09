# A handover's "still outstanding" lines go stale in one direction, and that direction is dangerous

**2026-11-09.** Lutan asked one question — *"is the handover up to date"* — about
`docs/release-handover.md`, written the previous day after `0.43.6`. Four of its statements had
stopped being true within twenty-four hours, and the **next free migration number was five behind**.

What makes this worth a decision file rather than a commit message is that **every one of the four
was stale in the same direction: it said a job was outstanding when the job was done.**

| What it said | What was true on 2026-11-09 |
|---|---|
| *"NOTHING PURGES TEST'S EDGE CACHE"*, a whole numbered point | `purge-cache.mjs --env test` purges it and proves it; `#pz3tk` ticked |
| *"The UAT zone cache has still never been purged"* | Purged, with a zone-scoped token, proven by a re-fetch; `#prg4z` |
| *"`scripts/pi/setup.sh:122` still hands the production service `lannacare.org`"*, plus three line numbers in `docs/pi-hosting.md` | Fixed by `claude/cutover-tidy` (`f3724a2d`); the line reads `lannacareforanimals.org` |
| *"Next free migration number: `0338`"* | `0342` is the highest on `main`, so `0343` |

## Why one direction, and why it matters more than the opposite

A delta handover is written at a moment and then **copied forward**. Its "carried, unchanged" list is
the cheapest part to copy and the most expensive part to re-measure, so it is the part that gets
copied. And a line in it only ever decays one way: a thing recorded as **done** stays done, while a
thing recorded as **not done** stops being true the moment anybody does it.

The cost is not confusion. It is **work done twice, or planned around for nothing.** A release
manager who reads *"nothing purges test's edge cache"* either re-does a job that is finished or
builds a manual step into a release that no longer needs one. That is the same fault
`docs/release-procedure.md` had the same day (`#r9k2m`, PR #1409), which is what prompted the
question: two documents, one pattern.

There is a third cost, visible here. The last edition's own bullet said `lannacare.org` *"is UAT"*
while the file's opening page said it **301s to production**. Both were written on 2026-11-08, hours
apart. **A copied line does not just age; it contradicts the fresh part of the same document**, and a
reader cannot tell which half to believe.

## The rule

1. **Every "still never", "still cannot", "has not yet" line is re-measured at each edition, or it
   does not go in.** The file already says *"Read the live state; never accept 'it's done'"* — this
   is that sentence's mirror, and the one nobody was applying: **never accept "it's not done"
   either.** The measurement is usually one command.
2. **Correct in place, dated, with the superseded text identifiable** — the way this file's own
   `database_read` correction was already done, and the way the runbook was fixed. Deleting a wrong
   line loses the reason somebody believed it.
3. **A number is a measurement with a date on it, never a line to copy.** `Next free migration
   number` moved five in a day. It now says to read `git ls-tree` rather than the line.

## What was deliberately left alone

*"The restore drill has still never been exercised"* stays. `#rg7pv` merged the same day and does
rehearse a restore — but against **privileges**, comparing a backup's ACLs line for line, which is
not what the release records have meant by the drill since 2026-10-19. Overwriting it would have
been the same fault in reverse: replacing an unverified claim with another unverified claim. It is
named here instead so the next edition can settle it with evidence.
