# Deploy the production Worker first, then build the Pis pinned to its SHA

**2026-10-15, during `0.32.0`.** Settles the open question `0.31.0`'s record and
the release handover both left deliberately unanswered, rather than picking one
order silently for a second release running.

## The question

A release has four builds: two Pis and two Workers. They differ in one way that
only matters when `main` moves under the release:

- **A Pi build can be pinned.** `deploy-pi.sh --ref <sha>` builds exactly that
  commit.
- **A Worker build cannot.** `deploy.mjs` takes no `--ref` and refuses a `main`
  that differs from `origin/main`, so it always builds whatever `main` is at the
  moment it runs.

So the order the four are done in decides what a late merge costs. Two orders
were both defensible and the handover said so in terms:

1. **Pis first, in parallel with the test Worker deploy** — what
   `docs/release-procedure.md` recommends under "Do not idle", and what `0.31.0`
   did. Saves about ten minutes of wall-clock.
2. **Production Worker first, then both Pis pinned to the SHA it reports** —
   makes a late merge harmless, at the cost of running the Pi builds serially
   after it.

`0.31.0` took the first and `main` moved twice. Nothing user-visible went wrong,
but keeping "all four builds came from the release SHA" true cost three extra
builds and about fifteen minutes.

## The decision

**Order 2. The production Worker deploy goes first, and both Pi builds follow,
pinned with `--ref` to the SHA that deploy reports.**

The full order for a release is therefore: merge the cut, pull, apply the
migrations, deploy the test Worker, hand the production Worker deploy to Lutan,
then build both Pis pinned to the SHA his deploy printed.

## Why

- **The two goals are not worth the same.** Order 1 saves roughly ten minutes of
  wall-clock. Order 2 removes a whole failure mode — the one that actually bit
  the last release — and it removes it by construction rather than by watching
  for it. Ten minutes of elapsed time is the cheapest thing a release spends.
- **It costs Lutan nothing either way.** Both orders are two touches. The three
  rebuilds `0.31.0` absorbed never reached him, and neither would they have here;
  what order 2 buys is not his time but the record's truthfulness about what was
  built from what.
- **It makes the unpinnable build the reference instead of the hostage.** Under
  order 1 the Worker is built last and has to match three builds already made,
  which is the wrong way round: the build with no `--ref` is the one that cannot
  be made to agree, so everything else should be made to agree with *it*.
- **It brings his one command earlier.** A smaller benefit, but a real one: the
  irreversible step — it mails every admin — now happens while the session is
  still fresh rather than after twenty minutes of Pi builds.

## What this does not change

- **The test Worker deploy still precedes the production one**, and they still
  cannot overlap: both build in the main checkout. That is unchanged and is why
  the test deploy stays first in the order above.
- **Test still gets the same release from the same commit.** Order 2 reaches it
  by pinning the test Pi too, not by letting it drift.
- **Nothing about "do not idle" is wrong in general** — it is good advice about
  handovers that do not need to be sequential. This is a case where the
  sequencing buys something, which is the exception the rule should have had.

## How to tell if this was the wrong call

If several releases run with `main` holding still, order 2 will have cost ten
minutes each time and bought nothing visible. That is the expected shape of a
correct precaution and is **not** evidence to revert it. What would be: a release
where the serial Pi builds after the Worker deploy delay something that actually
matters, or a change that gives `deploy.mjs` a `--ref` — which would dissolve the
question entirely and is the real fix if anyone wants one.
