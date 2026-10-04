# 2026-10-04 — A CI check for backlog items filed below `## Completed`, and the rule it deliberately does not have

## The failure

Every session reads `docs/backlog.md` the same way: open items are the `- [ ]`
lines **above** the `## Completed` heading. An unticked item filed below it is
therefore not deprioritised — it is invisible. Nothing errors, nothing looks
wrong, and `/plan-day` never offers it again.

Four escaped this way in two days:

- **2026-10-03** (`be288b8`), three at once: *Contact page map preview is too
  wide on desktop*, *Cost per unit keeps only 2 decimals*, and *`setup-test.sh`
  run under sudo leaves the whole test clone root-owned*.
- **2026-10-04** (`db9daa2b`), one more: *`release-smoke-test.md` still says to
  commit the release record "on whatever branch is to hand"*.

Two of those matter beyond the inconvenience. The map-preview item had been
offered to Lutan once and passed over for something else; when it then vanished
from every listing, there was nothing to distinguish "he deprioritised it" from
"it was lost". And the `setup-test.sh` one was a **live breakage** — the Pi's
test clone had 57,249 root-owned paths and deploys to it were failing — sitting
where no planning run would ever read it.

Each was found by someone happening to look. `scripts/check-backlog-sections.mjs`
is that look, done by CI instead, wired into `npm run lint` beside the other
`check-*` scripts.

## What it checks

1. **An open `- [ ]` below `## Completed`** — the real case, and the shape of
   all four above.
2. **An indented open `  - [ ]` below it** — a sub-item under a parent that was
   ticked and moved down. Less clear-cut, since the parent may genuinely be done
   with loose ends, but just as unreadable. Reported with its own wording so the
   two are not confused.
3. **A malformed checkbox** — `- [X]`, `- []`, `- [  ]`. The same failure in a
   different hat: anything matching neither exact form reads as neither open nor
   done.
4. **Exactly one `## Completed` heading** — with none, every item reads as open;
   with two, "above or below" has no answer. Better to say so than to guess at
   the first match.

The message names the line, the item's title and what to do, because a check
that only says *something is wrong* costs the next person the same search this
one was built to remove.

## The rule it does not have, and why

The obvious mirror — **a ticked `- [x]` item sitting above the heading** — was
proposed and then dropped, because counting the file first showed it would be
wrong:

```
above Completed: 85 open, 133 ticked
below Completed: 96 ticked
```

**133 ticked items live above the heading.** Items are ticked in place, in their
own section, and only some are ever moved down. That is the house style, not a
backlog of mistakes, so a check enforcing the mirror rule would have failed 133
times on day one — and a check that is red on arrival is one people learn to
filter. That is the same lesson `test-plan` already paid for, recorded in
CLAUDE.md: suppressing a noisy job lost the real signal with it.

So the asymmetry is deliberate. **Below the heading, a tick is the only valid
state. Above it, both are valid.** The convention only loses information in one
direction.

## Testability

The script takes an optional path argument so its failure modes can be exercised
against fixtures; `npm run lint` calls it with none. Five fixtures were run — the
four faults above plus a clean baseline — and are recorded in
`docs/test-plans/check-backlog-sections.md`. A check nobody has watched fail is
not known to check anything.

It is appended **last** in the `lint` chain, so a failure in one of the older
checks still surfaces first.
