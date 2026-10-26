# Card review 2, the app half (cards 11-21 and the My tasks entry) - 2026-10-26

Clause (b) of the backlog item *Card review decisions, cards 11-21*. The database half is `0268` (`2026-10-26-card-review-2-schema.md`).
No migration here. Cards only; Admin untouched; no role key named.

## Built

- **Appointments entry (1e, Lutan: "Repoint it").** `NavPane` asks `loadClinicScope()`: a login whose own record has clinic links
  (a doctor) keeps `/appointments`; everyone else gets the same entry pointing at `/upcoming-visits`. The test is the clinic links
  (data), never a role name. `/appointments` itself is untouched.
- **Card tiles that opened a refused page.** View contacts opened `/management/contacts` (asks `contacts.directory` at edit, which it does not
  hold) so its tile would not draw; it now opens `/contacts`. Publish Shelter Friends opens `/management/shelter-friends`
  (`friends.manage`) for the same reason. `docs/card-walkthrough.md` regenerated.
- **Recurring jobs: only the name.** `appUserName()` (display name, else what precedes the @) replaces `appUserLabel()` on the page and in the
  "cannot do this page" message, so an address is never shown.
- **Website.** The page opens at `website.content` read; the tab strip shows only the Gallery tab to a login that cannot edit the page
  itself (`WebsiteTabs` takes a `tabs` list). The strip's upload, move and remove ask `website.gallery`, and a login without it sees the
  strip with no buttons. Every added photo needs an English description (Thai optional), stored in `site_content_photos.alt` / `alt_th`.
- **Enclosures.** The resident list reads `resident_who_and_where` (not `residents`), so a who-and-where-only login sees each resident's
  photo and name. Clicking through opens the resident only for a login that reads the record (his: "deeper permissions by clicking on it
  will be based on additional cards").
- **Dashboard.** Figure links (residents, no-microchip, vet visits, maintenance) and the monthly report's names link only where the login
  opens the target page.
- **Menu entries.** Residents is already hidden unless `resident.record` is readable (#965), which covers the Recurring jobs, Dashboard and My
  tasks "hide the Residents entry" decisions; nothing further was needed in `NavLinks`.

## Not built, and why

- **The Website hero photo (7/8).** It is a column of `site_content`, and `site_content` is writable only under `website.content` edit by
  its row policy. Letting the photo card set it needs a database function or a policy change, i.e. a migration, which this stream may not
  carry. It stays with the full Website card. Follow-up for the next schema slot.
- **The Donations appeals list (9). DECIDED: a names-only view.** Both ways of reading an appeal without write need schema (the policy
  asks `appeal.run`, a yes/no): a read level on `appeal.run` would change its kind for every holder and policy, and a names-only view
  changes nothing about who may write. So: a view `appeal_choices` (id, title, resident name, status, target) over open appeals, readable
  by whoever holds `donation.receipt`, and the donation form reads it instead of `appeals`. Until that migration lands the form keeps its
  existing sentence that no appeal can be chosen, and `recordDonation` still checks the appeal under RLS. Filed on the backlog.
- **Buttons.** Driven through the code, not found missing: Assistant's record action is already gated by `assistant.record`; clinic visits
  have no delete control; Medical sections gate their Add buttons on `medical.*` edit (#965).
