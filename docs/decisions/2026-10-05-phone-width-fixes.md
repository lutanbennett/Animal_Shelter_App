# Phone width fixes: three overflows, two causes (2026-10-05)

The first run of `scripts/check-phone-width.mjs` found three pages scrolling
sideways at 375 px. Fixed at the element, nothing else touched.

- **Stock between counts link** (`/management/medications`, `/management/diets`):
  one shared component, `ActionLink`. `shrink-0` was on every instance; it now
  applies only to the icon-only variant, so a labelled link can wrap its text.
- **Rehome / foster** (`CarerPicker`, `RehomeForm`): the diagnosis in the backlog
  (`min-w-0` on the select's column) was necessary but **not sufficient**. The
  form's `<fieldset>` elements default to `min-width: min-content`, so the long
  option still held the whole column wide until the fieldsets and the picker's
  outer column also got `min-w-0`. The `<select>` itself keeps its natural text;
  it is capped by its column, not truncated by us.

## Proposal, not done: a base-layer fieldset rule

The `fieldset` min-width default is the same trap the `.grid` rule closed, and it
will bite again on any form with a wide select or long text. A one-line
`fieldset { min-width: 0 }` in `globals.css` would remove it for every form, but
it changes layout app-wide, so it needs its own look. Not added here; the
parked *Mobile responsiveness sweep* is the place for it.
