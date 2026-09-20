# Backlog

Each item is a self-contained prompt for a new thread. Tick when done. Ordered by suggested priority; reorder freely.

## Deployment (do before the first Cloudflare deploy)

- [ ] **Set all five runtime secrets on Cloudflare before running `npm run deploy`.** `wrangler secret put` for `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`. Reminder of why: the OpenNext adapter copies the *whole* of `.env.local` into the Worker bundle as a fallback. The deploy script now strips that (`scripts/strip-baked-env.mjs`), so anything not set on Cloudflare fails loudly at runtime rather than silently using dev creds — but that means nothing works until these are set. At go-live these must be the production (`lannacareforanimals@gmail.com`) values, re-minted per `docs/decisions.md`. Also make sure `.env.local` holds the production `NEXT_PUBLIC_SUPABASE_*` values when running the deploy build, since those are inlined by `next build`.

## Quick wins

- [x] **Fix mobile row click on residents list.** In `src/app/residents/ResidentsTable.tsx` the name link's `after:absolute after:inset-0` overlay relies on `relative` on the `<tr>`, which mobile WebKit ignores, so tapping anywhere opens the last row. Anchor it to the cell or make the row properly clickable.
- [x] **Add "Book vet visit" button to the resident hub.** Put it on the vet-appointments section (and stat card) linking to `/vet-visits/new?residentId=<id>`, mirroring how immunizations already do it.
- [x] **Show age on the public resident page.** Add `estimated_age_years` and `intake_date` to the `public_resident_profiles` view (new migration) and render an Age row on `/adopt/[id]` using the existing `formatAge()` helper.

## Mobile

- [x] **Collapsible mobile navigation.** Replace the fixed `w-48` sidebar in `src/app/NavLinks.tsx` / `layout.tsx` with a hamburger-toggled drawer below the `md` breakpoint so phones don't show only the nav bar.
- [x] **Icon-based mobile hub and residents list.** Hub stat cards, tabs and action buttons use lucide icons (`src/components/hub-icons.ts`, `ActionLink.tsx`); the phone residents list shows only ID + name with no checkboxes or zone/enclosure filters.
- [x] **Browse residents by enclosure.** New mobile-friendly views to navigate zone → enclosure → residents (replacing the desktop-only zone/enclosure filters and extra columns that are hidden on phones in `src/app/residents/`). Lives at `/enclosures` (zone chips, name search, sort by zone/name/fullest; capacity indicator per card) and `/enclosures/[id]` (occupancy bar, notes, resident thumbnails, disabled Maintenance placeholder).
- [ ] **Mobile responsiveness sweep.** Go through every screen (residents list, resident hub, forms, admin pages, login) at phone width and fix layout, table overflow, and spacing so it feels professional in portrait.

## Resident operations

- [x] **Edit resident details.** Add `/residents/[id]/edit` with a form + server action to update identity/bio fields (name, Thai name, other names, animal code, species, breed, sex, age, notes, adoption/public flags). Housing is not edited here.
- [x] **Move resident between enclosures.** `/residents/[id]/move` (linked from the hub's Housing card and the housing section) and a Housing section on the edit form both insert a `ChangeEnclosure` row into `placement_history` via `src/lib/placements/move.ts` (zone → enclosure picker, date, notes; Lifecycle pseudo-enclosures excluded; capacity warning before moving into a nearly-full/full/over-capacity enclosure). Existing trigger closes the prior placement (0024 makes it `BEFORE INSERT` — it never could have fired past the one-active-placement index as `AFTER` — and `security definer` so volunteers' moves work).
- [x] **Send to hospital.** `/residents/[id]/hospital` (from the hub's Housing card, the housing section, and each vet visit record via `?vetAppointmentId=` which pre-fills date and notes) inserts a `SendToHospital` placement into the Lifecycle/Hospital enclosure via `src/lib/placements/hospital.ts`, storing `previous_enclosure_id` so the resident can return later. Admin/staff only. The Housing card reads "In hospital · Off-site in medical care · Returns to X" while they're there.
- [ ] **Return from hospital.** Action that inserts a `ReturnFromHospital` placement back into the stored `previous_enclosure_id` (with an override picker if that enclosure is gone).
- [ ] **Foster and adopt.** Actions that insert `Foster` / `Adopt` placements into the matching Lifecycle enclosures, requiring a carer chosen from contacts of type Carer. Depends on Contacts management.
- [ ] **Record deceased.** Action that inserts a `Deceased` placement (date of death, notes), after which the resident drops off public pages and shows as Deceased in the app.

## Medical records

- [ ] **Prescriptions.** Form + hub section to add/view prescriptions (medication, frequency, start/end date, notes) against the existing `prescriptions`, `medication` and `frequency` tables.
- [ ] **Weight.** Form + hub section to log and list weight entries (date, kg) against the existing `weight` table, newest first.
- [ ] **Procedures.** Form + hub section to log and list procedures (type, date, vet appointment link, notes) against the existing `procedures` table.
- [ ] **Blood test types.** New `blood_test_types` table + admin CRUD page, `blood_test_type_id` on `blood_tests`, and a type dropdown on the blood test form defaulting to CBC. Seed: CBC (Complete Blood Count), Blood Chemistry Panel, Thyroid Panel, Heartworm Test, Tick Borne Disease Panel, Cortisol Test, Urinary Analysis.
- [ ] **Dietary requirements.** Add a dietary requirements field/section to residents (free text or structured), editable from the hub and visible on the resident info tab.

## Facility

- [ ] **Enclosure maintenance.** Let staff log repairs / work needed on an enclosure (title, description, status, estimated cost, photos) for budgeting and tracking, replacing the disabled "Maintenance — coming soon" card on `/enclosures/[id]`. The existing `maintenance` table only references `zone_id`; add an `enclosure_id` column (nullable, so zone-wide jobs still work) and a cost field. Volunteers can read maintenance but not create it (see RLS in 0001).

## Admin

- [ ] **Vets management.** Admin CRUD page for the existing `vets` table (name, clinic, contact info) following the immunization-types page pattern, plus a nav entry.
- [ ] **Contacts management.** Admin CRUD page for the existing `contacts` table (name, type, phone, email, LINE ID) following the same pattern, plus a nav entry.
- [ ] **Projects folders.** Admin page to create and manage `project_folders` and their `project_photos` (Google Drive backed, like resident photos).

## Auth

- [ ] **Forgot password.** Add a "Forgot password?" link on login, a request page using Supabase `resetPasswordForEmail`, and a reset page that consumes the recovery link and sets a new password. Needs a production SMTP provider configured in Supabase.
- [ ] **Sign in with Google.** Add Google OAuth via Supabase Auth (provider config + callback route + button on login), mapping the signed-in user to an existing `user_roles` row.

## Public website

- [ ] **Thai translation of home page content.** Add Thai columns to `site_content` (tagline, story heading/body, hero alt), second set of fields on the admin Website form, and pick by locale with English fallback on `/`.
- [ ] **Shelter impact stats on the home page.** Inspired by RSPCA ACT's "Last week at a glance" strip (animals in care / adopted last week / under vet care). Create a `public_shelter_stats` view (granted to `anon`) that derives counts from `resident_current_state` (Resident + Fostered + Hospitalised = in care; Hospitalised = under vet care) and from `placement_history` (`Adopt` placements with `start_date` in the last 7 days). Render three stat tiles with a one-line explainer each near the top of `/`. Public-safe: counts only, no names or IDs.
- [ ] **Visiting hours + adoption process on public pages.** Add `visiting_hours` (per-day text or JSON) and `adoption_process` (markdown/long text) to `site_content`, editable from `/admin/website`. On `/adopt/[id]` replace the bare mailto footer with a "Where to meet {name}" block (address from `contact_address`, hours by day, email/LINE contact) plus an honest note that animals may be adopted before a visitor arrives and can't be held over the phone, linking to a short "Our adoption process" section/page. Modelled on RSPCA ACT's pet profile footer.
- [ ] **Filters on the public adoption listing.** `/adopt` is a flat grid sorted by name. Add a species filter (Dog / Cat / Other, from the values in `public_resident_profiles`) and a "Ready for adoption" toggle, driven by URL search params so links are shareable and the page stays server-rendered. Keep it a simple chip/select row above the grid; no JS-heavy filter panel needed.
- [ ] **Pet of the Week on the home page.** Add `featured_resident_id` (nullable FK to `residents`) to `site_content`, chosen via a resident picker on `/admin/website` (only publicly-visible residents offered). On `/` render a featured card (profile photo, name, species/breed, first paragraph of `bio`) linking to `/adopt/[id]`. Hide the section when unset or the resident is no longer public. Mirrors RSPCA ACT's "Dog/Cat of the week".
- [ ] **"Similar animals" on the public resident page.** At the bottom of `/adopt/[id]`, query up to four other rows from `public_resident_profiles` with the same species (excluding the current one, `ready_for_adoption` first, then random or by name) and render them as the same cards used on `/adopt`. Mirrors the "Similar animals to Harry" strip on RSPCA ACT.
- [ ] **Adoption Recommendation fields on residents.** RSPCA ACT shows a separate "Adoption Recommendation" block (dog friendly / cat friendly / energy level / household activity / child recommendation) plus size and colour. Migration adding to `residents`: `good_with_dogs`, `good_with_cats`, `good_with_children` (nullable enum yes/no/unknown), `energy_level` (low/medium/high), `size` (small/medium/large), `colour` text. Expose the non-sensitive ones through `public_resident_profiles` (CREATE OR REPLACE VIEW — append columns only), add them to `/residents/[id]/edit` and the resident info tab, and render an "Is {name} right for you?" block on `/adopt/[id]`. Also surface Desexed / Vaccinated / Microchipped flags publicly if the data exists in the medical tables (otherwise add booleans on `residents`). These fields later enable richer `/adopt` filters.
- [ ] **Foster, Volunteer and Donate public pages.** Add `/foster`, `/volunteer` and `/donate` reachable from `PublicHeader` (and a "How to help" section on `/`). Content lives in `site_content` (or a small `site_pages` table keyed by slug) so admins edit it from `/admin/website`; English + Thai columns following the Thai-translation item above. Foster page structure to borrow from RSPCA ACT: what fostering achieves, "what we need from you" list, "what we supply" list, then a CTA to email/LINE. Donate page holds bank transfer / PromptPay details and what donations fund.
- [ ] **Share button and Open Graph tags on public resident pages.** Add `generateMetadata` to `/adopt/[id]` (title = name, description = first sentence of bio, `og:image` = profile photo via `driveImageUrl`) so links preview correctly on Facebook and LINE, and a "Share {name}'s profile" button using the Web Share API with a copy-link fallback. Do the same OG treatment for `/` and `/adopt`.
- [ ] **Lost & found report form (future).** RSPCA ACT has a public "report a lost pet" form. Out of scope until the core app is wired up, but a natural later public feature: a public form (species, description, photo, location, contact) writing to a `lost_pet_reports` table that staff review from an admin list, with a link to the intake flow if the animal arrives at the shelter.
