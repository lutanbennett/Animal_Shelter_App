# Buttons follow cards, third slice: the clinic-visit page's log links (2026-10-27)

Continues `2026-10-27-buttons-follow-cards-resident-rows.md` (#993). Same rule and pattern; server and database checks untouched; no role named; Admin unchanged.

## Fixed

On `/clinic-visits/[id]` the whole Actions block was drawn for `medical.visits` edit, but four of its links open pages that ask a different activity. Each is now drawn only when the login holds the activity its own page asks (read from each page's `requirePermission`).

| Control | Activity |
|---|---|
| Log blood test | `medical.blood_tests` (`blood-tests/new/page.tsx`) |
| Add prescription | `medical.prescriptions` (`prescriptions/new/page.tsx`, `prescriptions/actions.ts`) |
| Log weight | `medical.weight` (`weight/new/page.tsx`, `weight/actions.ts`) |
| Log procedure | `medical.procedures` (`procedures/new/page.tsx`) |

## Every action control on the four pages, and what it asks

- `/clinic-visits/[id]`: Edit link, `medical.visits` edit (matches the edit page). Report Remove and Add pages, `medical.visits` edit (`report-actions.ts`), already gated by `writable`. Bill photos add, `medical.visits` edit (`bills/actions.ts`), already gated. The four links above: fixed.
- `/prescriptions`, `/weight`, `/diets`: **there is no list page.** Each has only `new/` and `[id]/edit/` pages, guarded by `requirePermission`, and a form whose submit actions check the same activity (`medical.prescriptions`, `medical.weight`; diets in `diets/actions.ts`). The rows with Edit/Archive links live in the resident hub tabs, which slice 2 covered.

## Found, not fixed

None. The resident-hub prescription, weight and diet tab row controls were not re-read here.

## Not done

Driven in both directions: **no.** The dev-signin roles hold all four cards, so the hidden side needs a login with `medical.visits` edit but not one of the four; that is a card edit on the shared dev database. Left for manual verification.

## Guard

`src/app/clinic-visits/visit-links-follow-cards.test.mjs` asserts each gate is present and that each target page asks the same activity. Narrow like the others: it cannot detect a new ungated control (no render harness).

Slice 4 remains (outside `/residents` and these pages).
