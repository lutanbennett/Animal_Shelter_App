# 2026-10-16 — Appeals, the staff side: moving gifts across, closing, and the preview

**Context.** Part (3) of Sponsorship drives (backlog, Lutan 2026-10-09, priority 2026-10-15): a person can now start, edit,
preview, publish, fund, close and delete-if-draft an appeal, choose its photos, record a gift against it and move
resident-designated gifts onto it. The schema (`0210`, #667) and public pages (#672) already decided what counts as raised,
how Medical photos stay off, and how the page ends. This records what the staff half added. No migration.

**1. "Move across" is one UPDATE of the same donation row, never a copy.** A gift has a single `designation`. Moving sets
`designation = 'appeal'`, `designation_appeal_id = <appeal>` and clears `designation_resident_id`, in one statement that also
filters on `designation = 'resident'` and `designation_resident_id = <this appeal's resident>`, so only that resident's gifts can
be moved and a gift cannot sit in both places. The raised figure counts only `designation = 'appeal'` (0210 decision 1), so
the total across "for the resident" and "for the appeal" is unchanged by a move. Proved on dev with real rows: before, ฿3,500
for the resident (2 gifts) plus ฿6,000 on the appeal = ฿9,500, public figure ฿6,000; after the move, resident ฿0, appeal ฿9,500
(3 gifts), public figure ฿9,500. Taking one ฿1,000 gift back out gave resident ฿1,000, appeal ฿8,500, public ฿8,500. Receipts are
untouched (a receipt prints donor and lines, never the designation) and `audit_donations` records each change.
The way back ("Take out") exists because a gift counted on a public page by mistake needs a remedy; it returns the gift to
the appeal's resident and never deletes it. Both refuse once the appeal is closed.

**2. A closed appeal stops collecting, in three places.** The public page (already, `showsWaysToGive`), the donation form (a
closed appeal is not offered, and the action refuses it: a late gift would change a total the page has told the public is
final), and the move actions. A late gift for a closed appeal is recorded as general or for the resident.

**3. Status buttons, and what each does to "published".** Publish: draft → live, `published = true`. Take off the website:
back to draft, `published = false` (0210's check forbids a published draft). Mark goal reached: live → funded, still
published, no longer asking. Ask again: funded → live. Close: needs an outcome, stays published so the page can say how it went.
A closed appeal never reopens (it would have to clear its outcome); a draft is deleted, not closed, and 0210's
`on delete restrict` refuses a draft that somehow has gifts. Publishing refuses an appeal with neither "what is wrong" nor
"the treatment": a page asking strangers for money must say why.

**4. The preview is the public page, drawn by the same component.** `AppealView` was extracted from `/appeals/[id]`; the staff
route `/management/appeals/[id]/preview` renders it from the staff copy of the appeal, and requires `appeal.run`. A draft is never
served from `/appeals/[id]`, which reads `public_appeals` and shows not-found for anything unpublished; this was checked by
fetching the draft's public address signed out (the body is the not-found page and the title appears nowhere; dev answers
200 for a streamed not-found, as it does for the other not-found pages). On a draft the preview hides the public share
buttons, because the address they would share does not work yet.

**5. Access is Admin only, as 0210 left it.** `appeal.run` has no `role_permissions` row, so Admin holds it and Management
does not until an Admin grants it in Settings. This stream did not widen anyone's access. The brief's "as Management" is
therefore a Settings change the Director's login needs, not something built here. The gifts section needs `donation.receipt`
as well; a login with `appeal.run` alone sees the appeal but is told it may not see the figure, instead of a zero that is
really "not allowed to look". Moving gifts asks for both.

**6. Photos.** The editor offers only non-Medical image files of the appeal's own resident (the page filters; 0210's trigger
and the public views refuse the rest). A photo temporarily filed under Medical on dev vanished from the picker. The per-photo
override for Medical photos stays unbuilt. A "Distressing" tick per photo blurs it publicly and keeps it out of share previews.

**7. Thai.** The staff screens are in both dictionaries (`appealsAdmin`); the Thai is mine and has not been read by a Thai reader.
Appeal prose goes through the existing translations queue on save (0210 triggers).

**Still open, and not this stream's to close.** (a) The Director's yes on the over-raising wording (`appeals.extraGoes`).
(b) A Thai reader's review of the Thai wording, public and staff. (c) The progress style in the generated share-preview image.
The backlog item is ticked with these three named.

**Verified on dev** (port 3005, a throwaway Admin): create (a bad link refused naming line 2), preview of a draft, public
address of the draft (not found), photos with a cover and a distressing flag, publish (public page served, warning shown),
move/take-out with the totals above, close with an outcome (public page shows "Appeal finished" and the outcome, no "Help needed",
no ways to give). Not driven in the browser: the donation form's appeal picker end to end, because the Browser pane was
hidden and a hidden pane did not finish loading that page's scripts; covered instead by `form.test.mjs` for `checkDonation`
and by reading the action. A manual pass of that one form is left in the test plan.
