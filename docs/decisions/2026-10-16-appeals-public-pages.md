# 2026-10-16 — Appeals, the public pages: what a visitor is told, and when the page stops asking

**Context.** Part (2) of Sponsorship drives (backlog, Lutan 2026-10-09, priority 2026-10-15): `/appeals`,
`/appeals/[id]` and the links to them. The schema half (#667, `0210`) already decided what counts as raised, how
Medical photos are kept off, and that no donor is ever in the view. This records what the pages added.
`src/` reads only `public_appeals` and `public_appeal_photos`; this PR carries no migration.

**1. The page stops asking when the money says so, not only when staff say so.** Four phases
(`src/lib/appeals/state.ts`, `appealPhase`):

| status | raised vs target | what the page does |
|---|---|---|
| live | under | "Help needed", the ways to give, days left |
| live | **at or over** | "Goal reached" and a sentence saying so, **still shows the ways to give** with the over-raising line, never reads "help needed" |
| funded | any | "Goal reached"; **no ways to give**, a link to `/donate` instead |
| closed | any | "Appeal finished", the outcome note ("How it went"), **no ways to give** |

The quiet failure this guards is an appeal left live after the treatment is paid for, still collecting. A live appeal
that has met its target says so in words by itself, and staff marking it funded or closed removes the ways to give.
A live-and-funded appeal still shows the ways to give, deliberately: a gift may already be in transit, and hiding the
page's only instruction would be worse than the over-raising line above it. If the Director would rather it hid them
at the target, that is one condition in `showsWaysToGive`.

**2. Over-raising wording (the shelter's choice, stated on the page):** "If more is given than the treatment costs,
the extra goes to the medical care of the other animals here." Shown on every open appeal, so a donor reads it before
giving, not after. **This wording is mine and needs the Director's yes**; it is one string, `appeals.extraGoes`, in
both dictionaries. I did not add "gifts are not refundable": that is a policy the shelter has not told me.

**3. Percent rounds down.** 99.6% reads 99%, so only a reached target reads 100%. Computed in whole satang, because
`17250 / 15000 * 100` is `114.99999999999999` in floating point and the first version read "114%" for a 115% appeal
(found on the dev server, fixed, covered by `state.test.mjs`). The drawing is capped at full; the words say how far
over ("฿17,500 raised, ฿2,500 over the goal").

**4. The raised figure says when it was last updated** (`raised_as_of`, the newest gift's recorded time), as a date
only: `formatDateTime` reads the server's local clock, which on Workers is UTC, so a time would be wrong for Thailand.
It also says it counts only recorded gifts and that a gift from the last day or two may not show. No "pledged" figure,
no estimate.

**5. Graphic photos.** A flagged photo is blurred behind a warning and a "Show photo" button, per photo, per visit;
its thumbnail is blurred too; without JavaScript it stays hidden, which is the safe way round. On cards the cover is
blurred with a label and cannot be revealed there. **A link preview is shown to people who did not choose to look**,
so the Open Graph picture is never a graphic one: first plain appeal photo, else the resident's profile photo, else the
site's default picture.

**6. `/appeals` is not edge-cached** (`NOT_EDGE_CACHED_PAGE_PREFIXES`, beside `/r` and `/e`). It shows a running
total for a named animal; a copy kept ten minutes after an appeal closed would keep asking. The pages are also
`force-dynamic`. Cost: one Worker render per visit, on a low-traffic page.

**7. Where the links went.** The header's "Help with their care" entry becomes "Help a sick resident" → `/appeals`
**while any appeal is live** (or the visitor is on one), and stays the Donate link otherwise; the home page gets a
strip (up to three cards) and its "Help with their care" card follows the same rule; a resident's `/adopt/[id]` swaps
the plain gift line for their live appeal. "Live" for those links means live **and short of its goal**, except the
header, which counts any live appeal. A failed read of appeals drops the strip or line rather than the page.

**8. Thai.** The prose goes through `appeals` translations (`title`, `what_is_wrong`, `treatment_needed`,
`cost_covers`, `outcome_note`) via `localizedField`; the resident's Thai name is used when there is one. Page chrome
is in both dictionaries (`appeals` block). The Thai wording is mine and unreviewed by a Thai reader.

**9. Tax wording.** None. The pages say nothing about deductibility, so nothing implies a gift is deductible; the
e-Donation item decides if and how that changes.

**10. What this PR does not do.** The chosen style on the page works for all three (bar, thermometer, gauge), but the
**share preview is the photo, not the progress picture** (the item says the style should show in the share preview;
that needs a generated image route and is left for a follow-up). The staff side (create, edit, preview, record a gift
against the appeal, close with an outcome, the manual topic "Running an appeal", the release note) is batch 3, so no
appeal can be created by a person yet. Test appeals on dev were inserted by script.

**Verified on dev** (signed out, port 3002): list, detail in all three styles at 0%, 40% and 115%, a graphic photo
blurred then shown, a draft returns the not-found page and is absent from the list, funded and closed states drop the
ways to give, Thai, 375 px (no horizontal scroll), the three links, `og:title` and a non-graphic `og:image`.
