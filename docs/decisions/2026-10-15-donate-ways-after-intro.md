# Donate page: ways to give go after the intro paragraph (2026-10-15)

- **Changed `SitePageView`, minimally.** `after` (used only by `/donate`) became `afterIntro`.
  When given, the body is split at its first blank line: intro, the slot, then the rest.
  Every other page passes nothing and renders exactly as before, so the coming inner-page
  rework meets one optional prop, not a new layout. Composing the Donate page separately
  was rejected: it would have copied the header, hero, English-only note and contact card.
- **Link labels** are dictionary strings keyed by `way` (paypal, donorbox, wise); `other`
  keeps the Director's own label. The company is in brackets, the verb first.
- **Empty state:** with no way configured the page shows a sentence pointing to the
  contact card instead of nothing.
- **Monthly default skipped.** A search found no documented DonorBox link parameter for
  a default interval (it is a form-builder setting), so none was invented.
- The Director's half (bank and Wise ways, notes, deleting the pasted block) is hers.
