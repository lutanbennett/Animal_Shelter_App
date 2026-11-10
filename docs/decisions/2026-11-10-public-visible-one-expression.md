# One expression for "this animal is on the website" (0350; #w8k4p, #r9wtk)

**Decided by the stream, 2026-11-10, under Lutan's ruling of 2026-11-09:** *"If the animal has an appeal etc then it should be visible for the duration of the appeal and this will override the Ready for adoption flag in terms of precedence."* and *"At this stage Ready for adoption = Show on website."*

## What changed
`private.on_website` (a view of resident ids, not granted to anyone) = `ready_for_adoption` OR a running (`private.appeal_running`) and `text_approval = 'public_ok'` appeal. `public_enclosures` and `public_resident_profiles` both filter through it, so they cannot disagree. `public_resident_cards` is **untouched**: the kennel card must always answer (`check-card-taps.mjs`).

## The profile-page question: it follows the appeal override
His ruling says an appeal overrides the flag for its duration; a visitor who follows an appeal link lands on the animal's profile, so a profile that disappeared while its appeal ran would contradict it. The profile page therefore uses the same expression.

## Why a view, not a function
A function reading `appeals` runs with the caller's rights and anon cannot read that table (the profiles view returned 401 to anon). A view's tables are read with its owner's rights, so no grant and no `security definer` (which `check-hard-coded-security` forbids without a card gate).

## Consequences
- `residents.is_public_visible` is no longer read by any public view. Both write paths still set it equal to `ready_for_adoption` (kept on purpose). **Future simplification, not done here:** drop the column in a separate destructive migration.
- A resident with `is_public_visible = true` but `ready_for_adoption = false` (drift) leaves the profiles view. Production's 281 not-listed residents are the planner's `not-listed-publicly` reading.
- Proved in a rolled-back harness on dev: neither-route listed by neither; running approved appeal, not ready: profile listed; closed appeal: not listed; ready: listed.
