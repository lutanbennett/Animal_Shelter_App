# Where the cooperjaidee.org page content is stored (#pcmsx, schema half)

Decided 2026-11-25 by the `product-content-schema` stream. Engineering, not Lutan's call: he asked for the outcome ("the console he already has,
pointed at the pages he does not").

## The answer

**A table of its own, `platform_content`, one row per `(page, key)` holding the English, the Thai and an optional Drive file id** (migration 0441,
seed 0442). Shape (a) of the brief, with two departures from "copy `site_pages`":

1. **The Thai is a column beside the English, not a translation row.** `site_pages` puts a page's Thai in the translation queue (0059). That is right
   for prose a volunteer writes in English and a manager translates; it is wrong here, because the product pages' Thai is already written and finished
   (`check-thai-dictionary.mjs`: 0 left). A queue row would have to be seeded already-approved, and every later edit would put the Thai back to
   pending. A column is approved by construction and a console edit saves both languages at once. **Path used: no translation machinery at all.**
2. **Free-text `page` and `key`, checked for shape only, never a slug list.** `site_pages` widened a CHECK five times (0059, 0099, 0104, 0206), one
   migration per new page. A new product page, or a new line on one, is a set of rows here, so "all pages on cooperjaidee" never costs a migration.

Page names: `home` (the overview, `/platform/about`) and `feature-<slug>` for each feature page. Keys are dotted paths into today's dictionary
subtree `admin.productAdmin.about`: `heading`, `lead`, `bands.0.name`, `sections.2.mock.title`.

## Rejected

- **(b) a reserved platform row in `site_pages` / `site_content`.** Every shelter query would have to learn to skip it, and the product site would
  sit one mistake from `my_shelters()` (0439) and every shelter list. It also keeps the five-times-widened slug CHECK.
- **(c) `site_pages` with a nullable `shelter_id`.** 0392's `shelter_scope_select` hides a null-shelter row (measured by the planner), so the policy
  would have to be bent to admit it. That policy is the thing that stops one shelter reading another's rows; weakening it for a convenience is the
  wrong trade, and the slug CHECK stays.
- **Translation queue for the Thai** (see 1 above).
- **A jsonb document per page.** One row per page would be simpler to read, but a console save would rewrite the whole page, two editors would
  overwrite each other, and a photo id could not be addressed by key. One row per line costs 330 rows and nothing else.

## What was measured

- Step zero: no `platform_pages` / `platform_site_content` / `product_page` object in `supabase/migrations/` or `src/lib/site/`; the gap was there.
- The product prose is **not** title/body pairs: `admin.productAdmin.about` is a tree (kicker, heading, lead, `bands[]` each with a `mock`, and
  `features.<slug>.sections[]` each with a `mock`). Flattened it is **330 string entries across 7 pages, all 330 with Thai**.
- `check-view-owners.mjs` refused a new postgres-owned view (the 0430 leak shape). The view is owned by `rls_definer`, and the table has one
  select policy naming that role alone, so anon and authenticated hold no grant and no policy on the table itself. The harness proves anon cannot
  read the table and does read the view, with `request.jwt.claims` role=anon set at every anon step.
- `check-hard-coded-security.mjs` wanted six declarations, now recorded in the registry (all PADMIN or public-by-intent; no role named, no card
  added, Admin untouched). Platform rows are public content, so there is no activity to turn into a card.
- Writes are `product_admin_set_platform_content(jsonb)` and `product_admin_delete_platform_content(text, text)`: `is_product_admin()` plus aal2,
  the 0436 shape. There is no table policy for any write.

## Specification for the console stream (read this first)

- **Table** `public.platform_content (page, key, en, th, drive_file_id, updated_at, updated_by)`, primary key `(page, key)`. Anon/authenticated
  have no grant on it. **Public read** is the view `public.public_platform_content (page, key, en, th, drive_file_id, updated_at)`.
- **Write** `select product_admin_set_platform_content('[{"page","key","en","th","drive_file_id"?}, …]')` returns the row count; atomic. Elements
  carrying `drive_file_id` set it (blank clears); elements without the property keep the stored one. `product_admin_delete_platform_content(page, key)`
  removes a line. Both need a product administrator at aal2; call them from the signed-in client (not the service role) as 0436's caller does.
- **Reader** `src/lib/site/product-content.ts`: `loadProductPage(supabase, page) -> Map<key, {en, th, driveFileId}>`,
  `productText(content, key, locale, fallback?)` (Thai when written, else English, else `fallback`), `productPhotoId(content, key)`.
  Unused by any page in this PR on purpose.
- **Which prose is rows now:** everything under `admin.productAdmin.about` (the home page and the six feature pages, 330 lines). **Still dictionary:**
  the product console's own labels, the enquiry form (`/platform/enquire`) and `platformName`; they are interface, not page copy. The pages still
  read the dictionary today, so nothing changes until the console stream switches them; it should call `productText(..., fallback = the dictionary
  string)` so a missing row never blanks a page.
- **A new page, or a new line:** no migration. Insert rows (the console's "add" is just the set function with a new `page` or `key`). A page name is
  `[a-z0-9-]` up to 64 characters; a key is `[A-Za-z0-9._-]` up to 200. The route that renders a new page is code, which is the console stream's call.
- **A photo:** upload to Drive as the website console does, then write its id as that line's `drive_file_id` (for example page `cooper`, key
  `photo`, with the alt text in `en`/`th`). `is_public_drive_file` and `is_known_drive_file` already include these ids, so `/api/photos/<id>` serves it
  and the Worker's cleanup keeps it. Proven in the harness.
- **Seed:** 0442 inserts `on conflict do nothing`, so re-running it never overwrites a console edit. It was generated once from the dictionaries
  (a scratch script, not committed); if the dictionary prose changes before the console ships, the rows will not follow it, which is the point.
- **Harness:** `supabase/harness/platform_content.sql`.

## Found by CI, and the two places that now know

`public-views` (live anon read) failed the first push: it wants every public view in `PUBLIC_VIEWS`, and a view that answers with no shelter header is a fault unless it is installation-level. `public_platform_content` is exactly that, so it is in `PUBLIC_VIEWS` and in `INSTALLATION_LEVEL_VIEWS` (`scripts/check-public-views.mjs`), and `platform_content` is recorded in `docs/tenancy-shared-tables-registry.json` as deliberately unscoped. The console stream does not need to touch either.
