# Decisions log

Tracks answers to the open questions raised in
[`requirements/lanna-care-rebuild-requirements.md`](requirements/lanna-care-rebuild-requirements.md)
Section 11, plus decisions made during setup that aren't in the original doc.

## Confirmed

- **Hosting:** Cloudflare Pages (free tier), not Vercel. Chosen to avoid
  Vercel Hobby's non-commercial-use restriction. Next.js on Cloudflare Pages
  needs the `@cloudflare/next-on-pages` (or OpenNext Cloudflare) adapter —
  not yet wired up, flagged for the deployment setup step.
- **Google Drive auth model:** the shelter's storage
  (`lannacareforanimals@gmail.com`) is a personal Gmail account, not Google
  Workspace, so domain-wide delegation (as the original doc assumed) is not
  available. Using OAuth2 with a stored refresh token against that one
  Google account instead — functionally equivalent for this use case.
- **Dev vs. production Google account:** development uses
  `lannaanimalfoundationbwm@gmail.com` (an account Lutan has admin rights
  to). Production repoints to `lannacareforanimals@gmail.com` at go-live.
  The account is a config value (env var), never hardcoded.
- **Vet access scope (Section 11, item 4):** shelter-wide read access to all
  residents' medical history, not scoped per-resident. Matches the doc's
  own recommendation (medical safety — a covering vet needs full history).
- **Volunteer tier (Section 11, item 5):** yes, added as a 5th role.
  Volunteers can **read everything** (residents, placements, vet history,
  maintenance/projects, contacts), and can **write** only:
  - attachments / photos (any owner type)
  - `ChangeEnclosure` placement_history records (moving an animal between
    enclosures)
  They cannot record any other placement type (Intake, Adopt, Deceased,
  Hospital, Foster, Return to Shelter), and cannot write vet/medical data
  or manage contacts. This is a first-pass boundary — flagged to confirm
  with Lutan once the app is running and volunteers' actual day-to-day
  needs are visible.

## Still open (from Section 11 of the requirements doc)

1. Exact per-table RBAC permission matrix beyond the role descriptions —
   the RLS policies in `supabase/migrations/0001_initial_schema.sql` are a
   working first pass, not signed off.
2. Whether `immunization_history` is distinct from `immunization_records`
   in the live data — needs confirmation against the actual Sheets data
   during migration. Current schema has only `immunization_records`.
3. Exact current values for `maintenance.status` — schema currently uses
   `To Do / In Progress / Blocked / Done` per the doc's example; confirm
   against live data.
4. Whether Supabase Storage should be used for anything (e.g. small UI
   assets) alongside Drive — not used yet; default is to avoid it for
   consistency unless a concrete need comes up.
5. Exact current Line-messaging URL pattern for the "tap to message"
   contact action — `contacts.line_id` field exists; confirm the URL
   pattern (`https://line.me/ti/p/~{line_id}` assumed) against the live app.
6. Immunization stock forecast (doses due in 7/14/30/90 days) needs a
   re-vaccination interval per `immunization_types`, which isn't in the
   documented data model — need to confirm this against the live sheet
   before adding an `interval_days` column and a forecast view.
