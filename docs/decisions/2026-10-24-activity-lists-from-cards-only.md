# Activity lists come from cards only (2026-10-24)

Backlog item `activity-lists-from-cards-only`. Rule (Lutan, 2026-10-23, recorded in
`2026-10-23-check-scripts-report-to-nobody.md`): hard-coding is forbidden for activity-based controls.
`cards.ts` is the one place that says what a card grants.

## What the check enforces

`scripts/check-activity-lists.mjs`, in `npm run lint` (so CI), reads files only. A violation is one `[...]`
literal naming two or more distinct catalogue activity keys as bare strings, in a file not on its `ALLOWED`
list. One activity asked per entry (`can(p, "x")` objects, `requireAnyPermission` gates) is not a list.
`ALLOWED` names each exception and why: the definers (catalogue, cards, jobs, routes, fixed-for-now,
prerequisites), labels and prose, the parity/probe/matrix tooling, a page's own gate, and two tests that pin
what `cards.ts` gives a card.

## What it found

`check-2ic-role.mjs` compared her powers to `jobs.ts` plus a draft file minus a hand-written list of seven
activities, the same fault as `check-medical-role.mjs`. It now expands the cards she holds from `role_cards`.
Its bundle line passes; two `residents` lines stay red for the 0249 reason in the decision above (a role holding
a `medical.*` edit reads the record), a separate stale expectation left for its own fix.

Same-principle precedent, one layer up: #882 removed `landingTiles()`/`RULED_CARDS` so a home is only its cards.
