# Decisions log

Tracks answers to the open questions raised in
[`requirements/lanna-care-rebuild-requirements.md`](requirements/lanna-care-rebuild-requirements.md)
Section 11, plus decisions made during setup that aren't in the original doc.

## Confirmed

- **Sign in with Google (2026-09-20):** the login page now offers
  "Continue with Google" alongside email/password, via Supabase Auth's
  Google provider (PKCE). `signInWithGoogle()` in `src/app/login/actions.ts`
  starts the flow (a server action, so the code-verifier cookie is written
  by the same server client that later exchanges it) and
  `src/app/auth/callback/route.ts` swaps the returned code for a session.
  Roles stay admin-provisioned: the callback checks `current_user_role()`
  and, if the Google account has no `user_roles` row, signs them straight
  back out to `/login?error=no_role` rather than letting a role-less
  session reach `/residents` where every RLS policy would reject it. The
  `auth.users` row is deliberately left in place so the admin sees the
  account on `/admin/security` and can assign a role; the person then
  just tries again. Google accounts whose email matches an existing
  admin-created login are linked to that user by Supabase automatically
  (both emails count as verified), so existing staff keep their role and
  can use either method. `/auth/callback` is a public path in
  `src/lib/supabase/proxy.ts`. The login page also gained a "Back to home
  page" link — previously there was no way back to the public site.
  One-time setup (not in code): Google Cloud console → create an OAuth
  2.0 *Web application* client (the existing Drive client can live in the
  same project) with authorised redirect URI
  `https://<project-ref>.supabase.co/auth/v1/callback`; Supabase →
  Authentication → Providers → Google: enable and paste that client
  ID/secret; Supabase → Authentication → URL Configuration: add
  `http://localhost:3000/auth/callback` and the production
  `https://<domain>/auth/callback` to Redirect URLs (Supabase falls back
  to the Site URL for any `redirectTo` not on that list). Optionally turn
  off "Allow new users to sign up" there to stop unknown Google accounts
  creating `auth.users` rows at all — then they get the generic
  `error=google` message instead of `no_role`, and admins must create the
  login first with the person's Gmail address.
- **Hosting:** Cloudflare Workers (free tier), not Vercel. Chosen to avoid
  Vercel Hobby's non-commercial-use restriction. Deployed via the
  `@opennextjs/cloudflare` adapter (`wrangler.jsonc`, `open-next.config.ts`,
  `npm run deploy`) rather than `@cloudflare/next-on-pages`, since OpenNext
  runs the Node.js-runtime routes this app uses.
- **Google Drive without `googleapis` (2026-09-20):** the first Cloudflare
  deploy attempt (2026-09-19) failed because the `googleapis` SDK's HTTP
  layer (gaxios over Node `http`/`zlib`) doesn't work on the Workers
  runtime even with `nodejs_compat` — the OAuth refresh-token exchange came
  back corrupted, so every Drive call failed and that day's demo went to
  Vercel instead. `src/lib/google/drive.ts` now talks to the Drive v3 REST
  API directly with `fetch` (a ~150-line client covering the five endpoints
  the app uses: list, create folder, multipart upload, get/download,
  delete), with a module-level access-token cache. `googleapis` is kept
  only as a devDependency for the one-off local setup scripts in
  `scripts/`. Side benefit: the photo proxy now needs one Drive request
  per file instead of two, since `fetch` exposes the `Content-Type` header
  on the `alt=media` response that gaxios hid.
- **No `.env.local` in the Worker bundle (2026-09-20):** `@opennextjs/cloudflare`
  snapshots every variable from `.env*` files into
  `.open-next/cloudflare/next-env.mjs` and the Worker uses them as a
  `process.env[key] ??=` fallback for anything not set as a Cloudflare
  secret. Handy for `npm run preview`, but on a deploy it would upload the
  dev Google/Supabase credentials plus `SUPABASE_ACCESS_TOKEN` and
  `DEV_TEST_USER_PASSWORD`, which the app never reads. `npm run deploy` now
  runs `scripts/strip-baked-env.mjs` between build and deploy to empty
  that file. Verified on workerd that the stripped bundle 502s the photo
  proxy with no secrets and works once they're supplied via `.dev.vars`
  (the local equivalent of `wrangler secret put`). `NEXT_PUBLIC_*` values
  are unaffected — `next build` inlines them separately. Consequence:
  every runtime secret must be set on Cloudflare before the first deploy.
- **Google Drive auth model:** the shelter's storage
  (`lannacareforanimals@gmail.com`) is a personal Gmail account, not Google
  Workspace, so domain-wide delegation (as the original doc assumed) is not
  available. Using OAuth2 with a stored refresh token against that one
  Google account instead — functionally equivalent for this use case.
- **Dev vs. production Google account:** development uses
  `lannaanimalfoundationbwm@gmail.com` (an account Lutan has admin rights
  to). Production repoints to `lannacareforanimals@gmail.com` at go-live.
  The account is a config value (env var), never hardcoded.
- **Google OAuth setup (2026-09-18):** OAuth2 client + refresh token minted
  against `lannaanimalfoundationbwm@gmail.com` via a one-time consent flow
  (`scripts/google-oauth-setup.mjs`), verified end-to-end with
  `scripts/google-drive-verify.mjs`. `GOOGLE_DRIVE_ROOT_FOLDER_ID` in
  `.env.local` points at that account's "LCA Health System" folder
  (`1Yn4LTg5cc4oc843sVgn8kvF5sy5fupZy`). At go-live, this whole set
  (`GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`)
  needs to be re-minted against `lannacareforanimals@gmail.com` and the
  equivalent production folder — none of it carries over as-is.
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
- **Resident photo upload (2026-09-19):** added `residents.animal_code`
  (sequential `R-0001`, `R-0002`, …, assigned at intake — see
  `0012_resident_animal_code.sql`; prefix changed from `A-` to `R-` for
  "Resident" in `0022_resident_code_prefix.sql`, 2026-09-20) as the short, human-friendly identifier
  needed because animal names repeat at the shelter and `residents.id`
  (UUID) is unusable in a Drive folder name. Multi-file drag-and-drop/tap
  upload lands in `Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/`
  (Category is one of Shelter/Medical/Foster/Adoption, chosen per upload
  batch alongside a date-taken; `<YYMM>` derives from that date) — this
  matches the pre-existing convention already found in the dev Drive
  account's legacy-migrated folders, confirmed while building this feature
  (see the open item below). Volunteers can manage photos (upload, pick
  profile photo, delete) via three new `security definer` RPC functions
  (`record_attachment`, `set_resident_profile_photo`,
  `delete_resident_photo` — `0013_resident_photo_attachments.sql`,
  `0014_attachment_date_taken.sql`) since that requires writing
  `residents.profile_photo_drive_file_id`, and volunteers otherwise have
  read-only RLS on `residents`. Flagged as an assumption, not confirmed:
  decisions.md's existing volunteer boundary says they may write
  "attachments/photos" without explicitly covering profile-selection.
- **No `date_of_birth` on residents:** removed (0011_drop_date_of_birth.sql).
  The original doc listed `date_of_birth (or estimated age)` as if either
  might be known, but in practice the shelter never has a real DOB at
  intake — every age is a staff guess. `estimated_age_years` (anchored to
  `age_estimated_on`, so displayed age keeps advancing over time rather than
  freezing at the value entered on day one — see `formatAge` in
  `src/lib/format.ts`) is the only age input now.
  - **Anchor moved from `intake_date` to `age_estimated_on` (2026-09-20,
    `0023_resident_age_estimated_on.sql`):** anchoring to intake broke the
    moment staff revised the estimate from the edit form — typing "5" two
    years after intake displayed as ~7. The edit form now shows the age as
    it reads *today* and, only when that number is changed, stores it with
    `age_estimated_on = today`. Deliberately a dedicated column rather than
    the row's last-modified time, so editing the bio doesn't re-anchor the
    age. Intake still sets it to `intake_date`.

- **Photo image proxy (2026-09-19):** stopped rendering resident photos via
  direct `drive.google.com/thumbnail?id=...` URLs. That endpoint has a
  separate, undocumented per-file abuse-throttling quota (distinct from the
  documented, generous 325k-units/min Drive API quota) — a handful of staff
  refreshing a list page in a short window could plausibly trip it for a
  given resident's photo, taking it offline for everyone for up to ~24h.
  This mattered most for the planned public adoption listing (unbuilt), the
  most likely source of an unpredictable anonymous traffic burst.
  Replaced with an image proxy (`src/app/api/photos/[fileId]/route.ts`) that
  fetches a file once via the authenticated Drive API (`files.get` +
  `alt=media`) and serves it with `Cache-Control` headers, plus Cloudflare's
  edge Cache API (`caches.default`) when that global is available at
  runtime — so N pageviews cost Drive at most one request per cache
  lifetime instead of N direct hits. `driveImageUrl()` in
  `src/lib/google/drive-client.ts` now returns this proxy's URL instead of
  a Drive URL, and no longer takes a `size` — the proxy can't ask the Drive
  API for a resized thumbnail the way the old `drive.google.com/thumbnail`
  endpoint could, so it serves the original file and lets the existing CSS
  (`object-cover`/`object-contain` + fixed container sizes) handle display
  sizing. Chose the Cache API over R2 for the edge layer: it's free-tier,
  needs no new billing, and matches the actual need (de-dupe a traffic
  burst against a single file), whereas R2 buys persistence this doesn't
  need. New uploads (`uploadImageToFolder` in `src/lib/google/drive.ts`)
  no longer get "anyone with the link" sharing — they're only reachable
  through the proxy now, which closes off the direct Drive URL as a way to
  bypass the proxy's caching entirely. The proxy itself stays
  unauthenticated (carved out of the blanket auth gate in
  `src/lib/supabase/proxy.ts`, which otherwise 307-redirects every
  signed-out request to `/login`) and instead checks the requested file ID
  against a new `is_known_drive_file()` RPC
  (`supabase/migrations/0015_photo_proxy_lookup.sql`) before calling Drive,
  so it can't be used to fetch arbitrary files from the account — this
  matches, not exceeds, today's access level (anyone who already knows a
  registered Drive file ID could view it before this change too).
  Flagged, not done here:
  - Files uploaded before this change are still "anyone with the link";
    revoking those permissions retroactively is a separate cleanup task.
  - The Cache API layer needs a Workers-compatible runtime to actually
    activate — it's feature-detected and simply no-ops under plain
    `next dev`/Node hosting. Under the `@opennextjs/cloudflare` deploy
    (see the Hosting entry above) `caches.default` is available, so it
    should be live in production — worth confirming on the first
    Cloudflare deploy by checking that repeat requests for a photo don't
    reach the handler.

- **Public welcome page + guest browsing (2026-09-19):** `/` is now the
  public marketing/welcome page (hero photo, shelter story, links to
  `/login` and `/adopt`); the staff dashboard that used to live at `/` moved
  to `/residents`. `/adopt` and `/adopt/[id]` are the "Public/Anonymous"
  RBAC tier's guest-browsing pages (Section 6), reading only from the
  existing `public_resident_profiles` view — never `residents` directly.
  `src/lib/supabase/proxy.ts` now treats `/`, `/adopt*`, and `/api/photos/*`
  as public paths; everything else still 307s a signed-out visitor to
  `/login`. The public `/adopt/[id]` page shows a full photo gallery
  (`public_resident_photos` view, 0017) with click-to-swap thumbnails, not
  just the one profile photo.

  **Landing page content is now admin-editable, not hardcoded (2026-09-19):**
  hero photo, tagline, "Our story" heading/body, contact email/address, and
  the gallery photo strip all live in `site_content` /
  `site_content_photos` (0018) and are edited at `/admin/website` — no code
  change needed to update copy or swap photos. Uploaded photos go through
  the same Google Drive flow as resident photos (`Website` folder under
  `GOOGLE_DRIVE_ROOT_FOLDER_ID`), served via the existing image proxy.
  Initial launch copy/photos (originally sourced from the shelter's
  Facebook page, facebook.com/lannacareforanimals) were seeded into this
  table directly — `public/landing/*` no longer exists, that's not where
  landing-page images live anymore.

  **SQL to run against the production Supabase project before go-live**
  (not yet applied anywhere but the dev project — do this alongside the
  other go-live steps in the Google Drive entry above):
  - `supabase/migrations/0016_public_adopt_listing_access.sql` through
    `0019_site_content_photo_proxy.sql` (0016 public listing grant, 0017
    public photo gallery view, 0018 site_content/site_content_photos +
    RLS, 0019 adds site_content to `is_known_drive_file()` so its photos
    aren't blocked by the image proxy's allowlist). Confirmed working in
    dev, but don't assume the prod project's default privileges match —
    run 0016's grant explicitly rather than relying on that.
  - `site_content` ships with an empty hero/gallery (the dev seed data
    doesn't carry over) — go to `/admin/website` after migrating and set
    the real production hero photo, story copy, and gallery before
    announcing the page publicly, or it'll briefly show a hero-less page.
  - Sanity-check after applying: hit `/` and `/adopt` signed out and
    confirm the page and animals actually load. If RLS/grants are
    misconfigured on the prod project, this fails closed (empty/blank),
    not open — worst case is a bare page, never a data leak. Still worth
    checking before launch rather than discovering it from a support email.

- **Blood test view + Drive attachments (2026-09-19):** blood tests can now
  be logged from a resident's Blood Tests tab (`/blood-tests/new?residentId=`)
  or from a specific logged vet visit (adds `&vetAppointmentId=`, preselecting
  the linked visit and defaulting the test date to that visit's date). Files
  go through the same polymorphic `attachments` table as resident photos
  (`0020_blood_test_attachments.sql` adds `'blood_test'` to
  `attachment_owner_type`) instead of the single `blood_tests.drive_file_id`
  column from the initial schema (dropped) — a lab report is often more than
  one file (front/back of a slip, a multi-page PDF), and this also means the
  future OCR build can iterate every file on a test rather than being
  hard-limited to one. Drive path is
  `Residents/<Name> (<ID>)/Blood Tests/<YYYYMMDD>/<filename>`, matching the
  requirements doc's Section 5.1 convention — one folder per test date
  (unlike Photos' per-month grouping), since a single draw's files should
  land together. Accepts images and PDF (photos stay image-only).
  OCR itself (auto-populating structured values from the attached scan) is
  explicitly out of scope for this build.

  **Role scope, flagged as an assumption, not fully confirmed:** creating the
  `blood_tests` row itself stays limited to vet/admin, per the existing RLS
  (`vet_rw_blood_tests` / `admin_all_blood_tests` in 0001) — staff/volunteers
  can view but not log a new test. This reads Section 6's role table
  literally (blood tests listed only under Vet's read/write scope) rather
  than assuming staff need to log results a vet phoned in; worth confirming
  once this is in front of the person who'll actually use it day to day. Once
  a test row exists, staff/volunteers *can* attach additional files to it
  (e.g. scanning in a paper report that arrives later) — `record_attachment()`
  was extended to include `'vet'` in its role check (it previously only
  covered resident photos: admin/staff/volunteer), and per decisions.md's
  existing "volunteers may write attachments/photos, any owner type" this
  extends unchanged to the new `blood_test` owner type.

  **Fixed in passing:** `attachments` had no RLS policy at all for the `vet`
  role (an existing gap, unrelated to blood tests specifically) — a vet
  reading resident photos "for context" per Section 6 would have silently
  gotten zero rows. Added `vet_rw_attachments` matching the existing
  staff/volunteer "for all" shape.

- **Enclosure browser (2026-09-20):** `/enclosures` and `/enclosures/[id]`
  are the phone-friendly zone → enclosure → residents path; the desktop-only
  zone/enclosure filters on `/residents` stay as they are. Occupancy is
  computed in the page from `resident_list_view` (one `enclosure_id` per
  resident, counted in the request) rather than a new occupancy view — no
  migration needed, and the headcount is small enough that this is cheap.
  If it ever isn't, swap in a `security_invoker` view with a `group by`.
  Capacity thresholds live in `src/lib/enclosures/occupancy.ts`: over
  (count > capacity), full (equal), nearly full (≥ 80%), otherwise space
  available; `capacity` null/0 shows the count only. The Lifecycle
  pseudo-zone (Hospital / Fostered / Adopted / Deceased / Unassigned) is
  included — "who's in hospital" is a real question — but sorted last,
  labelled as a status rather than a physical enclosure, and gets no
  Maintenance card. Maintenance is a disabled placeholder on the hub only;
  building it needs an `enclosure_id` on the `maintenance` table (it only
  has `zone_id` today) — tracked in the backlog.

- **Move resident between enclosures (2026-09-20):** two entry points, one
  rule set. `/residents/[id]/move` (from the hub's Housing card and the
  housing section) is the quick path; the edit form's Housing section does
  the same thing on save when a different enclosure is picked. Both go
  through `moveResidentToEnclosure()` in `src/lib/placements/move.ts`, which
  inserts a single `ChangeEnclosure` row (with `previous_enclosure_id`) and
  lets the existing `close_prior_placement` trigger end the prior placement.
  The picker is zone → enclosure (dependent dropdowns — there will be 100+
  enclosures) and only lists physical zones: Lifecycle pseudo-enclosures are
  entered via their own placement types (hospital, foster, adopt, deceased),
  never by "moving" there, and the server rejects them too. Moving into an
  enclosure that would be nearly full / full / over capacity (thresholds
  from `occupancy.ts`, counting the incoming resident) shows a warning
  dialog but is allowed on confirm — staff know which animals can share.
  Dates: a date-only input is stamped `now()` for today and midday UTC for
  back-dated moves, so it always sorts after a midnight-stamped intake on
  the same day; the server also rejects a move dated before the current
  placement started (the `end_after_start` check would, less helpfully).
  Deceased residents can't be moved. **0024** fixes two things in the
  `close_prior_placement` trigger that the first real non-Intake insert
  exposed: (a) it was `AFTER INSERT`, but the one-active-placement partial
  unique index is checked as the row is written, so *every* move failed
  with a duplicate-key error before the trigger could close the prior row —
  it is now `BEFORE INSERT`; (b) it ran as the caller, so volunteers (who
  may insert `ChangeEnclosure` but have no UPDATE policy on
  `placement_history`) would have had the prior placement silently *not*
  closed — it is now `security definer` with `search_path` pinned. Also
  fixed in passing: the housing history section embedded `enclosures(name)`
  without naming the FK, which PostgREST rejects as ambiguous (there are two
  FKs to `enclosures`), so the list always read "No placement history".

- **Send to hospital (2026-09-20):** three entry points, one page.
  `/residents/[id]/hospital` is linked from the hub's Housing card, the
  housing section, and each vet visit record (which passes
  `?vetAppointmentId=` so the visit's date pre-fills "Date admitted" and
  the visit's date/reason/vet pre-fills the notes — `placement_history` has
  no FK to `vet_appointments`, and adding one for a note-worthy link wasn't
  worth a migration). `sendResidentToHospital()` in
  `src/lib/placements/hospital.ts` inserts a single `SendToHospital` row
  into the Lifecycle/Hospital pseudo-enclosure (looked up by name — there's
  no id constant) with `previous_enclosure_id` = whatever the resident's
  current enclosure is, physical or not, so "Return from hospital" can put
  them back; the same `close_prior_placement` trigger closes the prior row.
  No migration: the enum value, pseudo-enclosure and admin/staff insert
  policies already existed. Role boundary kept as decided above — only
  admin and staff; volunteers (ChangeEnclosure only) and vets (no placement
  writes) see the page's not-authorised message. Worth revisiting if the
  vet role turns out to be used by people who actually admit animals.
  Rejected: already-hospitalised, deceased, future dates, dates before the
  current placement started (same date stamping as moves, via the shared
  `src/lib/placements/dates.ts`). While a resident is hospitalised the
  Housing card switches to an ambulance icon, reads "In hospital · Off-site
  in medical care · Returns to {enclosure}", and hides "Send to hospital".
  Placement history rows now show a translated label per `placement_type`
  (`enums.placementType`) instead of the raw enum. `StatCard` takes
  `actions: []` instead of a single `action` so the Housing card can offer
  both Move and Send to hospital.

- **Return from hospital (2026-09-20):** the reverse of send, at
  `/residents/[id]/hospital/return`, linked from the Housing card and the
  housing section only while the resident is hospitalised — the two
  actions are opposites and exactly one of them is ever shown.
  `returnResidentFromHospital()` (same file as send) inserts a single
  `ReturnFromHospital` row; `previous_enclosure_id` on that row is the
  Hospital pseudo-enclosure so the history reads "Hospital → Kennel 3"
  like a move. The zone → enclosure picker (shared `EnclosurePicker`, with
  the same capacity warning as moves) defaults to the stored
  `active_hospital_previous_enclosure`, but any physical enclosure is
  accepted: a resident back from surgery may need an isolation enclosure
  for a few weeks before rejoining the general population. When the stored
  enclosure can't be offered (deleted, or a Lifecycle status such as
  Fostered — returning to foster would need a Foster placement with a
  carer, not built yet) the picker starts empty with a note saying why.
  Rejected: not hospitalised, deceased, future dates, dates before the
  admission, Lifecycle targets. Same admin/staff role boundary as send.
  With a proper way back, "Move enclosure" is now hidden while in hospital
  and `moveResidentToEnclosure()` rejects hospitalised residents, so the
  edit form's Housing section can't record a `ChangeEnclosure` out of the
  Hospital pseudo-enclosure (it shows the return link instead). Vet visit
  records still only offer "Send to hospital": a discharge isn't tied to a
  visit the way an admission can be.

- **Foster and adopt (2026-09-20):** one page for both,
  `/residents/[id]/rehome`, with a Foster / Adopt toggle (`?type=` picks
  the default; a fostered resident defaults to Adopt because the usual case
  is the carer adopting). `rehomeResident()` in
  `src/lib/placements/rehome.ts` inserts a single `Foster` or `Adopt` row
  into the Lifecycle/Fostered or /Adopted pseudo-enclosure with `carer_id`
  set, so `resident_current_state.current_status` / `current_carer_id`
  come out right with no view changes; `previous_enclosure_id` is the
  enclosure they left so a return can offer it back. No migration: enum
  values, pseudo-enclosures, `carer_id` + its Carer-type trigger and the
  admin/staff insert policies all existed since 0001. Transitions: Foster
  is allowed from Resident/Outreach, Hospitalised (a fostered animal the
  shelter treated can go straight back to its carer — the form pre-selects
  the carer from the placement before the hospital stay) and Fostered
  (change of carer; same carer rejected). Adopt is allowed from the same
  states. Nothing is allowed from Adopted except **Return to shelter**
  (`/residents/[id]/rehome/return`, `returnResidentToShelter()` — a
  `ReturnToShelter` row into a physical enclosure, picker defaulting to
  the enclosure they left from, same capacity warning as moves), which also
  serves fostered residents. Adoption ends the shelter's medical
  responsibility, so "Send to hospital" is refused for adopted residents
  but still offered while fostered. "Move enclosure" is now refused (and
  hidden, including on the edit form) while fostered or adopted, since a
  `ChangeEnclosure` out of a Lifecycle enclosure would misrecord the
  return. The per-status list of offered actions is a single table,
  `availablePlacementActions()` in `src/lib/placements/available.ts`, read
  by the hub card, the housing section and the vet-visit links, so the
  four surfaces can't drift. **Carer picker:** the dev database had no
  contacts at all, and Contacts management isn't built, so the picker
  offers existing Carer contacts *or* an inline "add a new carer" form
  (name required; phone / email / LINE ID optional) that inserts a Carer
  contact right before the placement — two statements, not one
  transaction, on the grounds that a stray carer contact is harmless. Same
  admin/staff role boundary as hospital placements. The foster-carer
  portal role is tracked in the backlog.

- **Adopted residents leave the public pages; fostered ones stay
  (2026-09-20):** `0025_public_views_exclude_adopted.sql` changes
  `public_resident_profiles` and `public_resident_photos` from "not
  deceased" to `current_status not in ('Deceased', 'Adopted')`. Lutan's
  call: an adopted animal is no longer available so it must not be listed;
  a fostered one still is (foster-to-adopt is the common path), so it stays.
  A public "recently adopted" page is a possible later feature and is noted
  on the public-pages backlog item — it would read `Adopt` rows from
  `placement_history`, not these views. Found and fixed in the same
  migration: Supabase's default privileges grant INSERT/UPDATE/DELETE on
  every new `public` object to `anon` and `authenticated`, and
  `public_resident_profiles` is simple enough to be auto-updatable, so
  with the view owned by the RLS-bypassing migration role an anonymous
  `PATCH /rest/v1/public_resident_profiles` was accepted (verified: HTTP
  200 on a no-op filter before, `permission denied` after). Everything but
  SELECT is now revoked on both views. **Any future view granted to
  `anon` needs the same revoke**, and this is worth re-checking on the
  production project at go-live alongside the 0016 grant.

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
7. **Legacy Drive folder IDs vs. `animal_code` (found 2026-09-19):** the dev
   Drive account's `Residents/` tree already contains real
   legacy-migrated animals folder-named `<Name> (<8-char-hex-id>)` — that
   hex ID is the old AppSheet row ID. New residents entered through this
   app instead get a sequential `animal_code` (`R-0001`, …). When real data
   migration (Section 9 of the requirements doc) actually happens, a
   migrated resident's Drive folder needs to be matched to its existing
   hex-ID-named folder (to avoid creating a duplicate, differently-named
   folder for the same animal) — likely by having the migration script set
   `animal_code` to the legacy hex ID for migrated rows, or by matching
   folders by resident name at migration time and recording whatever ID
   that folder already uses. Not resolved here; flagging so it isn't lost
   before that step is scoped.
