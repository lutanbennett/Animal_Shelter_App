# A link must ask its destination's activity: a static check (backlog #79sqf)

Stream `destination-activity-check`, 2026-11-09. Nothing here is a decision for Lutan.

## Step zero: not already built
`check-menu-coverage.mjs` (per role, reachability) and `check-permission-catalogue.mjs` (page guard vs registry) exist.
Neither compares a link's gate with its destination's activity. `git log -S destination -- scripts/` found nothing relevant.

## Feasibility (deliverable 1)
**Yes for links, no for notices and for control-vs-action mismatches.**
- (a) The activity a link is gated on: readable. TypeScript AST, walking the link's ancestors for `cond && …`, `cond ? … : …`,
  `if (cond)` and early `if (!cond) return`; a condition resolves to `can(perms, "act", lvl)`, a same-file const, or a prop name traced to
  `name={can(...)}` at the call sites of the component that holds the link. A prop passed through a second component is **not** traced.
- (b) The activity its destination asks: readable from the destination `page.tsx`'s `requirePermission` / `requireAnyPermission`
  (106 of 168 pages), else the route registry. 141 links go to pages with no static activity and are counted, not judged.
- F1 (a link): caught. Re-introduced by removing `&& canEnclosure`, the check named the line and `facility.enclosures`.
- F2 (a notice): **not catchable**; prose carries no activity. F3/F4 (control gated on the wrong activity): **not caught**; needs
  gate -> server action -> action's own `can()`, a second resolver not built. F5/F6 are links and are in scope.

## Result and precision
341 in-app links; 160 resolved OK, 141 destination has no static activity, 16 UNRESOLVED (printed by name), 24 findings.
Runs in about 9 s. I read 8 of the 24 against the source (ClinicHub x2, EnclosureGrid, memes -> reels, stock-usage -> deliveries,
MakeMemeLink, ContactsTable, admin/status) and all 8 were real, so about 100 % on that sample; not measured beyond it, so no rate is claimed.
Known imprecision: an OR condition counts as gated when any branch matches (misses), and a shared component is judged against every page
that renders it (can flag a link some host never shows).

## Blocking, with an allow-list
The 24 findings are real unfixed faults, so a blocking check would be red on day one. It blocks on **anything not on
`docs/destination-activity-allowlist.json`** and on **a listed entry that stops being a finding**, so the list can only shrink. CI job
`destination-activity`. Entries are faults to fix, never rulings. Admin sits outside the card system and nothing here reads a role.

## Does it make the 44-page drive unnecessary? Only partly, so #79sqf is NOT ticked
It covers the link half of the 18 cross-activity pages. It cannot see notices or control-vs-action mismatches, which is what the 26
read-opened pages need. Title rewritten to say that. Cost: the check ran in one stream; the three walks were about 880k of context.
