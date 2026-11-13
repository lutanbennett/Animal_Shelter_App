# View foundation papers: a read-only card for the foundation's papers (2026-11-13, #t1zyc B, #98se8 residue a)

## The card
Key `view_foundation_papers`, label "View foundation papers", migration `0368`. It grants `foundation.papers` at **read** (level 1) and opens
`/management/foundation-papers`, in the Finances and reports feature. Key chosen to match the read-only precedents `view_expenses`, `view_medical`,
`view_translations`. No new activity: `foundation.papers` is a level activity, so it already had a read.

## What it covers, and why it excludes the ID copies
Papers only. `foundation.id_copies` (board members' ID cards and household registrations) is its own activity and card, called a much narrower audience
by 0362. An outside accountant has no reason to hold named people's identity documents, and bundling them would be a privacy harm no check catches.
If the shelter ever wants her to have them, that is a second read-only card and Lutan's explicit choice.

## Controls on `/management/foundation-papers`
Already gated before this change, so nothing needed restructuring: the file form, and the per-row Remove, show only when
`can(perms, "foundation.papers", "edit")` (the page's `canEdit`, defaulting to false in `PapersPanel`); the actions ask `activityFor(category)` at edit
and the table's policies ask edit for insert and delete. The Open link needs read only. Driven: a login holding only the new card sees the list and
Open, no form, no Remove. Found, not fixed: none. The board-ids page refuses that login (it asks `foundation.id_copies`).

## Residue (a), driven
A login holding only `view_expenses`: `/api/documents/zz-fixture-receipt` (a file on a general bill) passed the permission check and returned 502 from
Drive, because the fixture's id is fake; `/api/documents/zz-fixture-paper` returned 404 (it cannot see the foundation papers). So an attachment on a
bill opens for the read-only money card. Limit: no withholding-specific document type exists in the code, so I tested a general bill's file; stock
delivery, utility and maintenance bills use the same `bill_owner_can()` branch (0317) but I did not drive each.

## What remains
`#t1zyc` (A) and the assignment of both cards are Lutan's. The card's migration must reach production with the next release. Dev's `check-card-grants`
reports one failure, `ASSERT wrong refusal: role_cards.needs_an_approver_first` from the 0365 harness (photo-approver scenario on the shared dev
database), unrelated to this card: the card_grants, card_includes and per-role lines it prints before that are all ok.
