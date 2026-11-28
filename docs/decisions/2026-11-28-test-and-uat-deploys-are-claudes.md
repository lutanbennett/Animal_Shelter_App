# Test and UAT deploys are Claude's; production stays Lutan's

**Decided 2026-11-28 by Lutan, asked directly during `/plan-day`.**

## The question, and why it had to be asked

`#pltst` recorded the gap in its own words:

> **whether running a `--env test` or `--env uat` deploy is Claude's or Lutan's has never been
> settled**; only the production deploy is explicitly his (2026-10-02). **Ask him rather than
> assume.**

Nobody had. The effect was not neutral: because no session knew whether it was allowed to deploy
to test or UAT, work whose *proof* lived on one of those environments kept being written up as
waiting on Lutan. `#pltst`'s own G7, `#u2bo6`'s test deploy and anything verifiable only on UAT
were all parked behind a permission question that had never been put to him.

## The decision

Offered three shapes — both environments Claude's, test Claude's and UAT his, or both his — **he
chose: both test and UAT deploys are Claude's.**

**Production is unchanged and remains his**, by his instruction of 2026-10-02. Nothing in this
decision touches it, and no later session may read this file as softening it.

## What follows

- A stream may run `node scripts/deploy.mjs --env test` and `--env uat` itself. Run `--plan`
  first, as the script intends.
- **A verification that needs test or UAT is now the stream's own work**, not a line handed back
  to Lutan. A brief that writes out UAT steps for him to run is, from today, doing it the old way.
- **A stream must still prove the thing it deployed**, by a real run, a readback or the heartbeat
  note — never by reasoning that the deploy succeeded.
- **Expect the DNS blackout.** A deploy from this machine may wait up to about 65 seconds printing
  `DNS-RETRY waiting, Ns until retry X of 4...`. That is #1923's retry working, not a hang; its
  cause is `#dnsgp` and is Lutan's.

## What this does not decide

Nothing about the Pi, nothing about production, nothing about Supabase dashboard settings, and
nothing about privilege grants such as the product-administrator list — a deploy is not a grant,
and `#pltst`'s G7 still needs an account and an authenticator that only a person can supply.
