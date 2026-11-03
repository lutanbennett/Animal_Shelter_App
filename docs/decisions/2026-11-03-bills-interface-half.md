# Bills interface half: settings screen, kind dropdown, per-kind form (2026-11-03)

Stream `bills-interface-half`, app only, no migration (the schema is `0304`/`0305`, `0306` for attachments).

**Where the settings screen lives: `/bills/settings`**, not under `/admin`. The `bill_sites` card opens it, a login holding that
card alone has no business in the admin area, and it is a sub-page of Bills so the inbox links to it. Registered in `routes.ts` on
`bills.sites` (menu: false) and in `WRAPPED_WRITE_PATHS`. Tabs: Places (`premises`), Accounts (`bill_accounts`), Kinds of bill
(`bill_kinds`). Every control asks `bills.sites`, which is what the three tables' write policies ask; the page asks it too.
Nothing is deleted: archive and restore (`archived_at`). Nothing is seeded and no count of places is in code (Answer A).

**The dropdown copies `photoCategoriesFor`.** `kindsFor(perms, kinds)` in `src/lib/bills/kinds.ts` offers a kind only when the
login holds the activity of the place that kind is filed: visit (`medical.visits` edit), delivery (`stock.delivery`), job
(`maintenance.bills`), utility (`bills.utilities`), general (`bills.general`). The server action (`resolveKind` in
`src/app/bills/actions.ts`, and `recordGeneralBill`) calls the same function, so control and action cannot disagree. A card keeps a kind it already has
if that kind later stops being offered, so saving cannot silently clear it. The picker is always drawn when any kind is offered, with
"Not chosen yet" first, because an unchosen card must stay valid (today's behaviour). With no kind chosen, matching is exactly as it
was; choosing a kind narrows the suggestions to its route and does not replace the matching.

**Hierarchy.** Parent kinds with children (Utilities) render as an optgroup: "Utilities (any)" first, then each type. Children inherit
their nearest known ancestor's tailoring. A child of an unknown kind is plain.

**Data versus code (Answer B).** The catalogue of kinds is data, added in settings without a deploy. What a kind asks for is code,
keyed by `bill_kinds.key` (`KNOWN` in `kinds.ts`). A kind added in settings has an unknown key and gets the plain form
(cost, date, note) and is filed as a general bill. That is the honest fallback: it widens, it never narrows to a named kind. `Other`
is the plain form on purpose. Every field a kind implies (place, account) is optional.

**Per-kind form.** Place and account appear for maintenance, materials, cleaning products and utilities. Accounts are filtered by the
chosen place and kind. Vet, food and medicine ask nothing extra (they match to a visit or delivery). A general kind (materials,
cleaning, Other, unknown) has a Record button that files a `general_bills` row and moves the photos (`recordGeneralBill`, needs
`bills.general`). A job match now also carries place and account. **Utilities: only the kind, place and account are kept on the
card; filing by month is batch 3**, and the card says so.

**Cards.** `bill_sites` now opens `/bills/settings`. `general_bills` still opens `/bills`, which is now a real destination because
`canUseBills` opens the inbox for `bills.general` and `bills.utilities` (the database already did, `can_use_bills_inbox`, `0305`).
`utility_bills` is left on `/bills`: its own screens are batch 3.

**Found, which the brief's evidence got wrong or missed.** `canUseBills` and `mayFileBill` did not know the two new cards, so a login
holding only `general_bills` could not open the inbox though the database allowed it. Fixed here. Nothing else differed.

**Found, not fixed:** the `utility_types` proposal in the utilities backlog item is superseded by `0305` (utility types are child
kinds); that item's text still describes it and is batch 3's to rewrite.

**Thai** is ours and has not been read by a Thai speaker.
