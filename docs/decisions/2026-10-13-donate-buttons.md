# Donate page: a button for each way to give (the app half)

2026-10-13. Backlog: *Donate page: a button for each way to give*. Builds on `0191` (see
`2026-10-12-donation-channels.md`). No migration.

## The company-domain rule is written twice, and they must agree

`src/lib/links/donation.ts` checks a link before it is saved; `0191` repeats the same patterns as a table check.
The app's check gives the person a sentence; the database's is for a client that skipped it. Both only allow
subdomain labels between `https://` and the company's domain (`paypal.com`, `paypal.me`, `donorbox.org`,
`wise.com`), followed by `/`, `?`, `#` or the end. The app checks the address **as it will be stored** (after
`new URL()` has normalised it), so a bare `wise.com/pay/me/x` is accepted and stored as `https://wise.com/...`,
while `https://paypal.com@evil.test/` keeps its `@` and is refused.

A host-suffix test (`hostname.endsWith(".paypal.com")`) was the obvious alternative and was not used: it is one
step from a bug with userinfo and ports, and the regex is the same one the database runs, so there is nothing for
the two to disagree about. Proven by `src/lib/links/donation.test.mjs` (18 trick addresses) and, against the real
table, by `scripts/check-donate-buttons.mjs`. **If a host is in doubt it is refused**: a good link refused is a
support question; a bad one accepted is a theft. Adding a company, or a PayPal domain such as `paypal.me`'s
sibling, means editing both places and both tests.

## Kind is fixed once a way exists

Editing a way changes its fields, not its kind (PayPal cannot become Wise). Changing kind would let a saved link
quietly move to a kind with a different domain rule; delete and add instead. The save action also matches on
`way` when updating.

## Hidden is not deleted

Hide keeps everything typed (Settings still shows the row). The row disappears from `/donate` because the
database view leaves it out; the page does no filtering of its own.

## Names, not logos

Buttons carry the company's name in words and a plain "opens in a new tab" icon. PayPal, DonorBox and Wise each
publish brand rules for logos; none were checked, so none are used.

## Copy has a fallback

`navigator.clipboard` refuses on some browsers and pages (the in-app browser used for testing did). `CopyButton`
falls back to select-and-copy, and if that fails too it says so and the number is on screen to press and hold. It
never says "Copied" unless the browser said it worked.

## Recent changes

`donation_channels` joined the audited tables on Settings → Recent changes (name = the way's label), because the
manual says every change is listed there and a bank account number changing is exactly what the Director would
want to see. It is **not** undoable from there (not in `UNDOABLE_*`).

## The seeded page text still names Wise/PayPal

`0059` seeded the Donate page text with "From outside Thailand: (Wise / PayPal / other details)". That line is
data, not code, so this PR does not remove it. Once ways to give exist it is redundant and should go, in
**production and dev**, edited on Settings → Website → Pages → Donate. Filed on the backlog branch.

## Release note

None yet: the buttons only show once someone enters the ways to give in Settings on production, so a note now
would promise donors something that is not there (`2026-10-11-release-note-truth-rule.md`). The note goes in the
change that closes that step.
