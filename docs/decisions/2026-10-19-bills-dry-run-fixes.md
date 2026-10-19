# 2026-10-19 — Four Management defects from the 2026-10-18 dry run

**A bill turned into a delivery lost its cost and never attached.** Two causes, both small:
`deliveries/page.tsx` read `?cost=` with a pattern that had lost its backslashes (`/^d+(.d{1,2})?$/`),
so no amount ever matched; and `recordDelivery` never returned the new row's id, so the wizard's
`if (result.id && cardId)` never ran and the bill stayed waiting. The parser is now
`src/lib/bills/cost-param.ts` with a test; the insert selects `id`; changing the kind in the wizard
keeps the cost. The same lost-backslash pattern exists at `src/app/admin/security/actions.ts:294`
(`/^d{4}-d{2}-d{2}$/`) and was left alone as out of scope; it should be looked at.

**Likely matches.** Deliveries were already queried (only those with no cost, last 14 days); what
kept them off the card is that up to 30 jobs sort by nearness and the card shows 4. The card now
takes the nearest of each kind first. Not confirmed against the dry-run data: if the delivery there
already had a cost, the `cost is null` filter is the cause instead, and is left as is on purpose
(matching writes the bill's amount over the delivery's cost).

**Appeal picker.** Uses the donation form's `ResidentPicker`. Ineligible = Deceased, Adopted and
**Outreach**. Outreach is the cautious reading; Lutan can widen it by editing the list in
`management/appeals/new/page.tsx`.

**Publish/Unpublish.** An `ActionButton` with the word (the icon-only `RowActionButton` is for
actions with no word needed); the move arrows stay icons.
