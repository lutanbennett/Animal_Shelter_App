# The Thai read routine (`#y1dqu`)

Written for `docs/thai-read-routine.md`. The script (`2026-11-10-thai-added-since.md`) existed; the cadence did not.

## The queue as measured, 2026-11-12, 8pm (machine idle apart from this session)

`list-thai-added.mjs`, by start point:

| Start point | Strings | disagree | new | reworded |
|---|---|---|---|---|
| 2026-11-01 (last read) | 1125 | 25 | 931 | 169 |
| 2026-11-05 | 614 | 1 | 570 | 43 |
| 2026-11-10 | 244 | 0 | 242 | 2 |
| 2026-11-12 | 186 | 0 | 186 | 0 |

Largest areas since 2026-11-01: bills 153, admin 119 (new). About 100 strings a day, 700 a week.
Last release was 0.44.3 on 2026-11-11, and releases come every day or two. `check-thai-dictionary.mjs`
reports clean, which confirms it tests existence, not reading.

## Chosen

A weekly read, plus one before a release that adds wording workers meet daily, with the date of the
last read recorded as a line at the top of the routine itself.

**Rejected:** a read at every release (a release every day or two, so the reader never catches up);
a calendar reminder (nobody keeps it); a stored date in a database or script (new machinery, can
drift from what was actually read); an app screen for the reader (a process problem, not a screen
problem; reading a file needs no card).

## The durable half

New strings should not be filed into `#y1dqu` by hand. The script is the queue; streams write
`pending: Thai unreviewed` on their test plan.

## Limits of the instrument

It sees only `en.ts` and `th.ts`. Thai outside them (the Worker offline page from
`worker-cpu-fallback-paper`) is invisible and must be added to the handover by hand.

## Not yet confirmed

**The cadence (weekly, and who hands it over) is a recommendation, not Lutan's decision.**
