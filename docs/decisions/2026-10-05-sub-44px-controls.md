# The last two sub-44 px controls (2026-10-05)

Closes the backlog item under *Mobile*. Both controls are shared, which is why
this is its own PR rather than part of the icon-buttons sweep.

## Language switcher

The `app` and `site` tones differed only because the site one was designed later
for a phone; nothing about the app header needed 24 px. `app` now has 44 px
segments on a phone and 36 px from `md` (the rule `ActionButton` and `RowAction`
settled), and the pill's own padding is gone so the pill *is* the segments.
Measured on the login page: 44x44 at 375 px, 44x36 at 1280 px (was 24 px).
`site` is unchanged.

## Wizard step dots

They are real buttons (jump back to a visited step, with `aria-label`
"Go to step N"), not decorative, so they were grown, not made inert: `min-h-11
min-w-11` on a phone, 36 px from `md`. The component is `WizardProgress`, shared
by maintenance, resident intake and the Shelter Friend wizard, so all three
changed. Not measured in a signed-in browser (see the test plan).

## For whoever designs tap-target rules

The header switcher was named on `icon-buttons-rest`'s exemption list for a
future `check-phone-width.mjs` tap-size check. It no longer needs an exemption.
