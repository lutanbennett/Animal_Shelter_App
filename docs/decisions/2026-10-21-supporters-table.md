# Supporters get their own table (0244)

Lutan, 2026-10-21: "For the Donors let's keep a separate list", then "not in contacts". `0244_supporters.sql`
is the schema half; `claude/supporters-list-app` builds the list, gift history and inline add.

**Shape.** `supporters`: `name` (required, non-blank), `email`, `phone`, `line`, `note`, `archived_at`,
`created_by`, `created_at`, `updated_at` (touched by trigger). The contact columns mirror what `donations`
already collects (`donor_email`, `donor_phone`, `donor_line`) so the form can copy them across unchanged.
Indexed on `lower(name)` for finding, with a partial index over live rows for the list.

**The link.** `donations.supporter_id`, nullable, beside `contact_id` (not replacing it), `on delete set null`:
removing a supporter never removes a gift, and `donor_name` on the donation still says who gave.

**Who may read it.** Donor contact details are personal data, so `supporters` is guarded by the same activity as
`donations`, `donation.receipt` (Admin, and Management by one cell). Anyone who may see a gift may see who gave it;
no other signed-in role, and no anon grant. Proved on dev: a volunteer-only login sees zero rows and is refused an
insert; anon is refused select.

**Not included, on purpose.** No address or Thai ID (the e-Donation follow-up must store an ID apart, per 0168);
no `Donor` value on `contact_type` (0067 removed it); nothing on `shelter_friends` (business sponsors); no unique
constraint on name or email (two donors can share a name, a household can share an email); no back-fill from
`donations.donor_name` — matching free text to people is a judgement nobody has asked for and would make duplicates.
If a back-fill is wanted, the app half or a chat with Lutan can offer it as a reviewed list.
