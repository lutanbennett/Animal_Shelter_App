# The console's website step means "the address answers", checked once after the page draws (#hsttk, #cnhom)

**Date:** 2026-11-27 · **Branch:** `claude/console-website-truth`

## The fault

The product console's setup checklist ticked *website address* off `has_host`, which is only whether a
`shelter_hosts` row exists. `mapShelterHost` writes that row the moment the address is typed, so
`test555` read as past the website step while `test555.cooperjaidee.org` did not even resolve
(`curl` returned `000`). The probe that could tell (`checkShelterHost`, #1874) sat behind a Check
button on the Website tab.

## How the answer reaches the card (deliverable 2)

**Checked on demand, once, from the browser, after the list has drawn.** `checkShelterHosts(hosts)` in
`src/app/platform/actions.ts` reads the shelter list once (to refuse any address no shelter has), then
sends every `HEAD` in parallel, each capped at 6 s. `ProductAdminPanel` calls it from one `useEffect`.

Options weighed:

- **Probe in the server render** — rejected: the list page would wait up to 6 s on the slowest host.
  The brief's rule was *do not make the list page slower to make it honest.*
- **One call per card** — rejected: N round trips and N reads of the shelter list.
- **Store the answer in a column** — rejected: needs a migration (out of scope for this stream) and a
  stored answer goes stale the moment Cloudflare changes, which is exactly the kind of false success
  this item is about.
- **Cache across page loads** — not done: the console is used by one or two people a few times a day
  and the probe is cheap; a cache would add a second source of truth for no measured need.

Until the answer arrives the card says *Checking…* and the step is **not** ticked: an unknown answer
counts as not done, never done. If the probe itself fails (no aal2, a database error) nothing is ticked
and the card shows nothing beside the address.

## What a silent address does to the status (deliverable 5)

**It leaves the website step unticked and the shelter *Still being set up*. It does not turn the card
red.** A shelter part-way through setup is not broken, and a red that is normal for every new shelter
teaches people to ignore red. `broken` stays reserved for a connection that has died. The three
readers of `has_host` now read `websiteLive(s, live)` (row AND answered): the Setup tab's colour, the
card state and the checklist. The Website tab goes **green** when the address answers (it could never
be green before, because nothing checked), grey when recorded but silent or unchecked, red with no
address.

The wording beside the address reuses `hostAnswers` / `hostSilent` / `hostChecking`; no new phrasing.

## The product name as the way home (#cnhom)

`src/app/platform/ProductHomeLink.tsx` wraps the lockup in a link to `PRODUCT_HOME`, with `/th` in front
on a Thai address or when Thai is the chosen language. The link carries its own label
(`platformHomeLink`) and the `role="img"` lockup inside is `aria-hidden`, so a screen reader hears the
destination once. On `/platform/about` and `/th/platform/about` it is **not** a link, so it does not
duplicate `ProductNav`'s home entry. From the console it opens in a new tab, as Lutan asked ("the same as
we have in lannacare": `AppHeader.tsx`'s logo does that because staff are mid-task); from the public
product pages it is ordinary navigation.
