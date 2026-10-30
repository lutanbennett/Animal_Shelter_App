# Retire the `add_while_recording` card (0287)

Lutan, 2026-10-30: *"Missing medication added by admin only as part of system configuration."* That is already how the app works
(`reference.types` is granted by no card, so the six `/admin/*` reference screens are Admin-only through the `isAdmin` short-circuit).
The card granted an insert right no screen draws a control for: a card that does nothing. Deleted by `0287` (role_cards, card_grants,
card_includes, card_features), the same shape as `0282`. Nothing was added to `reference.types` and nothing was given to Admin.

## The activity stays (scope chosen with Lutan in chat)
The brief said to drop `reference.add_while_recording` too "if nothing else grants it". No card grants it any more, but it is still **asked**
by the medication, frequency and procedure_types RLS policies (0148, 0151) and by `scripts/lib/permission-probes.mjs`,
`scripts/lib/readonly-checks.mjs`, `check-perm-convert-stock-and-lists.mjs` and `check-price-free-pickers.mjs`. Retiring it means rewriting
those policies and editing `scripts/lib/`, which this batch forbids. Asked; Lutan chose card only. With no card granting it the activity is inert.
Follow-up: retire the activity (policies + probes) as its own item.

## `roles-draft/draft-1.json` / `draft-2.json`
They are the Director's draft role cells (`resolve.ts`, `load-role-draft.mjs`), a frozen artefact keyed by **activity**, not card. The activity
stays, so they are untouched.

## One PR, not schema-then-app
`npm run lint` compares `catalogue.ts` with the dev database, so a migration applied to dev ahead of its `src/` half reddens every stream
(#1100). Migration and `src/` go together. The catalogue keeps the activity, so only the card sites changed.

Applied to dev 2026-10-30 ~10:03 UTC. `check-card-grants`, `check-cards-count` (now 39), `check-card-walkthrough` (regenerated) and
`check-hard-coded-security` (clean) pass. `role-cards-coverage` lives in `check-production.mjs` (production reads) and was not run.
