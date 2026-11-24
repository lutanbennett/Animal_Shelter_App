# The console says when the deployment floor is what keeps a website locked (#wbopn)

Date: 2026-11-25. Stream `website-lock-truth`.

## What was wrong

A shelter's website state has two inputs: the shelter's own `public_site` and the deployment floor
(`PUBLIC_SITE` in `wrangler.jsonc`). The more closed one wins (`publicSiteStateFor`, `src/lib/public-site.ts`).
The Website tab already carried a floor sentence (#1874), but the **Summary** list and the first line of the
Website tab read only the shelter's own value. A shelter set to `open` on a locked deployment read
"Public website: open" while its visitors saw the construction page.

## What the console says now

- When the floor is more closed than the shelter: **"Public website: open. Visitors see it locked: the
  deployment keeps every website locked."** Both facts, on the Summary and on the Website tab
  (`healthSiteHeld`, both dictionaries). When they agree, the old words are unchanged.
- The floor sentence now also says what lifting it takes: a `wrangler.jsonc` change plus a production deploy,
  which the console cannot do, and to make sure every shelter that must stay hidden is set to locked first.
- **Placement (deliverable 5): both, but not the row mark.** The words go where a person reads the state (Summary
  and Website tab). The shelter's card/row mark (`ProductAdminPanel.tsx` health) is untouched: a shelter correctly
  set to `open` under a locked floor is not faulty, and colouring it would make the mark lie the other way.
  The shelter's own setting stays visible because it is what takes effect the moment the floor lifts.

## Proved on dev, both floors, without a deploy

`next dev` reads `PUBLIC_SITE` from the environment. Driven with `scripts/lib/driven-session.mjs` as an aal2
product administrator, reading `/platform` (no presses):

- **Floor `locked`:** a shelter set to `open` read the two-fact sentence and the floor paragraph; shelters set to
  `locked` read "locked (staff only)" unchanged.
- **Floor `open`:** the same shelter read plain "Public website: open"; no floor paragraph.

## Production's floor lifted, on his instruction of 2026-11-25

*"lannacareforanimals needs to remain locked, new sites should be created by default as locked but a switch provided
on the product console to make them live"*, then *"i have set lanna to locked so we should be able to lift the floor
now"*. `wrangler.jsonc`, production (`lanna-animal-care`) only: `PUBLIC_SITE` `locked` to `open`. UAT (`locked`)
and test (`off`, deliberate) are unchanged.

**New sites are born locked: already true.** `0426` adds `shelters.public_site text not null default 'locked'`;
nothing built here.

## The trap, and the order

`0426` ran `update shelters set public_site = 'open' where key = 'lanna'`. Lanna's own value was `open`, kept
closed only by the floor. Lifting the floor before Lanna's own row reads `locked` publishes the site on deploy.

1. Set Lanna's own website to locked (console, Website tab). Product administrator.
2. Read it back on a reloaded screen. Product administrator.
3. Only then deploy the floor change. **Lutan's** (production deploy, 2026-10-02).
4. Check from outside: construction page for a signed-out visitor to lannacareforanimals.org (allow 60 seconds,
   `worker/shelter.mjs:18`), `robots.txt` still refuses crawlers, a new shelter still locked, a shelter switched to
   `open` now serves.

Written into `docs/shelter-onboarding-runbook.md`. **The deploy must not run until Lanna's own value reads locked
on production.** Nobody could read a production row from this worktree, so that read is the deployer's.

## What stays open, and on whom

`#wbopn` is not ticked. Its end-to-end clause needs a host that answers, which is `#hstau`, waiting on a
Cloudflare credential of Lutan's. The done-when ("open its website from the console alone") becomes true on
production only after steps 1 to 3 above.
