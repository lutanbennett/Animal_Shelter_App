# Every `/th` address hides the staff app's chrome (#thchr)

**Measured, 2026-11-27, signed in on dev, headless Chrome:** the staff header and sidebar were drawn on
`/th`, `/th/adopt`, `/th/donate` and `/th/platform/about`, but not on `/adopt`. So the fault was **general**
to the Thai public site, not limited to the product page. Cause: the Thai twin is a rewrite, so the
browser keeps `/th/...` and `PublicPathGate`'s bare-path tests matched nothing.

**Decision:** the gate's test moved into `isChromelessPath()` in `src/lib/public-paths.ts` (testable,
beside `thPathRest`). It returns true for **any** `/th` or `/th/...` address, including ones
`thPathRest` returns `null` for (e.g. `/th/platform/shelters`, an unknown `/th/x`). Reason: no staff
page lives under `/th`, so the only way to get this wrong in the safe direction is to hide chrome on a
404; the other direction draws a shelter's menu on the product site. That is the brief's question 5,
answered towards "cannot show a shelter's menu". No new prefix list was written: the prefix test is the
`/th` rule itself, which `thPathRest` applies too.

**Not changed, noted:** the three other copies of Thai/product path knowledge (`src/proxy.ts`,
`PLATFORM_KEEPS` in `src/lib/site-hosts.ts`, `src/lib/platform-features.ts`) were not touched or audited.
