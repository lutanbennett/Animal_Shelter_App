# 2026-10-06 — Purchasing phone: a never-counted item at zero need is named, not listed

**Decision: yes, the phone shows it — inside the existing "Not counted yet" box,
not as a row in the buy list.** The 2IC is phone-only, so the warning the desk
table gained in #388 (`docs/decisions/2026-10-06-purchasing-accordion.md`) had to
reach her too. A row in the buy list would read as "buy this", which is the one
thing not known about it.

**How it appears.** The box's condition widened from `needed > 0` to every
`state === "notCounted"` item, so its count (19 on dev data) includes them. The
body text stays "Listed below in yellow as if none were on the shelf" only while
that is true; when every item in the box is at zero it says nobody has counted
them, and for the zero ones a second line names them: "Not on the list below, but
do not trust 'nothing to buy' until they are counted: …". Names rather than a bare
count, because a count she cannot act on is the failure being fixed. The existing
Count them button (shown only to people who may count) sits under it. Added
`notCountedBodyZeroOnly` and `notCountedZero` to both dictionaries.

**The desk banner needed the same fix.** `page.tsx` used the identical
`needed > 0` filter for `neverCountedBanner`; widened, and "in use" dropped from
the sentence (en and th), since a zero-need item is by definition not in use this
period. The two views now agree.

**Not changed:** a stale count at zero need is still invisible on the phone. The
desk table keeps it, but the brief's item was about never-counted; left as a
backlog follow-up rather than widened here.
