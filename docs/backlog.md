# Backlog

Each item is a self-contained prompt for a new thread. Tick when done. Ordered by suggested priority; reorder freely.

## Deployment (do before the first Cloudflare deploy)

- [ ] **Set all five runtime secrets on Cloudflare before running `npm run deploy`.** `wrangler secret put` for `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`. Reminder of why: the OpenNext adapter copies the *whole* of `.env.local` into the Worker bundle as a fallback. The deploy script now strips that (`scripts/strip-baked-env.mjs`), so anything not set on Cloudflare fails loudly at runtime rather than silently using dev creds — but that means nothing works until these are set. At go-live these must be the production (`lannacareforanimals@gmail.com`) values, re-minted per `docs/decisions.md`. Also make sure `.env.local` holds the production `NEXT_PUBLIC_SUPABASE_*` values when running the deploy build, since those are inlined by `next build`.

## Quick wins

- [x] **Fix mobile row click on residents list.** In `src/app/residents/ResidentsTable.tsx` the name link's `after:absolute after:inset-0` overlay relies on `relative` on the `<tr>`, which mobile WebKit ignores, so tapping anywhere opens the last row. Anchor it to the cell or make the row properly clickable.
- [x] **Add "Book vet visit" button to the resident hub.** Put it on the vet-appointments section (and stat card) linking to `/vet-visits/new?residentId=<id>`, mirroring how immunizations already do it.
- [x] **Show age on the public resident page.** Add `estimated_age_years` and `intake_date` to the `public_resident_profiles` view (new migration) and render an Age row on `/adopt/[id]` using the existing `formatAge()` helper.

## Mobile

- [ ] **Collapsible mobile navigation.** Replace the fixed `w-48` sidebar in `src/app/NavLinks.tsx` / `layout.tsx` with a hamburger-toggled drawer below the `md` breakpoint so phones don't show only the nav bar.
- [ ] **Mobile responsiveness sweep.** Go through every screen (residents list, resident hub, forms, admin pages, login) at phone width and fix layout, table overflow, and spacing so it feels professional in portrait.

## Resident operations

- [ ] **Edit resident details.** Add `/residents/[id]/edit` with a form + server action to update identity/bio fields (name, Thai name, other names, animal code, species, breed, sex, age, notes, adoption/public flags). Housing is not edited here.
- [ ] **Move resident between enclosures.** Add a move page/modal from the hub's housing section that inserts a `ChangeEnclosure` row into `placement_history` (zone → enclosure picker, date, notes). Existing trigger closes the prior placement.
- [ ] **Send to hospital.** Action from the hub that inserts a `SendToHospital` placement into the Lifecycle/Hospital enclosure, storing `previous_enclosure_id` so the resident can return later.
- [ ] **Return from hospital.** Action that inserts a `ReturnFromHospital` placement back into the stored `previous_enclosure_id` (with an override picker if that enclosure is gone).
- [ ] **Foster and adopt.** Actions that insert `Foster` / `Adopt` placements into the matching Lifecycle enclosures, requiring a carer chosen from contacts of type Carer. Depends on Contacts management.
- [ ] **Record deceased.** Action that inserts a `Deceased` placement (date of death, notes), after which the resident drops off public pages and shows as Deceased in the app.

## Medical records

- [ ] **Prescriptions.** Form + hub section to add/view prescriptions (medication, frequency, start/end date, notes) against the existing `prescriptions`, `medication` and `frequency` tables.
- [ ] **Weight.** Form + hub section to log and list weight entries (date, kg) against the existing `weight` table, newest first.
- [ ] **Procedures.** Form + hub section to log and list procedures (type, date, vet appointment link, notes) against the existing `procedures` table.
- [ ] **Blood test types.** New `blood_test_types` table + admin CRUD page, `blood_test_type_id` on `blood_tests`, and a type dropdown on the blood test form defaulting to CBC. Seed: CBC (Complete Blood Count), Blood Chemistry Panel, Thyroid Panel, Heartworm Test, Tick Borne Disease Panel, Cortisol Test, Urinary Analysis.
- [ ] **Dietary requirements.** Add a dietary requirements field/section to residents (free text or structured), editable from the hub and visible on the resident info tab.

## Admin

- [ ] **Vets management.** Admin CRUD page for the existing `vets` table (name, clinic, contact info) following the immunization-types page pattern, plus a nav entry.
- [ ] **Contacts management.** Admin CRUD page for the existing `contacts` table (name, type, phone, email, LINE ID) following the same pattern, plus a nav entry.
- [ ] **Projects folders.** Admin page to create and manage `project_folders` and their `project_photos` (Google Drive backed, like resident photos).

## Auth

- [ ] **Forgot password.** Add a "Forgot password?" link on login, a request page using Supabase `resetPasswordForEmail`, and a reset page that consumes the recovery link and sets a new password. Needs a production SMTP provider configured in Supabase.
- [ ] **Sign in with Google.** Add Google OAuth via Supabase Auth (provider config + callback route + button on login), mapping the signed-in user to an existing `user_roles` row.

## Public website

- [ ] **Thai translation of home page content.** Add Thai columns to `site_content` (tagline, story heading/body, hero alt), second set of fields on the admin Website form, and pick by locale with English fallback on `/`.
