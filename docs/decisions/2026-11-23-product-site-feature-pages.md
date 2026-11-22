# The product site gets a page per feature (#psubp, #fnbnd)

**Date:** 2026-11-23. **Stream:** `claude/product-site-pages`.

**Lutan, 2026-11-23:** *"Make the product home page look like a home page for a system with sub pages that describe in detail the system"*, and on the money side: *"add financial management to the product web page"* and *"Maybe think about sub pages for 1 or 2 features each"*.

## Step zero
`/platform/about` was one page, no `features/` directory, and `PLATFORM_INDEXABLE` the hard-coded two-entry array. Built, not skipped.

## Address
`/platform/features/<subject>`, English and `/th/platform/features/<subject>`. The home page stays at `/platform/about`, which `platformRedirect()` serves at the bare `/`. Nothing on the host is indexed yet, so the choice costs no redirects.

## The six hard-coded places, made one list
`src/lib/platform-features.ts` lists the product pages. Robots and the sitemap read it (each page gets its own language links). `public-paths.ts` and `site-hosts.ts` are documented as import-free, so they carry the **prefix** `/platform/features/` (public lists, Thai rewrite) and `/th/platform/features` (platform keep-list) instead of importing it. An unknown slug is public and returns 404 from the page, never a login. Each page overrides the layout's noindex with the same `PLATFORM_SEARCH` switch as the home page; the switch itself is untouched.

## What leads the money page
The two things a director weighs: a numbered receipt for every gift, and expenses an accountant can read without the run of the records. Cashflow third; appeals, bills, purchasing and the shop get one closing sentence. Every figure is invented sample data in baht. The home page's meta description and JSON-LD description now name donations and expenses, so summary and content agree.

## Subjects left as bands, on purpose
Resident records, Medical care, Adoptions and fostering, Volunteers and staff, A public website stay as bands with no detail page. The brief warns that a thin page ranks below a band; this stream wrote the money page from the item's shipped-feature list and did not have the same grounded material for the other five. Adding one is now data: a slug in `platform-features.ts`, a `features.<slug>` block in `en.ts` and `th.ts`, and `slug` on its band.

## Upkeep
One page is two pieces of copy to keep in step for good.
