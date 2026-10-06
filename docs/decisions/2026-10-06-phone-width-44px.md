# 44 px tap targets in `check-phone-width.mjs`: the boundary is the component, not a list

2026-10-06, `claude/phone-width-44px`. Backlog: "Add 44 px tap targets to
`check-phone-width.mjs`, if `icon-buttons-rest` wants it". That stream declined
(2026-10-05) because a tap-target check needs an exemption list of judgement
calls (inline links, list name links, the header language switcher) and a list
either fails routine pages or needs upkeep. This is the answer to that, and it
ticks the item.

## The rule

**An action is something a shared component renders. Only those are measured.**

`ActionLink`, `ActionButton`, `RowActionLink` and `RowActionButton` each stamp
`data-action="<Component>"` on the element they render (a bare attribute, no
behaviour, nothing a user sees). At 375 px the check finds every visible
`[data-action]` and **fails** if its width or its height is under 44 px
(half a pixel of slack for sub-pixel layout). It names the page, the component,
the control's label, the size, and the roles and languages that saw it.

There is no exemption list, because there is nothing to exempt. A link in a
sentence, a name link in a list or a table, a nav entry: these are plain
anchors, never carry the attribute, and are never looked at. The audit rule the
four icon-button areas applied by hand (*navigation stays a text link; an action
becomes a button*) is now what the check enforces, and it is enforced by how the
element was built rather than by a list someone keeps in step with the pages.

The two named exemptions that were left (the header language switcher and the
maintenance wizard's step dots) were already raised to 44 px by #379, so no
rule was needed for them either.

## What it does not fail, and says so

The brief asked us to check that "every action goes through a component". It
does not: 114 `.tsx` files contain a raw `<button>`, against about 70 that use
one of the four components. Some are not actions in the sense that matters
(steppers, chips, calendar cells, map handles), and some are (the Save changes
button on the resident edit page is a bare `<button>` at 36 px).

A bare `<button>` is therefore a judgement call and is **printed as a note, not
failed**: `"<label>" (in header|main) W x H px on N page(s)`, folded so that the
app header's buttons appear once rather than once per page. A note is a defect
nobody has decided about; fixing it means either moving the control onto a
component (it then fails if it regresses, which is the point) or deciding it is
not an action. `<a>` elements are never noted: an anchor is navigation unless it
was built as an action, and that is exactly what the components are for.

This leaves a **named blind spot**, not a hidden one: an action built by hand
as an `<a>` styled like a button is not seen at all, and a bare `<button>` is
seen but not failed.

## Why not the alternatives

- **Measure every `a, button` and exempt by rule** (inline, in a list, in a
  table…): the exemptions are the judgement calls `icon-buttons-rest` refused to
  own, and a new page type needs a new exemption.
- **Match on classes** (`h-11`, `min-h-11`): measures how the component was
  written, not the result, and misses a component that is overridden.
- **Fail every bare `<button>`**: red on routine pages (see counts in the test
  plan), which is the failure the width check was built to avoid. A red result
  must always be someone's mistake to fix.

## Where it runs

Same as the width check it extends: by hand and in the release smoke test, never
in `npm run lint` or `scripts/gates.mjs`, because it needs a server, a browser
and seeded rows. It is the same run: one pass measures overflow and tap targets.
The smoke-test line now ends on two sentences, not one.

## Findings

Recorded in the test plan and filed on the `backlog` branch as evidence for the
parked *Mobile responsiveness sweep*; the guard is the deliverable, not the
fixes.
