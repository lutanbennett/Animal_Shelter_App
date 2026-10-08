# Management holds `website.content`, and the site tables ask the cell (`0163`)

**Date:** 2026-10-08 · **Stream:** `website-content-grant` · **Follows:**
`2026-10-07-management-settings-split.md` (Lutan: the website is the Director's job by day, as Management)

## What changed

- `role_permissions`: `management` gains `website.content` at Edit (2), the same shape `0155` used for
  `resident.microchip`.
- `site_content`, `site_content_photos`, `site_pages`: their write policies
  (`admin_update_site_content`, `admin_write_site_content_photos`, `admin_update_site_pages`) were
  `is_admin()` since `0153`. They now ask `has_permission('website.content')`, as `impact_baselines`
  (`0156`) already did. Same names, same commands; only the expression. Admin is unchanged, because
  `has_permission()` admits Admin before it looks at any cell.

The cell alone would have been a silent failure: a Management login would have opened
Management → Website and had every save refused by the database. That is why the policies ride in the
same file, as the split decision found while building #448.

## Accepted consequence

**Anyone holding the Management role can change the public site** — the home page, every information
page, the gallery, the contact details and the impact figures. Lutan accepted this on 2026-10-08.

## Who was deliberately left out

**The 2IC.** `0155` gave `contacts.browse` to Management *and* the 2IC, so it is tempting to pair them
again. The decision named Management only, and widening who can change the public site is an
over-grant that never looks broken on a screen. If the 2IC should edit the website, that is a new
decision and one more row.

## The menu

`/admin/website`'s registry row carries `section: "management"` explicitly
(`src/lib/permissions/routes.ts`), so `sectionOf()` lists it under Management even though its path is
under `/admin/` (which would otherwise mean Settings). Who sees it is decided by its `activity`, so with
the cell a Management login sees it under Management, and nowhere else.

## Proof

`scripts/check-website-content-grant.mjs`, against dev in one rolled-back transaction, under each
role's own login: before (what `0163` replaces, put back) only Admin holds the cell and writes the three
tables; after (the file replayed) Admin and Management do, and the 2IC, staff, volunteer, vet and public
viewer still hold nothing and write nothing.

`scripts/check-permission-parity.mjs` gained `WIDENED_BY_DECISION`, the mirror of `NARROWED_BY_R1`: the
retired `isAdminRole` predicate said Admin only, the cell now says Management too, and that difference is
expected rather than a mismatch. It goes STALE (red) if the two ever agree again.
