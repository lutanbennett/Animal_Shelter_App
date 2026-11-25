# The product site's content console (#pcmsx, console half)

Decided 2026-11-25 by the `product-content-console` stream. Engineering, not Lutan's call: the storage and its specification were settled in
`2026-11-25-product-page-content-storage.md`; this records where the editor lives and how it is arranged.

## Where the editor lives: a new route, `/platform/content`

**Chosen: a new route, linked from the top of `/platform`** (one click). Reasons, from reading both:

- `ProductAdminPanel.tsx` is 1,103 lines and **keyed to one `ShelterRow`**: its tabs (`summary, setup, connections, website, contact, access, close`)
  are all "this shelter". The product site's words belong to no shelter, so a tab there would sit under a shelter it is not about.
- A route keeps the gate identical without sharing a component: the page repeats `/platform`'s own checks (platform host, signed in,
  `is_product_admin()` else the same not-found as an address that does not exist), and the writes need aal2, so every control that acts is drawn
  only then, with the one notice at the top that `/platform` uses. No role and no card is read anywhere.
- It left `ProductAdminPanel.tsx` untouched (the only change to `src/app/platform/page.tsx` is the link).

## How 330 lines are arranged

Group by **page** (a collapsed `<details>` per page, `home` first), then by the **key's parent path** (`bands.2.mock`, `sections.0`), natural order so
`bands.2` precedes `bands.10`. Each line is **English and Thai side by side**, and Save sends **only the lines that differ** from what was loaded, in one
atomic call to `product_admin_set_platform_content`. A line's own delete is `product_admin_delete_platform_content`. The "Add a line" form is the set
function with a new `(page, key)`, which is how a **new page** or **new line** is stored with no code and no migration.

## The pages read rows, the dictionary is the fallback

`overlayProductText()` (in `src/lib/site/product-content.ts`) walks the dictionary subtree the pages already used and replaces each string with
`productText(content, <dotted path>, locale, <the dictionary string>)`. `about/page.tsx` and `features/[slug]/page.tsx` both go through it, **including
`generateMetadata`**, so the title, description and JSON-LD follow the console too. A deleted or missing row gives the dictionary's own string, so a page
can never blank. The `admin.productAdmin.about` prose is **kept** for exactly that reason. `slug` and the nested `features` subtree are skipped (code, not words).

## A photo

A line whose key is `photo` or ends `.photo` (or that already holds a photo) shows an upload control. Upload goes to Drive in a **"Product site"** folder
under the same root the Website console uses, is read back before anything points at it, and its id is written to that line's `drive_file_id` through
the same set function (sent **with** `en`/`th`, which are the alt text); a replaced photo is moved to Drive's trash, not deleted. The home page's hero
shows `hero.photo` in place of the sample screen when it has one, served through `/api/photos/<id>`, alt text from `en`/`th`.

**Not decided here, and worth knowing:** with no shelter in scope (the platform host), `driveRootFolderId()` answers
`GOOGLE_DRIVE_ROOT_FOLDER_ID`. That is correct on dev and was exercised there; whether production's Worker has the same value is for the deploy.

## What `#cpstr` (Cooper's page) still needs

**A new page can already be added from this editor with no code** (page `cooper`, any keys, English and Thai, a `*.photo` line for his photo): rows
are stored, editable and publicly readable. **What is still code is the route that renders it**: a page under `src/app/platform/` that calls
`loadProductPage(supabase, "cooper")` and lays out his lines, is added to `PRODUCT_PAGES_EN` in `src/lib/platform-features.ts` (so the public-path
lists, the Thai rewrite and the sitemap know it) and falls back to nothing, so the page must say what to show before any row exists. This stream built
none of it and seeded no `cooper` rows.

## Found, not fixed

- `bands.N.slug` rows exist in the seed (they were generated from the whole subtree). The pages ignore them (the slug is a link, read from code), so
  editing one does nothing; the editor lists them like any line. A follow-up could hide keys ending `.slug`.
- The editor lists only rows that exist. A line added to the dictionary later has no row until it is added here.
