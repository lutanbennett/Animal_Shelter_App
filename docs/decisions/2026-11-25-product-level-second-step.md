# The second step is one bare page, owned by the person (#pstep)

**2026-11-25.** Lutan opened the console on `cooperjaidee.org/platform`, pressed a save and was sent to
`/admin/security/verify?next=%2Fplatform`, which wore one shelter's logo and whole menu and said the code
was "for this shelter". His decision, the same hour: *"having the only 2 step validation at the product
level only, it would bounce the administrator back to the shelter that they originated from which is fine
behavior as long as the authenticator is a bare page with no other links / product information on it"*, and
*"in other words we reverse the current behaviour"*. Asked about the lost-phone sentence: *"Keep the lost
phone sentence."*

## What was measured
The authenticator belongs to the **login**, not a shelter (`verify/actions.ts` says set-up "adds a factor to
your own login only"; `trustedTotpFactors()` reads the user's own factors). The sentence "for this shelter"
was never true. There is already one route (`TWO_STEP_PATH`) and one return path (`stepUpHref` carries
`?next=`, `stepUpDestination` returns it), so this is a presentation change.

## What changed
- `PublicPathGate` returns null for the chrome on `/admin/security/verify` (a string literal, because
  `two-step.ts` is server-only and the gate is a client component).
- New `src/app/admin/security/verify/layout.tsx`: tab title "2-step verification" and noindex.
- The "Back to Settings" link is gone (a bare page has no links), with its two dictionary keys.
- `codeSubtitle` no longer says "for this shelter" (English and Thai together).
- The lost-phone sentence stays. No product branding was added; the address bar says where you are.

## The tab title (the part a future change will break first)
The root layout titles every page from `shelterNames()`, which reads the shelter the **host** maps to. A
page that hides the chrome but sets no title still names a shelter in the tab, and on the platform host that
is whichever shelter `cooperjaidee.org`'s row points at. The title is therefore set in this route's own
layout with `absolute`, so neither the root title nor a template can add a name. Do not remove that layout
when tidying; hiding the chrome alone does not make the page bare.

## Deliberately not touched
`shelter_hosts`, the host mapping and `wrangler.jsonc` (that row may be what makes sign-in work on the
platform host; which shelter it points at is not established). Enrolment, factor approval, `app_metadata`
and how a code is verified. No migration.

## Not proved
A real second step needs a real authenticator code, which no stream has. What was driven is in the test plan.
