# The product lockup goes on the platform's own door, not on a shelter's site

**2026-11-20.** Lutan: *"add the lockup to the public website header"*. Asked which header,
he chose **cooperjaidee.org's** — the platform's own front door — over the shelter site's
header and over a "powered by" line in the shelter site's footer.

## Why the question had to be asked rather than guessed

There are two things in this repository that could be called "the public website header", and
they want opposite answers:

- `src/app/adopt/PublicHeader.tsx` is **a shelter's** public website header. Its name is
  `t.header.appName`, which is the string `"{shelter}"` — filled in per tenant — beside the
  shelter's own logo. Putting the product's lockup there would tell a visitor who went looking
  for their local shelter that they had arrived somewhere else, on every tenant's site at once.
- `src/app/platform/layout.tsx` is **the product's** front door. `PLATFORM_HOST` is
  `cooperjaidee.org` in production, and its header said `Cooper Jaidee platform` in plain text.

The literal reading of the request was the first one. It was also the one that would have been
wrong, and wrong in a way that is hard to notice from inside a single-shelter dev database —
which is exactly the shape of fault `#hostx` and `#cjred` were filed about this week. So it was
put to him in one question with both readings named.

## What was built

A `CooperJaideeMark` and a `CooperJaideeLockup` in `src/components/CooperJaideeLockup.tsx`.
Three choices in it are not obvious.

**The mark is one file for every background.** The heart is a real hole —
`fill-rule="evenodd"` on a single path that draws the disc and then the heart — and the ring is
`currentColor`. So the mark takes its heart and its ring from whatever is behind it: on the
app's dark surface the heart reads dark and the ring pale; on a cream ground the heart reads
cream and the ring dark. Both were checked in the browser, not inferred from the fill rule.

The alternative was the brand sheet's three colourways as three components, which is what the
flat files on the brand folder are. That is right for files someone hands to a printer and
wrong inside an app with a theme picker: the day the theme moves, one of the three is wrong and
nothing says so.

**The name is live text in the display face, not an image and not outlines.** It stays sharp at
any size, can be selected, and costs no request. The outlined lockup exists for print, where
there is no font to rely on; in the app Fraunces is already loaded for every page, so the
reason for outlines does not apply. The two words are `aria-hidden` and the whole block carries
one accessible name taken from the dictionary, so the name stays artwork while the sentence
around it stays translated.

**The mark is drawn at 40px, not 32.** At 32 the tag's ring — an open circle with about 1.9px
of stroke around a 1.6px hole at that size — closes into a solid dot, and the mark reads as an
amber blob with a speck above it. This was found by looking, not by reasoning: the brand sheet
already said the ring closes below about 20px, and the useful correction is that **in a header
bar the threshold is twice that**. The header grew from roughly 48px to 64px as a result, which
also brings it into line with the public site's 68px bar.

## What was deliberately not done

The shelter site's header is untouched, and so is its footer. A "powered by" lockup there was
offered and not taken; if it is wanted later it is a small change to `PublicFooter.tsx` and this
component already covers it.

## One thing found on the way and not fixed here

`src/app/adopt/PublicHeader.tsx` serves `/lca-logo-transparent.png` — one shelter's logo file —
to **every** tenant's public website. A second shelter's own site would show the first
shelter's logo beside its own name. This is the same fault the favicon had until #1774 fixed it,
and it is left here on purpose: the fix is not a swap but a per-shelter logo upload, which is
its own piece of work. It is on the backlog.
