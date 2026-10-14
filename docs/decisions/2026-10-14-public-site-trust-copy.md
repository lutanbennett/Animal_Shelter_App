# Public site: promise what Donate delivers, hide a 0 or 1 tile, a give line on stories (2026-10-14)

Three of the four review findings folded into `public-site-trust-copy`
(`docs/public-site-review-2026-10-13.md` §6.2, §3.7, §6.4). The fourth, §5.6
"since <year>", was **not** built here — see the end.

## Code or data, for each

The brief asked this to be written down, because a change to page-body
**data** is invisible wherever someone has already saved a body, and a change
to a **dictionary string** is not.

| Finding | Where the words live | What changed |
|---|---|---|
| §6.2 Donate promise | **Code.** All four lines are dictionary strings (`home.helpFeedThem`, `home.howToHelp.care`, `nav.care`, `adopt.profile.careHeading/careLink`), not `site_pages` bodies. | Strings renamed and reworded in both dictionaries; the hero button now links to `/donate#ways-to-give`. Nothing on Settings → Website changes. |
| §3.7 Impact band | **Code.** `src/lib/site/impact.ts` and the order of two spreads in `src/app/page.tsx`. | `impactStats()` drops a `public_shelter_stats` tile below `LIVE_TILE_MIN = 2`; `page.tsx` spreads the baseline figures first. |
| §6.4 Give line | **Code.** New dictionary strings `ourWork.helpMore` / `helpMoreLink`, rendered by `src/app/our-work/HelpUsDoMore.tsx` inside the story's `<article>` (so before "More of our work") and under the list. | The line only shows under the list when there are stories to show; an empty list keeps its empty-state text alone. |

No Thai went through the translation queue: every new line is a dictionary
string, so both languages ship together.

## What the "below 2" rule does to the baseline tiles

Nothing. The rule is inside `impactStats()`, which reads only
`public_shelter_stats` (today's counts). `impactFigureStats()`, which reads
`public_impact_figures` (the Director's baseline plus the count since), is
untouched, so a baseline figure shows whatever its total is, as
`docs/decisions/2026-10-07-public-impact-figures-declared-public.md` and the
0156 header intend. A baseline figure already has its own "not public until
entered" rule in the view, and nothing here changes which figures are public,
only the order and whether a live 0 or 1 is printed.

The rule is a constant so the threshold is one edit if it ever moves; it was
not made a setting, because it is a presentation choice, not a fact about the
shelter.

## Why the hero says "Help feed them" and not "Donate"

The review offered either. The header already carries a "Donate" button on
every page; a second "Donate" beside "Meet the animals" would be the same
word twice in the same viewport. "Help feed them" says what a gift does and
goes straight to the ways to give (`#ways-to-give` on `DonateWays`). When the
§6.1 item gives DonorBox a monthly link, `home.helpFeedThem` is the string to
turn back into "Give monthly", pointing at that button.

"Sponsor a resident" is gone from the menu, the home card and the animal page
because sponsorship does not exist. It comes back with *Sponsorship drives for
sick residents* (backlog), not before.

## §5.6 "since <year>" was not built, on purpose

The brief ruled "Migration: none. If one looks like it needs a column, stop and
say so — 0195 is meant to stay free." `impact_baselines` has no column that
holds the year counting began (`baseline_date` is the date the figure is true
up to), so the label cannot be rendered honestly without one. Per the
schema-first rule it is two streams: a `*-schema` PR adding `counting_since`
(or `since_year`) to `impact_baselines` and the view, then the Settings field
and the label. It also needs the year from the Director, which puts it with the
nine review items that wait on her words. The backlog item stays open with a
note saying so.
