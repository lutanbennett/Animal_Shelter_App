# `donation.receipt` stays yes/no (`#v3qlt`)

**2026-11-14.** Question: should `donation.receipt` become levelled (read / edit), or should a separate totals activity be added, so a card can show donation figures without receipt-level access? Decision: **leave it as it is, change nothing.**

## What was read

- **The activity.** `catalogue.ts:150`, `kind: "yesno"`. The database half is one cell: `0168` has donations, their lines and the receipt register share it, and `issue_donation_receipt()` asks it too. The existing write probe is in `scripts/lib/permission-probes.mjs` (the catalogue field `probes: []` is not where probes live, so "nothing tests it" is only half true: the edit side is probed; a read probe has no fixture row).
- **The cards.** Two carry it: `donations_receipts` and `run_appeals`. The `run_appeals` comment says it is bundled because the appeals pages show money raised only to a login holding it, so that card already means "may see gifts".
- **The callers.** Thirty-odd files in `src/` ask it (donations pages and actions, the donors pages, four `campaigns` files, `cashflow/page.tsx`, receipt PDF routes, `api/documents/[fileId]/route.ts` through `can_see_drive_file()`, `recent-changes.ts`, drive client), plus migrations `0168`, `0176`, `0177`, `0186`, `0244`, `0274`, `0286`, `0317`, `0324`, `0362`.
- **History.** No earlier levelling, shaping or revert (`git log -S`). The cashflow income decision (`2026-11-13`) already recorded why it did not widen the activity: existing screens ask it as yes/no.

## The three options

1. **Level it (read / edit).** Every caller above must be re-read and re-levelled, the document route and `can_see_drive_file()` included (a `read` asked where `edit` was meant leaks a receipt), and the SQL must agree. Existing holders keep yes/no meaning, so it is a rewrite of every cell and policy for no behaviour change today.
2. **Add a separate totals activity.** Needs a new activity, a card that holds it (a card may never grant nothing), a database function returning monthly totals without opening the `donations` table, `cards.ts` counts, both dictionaries, probes and the card checks, in one change. The cashflow query would move off the table onto that function.
3. **Leave it.** Chosen.

## Why leave it

- **No shelter need is on record.** Nothing is broken and no card has been asked for that sees totals without receipts. Lutan will rebuild card assignments himself; a card that would be held by nobody is exactly the state the card checks exist to prevent.
- **The cost is large and the risk sits on the document route**, for a capability nobody is waiting on.
- **Cheap to revisit.** Option 2 changes no caller that works today, so it can be built the day a shelter wants such a card, as its own change with its own migration. Today's coarse behaviour (income figures need gift access) is the safe direction: it never shows more than the register does.

Cashflow's income side therefore keeps asking `donation.receipt`. No migration, no card, no caller, no dictionary changed.
