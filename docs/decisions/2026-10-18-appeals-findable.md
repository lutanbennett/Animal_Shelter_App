# Appeals made findable (2026-10-18)

- **Public:** the footer and the Get involved menu always link Appeals. The header
  keeps its old rule (Appeals while one is live, Donate otherwise); with none live
  Appeals now follows Donate in the same menu. `/appeals` with nothing open says so,
  lists the recent finished ones and points to Donate. Nothing touches the public-site
  lock: `/appeals` was already a public prefix and is unchanged in that respect.
- **Staff:** `/management/appeals` is `menu: true` on its existing `appeal.run` route
  entry, so the menu and the page guard are the same check. A line on Settings → Website
  links to it, shown only to a login holding `appeal.run`.
- **New card, "Run fundraising appeals" (`run_appeals`), card twenty-three.** Bundle:
  `appeal.run` plus `donation.receipt`. `donation.receipt` is the only activity the appeals
  pages use to show what has been raised (`canSeeGifts`), and recording or moving a gift
  asks for it too; without it the page opens but shows no figures. The cost: a role given
  this card can also issue donation receipts. That is the narrowest bundle that makes the
  card usable, and Lutan can instead give the two as extras.
- **The card is granted to no role.** Lutan ticks it in Settings → Who does what.
  Nothing hard-codes a role.
